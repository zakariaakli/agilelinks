// app/page.tsx
import React from 'react';
import ArticlesPage from './articles/page';
import GlobalTest from './Components/GlobalTest';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

export default function Home() {
  return (
    <Container fluid className="mt-2" style={{ height: '80vh' }}>
    <Row className="mb-2" style={{ height: '100%' }}>
      <Col xs={12} md={3} className="Info-section text-center" style={{ height: '100%', overflowY: 'auto' }}>
        <ArticlesPage />
      </Col>
      <Col xs={12} md={9} className="Chat-section" style={{ height: '100%', overflowY: 'auto' }}>
        <GlobalTest />
      </Col>
    </Row>
  </Container>
  );
}
