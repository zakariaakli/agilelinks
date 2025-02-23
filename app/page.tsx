// pages/index.tsx
import React from 'react';
import { AppProps } from 'next/app';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import GlobalTest from '../src/Components/GlobalTest'; // Adjust path based on your new folder structure
import "../styles/globals.css";
import Header from '../src/Components/Header';

const HomePage= ({ Component, pageProps }: AppProps) =>  {
  return (
    <Container fluid>
      <Row>
        <Col>
        <Header />
          {/* <header className="header-custom">
            <h1>Welcome to Enneagram Insights</h1>
            <h4>Your personal journey towards self-discovery and growth starts here!</h4>
          </header> */}
        </Col>
      </Row>
      <Row className="mt-4">
        <Col>
          <GlobalTest />
        </Col>
      </Row>
    </Container>
  );
};

export default HomePage;
