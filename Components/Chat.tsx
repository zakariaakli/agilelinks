// app/Components/Chat.tsx
'use client';

import React, { useEffect, useState, useRef, useContext } from 'react';
import ChatInput from './ChatInput';
import Message from './Message';
import { OpenAI } from 'openai';
import { MessageDto } from '../Models/MessageDto';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { DataContext } from '../Helpers/dataContext';
import { EnneagramResult } from '../Models/EnneagramResult';
import { Container, Row, Col, Button, ProgressBar } from 'react-bootstrap';
import styles from '../Styles/auth.module.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import chatStyles from '../Styles/chat.module.css';

// onboardingPrompt.ts
export const ONBOARDING_PROMPT = `
👋  I’m your AI Companion!

Take a 20-minute personality assessment and I can:

🔍  Discover your strengths & blind spots
🎯  Turn patterns into clear goals and track progress
💡  Send regular, uplifting guidance when you need it
🛠️  Adapt advice to your style and ambitions

Say Hello, and we can start the assessment ➜
`;

interface ChatProps {
  setAssessmentResult: (result: EnneagramResult) => void;
  setResultData: (result: EnneagramResult) => void;
}

function hasChatbotFinishedFunc(message: string): boolean {
  return message.includes('TEST FINISHED');
}

const Chat: React.FC<ChatProps> = ({ setAssessmentResult, setResultData }) => {
  const [isWaiting, setIsWaiting] = useState(false);
  const [messages, setMessages] = useState<Array<MessageDto>>([]);
  const [input, setInput] = useState('');
  const [thread, setThread] = useState<any>(null);
  const [openai, setOpenai] = useState<any>(null);
  const [showButtons, setShowButtons] = useState(false);
  const [ratingQuestion, setRatingQuestion] = useState('');
  const [hasChatbotFinished, setHasChatbotFinished] = useState(false);
  const [name, setName] = useState('');
  const [isPopUpVisible, setIsPopUpVisible] = useState(false);
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesWrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<any>(null);
  const updateData = useContext(DataContext);

  useEffect(() => {
    initChatBot();
  }, []);

  useEffect(() => {
    setMessages([
      {
        content: ONBOARDING_PROMPT,
        isUser: false,
      },
    ]);
  }, [thread]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const scrollToBottom = () => {
    if (messagesWrapperRef.current) {
      messagesWrapperRef.current.scrollTo({
        top: messagesWrapperRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

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

  const createNewMessage = (content: string, isUser: boolean) => new MessageDto(isUser, content);

  const handleSendMessage = async (message?: string) => {
    const newMessages = [...messages, createNewMessage(message || input, true)];
    setMessages(newMessages);
    setInput('');

    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: message || input,
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.NEXT_PUBLIC_REACT_APP_ASSISTANT_ID,
    });

    let response = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    while (response.status === 'in_progress' || response.status === 'queued') {
      setIsWaiting(true);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      response = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    setIsWaiting(false);

    // Track token usage for Enneagram chat conversation
    if (response.status === 'completed' && user) {
      try {
        console.log('🔍 Tracking Enneagram chat conversation tokens...');
        
        // Estimate tokens since Assistant API doesn't always return usage
        const estimatedTokens = (message || input).length * 0.25 + 150; // Rough estimation
        
        const trackingResponse = await fetch('/api/track-openai-usage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await user.getIdToken()}`
          },
          body: JSON.stringify({
            functionName: 'enneagram_chat_conversation',
            model: 'gpt-4', // Assistant API typically uses GPT-4
            promptTokens: Math.floor(estimatedTokens * 0.7),
            completionTokens: Math.floor(estimatedTokens * 0.3),
            totalTokens: Math.floor(estimatedTokens),
            requestData: { 
              userMessage: (message || input).substring(0, 100) + '...',
              assistantId: process.env.NEXT_PUBLIC_REACT_APP_ASSISTANT_ID
            }
          })
        });
        
        if (trackingResponse.ok) {
          console.log('✅ Successfully tracked Enneagram chat tokens');
        }
      } catch (trackingError) {
        console.warn('⚠️ Could not track Enneagram chat tokens:', trackingError);
      }
    }
    const messageList = await openai.beta.threads.messages.list(thread.id);
    const lastMessage = messageList.data
      .filter((msg: any) => msg.run_id === run.id && msg.role === 'assistant')
      .pop();

    if (lastMessage) {
      const lastContent = lastMessage.content[0]['text'].value;
      setMessages([...newMessages, createNewMessage(lastContent, false)]);

      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
        scrollToBottom();
      }, 100);

      if (hasChatbotFinishedFunc(lastContent)) {
        setHasChatbotFinished(true);
        if (!user) setTimeout(() => setIsPopUpVisible(true), 2000);

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
          summary: z.string(),
        });

        const completion = await openai.beta.chat.completions.parse({
          model: 'gpt-4o-2024-08-06',
          messages: [
            {
              role: 'system',
              content: 'extract the obtained rating for each enneagram type you will reflect the same results given to the user. put each of these rating in variables respectively enneagramtype1, enneagramType2, etc',
            },
            { role: 'user', content: lastContent },
          ],
          response_format: zodResponseFormat(EnneagramResult, 'result'),
        });
        
        // Track token usage for Enneagram result parsing
        if (completion.usage && user) {
          try {
            console.log('🔍 Tracking Enneagram result parsing tokens...');
            
            // Send token usage to our tracking API
            const trackingResponse = await fetch('/api/track-openai-usage', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await user.getIdToken()}`
              },
              body: JSON.stringify({
                functionName: 'enneagram_result_parsing',
                model: 'gpt-4o-2024-08-06',
                promptTokens: completion.usage.prompt_tokens,
                completionTokens: completion.usage.completion_tokens,
                totalTokens: completion.usage.total_tokens,
                requestData: { 
                  systemPrompt: 'extract enneagram ratings',
                  userContent: lastContent.substring(0, 200) + '...' 
                }
              })
            });
            
            if (trackingResponse.ok) {
              console.log('✅ Successfully tracked Enneagram parsing tokens');
            }
          } catch (trackingError) {
            console.warn('⚠️ Could not track Enneagram parsing tokens:', trackingError);
          }
        }
        
        const event = completion.choices[0].message.parsed;
        try {
          setAssessmentResult(event);
          setResultData(event);
        } catch (error) {
          console.error('Error adding result:', error);
        }
      }

      if (/please rate the following|Now, please rate the/i.test(lastContent)) {
        setShowButtons(true);
        setRatingQuestion(lastContent);
      } else {
        setShowButtons(false);
      }
    }
  };

  const handleButtonClick = (value: number) => {
    handleSendMessage(value.toString());
    setShowButtons(false);
  };

  return (
    <Container fluid className="d-flex flex-column justify-content-end min-vh-100">
      <div ref={messagesWrapperRef} className="flex-grow-1 overflow-auto px-3 pt-3">
        <Row>
          {messages.map((message, index) => (
            <Col
              xs={12}
              className={`d-flex ${
                message.isUser ? 'justify-content-end' : 'justify-content-start'
              } mb-2`}
              key={index}
            >
              <div
                className={`${chatStyles['message-bubble']} ${
                  message.isUser ? chatStyles['message-user'] : chatStyles['message-bot']
                }`}
              >
                {message.content}
              </div>
            </Col>
          ))}
        </Row>

        {showButtons && (
          <div className="d-flex flex-wrap justify-content-center gap-2 mt-2 mb-3">
            {[...Array(10).keys()].map((num) => (
              <Button
                key={num}
                variant="outline-dark"
                onClick={() => handleButtonClick(num)}
                className={chatStyles.ratingButton}
              >
                {num}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="sticky-bottom bg-white pb-3 pt-1 px-3">
        <ChatInput
          input={input}
          setInput={setInput}
          handleSendMessage={() => handleSendMessage(input)}
          refreshTest={initChatBot}
          isWaiting={isWaiting}
          isTestFinished={hasChatbotFinished}
          name={name}
          inputRef={inputRef}
        />
        {isWaiting && <ProgressBar animated now={100} className="loading-bar mt-2" />}
      </div>

    </Container>
  );
};

export default Chat;
