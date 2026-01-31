"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { EnneagramResult } from "../Models/EnneagramResult";
import styles from "../Styles/simplifiedEnneagram.module.css";
import { getEnneagramTypeInfo } from "../Data/enneagramTypeData";
import { trackEnneagramCompleted } from "../lib/analytics";
import { TrackedFirestoreClient } from "../lib/trackedFirestoreClient";

interface SimplifiedEnneagramInputProps {
  onComplete?: (result: EnneagramResult) => void;
}

const TYPE_NAMES: { [key: number]: string } = {
  1: "Perfectionist",
  2: "Helper",
  3: "Achiever",
  4: "Individualist",
  5: "Investigator",
  6: "Loyalist",
  7: "Enthusiast",
  8: "Challenger",
  9: "Peacemaker",
};

const TYPE_DESCRIPTIONS: { [key: string]: string } = {
  "1w9":
    "You are a Type 1 (The Perfectionist) with a 9 wing. You combine a strong desire for integrity and improvement with a peaceful, accommodating nature. You strive for excellence while maintaining harmony.",
  "1w2":
    "You are a Type 1 (The Perfectionist) with a 2 wing. You blend a commitment to doing what's right with a warm, helpful disposition. You work to improve the world while caring deeply for others.",
  "2w1":
    "You are a Type 2 (The Helper) with a 1 wing. You combine genuine care for others with high standards and conscientiousness. You want to help while maintaining integrity.",
  "2w3":
    "You are a Type 2 (The Helper) with a 3 wing. You blend a nurturing heart with ambition and social awareness. You support others while also achieving your own goals.",
  "3w2":
    "You are a Type 3 (The Achiever) with a 2 wing. You combine drive for success with interpersonal warmth. You excel while building genuine connections with others.",
  "3w4":
    "You are a Type 3 (The Achiever) with a 4 wing. You blend ambition with authenticity and depth. You pursue success while staying true to your unique identity.",
  "4w3":
    "You are a Type 4 (The Individualist) with a 3 wing. You combine depth of feeling with goal-oriented action. You express your uniqueness while achieving tangible results.",
  "4w5":
    "You are a Type 4 (The Individualist) with a 5 wing. You blend emotional depth with intellectual curiosity. You explore your inner world while seeking knowledge.",
  "5w4":
    "You are a Type 5 (The Investigator) with a 4 wing. You combine analytical thinking with creative expression. You pursue knowledge while honoring your unique perspective.",
  "5w6":
    "You are a Type 5 (The Investigator) with a 6 wing. You blend intellectual curiosity with practical caution. You seek understanding while being mindful of potential challenges.",
  "6w5":
    "You are a Type 6 (The Loyalist) with a 5 wing. You combine loyalty and responsibility with analytical thinking. You prepare carefully while seeking security.",
  "6w7":
    "You are a Type 6 (The Loyalist) with a 7 wing. You blend reliability with optimism and enthusiasm. You face challenges with both caution and positive energy.",
  "7w6":
    "You are a Type 7 (The Enthusiast) with a 6 wing. You combine adventure-seeking with loyalty and responsibility. You pursue joy while maintaining commitments.",
  "7w8":
    "You are a Type 7 (The Enthusiast) with an 8 wing. You blend enthusiasm with assertiveness and confidence. You pursue experiences while taking charge of situations.",
  "8w7":
    "You are a Type 8 (The Challenger) with a 7 wing. You combine strength and directness with optimism and energy. You lead confidently while enjoying life.",
  "8w9":
    "You are a Type 8 (The Challenger) with a 9 wing. You blend power and assertiveness with calm and patience. You protect others while maintaining peace.",
  "9w8":
    "You are a Type 9 (The Peacemaker) with an 8 wing. You combine harmony-seeking with quiet strength. You maintain peace while standing firm when needed.",
  "9w1":
    "You are a Type 9 (The Peacemaker) with a 1 wing. You blend a desire for harmony with principled idealism. You seek peace while upholding your values.",
};

type WingStrength = "weak" | "moderate" | "strong";

