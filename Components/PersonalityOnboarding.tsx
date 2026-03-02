"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../firebase";
import SimplifiedEnneagramInput from "./SimplifiedEnneagramInput";
import SimplifiedMBTIInput from "./SimplifiedMBTIInput";
import { EnneagramResult } from "../Models/EnneagramResult";
import styles from "../Styles/simplifiedEnneagram.module.css";

type PersonalityChoice = "enneagram" | "mbti" | "both" | "skip" | null;
type Step = "choice" | "enneagram" | "mbti";

interface PersonalityOnboardingProps {
  /** Called when the user finishes (all selected steps done). In profile context, use this to dismiss the modal. */
  onComplete?: () => void;
  /** Called when the user clicks "Skip for now" on the choice screen. */
  onSkip?: () => void;
}

const PersonalityOnboarding: React.FC<PersonalityOnboardingProps> = ({ onComplete, onSkip }) => {
  const router = useRouter();
  const [choice, setChoice] = useState<PersonalityChoice>(null);
  const [step, setStep] = useState<Step>("choice");

  const navigateToSignupOrComplete = () => {
    if (onComplete) {
      onComplete();
    } else {
      router.push("/signup");
    }
  };

  const handleChoiceSelect = (selected: PersonalityChoice) => {
    if (selected === "skip") {
      const skipHandler = onSkip || (() => router.push("/signup"));
      skipHandler();
      return;
    }
    setChoice(selected);
    if (selected === "enneagram") setStep("enneagram");
    else if (selected === "mbti") setStep("mbti");
    else if (selected === "both") setStep("enneagram"); // start with enneagram
  };

  const handleEnneagramComplete = (_result: EnneagramResult) => {
    if (choice === "both") {
      setStep("mbti");
    } else {
      navigateToSignupOrComplete();
    }
  };

  const handleMBTIComplete = (_type: string) => {
    navigateToSignupOrComplete();
  };

  const handleSkipMBTI = () => {
    // In "both" flow, user already did enneagram — skipping MBTI is fine
    navigateToSignupOrComplete();
  };

  if (step === "enneagram") {
    return <SimplifiedEnneagramInput onComplete={handleEnneagramComplete} />;
  }

  if (step === "mbti") {
    const skipHandler = choice === "both" ? handleSkipMBTI : (onSkip || (() => router.push("/signup")));
    return <SimplifiedMBTIInput onComplete={handleMBTIComplete} onSkip={skipHandler} />;
  }

  const choiceCards = [
    {
      key: "enneagram" as PersonalityChoice,
      label: "Enneagram",
      description: "Types 1–9, core motivations & growth paths",
      bg: "#FDF0E7",
      border: "#C27A3E",
      iconBg: "#9C4B20",
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="12" stroke="white" strokeWidth="1.5" fill="none" />
          {[0,1,2,3,4,5,6,7,8].map((i) => {
            const angle = (i * 40 - 90) * (Math.PI / 180);
            const x = 14 + 10 * Math.cos(angle);
            const y = 14 + 10 * Math.sin(angle);
            return <circle key={i} cx={x} cy={y} r="1.8" fill="white" />;
          })}
          <polyline points="14,4 19.7,17.5 7,9.3 21,9.3 8.3,17.5" stroke="white" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      key: "mbti" as PersonalityChoice,
      label: "MBTI",
      description: "16 types, cognitive styles & behavioral patterns",
      bg: "#EEF5EF",
      border: "#6BA272",
      iconBg: "#3D7A4A",
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="3" y="3" width="10" height="10" rx="2" fill="white" opacity="0.9" />
          <rect x="15" y="3" width="10" height="10" rx="2" fill="white" opacity="0.6" />
          <rect x="3" y="15" width="10" height="10" rx="2" fill="white" opacity="0.6" />
          <rect x="15" y="15" width="10" height="10" rx="2" fill="white" opacity="0.9" />
        </svg>
      ),
    },
    {
      key: "both" as PersonalityChoice,
      label: "Both",
      description: "Get the richest personalization possible",
      bg: "#FDF6E7",
      border: "#D4A843",
      iconBg: "#C68B2C",
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="4" fill="white" />
          <circle cx="14" cy="4" r="2.5" fill="white" opacity="0.8" />
          <circle cx="23" cy="19" r="2.5" fill="white" opacity="0.8" />
          <circle cx="5" cy="19" r="2.5" fill="white" opacity="0.8" />
          <line x1="14" y1="6.5" x2="14" y2="10" stroke="white" strokeWidth="1.5" />
          <line x1="21" y1="17.5" x2="17.5" y2="15.5" stroke="white" strokeWidth="1.5" />
          <line x1="7" y1="17.5" x2="10.5" y2="15.5" stroke="white" strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      key: "skip" as PersonalityChoice,
      label: "Skip for now",
      description: "You can add it later from your profile",
      bg: "#F5F3F0",
      border: "#D5CFC8",
      iconBg: "#9C9690",
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <polyline points="6,8 18,14 6,20" stroke="white" strokeWidth="2" strokeLinejoin="round" fill="none" />
          <line x1="22" y1="8" x2="22" y2="20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  // Choice screen
  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h2 className={styles.heading}>What do you know about yourself?</h2>
        <p className={styles.helperText}>
          Your personality type helps us personalize your goals and coaching nudges.
          Select what you already know — you can always add more later.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          {choiceCards.map(({ key, label, description, bg, border, iconBg, icon }) => (
            <button
              key={key as string}
              onClick={() => handleChoiceSelect(key)}
              style={{
                background: bg,
                border: `2px solid ${border}`,
                borderRadius: "14px",
                padding: "1.5rem 1.25rem",
                textAlign: "left",
                cursor: "pointer",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 6px 16px ${border}99`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
              }}
            >
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                {icon}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "1rem", color: "#1f2937", marginBottom: "0.25rem" }}>
                  {label}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#6b7280", lineHeight: 1.4 }}>
                  {description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PersonalityOnboarding;
