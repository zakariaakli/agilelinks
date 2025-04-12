import React, { useEffect, useState, useRef, useContext } from "react";
import ChatInput from "./ChatInput";
import Message from "./Message";
import { OpenAI } from "openai";
import { MessageDto } from "../Models/MessageDto";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { DataContext } from "../Helpers/dataContext";
import { ResultData } from "../Models/EnneagramResult";
import { Container, Row, Col, Button, ProgressBar } from "react-bootstrap";
import styles from "../Styles/auth.module.css"; // Import auth styles
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ChatProps {
  setAssessmentResult: (result: any) => void;
}

// Function to check if the chatbot has completed the process
function hasChatbotFinishedFunc(message: string): boolean {
  const completionKeyword = "TEST FINISHED";
  return message.includes(completionKeyword);
}

const Chat: React.FC<ChatProps> = ({ setAssessmentResult }) => {
  const [isWaiting, setIsWaiting] = useState<boolean>(false);
  const [messages, setMessages] = useState<Array<MessageDto>>([]);
  const [input, setInput] = useState<string>("");
  const [thread, setThread] = useState<any>(null);
  const [openai, setOpenai] = useState<any>(null);
  const [showButtons, setShowButtons] = useState<boolean>(false);
  const [ratingQuestion, setRatingQuestion] = useState<string>("");
  const [showSendReport, setShowSendReport] = useState<boolean>(false);
  const [hasChatbotFinished, setHasChatbotFinished] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [isPopUpVisible, setIsPopUpVisible] = useState<boolean>(false);
  const router = useRouter();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const updateData = useContext(DataContext);

  useEffect(() => {
    initChatBot();
  }, []);

  useEffect(() => {
    setMessages([
      {
        content: "Hi, I'm your Enneagram assistant. How can I help you?",
        isUser: false,
      },
    ]);
  }, [thread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initChatBot = async () => {
    const openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_REACT_APP_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
    });
    const thread = await openai.beta.threads.create();
    setOpenai(openai);
    setThread(thread);
    setShowButtons(false);
    setHasChatbotFinished(false);
  };

  const createNewMessage = (content: string, isUser: boolean) => {
    return new MessageDto(isUser, content);
  };

  const handleSendMessage = async (message?: string) => {
    const newMessages = [...messages, createNewMessage(message || input, true)];
    setMessages(newMessages);
    setInput("");

    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message || input, // Use the passed message or input state
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.NEXT_PUBLIC_REACT_APP_ASSISTANT_ID,
    });

    let response = await openai.beta.threads.runs.retrieve(thread.id, run.id);

    while (response.status === "in_progress" || response.status === "queued") {
      setIsWaiting(true);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      response = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    setIsWaiting(false);
    const messageList = await openai.beta.threads.messages.list(thread.id);
    const lastMessage = messageList.data
      .filter((message: any) => message.run_id === run.id && message.role === "assistant")
      .pop();

    if (lastMessage) {
      const lastContent = lastMessage.content[0]["text"].value;
      if (typeof lastContent === "string") {
        setMessages([...newMessages, createNewMessage(lastMessage.content[0]["text"].value, false)]);

        if (hasChatbotFinishedFunc(lastMessage.content[0]["text"].value)) {
          console.log("Chatbot process is complete.");
          setHasChatbotFinished(true);
          setTimeout(() => {
            setIsPopUpVisible(true);
          }, 2000);
          // TEST OPENAI API
          const EnneagramResult = z.object({
            enneagramType1: z.number(),
            enneagramType2: z.number(),
            enneagramType3: z.number(),
            enneagramType4: z.number(),
            enneagramType5: z.number(),
            enneagramType6: z.number(),
            enneagramType7: z.number(),
            enneagramType8: z.number(),
            enneagramType9: z.number(),
            profession: z.string(),
          });

          const completion = await openai.beta.chat.completions.parse({
            model: "gpt-4o-2024-08-06",
            messages: [
              { role: "system", content: "extract the obtained rating for each enneagram type you will reflect the same results given to the user. put each of these rating in variables respectively enneagramtype1, enneagramType2, etc" },
              { role: "user", content: lastMessage.content[0]["text"].value },
            ],
            response_format: zodResponseFormat(EnneagramResult, "result"),
          });
          const event = completion.choices[0].message.parsed;
          try {
            // Add the result to the database
            addResult(event);
            // send data to the parent component to update the radar chart
            setAssessmentResult(event);
          } catch (error) {
            console.error("Error adding result: ", error);
          }
        }
      } else {
        console.log("Chatbot process is not yet complete.");
      }
      // Check if the last message is a prompt for rating
      if (
        lastMessage &&
        (lastMessage.content[0]["text"].value.includes("Please rate the following") ||
          lastMessage.content[0]["text"].value.includes("please rate the following") ||
          lastMessage.content[0]["text"].value.includes("Now, please rate the"))
      ) {
        setShowButtons(true);
        setRatingQuestion(lastMessage.content[0]["text"].value);
      } else {
        setShowButtons(false);
      }
    }
  };

  const handleButtonClick = (value: number) => {
    handleSendMessage(value.toString()); // Send the rating as a string
    setShowButtons(false); // Hide buttons after selection
  };

  const addResult = async (resultData: ResultData) => {
    try {
      const resultsCollectionRef = collection(db, "Results");
      const docRef = await addDoc(resultsCollectionRef, resultData);
      console.log("Document written with data: ", resultData);
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const handleClosePopUp = () => {
    setIsPopUpVisible(false);
  };

  return (
    <Container fluid="sm" className="chat-container d-flex flex-column">
      <div className="chat-box flex-grow-1 overflow-auto p-3">
        <Row>
          {messages.map((message, index) => (
            <Col
              xs={12}
              className={`d-flex ${message.isUser ? "justify-content-end" : "justify-content-start"} mb-2`}
              key={index}
            >
              <Message message={message} />
            </Col>
          ))}
        </Row>
        <div ref={messagesEndRef} />
      </div>

      {showButtons && (
        <Row className="button-group justify-content-center my-2">
          {[...Array(10).keys()].map((num) => (
            <Button
              key={num}
              variant="outline-dark"
              onClick={() => handleButtonClick(num)}
              className="rating-button m-1"
            >
              {num}
            </Button>
          ))}
        </Row>
      )}

      <ChatInput
        input={input}
        setInput={setInput}
        handleSendMessage={() => handleSendMessage(input)}
        refreshTest={initChatBot}
        isWaiting={isWaiting}
        isTestFinished={hasChatbotFinished}
        name={name}
      />

      {isWaiting && <ProgressBar animated now={100} className="loading-bar" />}

      {/* Modal Popup */}
      {isPopUpVisible && (
        <div className={styles.popupContainer}>
          <div className={styles.popupContent}>
            <button className={styles.closeButton} onClick={handleClosePopUp}>
              X
            </button>
            <h2 className={styles.formTitle}>
              Sign up or log in to discover more about your Enneagram type!
            </h2>
            <div style={{ textAlign: "center", marginTop: "10px" }}>
              <Link href="/signup" className={styles.authLink}>
                Sign up
              </Link>
            </div>
            <div style={{ textAlign: "center", marginTop: "10px" }}>
              <Link href="/login" className={styles.authLink}>
                Log In
              </Link>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export default Chat;
