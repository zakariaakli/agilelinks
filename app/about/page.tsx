"use client";

import React, { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import styles from "../../Styles/about-cinematic.module.css";

// Animated Counter
const AnimatedCounter = ({ end, suffix = "" }: { end: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isVisible && count < end) {
      const timer = setTimeout(() => setCount(count + 1), 20);
      return () => clearTimeout(timer);
    }
  }, [count, end, isVisible]);

  return (
    <div ref={(el) => {
      if (el) {
        const observer = new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting) setIsVisible(true);
        });
        observer.observe(el);
      }
    }}>
      {count}{suffix}
    </div>
  );
};

// Horizontal Scroll Component with drag support
const HorizontalScroll = ({ children }: { children: React.ReactNode }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 3;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const slideIndex = Math.round(scrollRef.current.scrollLeft / window.innerWidth);
      setCurrentSlide(slideIndex);
    }
  };

  const scrollToSlide = (index: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: index * window.innerWidth,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className={styles.sceneHorizontal}>
      <div
        ref={scrollRef}
        className={styles.horizontalScrollWrapper}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onScroll={handleScroll}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div className={styles.horizontalScrollContent}>
          {children}
        </div>
      </div>

      {/* Navigation Arrows */}
      {currentSlide > 0 && (
        <button
          className={`${styles.scrollArrow} ${styles.scrollArrowLeft}`}
          onClick={() => scrollToSlide(currentSlide - 1)}
          aria-label="Previous slide"
        >
          ←
        </button>
      )}
      {currentSlide < totalSlides - 1 && (
        <button
          className={`${styles.scrollArrow} ${styles.scrollArrowRight}`}
          onClick={() => scrollToSlide(currentSlide + 1)}
          aria-label="Next slide"
        >
          →
        </button>
      )}

      {/* Progress Dots */}
      <div className={styles.scrollDots}>
        {[...Array(totalSlides)].map((_, index) => (
          <button
            key={index}
            className={`${styles.scrollDot} ${index === currentSlide ? styles.scrollDotActive : ''}`}
            onClick={() => scrollToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default function AboutPage() {
  const { scrollYProgress } = useScroll();
  const timelineWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <div className={styles.filmContainer}>
      {/* Film grain overlay */}
      <div className={styles.filmGrain} />

      {/* Film timeline progress */}
      <div className={styles.filmTimeline}>
        <motion.div
          className={styles.filmTimelineProgress}
          style={{ width: timelineWidth }}
        />
        <div className={styles.filmTimelineMarkers}>
          <span>ACT I</span>
          <span>ACT II</span>
          <span>ACT III</span>
        </div>
      </div>

      {/* Letterbox bars */}
      <div className={`${styles.letterbox} ${styles.letterboxTop}`} />
      <div className={`${styles.letterbox} ${styles.letterboxBottom}`} />

      {/* ACT I: Opening Shot */}
      <section className={`${styles.scene} ${styles.sceneOpening}`}>
        <div className={`${styles.sceneContent} ${styles.sceneContentCenter}`}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className={styles.filmTitle}
          >
            STEPIVA PRESENTS
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 1.5 }}
            className={styles.openingTitle}
          >
            What if the only thing standing
            <br />
            between you and your dream job
            <br />
            <span className={styles.gradientText}>isn't what you know</span>,
            <br />
            but{" "}
            <span className={styles.gradientTextAlt}>how you show up?</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3, duration: 1 }}
            className={styles.scrollHint}
          >
            <span>↓</span>
            <p>SCROLL TO BEGIN</p>
          </motion.div>
        </div>
      </section>

      {/* ACT II: The Gap - Horizontal Scroll */}
      <HorizontalScroll>
        {/* Scene 1 */}
        <div className={styles.horizontalScene}>
          <div>
            <div className={styles.sceneNumber}>01</div>
            <h2 className={styles.sceneTitle}>THE GAP</h2>
            <div className={styles.statMassive}>
              <div className={`${styles.statNumber} ${styles.gradientText}`}>
                <AnimatedCounter end={90} suffix="%" />
              </div>
              <p className={styles.statDescription}>
                of insights fade within weeks
                <br />
                <strong>without action</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Scene 2 */}
        <div className={styles.horizontalScene}>
          <div>
            <div className={styles.sceneNumber}>02</div>
            <h2 className={styles.sceneTitle}>THE COST</h2>
            <div className={styles.statMassive}>
              <div className={`${styles.statNumber} ${styles.gradientTextAlt}`}>
                <AnimatedCounter end={41} suffix="%" />
              </div>
              <p className={styles.statDescription}>
                36-41% of employers concerned about
                <br />
                <strong>soft-skill execution gap</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Scene 3 */}
        <div className={styles.horizontalScene}>
          <div>
            <div className={styles.sceneNumber}>03</div>
            <h2 className={styles.sceneTitle}>THE TRANSFORMATION</h2>
            <div className={`${styles.statMassive} ${styles.statMassiveHighlight}`}>
              <div className={styles.statNumber}>
                <AnimatedCounter end={100} suffix="%" />
              </div>
              <p className={styles.statDescription}>
                of our users see lasting
                <br />
                <strong>behavior change</strong>
              </p>
            </div>
          </div>
        </div>
      </HorizontalScroll>

      {/* Product Intro Section */}
      <section className={styles.scene} style={{ background: "radial-gradient(circle at center, rgba(34, 211, 238, 0.1) 0%, rgba(0, 0, 0, 1) 60%)" }}>
        <div className={styles.sceneContent} style={{ maxWidth: "1000px" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            style={{ textAlign: "center" }}
          >
            <h2 style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 800, marginBottom: "40px" }}>
              Meet <span className={styles.gradientText}>Stepiva</span>
            </h2>

            <p style={{ fontSize: "clamp(18px, 2.5vw, 24px)", lineHeight: 1.8, color: "rgba(255, 255, 255, 0.8)", marginBottom: "60px" }}>
              The only personality-driven career platform that turns self-awareness into sustainable growth.
              We combine <strong style={{ color: "#22d3ee" }}>Enneagram science</strong>, <strong style={{ color: "#ec4899" }}>AI coaching</strong>,
              and <strong style={{ color: "#8b5cf6" }}>milestone tracking</strong> to help you build the soft skills employers actually want.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "32px", marginTop: "60px" }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.8 }}
                whileHover={{ scale: 1.05 }}
                style={{ padding: "32px", background: "rgba(139, 92, 246, 0.1)", borderRadius: "20px", border: "1px solid rgba(139, 92, 246, 0.3)" }}
              >
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🧬</div>
                <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px" }}>Discover</h3>
                <p style={{ fontSize: "15px", color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.6 }}>
                  Take the Enneagram assessment and understand your unique personality blueprint
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.8 }}
                whileHover={{ scale: 1.05 }}
                style={{ padding: "32px", background: "rgba(236, 72, 153, 0.1)", borderRadius: "20px", border: "1px solid rgba(236, 72, 153, 0.3)" }}
              >
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎯</div>
                <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px" }}>Apply</h3>
                <p style={{ fontSize: "15px", color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.6 }}>
                  Set goals, break them into milestones, and get AI-powered nudges tailored to your personality
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6, duration: 0.8 }}
                whileHover={{ scale: 1.05 }}
                style={{ padding: "32px", background: "rgba(34, 211, 238, 0.1)", borderRadius: "20px", border: "1px solid rgba(34, 211, 238, 0.3)" }}
              >
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🚀</div>
                <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px" }}>Transform</h3>
                <p style={{ fontSize: "15px", color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.6 }}>
                  Track your progress and build lasting habits that accelerate your career growth
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ACT III: The Call - Final Frame */}
      <section className={styles.scene}>
        <div className={`${styles.sceneContent} ${styles.sceneContentCenter}`}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            style={{ fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 800, marginBottom: "80px", maxWidth: "900px" }}
          >
            Ready to turn insights into{" "}
            <span className={styles.gradientText}>impact?</span>
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 1 }}
            className={styles.ctaGrid}
          >
            <a href="/signup" className={`${styles.ctaCard} ${styles.ctaCardPrimary}`}>
              <div className={styles.ctaLabel}>For Individuals</div>
              <div className={styles.ctaTitle}>Start Your Journey</div>
              <div className={styles.ctaArrow}>→</div>
            </a>

            <a href="/contact" className={styles.ctaCard}>
              <div className={styles.ctaLabel}>For Organizations</div>
              <div className={styles.ctaTitle}>Book a Demo</div>
              <div className={styles.ctaArrow}>→</div>
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1, duration: 1 }}
            style={{ marginTop: "60px", display: "flex", gap: "16px", justifyContent: "center", opacity: 0.5, fontSize: "14px" }}
          >
            <Link href="/privacy-policy" style={{ color: "#fff", textDecoration: "none" }}>Privacy</Link>
            <span>·</span>
            <Link href="/product" style={{ color: "#fff", textDecoration: "none" }}>Product</Link>
            <span>·</span>
            <Link href="/articles" style={{ color: "#fff", textDecoration: "none" }}>Blog</Link>
          </motion.div>
        </div>
      </section>

      {/* END CREDITS */}
      <div className={styles.endCredits}>
        <p>STEPIVA © 2025</p>
        <p>Personality-Powered Career Growth</p>
      </div>
    </div>
  );
}
