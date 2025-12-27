"use client";

import React from "react";
import SimplifiedEnneagramInput from "./SimplifiedEnneagramInput";
import Container from "react-bootstrap/Container";
import chatStyles from "../Styles/chat.module.css";

const GlobalTest: React.FC = () => {
  return (
    <Container fluid className="d-flex flex-column align-items-center px-2 px-md-5">
      <div className={chatStyles.chatWrapper}>
        {/* Simplified Enneagram Input - Quick type/wing selection */}
        <SimplifiedEnneagramInput />
      </div>
    </Container>
  );
};

export default GlobalTest;
