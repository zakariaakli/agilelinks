'use client';

import React, { useState, useEffect } from 'react';
import { Step } from '../Models/Step';
import StepItem from './StepItem';
import { PlusIcon, TargetIcon, LoaderIcon } from './Icons';
import styles from '../Styles/steps.module.css';

interface StepsListProps {
  planId: string;
  milestoneId: string;
  initialSteps?: Step[];
  onStepsChange?: (steps: Step[]) => void;
}

const StepsList: React.FC<StepsListProps> = ({
  planId,
  milestoneId,
  initialSteps = [],
  onStepsChange,
}) => {
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [isLoading, setIsLoading] = useState(!initialSteps.length);
  const [isAdding, setIsAdding] = useState(false);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [updatingStepId, setUpdatingStepId] = useState<string | null>(null);

  // Sync with parent's initialSteps when it changes (e.g., when parent adds a step)
  useEffect(() => {
    if (initialSteps.length > 0) {
      setSteps(initialSteps);
      setIsLoading(false);
    }
  }, [initialSteps]);

  // Fetch steps if not provided initially (only on mount)
  useEffect(() => {
    if (initialSteps.length > 0) {
      setIsLoading(false);
      return;
    }

    const fetchSteps = async () => {
      try {
        const response = await fetch(
          `/api/steps?planId=${planId}&milestoneId=${milestoneId}`
        );
        if (response.ok) {
          const data = await response.json();
          setSteps(data.steps || []);
        }
      } catch (error) {
        console.error('Error fetching steps:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSteps();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId, milestoneId]);

  // Notify parent of changes
  useEffect(() => {
    if (onStepsChange) {
      onStepsChange(steps);
    }
  }, [steps, onStepsChange]);

  const handleAddStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepTitle.trim() || isAdding) return;

    setIsAdding(true);
    try {
      const response = await fetch('/api/steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          milestoneId,
          title: newStepTitle.trim(),
          source: 'user',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSteps((prev) => [...prev, data.step]);
        setNewStepTitle('');
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error adding step:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateStep = async (stepId: string, completed: boolean) => {
    setUpdatingStepId(stepId);
    try {
      const response = await fetch('/api/steps', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          milestoneId,
          stepId,
          completed,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSteps((prev) =>
          prev.map((s) => (s.id === stepId ? data.step : s))
        );
      }
    } catch (error) {
      console.error('Error updating step:', error);
    } finally {
      setUpdatingStepId(null);
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    try {
      const response = await fetch('/api/steps', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          milestoneId,
          stepId,
        }),
      });

      if (response.ok) {
        setSteps((prev) => prev.filter((s) => s.id !== stepId));
      }
    } catch (error) {
      console.error('Error deleting step:', error);
    }
  };

  // Separate active and completed steps
  const activeSteps = steps.filter((s) => !s.completed);
  const completedSteps = steps.filter((s) => s.completed);
  const totalSteps = steps.length;
  const completedCount = completedSteps.length;

  if (isLoading) {
    return (
      <div className={styles.stepsContainer}>
        <div className={styles.stepsLoading}>
          <LoaderIcon size={16} className={styles.stepsLoadingSpinner} />
          Loading steps...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.stepsContainer}>
      {/* Header */}
      <div className={styles.stepsHeader}>
        <h4 className={styles.stepsTitle}>
          <TargetIcon size={16} className={styles.stepsTitleIcon} />
          Commitments
        </h4>
        {totalSteps > 0 && (
          <span className={styles.stepsCount}>
            {completedCount}/{totalSteps} done
          </span>
        )}
      </div>

      {/* Active Steps List */}
      {activeSteps.length > 0 && (
        <div className={styles.stepsList}>
          {activeSteps.map((step) => (
            <StepItem
              key={step.id}
              step={step}
              planId={planId}
              milestoneId={milestoneId}
              onUpdate={handleUpdateStep}
              onDelete={handleDeleteStep}
              isUpdating={updatingStepId === step.id}
            />
          ))}
        </div>
      )}

      {/* Empty state for active steps */}
      {activeSteps.length === 0 && completedSteps.length === 0 && (
        <div className={styles.stepsEmpty}>
          <div className={styles.stepsEmptyIcon}>📝</div>
          No commitments yet. Add your first one!
        </div>
      )}

      {/* Add Step Form */}
      {showAddForm ? (
        <form className={styles.addStepForm} onSubmit={handleAddStep}>
          <input
            type="text"
            className={styles.addStepInput}
            placeholder="What will you commit to?"
            value={newStepTitle}
            onChange={(e) => setNewStepTitle(e.target.value)}
            autoFocus
            disabled={isAdding}
          />
          <button
            type="submit"
            className={styles.addStepBtn}
            disabled={!newStepTitle.trim() || isAdding}
          >
            {isAdding ? (
              <LoaderIcon size={16} className={styles.stepsLoadingSpinner} />
            ) : (
              <PlusIcon size={16} />
            )}
          </button>
        </form>
      ) : (
        <button
          className={styles.toggleAddStepBtn}
          onClick={() => setShowAddForm(true)}
        >
          <PlusIcon size={14} />
          Add commitment
        </button>
      )}

      {/* Completed Steps (collapsed) */}
      {completedSteps.length > 0 && (
        <div className={styles.stepsList} style={{ marginTop: '0.75rem', opacity: 0.7 }}>
          {completedSteps.slice(0, 3).map((step) => (
            <StepItem
              key={step.id}
              step={step}
              planId={planId}
              milestoneId={milestoneId}
              onUpdate={handleUpdateStep}
              onDelete={handleDeleteStep}
              isUpdating={updatingStepId === step.id}
            />
          ))}
          {completedSteps.length > 3 && (
            <div className={styles.stepsEmpty} style={{ padding: '0.5rem' }}>
              +{completedSteps.length - 3} more completed
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StepsList;
