// pages/index.tsx
import React from 'react';
import { AppProps } from 'next/app';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import "../globals.css";
import styles from '../Styles/about.module.css';

const HomePage= ({ Component, pageProps }: AppProps) =>  {
  return (
    <Container fluid>
{/* //Call to Action Section */}
      <Row className="mt-4">
      <div className={styles.cta}>
        <p>Liked our idea? <a href="/subscribe">Sign up for more insights on personal development in the age of AI</a></p>
      </div>
      </Row>
    </Container>
  );
};

export default HomePage;
