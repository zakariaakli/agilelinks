import React, { RefObject } from 'react';
import { BsSend, BsArrowCounterclockwise } from 'react-icons/bs';
import styles from '../Styles/chat.module.css';

interface ChatInputProps {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  handleSendMessage: () => void;
  refreshTest: () => void;
  isWaiting: boolean;
  isTestFinished: boolean;
  name: string;
  inputRef: RefObject<HTMLInputElement>;
}

const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  handleSendMessage,
  refreshTest,
  isWaiting,
  isTestFinished,
  name
}) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className={styles.inputContainer}>
      <input
        type="text"
        placeholder="Type your message"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyPress}
        disabled={isWaiting}
      />
      <button onClick={handleSendMessage} disabled={isWaiting} title="Send message">
        <BsSend size={16} />
      </button>
      <button onClick={refreshTest} disabled={isWaiting} title="Restart chat">
        <BsArrowCounterclockwise size={16} />
      </button>
    </div>
  );
};

export default ChatInput;
