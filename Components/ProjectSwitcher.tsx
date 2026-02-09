'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDownIcon, CheckCircleIcon, PlusIcon, TargetIcon } from './Icons';
import styles from '../Styles/projectSwitcher.module.css';

interface Plan {
  id: string;
  goalName?: string;
  goalType: string;
  status: 'active' | 'paused' | 'completed';
  milestones: Array<{
    id: string;
    completed: boolean;
  }>;
}

interface ProjectSwitcherProps {
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
  const completed = milestones.filter((m) => m.completed).length;
  return Math.round((completed / milestones.length) * 100);
};

const ProjectSwitcher: React.FC<ProjectSwitcherProps> = ({
  plans,
  currentPlanId,
  onPlanSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Find current plan or default to first active one
  const activePlans = plans.filter((p) => p.status === 'active');
  const currentPlan = currentPlanId
    ? plans.find((p) => p.id === currentPlanId)
    : activePlans[0];
  const currentIndex = currentPlan ? plans.indexOf(currentPlan) : 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePlanSelect = (planId: string) => {
    setIsOpen(false);
    if (onPlanSelect) {
      onPlanSelect(planId);
    } else {
      // Default behavior: navigate to goal detail page
      router.push(`/profile/goals/${planId}`);
    }
  };

  const getPlanDisplayName = (plan: Plan) => {
    return plan.goalName ||
      (plan.goalType
        ? plan.goalType.charAt(0).toUpperCase() + plan.goalType.slice(1) + ' Goal'
        : 'Personal Goal');
  };

  const getStatusClass = (status: Plan['status']) => {
    switch (status) {
      case 'active':
        return styles.statusActive;
      case 'paused':
        return styles.statusPaused;
      case 'completed':
        return styles.statusCompleted;
      default:
        return '';
    }
  };

  if (plans.length === 0) {
    return (
      <Link href="/profile/companion" className={styles.createNewLink}>
        <PlusIcon size={16} />
        Create Plan
      </Link>
    );
  }

  return (
    <div className={styles.dropdownWrapper} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        className={`${styles.switcherTrigger} ${isOpen ? styles.switcherTriggerActive : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span
          className={styles.projectDot}
          style={{ backgroundColor: getPlanColor(currentIndex) }}
        />
        <span className={styles.projectName}>
          {currentPlan ? getPlanDisplayName(currentPlan) : 'Select Plan'}
        </span>
        <ChevronDownIcon
          size={14}
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={styles.dropdown} role="listbox">
          <div className={styles.dropdownHeader}>Your Plans</div>

          <div className={styles.projectList}>
            {plans.map((plan, index) => {
              const progress = getProgressPercentage(plan.milestones);
              const isActive = plan.id === currentPlan?.id;

              return (
                <button
                  key={plan.id}
                  className={`${styles.projectItem} ${isActive ? styles.projectItemActive : ''}`}
                  onClick={() => handlePlanSelect(plan.id)}
                  role="option"
                  aria-selected={isActive}
                >
                  <span
                    className={styles.projectDot}
                    style={{
                      backgroundColor: getPlanColor(index),
                      width: '0.625rem',
                      height: '0.625rem',
                    }}
                  />

                  <div className={styles.projectItemContent}>
                    <div className={styles.projectItemName}>
                      {getPlanDisplayName(plan)}
                    </div>
                    <div className={styles.projectItemMeta}>
                      <div className={styles.projectItemProgress}>
                        <div className={styles.projectItemProgressBar}>
                          <div
                            className={styles.projectItemProgressFill}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span>{progress}%</span>
                      </div>
                      <span className={`${styles.projectItemStatus} ${getStatusClass(plan.status)}`}>
                        {plan.status}
                      </span>
                    </div>
                  </div>

                  {isActive && (
                    <CheckCircleIcon size={16} className={styles.activeCheck} />
                  )}
                </button>
              );
            })}
          </div>

          <div className={styles.dropdownDivider} />

          <Link
            href="/profile/companion"
            className={styles.createNewLink}
            onClick={() => setIsOpen(false)}
          >
            <PlusIcon size={16} />
            Create New Plan
          </Link>
        </div>
      )}
    </div>
  );
};

export default ProjectSwitcher;
