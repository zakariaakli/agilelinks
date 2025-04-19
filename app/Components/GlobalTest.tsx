"use client";

import React, { useState, useEffect, useRef } from "react";
import Chat from "./Chat";
import ResultTest from "./ResultTest";
import { EnneagramResult } from "../Models/EnneagramResult";
import Container from "react-bootstrap/Container";
import Link from "next/link";
import chatStyles from "../Styles/chat.module.css";
import LandingHero from "./landing";

const GlobalTest: React.FC = () => {
  const [assessmentResult, setAssessmentResult] = useState<EnneagramResult | null>(null);
  const [started, setStarted] = useState(false);
  const resultRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (assessmentResult && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [assessmentResult]);

  return (
    <Container fluid className="d-flex flex-column align-items-center px-2 px-md-5">
      {!started ? (
        <LandingHero onStart={() => setStarted(true)} />
      ) : (
        <>
          <div className={chatStyles.chatWrapper}>
            <Chat setAssessmentResult={setAssessmentResult} setResultData={setAssessmentResult} />
          </div>

          {assessmentResult && (
            <div ref={resultRef} className={`${chatStyles.chatWrapper} mt-4`}>
              <h3 className="text-center fw-semibold mb-3">Your Enneagram Result</h3>
              <button className="btn btn-success w-100 mb-3">Book a Coach</button>
              <ResultTest data={assessmentResult} />
              <div className="cta-box mt-4 p-4 bg-white rounded shadow text-center">
                <h5 className="fw-bold mb-3">Want to save your result and track your growth?</h5>
                <ul className="list-unstyled text-start small text-muted mb-3">
                  <li>✔️ View historical assessments</li>
                  <li>✔️ Access personalized coaching tips</li>
                  <li>✔️ Re-test anytime</li>
                  <li>✔️ Unlock future features</li>
                </ul>
                <div className="d-flex flex-column gap-2">
                  <Link href="/signup" className="btn btn-success w-100">Sign up for free</Link>
                  <Link href="/login" className="btn btn-outline-secondary w-100">Log in</Link>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </Container>
  );
};

export default GlobalTest;
