import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "./Icons";
import NudgeFormatter from "./NudgeFormatter";
import FeedbackForm from "./FeedbackForm";

interface Notification {
  id: string;
  prompt: string;
  createdAt: any;
  feedback?: string | null;
  type: string;
  planId?: string;
}

interface GameNudgeSliderProps {
  notifications: Notification[];
  isLoading?: boolean;
  milestoneStartDate: string;
  milestoneDueDate: string;
  milestoneTitle: string;
  milestoneDescription: string;
  goalType?: string;
  enneagramData?: {
    type?: string;
    summary?: string;
    blindSpots?: string[];
    strengths?: string[];
  };
  showOnlyLatest?: boolean;
  hideFeedbackStatus?: boolean;
  compactView?: boolean;
  flatLayout?: boolean;
  // Step-adding context
  planId?: string;
  milestoneId?: string;
  onStepAdded?: (step: { id: string; title: string }) => void;
  existingStepTitles?: string[];
}

const GameNudgeSlider: React.FC<GameNudgeSliderProps> = ({
  notifications,
  isLoading = false,
  milestoneStartDate,
  milestoneDueDate,
  milestoneTitle,
  milestoneDescription,
  goalType,
  enneagramData,
  showOnlyLatest = false,
  hideFeedbackStatus = false,
  compactView = false,
  flatLayout = false,
  planId,
  milestoneId,
  onStepAdded,
  existingStepTitles = [],
}) => {
  // Filter to only show the latest notification if showOnlyLatest is true
  // Since notifications are ordered by createdAt desc, the first item is the most recent
  const displayNotifications = showOnlyLatest && notifications.length > 0
    ? [notifications[0]]
    : notifications;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<
    Array<{ id: number; x: number; y: number }>
  >([]);
  const [shakeAnimation, setShakeAnimation] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [addedSteps, setAddedSteps] = useState<Set<string>>(new Set());
  const sliderRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const heartCounter = useRef(0);

  // Handler for adding a step from nudge action items
  const handleAddStep = useCallback(async (stepText: string) => {
    if (!planId || !milestoneId) return;

    const response = await fetch('/api/steps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId,
        milestoneId,
        title: stepText,
        source: 'ai',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      setAddedSteps(prev => new Set([...prev, stepText]));
      onStepAdded?.(data.step);
    }
  }, [planId, milestoneId, onStepAdded]);

  // Check if mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Gamification calculations
  const reactedCount = displayNotifications.filter((n) => n.feedback).length;
  const totalCount = displayNotifications.length;
  const streakCount = calculateStreak(displayNotifications);
  const completionRate =
    totalCount > 0 ? Math.round((reactedCount / totalCount) * 100) : 0;

  function calculateStreak(notifications: Notification[]): number {
    let streak = 0;
    for (let i = 0; i < notifications.length; i++) {
      if (notifications[i].feedback) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  const formatDate = (date: any) => {
    try {
      const dateObj = date?.toDate?.() || new Date(date);
      return dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  const getTimeAgo = (date: any) => {
    try {
      const dateObj = date?.toDate?.() || new Date(date);
      const now = new Date();
      const diffHours = Math.floor(
        (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60)
      );

      if (diffHours < 1) return "Just now";
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return "Recently";
    }
  };

  // Navigation functions
  const goToNext = () => {
    if (currentIndex < notifications.length - 1 && !isAnimating) {
      setIsAnimating(true);
      setCurrentIndex(currentIndex + 1);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0 && !isAnimating) {
      setIsAnimating(true);
      setCurrentIndex(currentIndex - 1);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    handleSwipe();
  };

  const handleSwipe = () => {
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        goToNext(); // Swipe left = next
      } else {
        goToPrevious(); // Swipe right = previous
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex]);

  // Create floating hearts effect
  const createFloatingHeart = (e?: React.MouseEvent) => {
    const rect = sliderRef.current?.getBoundingClientRect();
    const x = e ? e.clientX - (rect?.left || 0) : Math.random() * 300;
    const y = e ? e.clientY - (rect?.top || 0) : Math.random() * 200;

    const heart = {
      id: heartCounter.current++,
      x,
      y,
    };

    setFloatingHearts((prev) => [...prev, heart]);

    // Remove heart after animation
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== heart.id));
    }, 3000);
  };

  // Simple celebration handler
  const handleCelebration = () => {
    setShowCelebration(true);
    setShakeAnimation(true);
    createFloatingHeart();

    setTimeout(() => {
      setShowCelebration(false);
      setShakeAnimation(false);
    }, 1500);
  };

  if (isLoading) {
    return (
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: "1rem",
          padding: "2rem",
          marginTop: "1rem",
          color: "white",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "1.5rem",
            marginBottom: "1rem",
          }}
        >
          🎮 Loading your nudge quest...
        </div>
        <div
          style={{
            width: "100%",
            height: "4px",
            background: "rgba(255,255,255,0.3)",
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "50%",
              height: "100%",
              background: "#fff",
              animation: "pulse 1.5s infinite",
            }}
          />
        </div>
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div
        style={{
          background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
          borderRadius: "1rem",
          padding: "2rem",
          marginTop: "1rem",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎯</div>
        <h3 style={{ margin: "0 0 0.5rem 0", color: "#8b4513" }}>
          Ready for Your First Quest?
        </h3>
        <p style={{ margin: 0, color: "#a0522d" }}>
          No weekly check-ins yet. Your journey starts now!
        </p>
      </div>
    );
  }

  const currentNotification = displayNotifications[currentIndex];
  const hasReacted = currentNotification?.feedback;

  // Build set of all existing step titles to prevent duplicate adds
  const allAddedSteps = new Set([...addedSteps, ...existingStepTitles]);

  const handleCollapse = () => {
    setIsExpanded(false);
    // Scroll back to the weekly check-ins section
    setTimeout(() => {
      containerRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  // Flat layout mode for profile page - no boxes, just inline content
  if (flatLayout) {
    return (
      <div style={{ marginTop: isMobile ? '0.75rem' : '1rem' }}>
        {/* Simple date header */}
        <div style={{
          fontSize: isMobile ? '0.75rem' : '0.8125rem',
          fontWeight: '600',
          color: '#667eea',
          marginBottom: '0.5rem'
        }}>
          📅 {formatDate(currentNotification.createdAt)}
        </div>

        {/* Nudge content - no box wrapper */}
        <div style={{
          fontSize: isMobile ? '0.875rem' : '1rem',
          lineHeight: '1.6',
          color: '#2d3748',
          marginBottom: '1rem'
        }}>
          <NudgeFormatter
            text={currentNotification.prompt}
            onAddStep={planId && milestoneId ? handleAddStep : undefined}
            addedSteps={allAddedSteps}
          />
        </div>

        {/* Show feedback form directly if not reacted */}
        {!hasReacted && (
          <div style={{ marginTop: '1rem' }}>
            <FeedbackForm
              notifId={currentNotification.id}
              existingFeedback={currentNotification.feedback}
              planId={currentNotification.planId}
              nudgeText={currentNotification.prompt}
              milestoneContext={{
                title: milestoneTitle,
                description: milestoneDescription,
                startDate: milestoneStartDate,
                dueDate: milestoneDueDate,
              }}
              goalType={goalType}
              enneagramData={enneagramData}
            />
          </div>
        )}
      </div>
    );
  }

  // Default boxed layout for goal-specific pages
  return (
    <div
      ref={containerRef}
      style={{
        background: isMobile
          ? "transparent"
          : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderRadius: isMobile ? "0" : "1rem",
        padding: isMobile ? "0" : "clamp(1rem, 3vw, 1.5rem)",
        marginTop: isMobile ? "0.5rem" : "1rem",
        color: isMobile ? "#333" : "white",
        position: "relative",
        overflow: "hidden",
        transform: shakeAnimation ? "translateX(-2px)" : "translateX(0)",
        transition: "transform 0.1s ease-in-out",
        maxWidth: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Floating Hearts */}
      {floatingHearts.map((heart) => (
        <div
          key={heart.id}
          style={{
            position: "absolute",
            left: heart.x,
            top: heart.y,
            fontSize: "1.5rem",
            color: "#ff6b9d",
            pointerEvents: "none",
            zIndex: 5,
            animation: "floatUp 3s ease-out forwards",
          }}
        >
          💖
        </div>
      ))}

      {/* Celebration Overlay */}
      {showCelebration && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(34, 197, 94, 0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
            zIndex: 10,
            animation: "celebration 1.5s ease-out",
          }}
        >
          🎉 Nice work! 🎉
        </div>
      )}

      {/* Progress Indicator (Instagram Stories Style) - Hide if showing only latest */}
      {!showOnlyLatest && (
        <div
          style={{
            display: "flex",
            gap: "clamp(0.125rem, 0.5vw, 0.25rem)",
            marginBottom: "1rem",
          }}
        >
          {displayNotifications.map((_, index) => (
            <div
              key={index}
              style={{
                flex: 1,
                height: isMobile ? "3px" : "8px",
                background:
                  index <= currentIndex ? "#ffd700" : "rgba(255,255,255,0.3)",
                borderRadius: "2px",
                transition: "background 0.3s ease",
                cursor: "pointer",
                minHeight: "2px",
              }}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}

      {/* Navigation Indicator - Hide if showing only latest */}
      {!showOnlyLatest && (
        <div
          style={{
            textAlign: "center",
            fontSize: "0.75rem",
            opacity: 0.8,
            marginBottom: "1rem",
          }}
        >
          {currentIndex + 1} of {displayNotifications.length} •{" "}
          {getTimeAgo(currentNotification.createdAt)}
        </div>
      )}

      {/* Main Content Card */}
      <div
        ref={sliderRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleCelebration}
        style={{
          background: isMobile ? "#f8f9fa" : "rgba(255,255,255,0.95)",
          borderRadius: isMobile ? "0.5rem" : "0.75rem",
          padding: isMobile ? "1rem" : "clamp(0.75rem, 2vw, 1.5rem)",
          color: "#1a1a1a",
          transform: isAnimating ? "scale(0.98)" : "scale(1)",
          transition: "transform 0.3s ease",
          cursor: "grab",
          userSelect: "none",
          marginTop: isMobile ? "0.75rem" : "0",
          border: isMobile ? "1px solid #e5e7eb" : "none",
          boxShadow: isMobile ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
        }}
        className="game-nudge-card"
      >
        {/* Content Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <div
            style={{
              fontSize: "clamp(0.75rem, 2vw, 0.875rem)",
              fontWeight: "bold",
              color: "#667eea",
            }}
          >
            📅 {formatDate(currentNotification.createdAt)}
          </div>
          {!hideFeedbackStatus && (
            <div
              style={{
                background: hasReacted ? "#10b981" : "#f59e0b",
                color: "white",
                padding: "0.25rem 0.75rem",
                borderRadius: "1rem",
                fontSize: "clamp(0.65rem, 1.8vw, 0.75rem)",
                fontWeight: "bold",
                whiteSpace: "nowrap",
              }}
            >
              {hasReacted ? "✅ Completed" : "⏳ Awaiting feedback"}
            </div>
          )}
        </div>

        {/* Nudge Content */}
        {!isExpanded ? (
          <div
            style={{
              marginBottom: isMobile ? "1rem" : "1.5rem",
            }}
          >
            {/* Show formatted preview */}
            <div
              style={{
                fontSize: "clamp(0.875rem, 2.5vw, 1rem)",
                lineHeight: "1.5",
                color: "#2d3748",
                wordBreak: "break-word",
                maxHeight: compactView ? "none" : undefined,
                overflow: compactView ? "visible" : undefined,
              }}
            >
              <NudgeFormatter
                text={currentNotification.prompt}
                onAddStep={planId && milestoneId ? handleAddStep : undefined}
                addedSteps={allAddedSteps}
              />
            </div>
            {!hasReacted && (
              <button
                onClick={() => setIsExpanded(true)}
                style={{
                  display: "block",
                  marginTop: "1rem",
                  background: "#667eea",
                  color: "white",
                  border: "none",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                💭 Reflect on this nudge
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Feedback Form */}
            {!hasReacted && (
              <div style={{ marginBottom: "1rem" }}>
                <FeedbackForm
                  notifId={currentNotification.id}
                  existingFeedback={currentNotification.feedback}
                  planId={currentNotification.planId}
                  nudgeText={currentNotification.prompt}
                  milestoneContext={{
                    title: milestoneTitle,
                    description: milestoneDescription,
                    startDate: milestoneStartDate,
                    dueDate: milestoneDueDate,
                  }}
                  goalType={goalType}
                  enneagramData={enneagramData}
                />
              </div>
            )}

            {/* Collapse Button */}
            <button
              onClick={handleCollapse}
              style={{
                display: "block",
                marginTop: "0.75rem",
                marginBottom: "1rem",
                background: "transparent",
                color: "#667eea",
                border: "2px solid #667eea",
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: "bold",
                cursor: "pointer",
                width: "100%",
              }}
            >
              ↑ Close
            </button>
          </div>
        )}

        {/* Existing Reaction */}
        {hasReacted && (
          <div
            style={{
              background: isMobile ? "transparent" : "#f0fdf4",
              border: isMobile ? "none" : "2px solid #22c55e",
              borderLeft: isMobile ? "3px solid #22c55e" : "none",
              borderRadius: isMobile ? "0" : "0.5rem",
              padding: isMobile ? "0.5rem 0 0.5rem 0.75rem" : "1rem",
              marginBottom: isMobile ? "0.75rem" : "1rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.5rem",
              }}
            >
              <span style={{ fontSize: isMobile ? "1rem" : "1.25rem" }}>
                💬
              </span>
              <span
                style={{
                  fontWeight: "bold",
                  color: "#15803d",
                  fontSize: isMobile ? "0.875rem" : "1rem",
                }}
              >
                Your Reaction:
              </span>
            </div>
            <p
              style={{
                margin: 0,
                fontStyle: "italic",
                color: "#166534",
                fontSize: isMobile ? "0.875rem" : "1rem",
                lineHeight: isMobile ? "1.4" : "1.5",
              }}
            >
              "{currentNotification.feedback}"
            </p>
          </div>
        )}

        {/* Optional Link to Separate Page (only show when expanded OR if already reacted) */}
        {(isExpanded || hasReacted) && (
          <Link
            href={`/nudge/${currentNotification.id}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              background: "transparent",
              color: "#64748b",
              padding: "0.75rem",
              borderRadius: "0.5rem",
              textDecoration: "none",
              fontWeight: "500",
              fontSize: "0.875rem",
              transition: "all 0.2s ease",
              width: "100%",
              border: "1px solid #e2e8f0",
            }}
          >
            🔗 View on separate page
            <ArrowRightIcon size={14} />
          </Link>
        )}
      </div>

      {/* Navigation Controls - Hide if showing only latest */}
      {!showOnlyLatest && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "1rem",
            fontSize: "clamp(0.65rem, 1.8vw, 0.75rem)",
            gap: "0.5rem",
          }}
        >
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            style={{
              background:
                currentIndex === 0
                  ? "rgba(255,255,255,0.2)"
                  : "rgba(255,255,255,0.9)",
              color: currentIndex === 0 ? "rgba(255,255,255,0.5)" : "#4f46e5",
              border: "none",
              borderRadius: "0.5rem",
              padding: "clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)",
              cursor: currentIndex === 0 ? "not-allowed" : "pointer",
              fontWeight: "bold",
              fontSize: "clamp(0.7rem, 1.8vw, 0.8rem)",
              minHeight: "40px",
              minWidth: "60px",
            }}
          >
            ← Future
          </button>

          <div
            style={{
              textAlign: "center",
              opacity: 0.9,
              flex: 1,
              padding: "0 0.5rem",
            }}
          >
            {isMobile ? (
              <div style={{ fontSize: "0.75rem" }}>💡 Swipe to navigate</div>
            ) : (
              <>
                <div style={{ marginBottom: "0.25rem" }}>
                  💡 Swipe to navigate
                </div>
                <div style={{ fontSize: "0.65rem", opacity: 0.7 }}>
                  Or use arrow keys • Double-tap for celebration
                </div>
              </>
            )}
          </div>

          <button
            onClick={goToNext}
            disabled={currentIndex === displayNotifications.length - 1}
          style={{
            background:
              currentIndex === displayNotifications.length - 1
                ? "rgba(255,255,255,0.2)"
                : "rgba(255,255,255,0.9)",
            color:
              currentIndex === displayNotifications.length - 1
                ? "rgba(255,255,255,0.5)"
                : "#4f46e5",
            border: "none",
            borderRadius: "0.5rem",
            padding: "clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)",
            cursor:
              currentIndex === displayNotifications.length - 1
                ? "not-allowed"
                : "pointer",
            fontWeight: "bold",
            fontSize: "clamp(0.7rem, 1.8vw, 0.8rem)",
            minHeight: "40px",
            minWidth: "60px",
          }}
        >
          Past →
        </button>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 1;
          }
        }

        @keyframes celebration {
          0% {
            opacity: 0;
            transform: scale(0.8) rotate(-5deg);
          }
          25% {
            opacity: 1;
            transform: scale(1.1) rotate(2deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.05) rotate(-1deg);
          }
          75% {
            opacity: 1;
            transform: scale(1.1) rotate(1deg);
          }
          100% {
            opacity: 0;
            transform: scale(1) rotate(0deg);
          }
        }

        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(0deg);
          }
          25% {
            opacity: 1;
            transform: translateY(-20px) scale(1.2) rotate(5deg);
          }
          50% {
            opacity: 0.8;
            transform: translateY(-40px) scale(1.1) rotate(-3deg);
          }
          75% {
            opacity: 0.5;
            transform: translateY(-60px) scale(0.9) rotate(8deg);
          }
          100% {
            opacity: 0;
            transform: translateY(-80px) scale(0.8) rotate(-5deg);
          }
        }

        @keyframes slideIn {
          0% {
            opacity: 0;
            transform: translateX(20px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* TikTok-style progress bars */
        @keyframes progressFill {
          0% {
            width: 0%;
          }
          100% {
            width: var(--progress-width);
          }
        }

        /* Reaction button hover effects */
        @keyframes buttonPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
          }
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .game-nudge-card {
            min-height: auto !important;
            max-height: 75vh;
            overflow-y: auto;
          }

          /* Reduce vertical spacing on mobile */
          .game-nudge-card > div {
            margin-bottom: 0.75rem !important;
          }

          /* Make navigation more touch-friendly */
          .game-nudge-card button {
            min-height: 44px !important;
            min-width: 44px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default GameNudgeSlider;
