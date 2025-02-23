import React from 'react';
import { TextField, Grid } from '@mui/material';
import { Container, Row, Col, Button, ProgressBar, Spinner } from "react-bootstrap";
import { BsSend, BsArrowCounterclockwise } from 'react-icons/bs';

interface ChatInputProps {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  handleSendMessage: () => void;
  refreshTest: () => void;
  isWaiting: boolean;
  isTestFinished: boolean;
  name: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ input, setInput, handleSendMessage, refreshTest, isWaiting, isTestFinished, name }) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (

    <Container>
      <Row className="align-items-center mb-1">
        <Col xs={12} md={10}>
          <TextField
            label="Type your message"
            variant="outlined"
            fullWidth
            disabled={isWaiting}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}

          />
        </Col>
        <Col xs={12} md={1}>
          <Button variant="success" className="mx-1" color="primary" onClick={handleSendMessage} disabled={isWaiting}>
            <BsSend />
          </Button>
        </Col>
        <Col xs={12} md={1}>
          <Button variant="dark" className="mx-1" color="warning"
            onClick={refreshTest}
            disabled={isWaiting}>
            <BsArrowCounterclockwise />
          </Button>
        </Col>
      </Row>

    </Container>

  );
};

export default ChatInput;
