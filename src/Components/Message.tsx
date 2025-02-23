import React from 'react';
import { MessageDto } from "../Models/MessageDto";
import styles from "../Styles/message.module.css";

interface MessageProps {
  message: {
    content: string | any; // Change this type if the structure of message.content is different
    isUser: boolean;
};
}
const Message: React.FC<MessageProps> = ({ message }) => {

  return (
      <div style={{ textAlign: message.isUser ? "right" : "left", margin: "8px" }}>
          <div className={message.isUser ? styles.userMessage : styles.assistantMessage}
          style={{backgroundColor: message.isUser ? "#28a745" : ""}}>
              {message && typeof message.content === "string" ? (
                  message.content.split("\n").map((text, index) => (
                      <React.Fragment key={index}>
                          {text}
                          <br />
                      </React.Fragment>
                  ))
              ) : (
                  <div>Error: Message content is not a string.</div>
              )}
          </div>
      </div>
  );
};

export default Message;
