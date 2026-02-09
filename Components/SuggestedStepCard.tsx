'use client';

import React, { useState } from 'react';
import { SparklesIcon, PlusIcon, XIcon, LoaderIcon } from './Icons';
import styles from '../Styles/steps.module.css';

interface SuggestedStepCardProps {
  suggestedStep: string;
  planId: string;
  milestoneId: string;
  nudgeId: string;
  onAccept: (step: { id: string; title: string }) => void;
  onDismiss: () => void;
}

const SuggestedStepCard: React.FC<SuggestedStepCardProps> = ({
  suggestedStep,
  planId,
  milestoneId,
  nudgeId,
  onAccept,
  onDismiss,
}) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleAccept = async () => {
    if (isAccepting) return;
    setIsAccepting(true);

    try {
      const response = await fetch('/api/steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          milestoneId,
          title: suggestedStep,
          source: 'ai',
          nudgeId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onAccept(data.step);
      }
    } catch (error) {
      console.error('Error accepting suggested step:', error);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss();
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div className={styles.suggestedStepCard}>
      <div className={styles.suggestedStepHeader}>
        <SparklesIcon size={16} className={styles.suggestedStepIcon} />
        <span className={styles.suggestedStepLabel}>AI Suggested Commitment</span>
      </div>

      <p className={styles.suggestedStepText}>{suggestedStep}</p>

      <div className={styles.suggestedStepActions}>
        <button
          className={styles.suggestedStepAccept}
          onClick={handleAccept}
          disabled={isAccepting}
        >
          {isAccepting ? (
            <>
              <LoaderIcon size={14} className={styles.stepsLoadingSpinner} />
              Adding...
            </>
          ) : (
            <>
              <PlusIcon size={14} />
              Add to my list
            </>
          )}
        </button>
        <button
          className={styles.suggestedStepDismiss}
          onClick={handleDismiss}
          disabled={isAccepting}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default SuggestedStepCard;
