"use client";

import React, { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import styles from "../../Styles/about-cinematic.module.css";

// Animated Counter
const AnimatedCounter = ({
  end,
  suffix = "",
}: {
  end: number;
  suffix?: string;
}) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isVisible && count < end) {
      const timer = setTimeout(() => setCount(count + 1), 20);
      return () => clearTimeout(timer);
    }
  }, [count, end, isVisible]);

  return (
    <div
      ref={(el) => {
        if (el) {
          const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) setIsVisible(true);
          });
          observer.observe(el);
        }
      }}
    >
      {count}
      {suffix}
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
      const slideIndex = Math.round(
        scrollRef.current.scrollLeft / window.innerWidth
      );
      setCurrentSlide(slideIndex);
    }
  };

  const scrollToSlide = (index: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: index * window.innerWidth,
        behavior: "smooth",
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
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        <div className={styles.horizontalScrollContent}>{children}</div>
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
            className={`${styles.scrollDot} ${index === currentSlide ? styles.scrollDotActive : ""}`}
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

  const [coachEmail, setCoachEmail] = useState("");
  const [coachSubmitted, setCoachSubmitted] = useState(false);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState("");

  const [orgEmail, setOrgEmail] = useState("");
  const [orgSubmitted, setOrgSubmitted] = useState(false);
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgError, setOrgError] = useState("");

  async function handleWaitlist(
    email: string,
    segment: "coach" | "organization",
    setLoading: (v: boolean) => void,
    setSubmitted: (v: boolean) => void,
    setError: (v: string) => void
  ) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, segment }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 1.2 }}
            className={styles.openingContent}
            style={{ marginTop: "16px" }}
          >
            <p className={styles.openingParagraph}>
              Coaching creates{" "}
              <span className={styles.gradientTextAlt}>powerful insights</span>{" "}
              — but without continuity, they fade.
            </p>
            <p className={styles.openingParagraphEmphasis}>
              Stepiva helps those insights stick.
            </p>
            <p className={styles.openingParagraphSubtext}>
              Stepiva is a personality-driven AI coaching companion designed to
              turn self-awareness into ongoing action, progress, and growth.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.2, duration: 1 }}
            style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap", marginTop: "48px" }}
          >
            <a
              href="https://calendly.com/zakaria-akli-ensa/one-on-one-with-zak"
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: "18px 36px", borderRadius: "16px", background: "#9C4B20", color: "#ffffff", fontWeight: 700, fontSize: "18px", textDecoration: "none", whiteSpace: "nowrap", boxShadow: "0 6px 24px rgba(156,75,32,0.4)" }}
            >
              I&apos;m an Individual → Book a Call
            </a>
            <a
              href="#who-its-for"
              onClick={(e) => { e.preventDefault(); document.getElementById("who-its-for")?.scrollIntoView({ behavior: "smooth" }); }}
              style={{ padding: "18px 36px", borderRadius: "16px", background: "rgba(198,139,44,0.15)", border: "1px solid rgba(198,139,44,0.5)", color: "#C68B2C", fontWeight: 700, fontSize: "18px", textDecoration: "none", cursor: "pointer", whiteSpace: "nowrap" }}
            >
              I&apos;m a Coach → Join Waitlist
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.8, duration: 1 }}
            className={styles.scrollHint}
          ></motion.div>
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
            <div
              className={`${styles.statMassive} ${styles.statMassiveHighlight}`}
            >
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
      <section
        className={styles.scene}
        style={{
          background:
            "rgba(61, 122, 74, 0.05)",
        }}
      >
        <div className={styles.sceneContent} style={{ maxWidth: "1000px" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            style={{ textAlign: "center" }}
          >
            <h2
              style={{
                fontSize: "clamp(32px, 5vw, 56px)",
                fontWeight: 800,
                marginBottom: "40px",
              }}
            >
              What <span className={styles.gradientText}>Stepiva</span> does
            </h2>

            <p
              style={{
                fontSize: "clamp(20px, 2.8vw, 28px)",
                lineHeight: 1.7,
                color: "rgba(255, 255, 255, 0.9)",
                marginBottom: "48px",
                fontWeight: 500,
              }}
            >
              Stepiva amplifies coaches' efforts by extending their impact over
              time.
            </p>

            <div
              style={{
                display: "grid",
                gap: "20px",
                maxWidth: "800px",
                margin: "0 auto 60px",
                padding: "0 20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                  padding: "20px 28px",
                  background: "rgba(156, 75, 32, 0.08)",
                  border: "1px solid rgba(156, 75, 32, 0.2)",
                  borderRadius: "16px",
                  transition: "all 0.3s ease",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    minWidth: "48px",
                    borderRadius: "12px",
                    background: "#9C4B20",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    boxShadow: "0 4px 12px rgba(156, 75, 32, 0.3)",
                  }}
                >
                  🧬
                </div>
                <p
                  style={{
                    fontSize: "clamp(17px, 2.2vw, 20px)",
                    lineHeight: 1.5,
                    color: "rgba(255, 255, 255, 0.9)",
                    margin: 0,
                  }}
                >
                  <strong style={{ color: "#ffffff" }}>
                    Personality grounding
                  </strong>{" "}
                  — Enneagram integration
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                  padding: "20px 28px",
                  background: "rgba(198, 139, 44, 0.08)",
                  border: "1px solid rgba(198, 139, 44, 0.2)",
                  borderRadius: "16px",
                  transition: "all 0.3s ease",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    minWidth: "48px",
                    borderRadius: "12px",
                    background: "#C68B2C",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    boxShadow: "0 4px 12px rgba(198, 139, 44, 0.3)",
                  }}
                >
                  💬
                </div>
                <p
                  style={{
                    fontSize: "clamp(17px, 2.2vw, 20px)",
                    lineHeight: 1.5,
                    color: "rgba(255, 255, 255, 0.9)",
                    margin: 0,
                  }}
                >
                  <strong style={{ color: "#ffffff" }}>
                    AI coach interaction
                  </strong>{" "}
                  — Personalized guidance
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                  padding: "20px 28px",
                  background: "rgba(61, 122, 74, 0.08)",
                  border: "1px solid rgba(61, 122, 74, 0.2)",
                  borderRadius: "16px",
                  transition: "all 0.3s ease",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    minWidth: "48px",
                    borderRadius: "12px",
                    background: "#6BA375",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    boxShadow: "0 4px 12px rgba(61, 122, 74, 0.3)",
                  }}
                >
                  🎯
                </div>
                <p
                  style={{
                    fontSize: "clamp(17px, 2.2vw, 20px)",
                    lineHeight: 1.5,
                    color: "rgba(255, 255, 255, 0.9)",
                    margin: 0,
                  }}
                >
                  <strong style={{ color: "#ffffff" }}>
                    Goals and milestone tracking
                  </strong>{" "}
                  — Clear progress
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                  padding: "20px 28px",
                  background: "rgba(156, 75, 32, 0.08)",
                  border: "1px solid rgba(156, 75, 32, 0.2)",
                  borderRadius: "16px",
                  transition: "all 0.3s ease",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    minWidth: "48px",
                    borderRadius: "12px",
                    background: "#9C4B20",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    boxShadow: "0 4px 12px rgba(156, 75, 32, 0.3)",
                  }}
                >
                  🔔
                </div>
                <p
                  style={{
                    fontSize: "clamp(17px, 2.2vw, 20px)",
                    lineHeight: 1.5,
                    color: "rgba(255, 255, 255, 0.9)",
                    margin: 0,
                  }}
                >
                  <strong style={{ color: "#ffffff" }}>
                    Smart nudges and reminders
                  </strong>{" "}
                  — Stay on track
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                  padding: "20px 28px",
                  background: "rgba(198, 139, 44, 0.08)",
                  border: "1px solid rgba(198, 139, 44, 0.2)",
                  borderRadius: "16px",
                  transition: "all 0.3s ease",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    minWidth: "48px",
                    borderRadius: "12px",
                    background: "#C68B2C",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    boxShadow: "0 4px 12px rgba(198, 139, 44, 0.3)",
                  }}
                >
                  🧠
                </div>
                <p
                  style={{
                    fontSize: "clamp(17px, 2.2vw, 20px)",
                    lineHeight: 1.5,
                    color: "rgba(255, 255, 255, 0.9)",
                    margin: 0,
                  }}
                >
                  <strong style={{ color: "#ffffff" }}>
                    Memory and continuity
                  </strong>{" "}
                  — Learning compounds
                </p>
              </div>
            </div>

            <p
              style={{
                fontSize: "clamp(19px, 2.6vw, 26px)",
                lineHeight: 1.6,
                color: "#ffffff",
                marginBottom: "60px",
                fontWeight: 600,
                fontStyle: "italic",
              }}
            >
              No generic advice. No reset at every conversation.
            </p>

            <h3
              style={{
                fontSize: "clamp(28px, 4vw, 40px)",
                fontWeight: 700,
                marginTop: "80px",
                marginBottom: "48px",
                color: "#ffffff",
              }}
            >
              How it works
            </h3>

            <p
              style={{
                fontSize: "clamp(18px, 2.5vw, 24px)",
                lineHeight: 1.8,
                color: "rgba(255, 255, 255, 0.8)",
                marginBottom: "60px",
                maxWidth: "800px",
                margin: "0 auto 60px",
              }}
            >
              Stepiva supports you end to end, from clarity to execution to
              long-term growth:
            </p>

            <div className={styles.stepsGrid}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.8 }}
                style={{
                  padding: "40px 28px",
                  background:
                    "rgba(156, 75, 32, 0.1)",
                  border: "1px solid rgba(156, 75, 32, 0.3)",
                  borderRadius: "24px",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  boxShadow: "0 8px 32px rgba(156, 75, 32, 0.2)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "20px",
                    background: "#9C4B20",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "32px",
                    fontWeight: 800,
                    color: "#ffffff",
                    marginBottom: "24px",
                    boxShadow:
                      "0 8px 24px rgba(156, 75, 32, 0.5), inset 0 -2px 8px rgba(0, 0, 0, 0.2)",
                    position: "relative",
                  }}
                >
                  <span style={{ position: "relative", zIndex: 1 }}>1</span>
                  <div
                    style={{
                      position: "absolute",
                      top: "-4px",
                      right: "-4px",
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      background: "rgba(255, 255, 255, 0.3)",
                      filter: "blur(4px)",
                    }}
                  />
                </div>
                <h4
                  style={{
                    fontSize: "clamp(20px, 2.5vw, 24px)",
                    fontWeight: 700,
                    marginBottom: "16px",
                    color: "#ffffff",
                    textAlign: "center",
                    lineHeight: 1.3,
                  }}
                >
                  Start from who you are
                </h4>
                <p
                  style={{
                    fontSize: "clamp(15px, 1.9vw, 17px)",
                    lineHeight: 1.7,
                    color: "rgba(255, 255, 255, 0.8)",
                    textAlign: "center",
                  }}
                >
                  Your personality gives the AI coach context about your
                  strengths, blind spots, and recurring patterns, so guidance is
                  grounded from day one.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.8 }}
                style={{
                  padding: "40px 28px",
                  background:
                    "rgba(198, 139, 44, 0.1)",
                  border: "1px solid rgba(198, 139, 44, 0.3)",
                  borderRadius: "24px",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  boxShadow: "0 8px 32px rgba(198, 139, 44, 0.2)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "20px",
                    background: "#C68B2C",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "32px",
                    fontWeight: 800,
                    color: "#ffffff",
                    marginBottom: "24px",
                    boxShadow:
                      "0 8px 24px rgba(198, 139, 44, 0.5), inset 0 -2px 8px rgba(0, 0, 0, 0.2)",
                    position: "relative",
                  }}
                >
                  <span style={{ position: "relative", zIndex: 1 }}>2</span>
                  <div
                    style={{
                      position: "absolute",
                      top: "-4px",
                      right: "-4px",
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      background: "rgba(255, 255, 255, 0.3)",
                      filter: "blur(4px)",
                    }}
                  />
                </div>
                <h4
                  style={{
                    fontSize: "clamp(20px, 2.5vw, 24px)",
                    fontWeight: 700,
                    marginBottom: "16px",
                    color: "#ffffff",
                    textAlign: "center",
                    lineHeight: 1.3,
                  }}
                >
                  Work on real goals
                </h4>
                <p
                  style={{
                    fontSize: "clamp(15px, 1.9vw, 17px)",
                    lineHeight: 1.7,
                    color: "rgba(255, 255, 255, 0.8)",
                    textAlign: "center",
                  }}
                >
                  The AI Goal Wizard helps structure and fine-tune each goal,
                  then breaks it into clear, achievable milestones.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6, duration: 0.8 }}
                style={{
                  padding: "40px 28px",
                  background:
                    "rgba(61, 122, 74, 0.1)",
                  border: "1px solid rgba(61, 122, 74, 0.3)",
                  borderRadius: "24px",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  boxShadow: "0 8px 32px rgba(61, 122, 74, 0.2)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "20px",
                    background: "#6BA375",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "32px",
                    fontWeight: 800,
                    color: "#ffffff",
                    marginBottom: "24px",
                    boxShadow:
                      "0 8px 24px rgba(61, 122, 74, 0.5), inset 0 -2px 8px rgba(0, 0, 0, 0.2)",
                    position: "relative",
                  }}
                >
                  <span style={{ position: "relative", zIndex: 1 }}>3</span>
                  <div
                    style={{
                      position: "absolute",
                      top: "-4px",
                      right: "-4px",
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      background: "rgba(255, 255, 255, 0.3)",
                      filter: "blur(4px)",
                    }}
                  />
                </div>
                <h4
                  style={{
                    fontSize: "clamp(20px, 2.5vw, 24px)",
                    fontWeight: 700,
                    marginBottom: "16px",
                    color: "#ffffff",
                    textAlign: "center",
                    lineHeight: 1.3,
                  }}
                >
                  Stay supported between milestones
                </h4>
                <p
                  style={{
                    fontSize: "clamp(15px, 1.9vw, 17px)",
                    lineHeight: 1.7,
                    color: "rgba(255, 255, 255, 0.8)",
                    textAlign: "center",
                  }}
                >
                  You interact with your AI coach and receive personalized
                  nudges that amplify strengths, navigate blind spots, and
                  maintain momentum.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8, duration: 0.8 }}
                style={{
                  padding: "40px 28px",
                  background:
                    "rgba(156, 75, 32, 0.1)",
                  border: "1px solid rgba(156, 75, 32, 0.3)",
                  borderRadius: "24px",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  boxShadow: "0 8px 32px rgba(156, 75, 32, 0.2)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "20px",
                    background: "#9C4B20",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "32px",
                    fontWeight: 800,
                    color: "#ffffff",
                    marginBottom: "24px",
                    boxShadow:
                      "0 8px 24px rgba(156, 75, 32, 0.5), inset 0 -2px 8px rgba(0, 0, 0, 0.2)",
                    position: "relative",
                  }}
                >
                  <span style={{ position: "relative", zIndex: 1 }}>4</span>
                  <div
                    style={{
                      position: "absolute",
                      top: "-4px",
                      right: "-4px",
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      background: "rgba(255, 255, 255, 0.3)",
                      filter: "blur(4px)",
                    }}
                  />
                </div>
                <h4
                  style={{
                    fontSize: "clamp(20px, 2.5vw, 24px)",
                    fontWeight: 700,
                    marginBottom: "16px",
                    color: "#ffffff",
                    textAlign: "center",
                    lineHeight: 1.3,
                  }}
                >
                  Build continuity over time
                </h4>
                <p
                  style={{
                    fontSize: "clamp(15px, 1.9vw, 17px)",
                    lineHeight: 1.7,
                    color: "rgba(255, 255, 255, 0.8)",
                    textAlign: "center",
                  }}
                >
                  Stepiva remembers your journey, learns from your progress, and
                  adapts its guidance as you grow, so insights accumulate
                  instead of resetting.
                </p>
              </motion.div>
            </div>

          </motion.div>
        </div>
      </section>

      {/* Who it's for */}
      <section id="who-its-for" className={styles.scene} style={{ background: "rgba(156, 75, 32, 0.03)" }}>
        <div className={styles.sceneContent} style={{ maxWidth: "1100px" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            style={{ textAlign: "center", marginBottom: "56px" }}
          >
            <h2 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, marginBottom: "16px" }}>
              Built for every <span className={styles.gradientText}>growth journey</span>
            </h2>
            <p style={{ fontSize: "clamp(17px, 2.2vw, 21px)", color: "rgba(255,255,255,0.7)", margin: 0 }}>
              Whether you're growing yourself, guiding others, or shaping the next generation.
            </p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "28px" }}>
            {/* For Individuals */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.8 }}
              style={{
                padding: "36px 28px",
                background: "rgba(156, 75, 32, 0.1)",
                border: "1px solid rgba(156, 75, 32, 0.3)",
                borderRadius: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "52px", height: "52px", minWidth: "52px", borderRadius: "14px", background: "#9C4B20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", boxShadow: "0 4px 16px rgba(156,75,32,0.4)" }}>
                  🌱
                </div>
                <h3 style={{ fontSize: "clamp(20px, 2.4vw, 24px)", fontWeight: 700, color: "#ffffff", margin: 0 }}>For Individuals</h3>
              </div>
              <p style={{ fontSize: "clamp(15px, 1.8vw, 17px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.7, margin: 0 }}>
                Already in a coaching program? Book a free call to explore how the AI/human hybrid experience can help your insights stick between sessions.
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                {["Personality-grounded goal setting", "Daily nudges tied to your milestones", "Reflection coach always available", "Progress that actually compounds"].map((item) => (
                  <li key={item} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "clamp(14px, 1.7vw, 16px)", color: "rgba(255,255,255,0.85)" }}>
                    <span style={{ color: "#C68B2C", fontWeight: 700, fontSize: "18px", lineHeight: 1 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="https://calendly.com/zakaria-akli-ensa/one-on-one-with-zak"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "14px 24px",
                  borderRadius: "12px",
                  background: "#9C4B20",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "16px",
                  textDecoration: "none",
                  marginTop: "4px",
                  transition: "opacity 0.2s",
                }}
              >
                Book a Free Call →
              </a>
            </motion.div>

            {/* For Coaches */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25, duration: 0.8 }}
              style={{
                padding: "36px 28px",
                background: "rgba(198, 139, 44, 0.1)",
                border: "1px solid rgba(198, 139, 44, 0.3)",
                borderRadius: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "52px", height: "52px", minWidth: "52px", borderRadius: "14px", background: "#C68B2C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", boxShadow: "0 4px 16px rgba(198,139,44,0.4)" }}>
                  🎓
                </div>
                <h3 style={{ fontSize: "clamp(20px, 2.4vw, 24px)", fontWeight: 700, color: "#ffffff", margin: 0 }}>For Coaches</h3>
              </div>
              <p style={{ fontSize: "clamp(15px, 1.8vw, 17px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.7, margin: 0 }}>
                Be among the first to test the AI/human hybrid experience with your clients. Join the waitlist and help shape how coaching evolves between sessions.
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                {["Client continuity between sessions", "AI aligned with your methodology", "Engagement data at a glance", "Scale your impact without burnout"].map((item) => (
                  <li key={item} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "clamp(14px, 1.7vw, 16px)", color: "rgba(255,255,255,0.85)" }}>
                    <span style={{ color: "#C68B2C", fontWeight: 700, fontSize: "18px", lineHeight: 1 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              {coachSubmitted ? (
                <div style={{ padding: "16px", background: "rgba(198,139,44,0.15)", border: "1px solid rgba(198,139,44,0.4)", borderRadius: "12px", textAlign: "center" }}>
                  <p style={{ color: "#C68B2C", fontWeight: 600, margin: 0, fontSize: "15px" }}>You're on the list. We'll be in touch soon.</p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleWaitlist(coachEmail, "coach", setCoachLoading, setCoachSubmitted, setCoachError);
                  }}
                  style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "4px" }}
                >
                  <input
                    type="email"
                    value={coachEmail}
                    onChange={(e) => setCoachEmail(e.target.value)}
                    placeholder="Your email"
                    required
                    style={{
                      flex: 1,
                      minWidth: "180px",
                      padding: "13px 16px",
                      borderRadius: "10px",
                      border: "1px solid rgba(198,139,44,0.4)",
                      background: "rgba(0,0,0,0.3)",
                      color: "#ffffff",
                      fontSize: "15px",
                      outline: "none",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={coachLoading}
                    style={{
                      padding: "13px 22px",
                      borderRadius: "10px",
                      background: "#C68B2C",
                      color: "#ffffff",
                      border: "none",
                      fontWeight: 700,
                      fontSize: "15px",
                      cursor: coachLoading ? "not-allowed" : "pointer",
                      opacity: coachLoading ? 0.7 : 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {coachLoading ? "..." : "Join Waitlist"}
                  </button>
                  {coachError && (
                    <p style={{ color: "#ff6b6b", fontSize: "13px", margin: "4px 0 0", width: "100%" }}>{coachError}</p>
                  )}
                </form>
              )}
            </motion.div>
          </div>

          {/* Subtle org CTA */}
          <div style={{ textAlign: "center", marginTop: "36px" }}>
            {orgSubmitted ? (
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "15px" }}>
                Thanks — we'll reach out when we have an institutional offering ready.
              </p>
            ) : (
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "15px", margin: 0, display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: "8px" }}>
                <span>A coaching school or organization?</span>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleWaitlist(orgEmail, "organization", setOrgLoading, setOrgSubmitted, setOrgError);
                  }}
                  style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}
                >
                  <input
                    type="email"
                    value={orgEmail}
                    onChange={(e) => setOrgEmail(e.target.value)}
                    placeholder="Your email"
                    required
                    style={{
                      padding: "8px 14px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.2)",
                      background: "rgba(255,255,255,0.05)",
                      color: "#ffffff",
                      fontSize: "14px",
                      outline: "none",
                      width: "200px",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={orgLoading}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      background: "rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.7)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      fontSize: "14px",
                      cursor: orgLoading ? "not-allowed" : "pointer",
                      fontWeight: 600,
                    }}
                  >
                    {orgLoading ? "..." : "Get in touch →"}
                  </button>
                  {orgError && <span style={{ color: "#ff6b6b", fontSize: "13px" }}>{orgError}</span>}
                </form>
              </div>
            )}
          </div>

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
            style={{
              fontSize: "clamp(36px, 6vw, 72px)",
              fontWeight: 800,
              marginBottom: "80px",
              maxWidth: "900px",
            }}
          >
            Ready to turn insights into{" "}
            <span className={styles.gradientText}>impact?</span>
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 1 }}
            style={{ display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap" }}
          >
            <a
              href="https://calendly.com/zakaria-akli-ensa/one-on-one-with-zak"
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.ctaCard} ${styles.ctaCardPrimary}`}
            >
              <div className={styles.ctaLabel}>For Individuals</div>
              <div className={styles.ctaTitle}>Book a Free Call</div>
              <div className={styles.ctaArrow}>→</div>
            </a>
            <a
              href="#who-its-for"
              className={`${styles.ctaCard} ${styles.ctaCardPrimary}`}
              style={{ borderColor: "rgba(198,139,44,0.5)", background: "rgba(198,139,44,0.08)" }}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("who-its-for")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <div className={styles.ctaLabel}>For Coaches</div>
              <div className={styles.ctaTitle}>Join the Waitlist</div>
              <div className={styles.ctaArrow}>→</div>
            </a>
          </motion.div>

        </div>
      </section>
    </div>
  );
}
