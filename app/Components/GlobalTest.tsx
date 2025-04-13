"use client"
import React, { useState, useEffect } from "react";
import Chat from "./Chat";
import ResultTest from "./ResultTest";
import { EnneagramResult } from "../Models/EnneagramResult";
import "../Styles/global.module.css";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ArticlesPage from "../articles/page";

const GlobalTest: React.FC = () => {
  const [assessmentResult, setAssessmentResult] = useState<EnneagramResult | null>();
  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);

  }, []);

  return (
    <Container fluid className="mt-2" style={{ height: '80vh' }}>
      <Row className="mb-2" style={{ height: '100%' }}>
        <Col xs={12} md={3} className="Info-section text-center" style={{ height: '100%', overflowY: 'auto' }}>
          {/* <h2 className="title-green">Discover Your Potential</h2>
          <p>Understanding your Enneagram type can provide insights into your personality, motivations, and relationships.</p>
          <p>Taking the Enneagram test can help you identify your strengths and areas for growth, leading to a more fulfilling life.</p> */}
          <ArticlesPage />
        </Col>
        <Col xs={12} md={6} className="Chat-section" style={{ height: '100%', overflowY: 'auto' }}>
          <Chat setAssessmentResult={setAssessmentResult} setResultData={setAssessmentResult} />
        </Col>
        <Col xs={12} md={3} className="Result-section text-center" style={{ height: '100%', overflowY: 'auto' }}>
          <h3 className="title-green">Discover your Enneagram type and what it means for you!</h3>
          <button className="Book-appointment-button mt-3">Book an Appointment with a Coach</button>
          <ResultTest data={assessmentResult ?? null} />
        </Col>
      </Row>
    </Container>
  );
};

export default GlobalTest;
