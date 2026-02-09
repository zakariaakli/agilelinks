'use client';

import React, { useState, useCallback } from 'react';
import NudgeFormatter from './NudgeFormatter';
import StepsList from './StepsList';
import SuggestedStepCard from './SuggestedStepCard';
import AchievementTrail from './AchievementTrail';
import { Step } from '../Models/Step';

interface NudgeContentWithStepsProps {
  prompt: string;
  planId: string;
  milestoneId: string;
  nudgeId: string;
  suggestedStep?: string | null;
  initialSteps?: Step[];
}

/**
 * Client component that wraps NudgeFormatter with step-adding functionality
 * and coordinates with StepsList for shared state on the nudge detail page.
 */
const NudgeContentWithSteps: React.FC<NudgeContentWithStepsProps> = ({
  prompt,
  planId,
  milestoneId,
  nudgeId,
  suggestedStep,
  initialSteps = [],
}) => {
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [showSuggested, setShowSuggested] = useState(!!suggestedStep);

  // Build set of existing step titles so buttons show "Added" for duplicates
  const existingStepTitles = new Set(steps.map(s => s.title));

  // Handler for adding a step from nudge action items
  const handleAddStep = useCallback(async (stepText: string) => {
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
      setSteps((prev) => [...prev, data.step as Step]);
    }
  }, [planId, milestoneId]);

  const handleStepsChange = useCallback((newSteps: Step[]) => {
    setSteps(newSteps);
  }, []);

  const handleAcceptSuggestion = useCallback((newStep: { id: string; title: string }) => {
    setSteps((prev) => [...prev, newStep as Step]);
    setShowSuggested(false);
  }, []);

  const activeStepsCount = steps.filter((s) => !s.completed).length;
  const shouldShowSuggestion = showSuggested && suggestedStep && activeStepsCount < 2;

  return (
    <>
      {/* Nudge prompt with clickable action items */}
      <NudgeFormatter
        text={prompt}
        onAddStep={handleAddStep}
        addedSteps={existingStepTitles}
      />

      {/* Steps Section */}
      <div style={{ marginTop: '1.5rem' }}>
        {shouldShowSuggestion && (
          <SuggestedStepCard
            suggestedStep={suggestedStep}
            planId={planId}
            milestoneId={milestoneId}
            nudgeId={nudgeId}
            onAccept={handleAcceptSuggestion}
            onDismiss={() => setShowSuggested(false)}
          />
        )}

        <StepsList
          planId={planId}
          milestoneId={milestoneId}
          initialSteps={steps}
          onStepsChange={handleStepsChange}
        />

        {steps.some((s) => s.completed) && (
          <AchievementTrail steps={steps} maxDisplay={5} />
        )}
      </div>
    </>
  );
};

export default NudgeContentWithSteps;
