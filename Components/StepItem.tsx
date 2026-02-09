'use client';

import React, { useState } from 'react';
import { Step } from '../Models/Step';
import { CheckCircleIcon, TrashIcon, SparklesIcon } from './Icons';
import styles from '../Styles/steps.module.css';

interface StepItemProps {
  step: Step;
  planId: string;
  milestoneId: string;
  onUpdate: (stepId: string, completed: boolean) => void;
  onDelete: (stepId: string) => void;
  isUpdating?: boolean;
}

const StepItem: React.FC<StepItemProps> = ({
  step,
  planId,
  milestoneId,
  onUpdate,
  onDelete,
  isUpdating = false,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggle = () => {
    if (isUpdating) return;
    onUpdate(step.id, !step.completed);
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    await onDelete(step.id);
    setIsDeleting(false);
  };

  // Calculate days old
  const getDaysOld = () => {
    if (!step.createdAt) return null;
    const createdAt = step.createdAt instanceof Date
      ? step.createdAt
      : (step.createdAt as any)?.toDate?.() || new Date();
    const now = new Date();
    const daysOld = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    if (daysOld === 0) return 'Today';
    if (daysOld === 1) return '1 day ago';
    return `${daysOld} days ago`;
  };

  return (
    <div
      className={`${styles.stepItem} ${step.completed ? styles.stepItemCompleted : ''}`}
    >
      {/* Checkbox */}
      <label className={styles.stepCheckbox}>
        <input
          type="checkbox"
          className={styles.stepCheckboxInput}
          checked={step.completed}
          onChange={handleToggle}
          disabled={isUpdating}
        />
        <span className={styles.stepCheckboxCustom}>
          <CheckCircleIcon size={14} />
        </span>
      </label>

      {/* Content */}
      <div className={styles.stepContent}>
        <p className={styles.stepTitle}>{step.title}</p>
        <div className={styles.stepMeta}>
          {step.source === 'ai' && (
            <span className={`${styles.stepSource} ${styles.stepSourceAi}`}>
              <SparklesIcon size={10} />
              AI
            </span>
          )}
          {step.source === 'user' && (
            <span className={`${styles.stepSource} ${styles.stepSourceUser}`}>
              You
            </span>
          )}
          <span className={styles.stepAge}>{getDaysOld()}</span>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.stepActions}>
        <button
          className={`${styles.stepActionBtn} ${styles.stepActionBtnDelete}`}
          onClick={handleDelete}
          disabled={isDeleting}
          aria-label="Delete step"
        >
          <TrashIcon size={14} />
        </button>
      </div>
    </div>
  );
};

export default StepItem;
