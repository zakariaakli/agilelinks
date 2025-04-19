// pages/index.tsx
import React from 'react';
import { AppProps } from 'next/app';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import "../../globals.css";
import Products from '../../Components/Products'

const Product= ({ Component, pageProps }: AppProps) =>  {
  return (
    <Container fluid>

    <Row className="mt-4">
      <Col>
        <Products />
      </Col>
    </Row>
  </Container>
  );
};

export default Product;
