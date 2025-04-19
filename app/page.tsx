import React from "react";
import ArticlesPage from "./articles/page";
import GlobalTest from "./Components/GlobalTest";
import Container from "react-bootstrap/Container";
import './Styles/homepage.css';

export default function Home() {
  return (
    <Container fluid className="p-0 homepage-wrapper">
      {/* Hero Section */}
      {/* <section className="hero-section text-center py-5">
        <h1 className="display-5 fw-bold">Discover your Enneagram type</h1>
        <p className="lead">Understand yourself better through intelligent coaching.</p>
        <button className="btn btn-primary px-4 py-2 mt-3">Get Started</button>
      </section> */}

      {/* Chat + Result Panel */}
      <section className="chatbot-wrapper d-flex flex-column flex-lg-row justify-content-center align-items-start px-3 px-md-5">
        <div className="chatbox-area bg-white shadow-sm rounded-3 p-4 me-lg-4 mb-4 mb-lg-0">
          <GlobalTest />
        </div>
      </section>

      {/* Articles Section
      <section className="articles-section py-5 px-3 px-md-5 bg-light">
        <h2 className="mb-4 text-center">Insights & Articles</h2>
        <ArticlesPage />
      </section> */}

      {/* Footer */}
      <footer className="text-center py-4 mt-5 border-top">
        <p className="mb-0 text-muted">&copy; 2025 AgileLinks. All rights reserved.</p>
      </footer>
    </Container>
  );
}