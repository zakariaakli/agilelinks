'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { XIcon, CheckCircleIcon, PlusIcon, TargetIcon } from './Icons';
import styles from '../Styles/projectSwitcher.module.css';

interface Plan {
  id: string;
  goalName?: string;
  goalType: string;
  status: 'active' | 'paused' | 'completed';
  milestones: Array<{
    id: string;
    completed: boolean;
    dueDate?: string;
    steps?: Array<{ completed: boolean }>;
  }>;
}

interface MobileProjectSheetProps {
  isOpen: boolean;
  onClose: () => void;
  plans: Plan[];
  currentPlanId?: string | null;
  onPlanSelect?: (planId: string) => void;
}

// Color palette for plans
const PLAN_COLORS = [
  '#4F46E5', // Indigo
  '#059669', // Emerald
  '#7C3AED', // Violet
  '#EA580C', // Orange
  '#DB2777', // Pink
];

const getPlanColor = (index: number) => PLAN_COLORS[index % PLAN_COLORS.length];

const getProgressPercentage = (milestones: Plan['milestones']) => {
  if (!milestones || milestones.length === 0) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let totalProgress = 0;
  for (const m of milestones) {
    if (m.completed) {
      totalProgress += 1;
    } else if (m.dueDate && new Date(m.dueDate) < today) {
      totalProgress += 1;
    } else if (m.steps && m.steps.length > 0) {
      const completedSteps = m.steps.filter((s) => s.completed).length;
      totalProgress += completedSteps / m.steps.length;
    }
  }
  return Math.round((totalProgress / milestones.length) * 100);
};

const MobileProjectSheet: React.FC<MobileProjectSheetProps> = ({
  isOpen,
  onClose,
  plans,
  currentPlanId,
  onPlanSelect,
}) => {
  const router = useRouter();

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePlanSelect = (planId: string) => {
    onClose();
    if (onPlanSelect) {
      onPlanSelect(planId);
    } else {
      router.push(`/profile/goals/${planId}`);
    }
  };

  const getPlanDisplayName = (plan: Plan) => {
    return plan.goalName ||
      (plan.goalType
        ? plan.goalType.charAt(0).toUpperCase() + plan.goalType.slice(1) + ' Goal'
        : 'Personal Goal');
  };

  const getStatusLabel = (status: Plan['status']) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'paused':
        return 'Paused';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={styles.mobileSheetOverlay}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className={styles.mobileSheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
      >
        {/* Handle */}
        <div className={styles.mobileSheetHandle}>
          <div className={styles.mobileSheetHandleBar} />
        </div>

        {/* Header */}
        <div className={styles.mobileSheetHeader}>
          <h2 id="sheet-title" className={styles.mobileSheetTitle}>
            Your Plans
          </h2>
          <button
            className={styles.mobileSheetClose}
            onClick={onClose}
            aria-label="Close"
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.mobileSheetContent}>
          {plans.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>
                <TargetIcon size={48} color="#9ca3af" />
              </div>
              <p className={styles.emptyStateText}>
                You don't have any plans yet. Create your first one!
              </p>
              <Link
                href="/profile/companion"
                className={styles.mobileCreateLink}
                onClick={onClose}
              >
                <PlusIcon size={20} />
                Create Your First Plan
              </Link>
            </div>
          ) : (
            <>
              {plans.map((plan, index) => {
                const progress = getProgressPercentage(plan.milestones);
                const isActive = plan.id === currentPlanId;

                return (
                  <button
                    key={plan.id}
                    className={`${styles.mobileProjectCard} ${isActive ? styles.mobileProjectCardActive : ''}`}
                    onClick={() => handlePlanSelect(plan.id)}
                  >
                    <span
                      className={styles.mobileProjectDot}
                      style={{ backgroundColor: getPlanColor(index) }}
                    />

                    <div className={styles.mobileProjectContent}>
                      <div className={styles.mobileProjectName}>
                        {getPlanDisplayName(plan)}
                      </div>
                      <div className={styles.mobileProjectMeta}>
                        <div className={styles.mobileProjectProgressBar}>
                          <div
                            className={styles.mobileProjectProgressFill}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span>{progress}% complete</span>
                        <span>• {getStatusLabel(plan.status)}</span>
                      </div>
                    </div>

                    {isActive && (
                      <CheckCircleIcon size={20} className={styles.activeCheck} />
                    )}
                  </button>
                );
              })}

              <Link
                href="/profile/companion"
                className={styles.mobileCreateLink}
                onClick={onClose}
              >
                <PlusIcon size={20} />
                Create New Plan
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default MobileProjectSheet;
