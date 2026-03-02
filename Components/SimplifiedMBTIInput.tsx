"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../firebase";
import { TrackedFirestoreClient } from "../lib/trackedFirestoreClient";
import { trackMBTICompleted } from "../lib/analytics";
import { MBTI_GROUPS, getMBTITypeInfo } from "../Data/mbtiTypeData";
import styles from "../Styles/simplifiedEnneagram.module.css";

interface SimplifiedMBTIInputProps {
  onComplete?: (type: string) => void;
  onSkip?: () => void;
}

const SimplifiedMBTIInput: React.FC<SimplifiedMBTIInputProps> = ({ onComplete, onSkip }) => {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!selectedType) return;
    setIsSubmitting(true);

    try {
      const user = auth.currentUser;
      trackMBTICompleted(selectedType);

      if (user) {
        await TrackedFirestoreClient.doc(`users/${user.uid}`).set(
          { mbtiType: selectedType },
          {
            userId: user.uid,
            userEmail: user.email || undefined,
            source: "mbti_onboarding",
            functionName: "save_mbti_type",
          }
        );
        if (onComplete) {
          onComplete(selectedType);
        }
      } else {
        localStorage.setItem("userMBTIResult", selectedType);
        if (onComplete) {
          onComplete(selectedType);
        } else {
          router.push("/signup");
        }
      }
    } catch (error) {
      console.error("Error saving MBTI type:", error);
      setIsSubmitting(false);
    }
  };

  const typeInfo = selectedType ? getMBTITypeInfo(selectedType) : null;

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h2 className={styles.heading}>What's your MBTI Type?</h2>
        <p className={styles.helperText}>
          Select your Myers-Briggs type. If you're unsure, you can skip this for now.
        </p>

        {MBTI_GROUPS.map((group) => (
          <div key={group.name} style={{ marginBottom: "1.5rem" }}>
            <p style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: group.color,
              marginBottom: "0.75rem",
            }}>
              {group.name}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
              {group.types.map((type) => {
                const isSelected = selectedType === type;
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={styles.typeCard}
                    style={{
                      padding: "0.75rem 0.25rem",
                      borderColor: isSelected ? "#3D7A4A" : undefined,
                      background: isSelected ? "#EEF5EF" : undefined,
                      boxShadow: isSelected ? "0 0 0 3px rgba(61, 122, 74, 0.12)" : undefined,
                    }}
                  >
                    <div className={styles.typeNumber} style={{ fontSize: "0.95rem" }}>{type}</div>
                    <div className={styles.typeName} style={{ fontSize: "0.7rem" }}>
                      {getMBTITypeInfo(type)?.nickname.replace("The ", "")}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {typeInfo && selectedType && (
        <div className={styles.fadeIn} style={{
          background: "linear-gradient(135deg, #3D7A4A 0%, #274F30 100%)",
          borderRadius: "16px",
          padding: "1.75rem 2rem",
          color: "white",
          marginBottom: "2rem",
          boxShadow: "0 10px 25px rgba(61, 122, 74, 0.3)",
        }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.75rem" }}>
            {selectedType} – {typeInfo.nickname}
          </h3>
          <p style={{ fontSize: "1rem", lineHeight: 1.6, margin: 0 }}>
            {typeInfo.summary}
          </p>
        </div>
      )}

      <div className={styles.actions}>
        {onSkip && (
          <button onClick={onSkip} className={styles.secondaryButton}>
            Skip for now
          </button>
        )}
        <button
          onClick={handleConfirm}
          disabled={!selectedType || isSubmitting}
          className={styles.primaryButton}
          style={onSkip ? {} : { marginLeft: "auto" }}
        >
          {isSubmitting ? "Saving..." : "Continue →"}
        </button>
      </div>
    </div>
  );
};

export default SimplifiedMBTIInput;
