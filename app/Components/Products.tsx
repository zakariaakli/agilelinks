// pages/index.tsx
"use client"
import React, { useState, useEffect } from "react";
import { AppProps } from 'next/app';
import Container from 'react-bootstrap/Container';
import styles from '../Styles/product.module.css';
import "../Styles/global.module.css";
import { Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { StarFill, ShieldLockFill, LightningChargeFill, CheckCircleFill } from 'react-bootstrap-icons';


const Products: React.FC = () => {
     // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="text-center py-5">
    <h2 className="fw-bold mb-2">Choose Your Plan</h2>
    <p className="text-muted mb-4">
      Select the plan that best fits your needs and unlock deeper insights into your personality.
    </p>

    <Row xs={1} md={3} className="g-4 justify-content-center">
      {/* PRO Plan */}
      <Col>
        <Card style={{ border: '2px solid grey' }} className="rounded-4">
          <Card.Body className="text-start">
            <div className="mb-3">
              <div className="d-inline-flex justify-content-center align-items-center rounded bg-light p-2">
                <ShieldLockFill color="#34D399" size={24} />
              </div>
            </div>
            <Card.Title className="fw-bold">Pro</Card.Title>
            <Card.Text className="text-muted">Perfect for casual users</Card.Text>
            <h3 className="fw-bold">$4.99<span className="fs-6 fw-normal">/month</span></h3>
            <ul className="list-unstyled mt-3 mb-4">
              <li><CheckCircleFill color="#34D399" className="me-2" />100 analyses per month</li>
              <li><CheckCircleFill color="#34D399" className="me-2" />25 saved analysis slots</li>
              <li><CheckCircleFill color="#34D399" className="me-2" />Basic AI chatbots</li>
              <li><CheckCircleFill color="#34D399" className="me-2" />Romantic compatibility analysis</li>
              <li><CheckCircleFill color="#34D399" className="me-2" />Priority support</li>
              <li><CheckCircleFill color="#34D399" className="me-2" />Detailed insights</li>
            </ul>
            <Button variant="light" className="w-100 fw-bold border" style={{ color: 'black', borderColor: '#e5e5e5' }}>
              Get Started
            </Button>
          </Card.Body>
        </Card>
      </Col>

      {/* PREMIUM Plan */}
      <Col>
        <div className="position-relative h-100">
          <Badge
            style={{
              backgroundColor: 'white',
              color: 'black',
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1,
            }}
            className="px-3 py-1 rounded-pill fw-semibold"
          >
            Most Popular
          </Badge>
          <Card style={{ border: '2px solid #F7D36B' }} className="rounded-4">
            <Card.Body className="text-start">
              <div className="mb-3">
                <div className="d-inline-flex justify-content-center align-items-center rounded bg-light p-2">
                  <StarFill color="#34D399" size={24} />
                </div>
              </div>
              <Card.Title className="fw-bold">Casual</Card.Title>
              <Card.Text className="text-muted">For serious personality enthusiasts</Card.Text>
              <h3 className="fw-bold">$9.99<span className="fs-6 fw-normal">/month</span></h3>
              <ul className="list-unstyled mt-3 mb-4">
                <li><CheckCircleFill color="#34D399" className="me-2" />250 analyses per month</li>
                <li><CheckCircleFill color="#34D399" className="me-2" />50 saved analysis slots</li>
                <li><CheckCircleFill color="#34D399" className="me-2" />All AI chatbots</li>
                <li><CheckCircleFill color="#34D399" className="me-2" />All compatibility analyses</li>
                <li><CheckCircleFill color="#34D399" className="me-2" />Comparative analysis</li>
                <li><CheckCircleFill color="#34D399" className="me-2" />Trend tracking</li>
              </ul>
              <Button
                variant="success"
                className="w-100 fw-bold"
                style={{ backgroundColor: '#34D399', border: 'none' }}
              >
                Get Started
              </Button>
            </Card.Body>
          </Card>
        </div>
      </Col>

      {/* PLATINUM Plan */}
      <Col>
        <Card style={{ border: '2px solid grey' }} className="rounded-4">
          <Card.Body className="text-start">
            <div className="mb-3">
              <div className="d-inline-flex justify-content-center align-items-center rounded bg-light p-2">
                <LightningChargeFill color="#34D399" size={24} />
              </div>
            </div>
            <Card.Title className="fw-bold">Platinum</Card.Title>
            <Card.Text className="text-muted">Ultimate personality analysis suite</Card.Text>
            <h3 className="fw-bold">$18.99<span className="fs-6 fw-normal">/month</span></h3>
            <ul className="list-unstyled mt-3 mb-4">
              <li><CheckCircleFill color="#34D399" className="me-2" />Unlimited analyses</li>
              <li><CheckCircleFill color="#34D399" className="me-2" />100 saved analysis slots</li>
              <li><CheckCircleFill color="#34D399" className="me-2" />All AI chatbots</li>
              <li><CheckCircleFill color="#34D399" className="me-2" />All compatibility analyses</li>
              <li><CheckCircleFill color="#34D399" className="me-2" />Early access to new features</li>
              <li><CheckCircleFill color="#34D399" className="me-2" />Custom analysis reports</li>
            </ul>
            <Button variant="light" className="w-100 fw-bold border" style={{ color: 'black', borderColor: '#e5e5e5' }}>
              Get Started
            </Button>
          </Card.Body>
        </Card>
      </Col>
    </Row>
     <Row className="mt-4">
           <div className={styles.cta}>
             <p>Liked our product? <a href="/subscribe">Sign up for more insights on personal development in the age of AI</a></p>
           </div>
          </Row>
  </div>




    // <Container fluid style={{ height: '80vh' }}>

    //     <Row xs={1} md={2} className="g-4"  style={{ height: '100%' }}>
    //   <Col className={styles.ProductSection} style={{ height: '100%', overflowY: 'auto' }}>
    //   <h3 className={styles.titleBlack}>Deep coaching journey</h3>

    //   </Col>
    //   <Col className={styles.ProductSection} style={{ height: '100%', overflowY: 'auto' }}>
    //   <h3 className={styles.titleBlack}>Casual (Popular)</h3>
    //   <h5 className={styles.prodcutLine}> Instant personality assessment feedback</h5>
    //   <h5 className={styles.prodcutLine}> AI chatbot as coach</h5>
    //   <h5 className={styles.prodcutLine}> Regular customized insghts on personal development tredns and recent findings</h5>
    //   </Col>
    //   <Col className={styles.ProductSection} style={{ height: '100%', overflowY: 'auto' }}>
    //   <h3 className={styles.titleBlack}>Professional</h3>
    //   </Col>
    // </Row>
    // {/* //Call to Action Section */}
    // <Row className="mt-4">
    //       <div className={styles.cta}>
    //         <p>Liked our product? <a href="/subscribe">Sign up for more insights on personal development in the age of AI</a></p>
    //       </div>
    //       </Row>
    // </Container>
      );

}

export default Products;
