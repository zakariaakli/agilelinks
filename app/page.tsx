import React from "react";
import ArticlesPage from "./articles/page";
import GlobalTest from "../Components/GlobalTest";
import '../Styles/homepage.css';

export default function Home() {
  return (
    <div className="containerFluid">
      {/* Hero Section */}
      <section className="hero heroFull slideInDown">
        <div className="heroContent textCenter">
          <h1 className="display-5 fw-bold mb4 fadeIn staggerDelay1">Discover Your Enneagram Type</h1>
          <p className="lead mb8 fadeIn staggerDelay2">Understand yourself better through intelligent coaching and personalized growth plans.</p>
          <div className="fadeIn staggerDelay3">
            <a href="#test" className="button primary pulse">Get Started</a>
          </div>
        </div>
      </section>

      {/* Chat + Result Panel */}
      <section id="test" className="section slideInUp">
        <div className="container">
          <div className="flex justifyCenter">
            <div className="chatbox-area w100" style={{ maxWidth: '800px' }}>
              <GlobalTest />
            </div>
          </div>
        </div>
      </section>

      {/* Articles Section */}
      <section className="section slideInUp staggerDelay1" style={{ backgroundColor: 'var(--bg-muted)' }}>
        <div className="container">
          <h2 className="mb8 textCenter sectionTitle">Insights & Articles</h2>
          <ArticlesPage />
        </div>
      </section>

    </div>
  );
}