const SimplifiedEnneagramInput: React.FC<SimplifiedEnneagramInputProps> = ({
  onComplete,
}) => {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [wing, setWing] = useState<number | null>(null);
  const [wingStrength, setWingStrength] = useState<WingStrength>("moderate");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const getWingOptions = (
    type: number
  ): { value: number; display: string; name: string }[] => {
    const prevType = type === 1 ? 9 : type - 1;
    const nextType = type === 9 ? 1 : type + 1;

    return [
      {
        value: prevType,
        display: `${type}w${prevType}`,
        name: TYPE_NAMES[prevType],
      },
      {
        value: nextType,
        display: `${type}w${nextType}`,
        name: TYPE_NAMES[nextType],
      },
    ];
  };

  const getTypeDescription = (type: number, wingValue: number): string => {
    const wingKey = `${type}w${wingValue}`;
    return (
      TYPE_DESCRIPTIONS[wingKey] ||
      `You are a Type ${type} with characteristics influenced by Type ${wingValue}.`
    );
  };

  const getWingScore = (): number => {
    if (!wing) return 0;

    // Wing scoring based on strength:
    // Strong: 12 (close to main type score)
    // Moderate: 9 (balanced influence)
    // Weak: 6 (minimal influence)
    const wingScores = {
      strong: 12,
      moderate: 9,
      weak: 6,
    };

    return wingScores[wingStrength];
  };

  const handleContinue = async () => {
    if (!selectedType) return;

    setIsSubmitting(true);

    try {
      // Create summary based on whether wing is selected
      const wingStrengthText = wing
        ? wingStrength === "strong"
          ? " with a strong"
          : wingStrength === "weak"
          ? " with a subtle"
          : " with a"
        : "";

      const summary = wing
        ? `You are an Enneagram Type ${selectedType}w${wing} - ${TYPE_NAMES[selectedType]}${wingStrengthText} ${TYPE_NAMES[wing]} wing. ${getTypeDescription(selectedType, wing)}`
        : `You are an Enneagram Type ${selectedType} - ${TYPE_NAMES[selectedType]}.`;

      // Get complete type information for detailed personality data
      const typeInfo = getEnneagramTypeInfo(selectedType, wing);

      // Create EnneagramResult object with scores
      // Main type: 15, Wing: varies by strength (12/9/6), Others: 3
      const wingScore = getWingScore();
      const result: EnneagramResult = {
        enneagramType1: selectedType === 1 ? 15 : (wing === 1 ? wingScore : 3),
        enneagramType2: selectedType === 2 ? 15 : (wing === 2 ? wingScore : 3),
        enneagramType3: selectedType === 3 ? 15 : (wing === 3 ? wingScore : 3),
        enneagramType4: selectedType === 4 ? 15 : (wing === 4 ? wingScore : 3),
        enneagramType5: selectedType === 5 ? 15 : (wing === 5 ? wingScore : 3),
        enneagramType6: selectedType === 6 ? 15 : (wing === 6 ? wingScore : 3),
        enneagramType7: selectedType === 7 ? 15 : (wing === 7 ? wingScore : 3),
        enneagramType8: selectedType === 8 ? 15 : (wing === 8 ? wingScore : 3),
        enneagramType9: selectedType === 9 ? 15 : (wing === 9 ? wingScore : 3),
        summary,
        // Save complete personality data
        coreMotivation: typeInfo.coreMotivation,
        keyStrengths: typeInfo.keyStrengths,
        growthAreas: typeInfo.growthAreas,
        blindSpots: typeInfo.blindSpots,
      };

      // Save to Firestore if user is logged in
      const user = auth.currentUser;
      if (user) {
        await TrackedFirestoreClient.doc(`users/${user.uid}`).set(
          { enneagramResult: result },
          {
            userId: user.uid,
            userEmail: user.email || undefined,
            source: 'enneagram_onboarding',
            functionName: 'save_enneagram_result',
          }
        );
        console.log("✅ Enneagram result saved to Firestore");

        // Track enneagram completion
        trackEnneagramCompleted(
          `${selectedType}`,
          wing ? `${wing}` : undefined
        );

        // Check if we're in callback mode (profile catch-up) or redirect mode (signup)
        if (onComplete) {
          // Profile page catch-up mode - let parent handle next steps
          onComplete(result);
        } else {
          // Original signup flow
          router.push("/signup");
        }
      } else {
        // Save to localStorage as fallback for signup page
        localStorage.setItem("userTestResult", JSON.stringify(result));
        console.log("✅ Enneagram result saved to localStorage");

        // Track enneagram completion
        trackEnneagramCompleted(
          `${selectedType}`,
          wing ? `${wing}` : undefined
        );

        router.push("/signup");
      }
    } catch (error) {
      console.error("Error saving Enneagram result:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Step 1: Select Main Type */}
      <div className={styles.section}>
        <h2 className={styles.heading}>What's your Enneagram Type?</h2>
        <p className={styles.helperText}>Select your primary Enneagram type.</p>

        <div className={styles.typeGrid}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((type) => (
            <button
              key={type}
              onClick={() => {
                setSelectedType(type);
                setWing(null); // Reset wing when changing type
                setWingStrength("moderate"); // Reset wing strength to default
                setShowDetails(false); // Close details when changing type
              }}
              className={`${styles.typeCard} ${selectedType === type ? styles.selected : ""}`}
            >
              <div className={styles.typeNumber}>{type}</div>
              <div className={styles.typeName}>{TYPE_NAMES[type]}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Select Wing (Optional) */}
      {selectedType && (
        <div className={`${styles.section} ${styles.fadeIn}`}>
          <h3 className={styles.subheading}>Choose your wing (optional)</h3>
          <p className={styles.helperText}>
            Wings are the types on either side of your main type. You can skip this step if you're unsure.
          </p>

          <div className={styles.wingGrid}>
            {getWingOptions(selectedType).map((wingOption) => (
              <button
                key={wingOption.value}
                onClick={() => setWing(wingOption.value)}
                className={`${styles.wingCard} ${wing === wingOption.value ? styles.selected : ""}`}
              >
                <div className={styles.wingDisplay}>{wingOption.display}</div>
                <div className={styles.wingName}>{wingOption.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Wing Strength (Optional) */}
      {selectedType && wing && (
        <div className={`${styles.section} ${styles.fadeIn}`}>
          <h3 className={styles.subheading}>How strong is your wing influence?</h3>
          <p className={styles.helperText}>
            Some people have a strong wing influence, while others have a more balanced or subtle wing.
          </p>

          <div className={styles.wingStrengthGrid}>
            <button
              onClick={() => setWingStrength("weak")}
              className={`${styles.strengthCard} ${wingStrength === "weak" ? styles.selected : ""}`}
            >
              <div className={styles.strengthLabel}>Subtle</div>
              <div className={styles.strengthDescription}>Minimal wing influence</div>
            </button>
            <button
              onClick={() => setWingStrength("moderate")}
              className={`${styles.strengthCard} ${wingStrength === "moderate" ? styles.selected : ""}`}
            >
              <div className={styles.strengthLabel}>Balanced</div>
              <div className={styles.strengthDescription}>Moderate wing influence</div>
            </button>
            <button
              onClick={() => setWingStrength("strong")}
              className={`${styles.strengthCard} ${wingStrength === "strong" ? styles.selected : ""}`}
            >
              <div className={styles.strengthLabel}>Strong</div>
              <div className={styles.strengthDescription}>Significant wing influence</div>
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Preview Summary */}
      {selectedType && (
        <div className={`${styles.summary} ${styles.fadeIn}`}>
          <h3 className={styles.summaryTitle}>Your Personality Profile</h3>

          {/* Type and Wing Display */}
          <div className={styles.typeWingDisplay}>
            <span className={styles.typeLabel}>Type {selectedType}</span>
            {wing && (
              <>
                <span className={styles.wingConnector}>with</span>
                <span className={styles.wingLabel}>{wing} wing</span>
              </>
            )}
          </div>

          <p className={styles.summaryText}>
            {wing
              ? getTypeDescription(selectedType, wing)
              : `You are an Enneagram Type ${selectedType} - ${TYPE_NAMES[selectedType]}.`
            }
          </p>

          {/* Read More / Read Less Toggle */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={styles.readMoreButton}
          >
            {showDetails ? "Read Less ↑" : "Read More ↓"}
          </button>

          {/* Enhanced profile information - collapsible */}
          {showDetails && (() => {
            const typeInfo = getEnneagramTypeInfo(selectedType, wing);
            return (
              <div className={styles.fadeIn}>
                <div className={styles.profileSection}>
                  <h4 className={`${styles.profileSubheading} ${styles.motivationHeading}`}>
                    💫 Core Motivation
                  </h4>
                  <p className={styles.summaryText} style={{ fontSize: '0.95rem' }}>
                    {typeInfo.coreMotivation}
                  </p>
                </div>

                <div className={styles.profileSection}>
                  <h4 className={`${styles.profileSubheading} ${styles.strengthsHeading}`}>
                    ✨ Key Strengths
                  </h4>
                  <ul className={styles.profileList}>
                    {typeInfo.keyStrengths.map((strength, index) => (
                      <li key={index}>{strength}</li>
                    ))}
                  </ul>
                </div>

                <div className={styles.profileSection}>
                  <h4 className={`${styles.profileSubheading} ${styles.growthHeading}`}>
                    🌱 Growth Areas
                  </h4>
                  <ul className={styles.profileList}>
                    {typeInfo.growthAreas.map((area, index) => (
                      <li key={index}>{area}</li>
                    ))}
                  </ul>
                </div>

                <div className={styles.profileSection}>
                  <h4 className={`${styles.profileSubheading} ${styles.blindSpotsHeading}`}>
                    👁️ Blind Spots
                  </h4>
                  <ul className={styles.profileList}>
                    {typeInfo.blindSpots.map((spot, index) => (
                      <li key={index}>{spot}</li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Action Buttons */}
      <div className={styles.actions}>
        <button
          onClick={handleContinue}
          disabled={!selectedType || isSubmitting}
          className={styles.primaryButton}
        >
          {isSubmitting ? "Saving..." : "Continue →"}
        </button>
      </div>
    </div>
  );
};

export default SimplifiedEnneagramInput;
