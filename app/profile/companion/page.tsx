'use client';
import React, { useState, useRef, useEffect } from 'react';
import styles from '../../../Styles/companion.module.css';

interface Suggestion {
  name: string;
}

interface ClarifyingQuestion {
  id: string;
  question: string;
  answer: string;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
}

interface GoalTemplate {
  value: string;
  label: string;
  template: string;
}

const goalTemplates: GoalTemplate[] = [
  {
    value: 'consultant',
    label: 'Become a Consultant after graduation',
    template: 'I want to become a management consultant at a top-tier firm like McKinsey, BCG, or Bain after graduating with my MBA/Bachelor\'s degree. I need to develop case interview skills, build relevant business experience through internships, network with alumni in consulting, and maintain a strong GPA. My target is to secure a full-time offer by [specific month/year] and start working immediately after graduation.'
  },
  {
    value: 'manager',
    label: 'Get promoted to Manager',
    template: 'I want to get promoted from my current [current position] role to Manager within my company. I need to demonstrate leadership skills, exceed my current performance metrics, take on additional responsibilities, mentor junior team members, and build strong relationships with senior leadership. My goal is to secure this promotion by [specific date] with an accompanying salary increase of [target amount/percentage].'
  }
];

const suggestedGoals: Suggestion[] = [
  { name: 'Consulting offer' },
  { name: 'Promotion to Manager' },
  { name: 'Launch start-up' },
  { name: 'Improve emotional regulation' },
  { name: 'Practice daily journaling' },
  { name: 'Develop assertiveness' },
];

const GoalWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedGoalType, setSelectedGoalType] = useState<string>('');
  const [goal, setGoal] = useState<string>('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
  const [targetDate, setTargetDate] = useState<string>('');
  const [clarifyingQuestions, setClarifyingQuestions] = useState<ClarifyingQuestion[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Handle goal type selection
  const handleGoalTypeChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const selectedValue = event.target.value;
    setSelectedGoalType(selectedValue);

    if (selectedValue) {
      const template = goalTemplates.find(t => t.value === selectedValue);
      if (template) {
        setGoal(template.template);
      }
    } else {
      setGoal('');
    }
  };

  // Mock clarifying questions generation
  const generateClarifyingQuestions = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      const questions: ClarifyingQuestion[] = [
        { id: '1', question: 'What specific skills do you need to develop to achieve this goal?', answer: '' },
        { id: '2', question: 'What resources or support do you currently have available?', answer: '' },
        { id: '3', question: 'What potential obstacles do you anticipate?', answer: '' },
        { id: '4', question: 'How will you measure success?', answer: '' },
      ];
      setClarifyingQuestions(questions);
      setIsLoading(false);
    }, 1500);
  };

  // Mock milestone generation
  const generateMilestones = () => {
    setIsLoading(true);
    setTimeout(() => {
      const today = new Date();
      const endDate = new Date(targetDate);
      const timeSpan = endDate.getTime() - today.getTime();
      const quarterSpan = timeSpan / 4;

      const generatedMilestones: Milestone[] = [
        {
          id: '1',
          title: 'Research and Planning Phase',
          description: 'Conduct market research and create detailed action plan',
          dueDate: new Date(today.getTime() + quarterSpan).toISOString().split('T')[0],
          completed: false
        },
        {
          id: '2',
          title: 'Skill Development',
          description: 'Complete necessary training and skill building activities',
          dueDate: new Date(today.getTime() + quarterSpan * 2).toISOString().split('T')[0],
          completed: false
        },
        {
          id: '3',
          title: 'Implementation Phase',
          description: 'Execute the main activities towards achieving the goal',
          dueDate: new Date(today.getTime() + quarterSpan * 3).toISOString().split('T')[0],
          completed: false
        },
        {
          id: '4',
          title: 'Final Push and Evaluation',
          description: 'Complete final steps and evaluate progress',
          dueDate: targetDate,
          completed: false
        }
      ];
      setMilestones(generatedMilestones);
      setIsLoading(false);
    }, 2000);
  };

  const getSuggestions = (value: string): Suggestion[] => {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;

    return inputLength === 0
      ? []
      : suggestedGoals.filter(
          (goalItem) => goalItem.name.toLowerCase().slice(0, inputLength) === inputValue
        );
  };

  const handleGoalChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const value = event.target.value;
    setGoal(value);

    const newSuggestions = getSuggestions(value);
    setSuggestions(newSuggestions);
    setShowSuggestions(newSuggestions.length > 0);
    setActiveSuggestion(-1);
  };

  const handleSuggestionClick = (suggestion: Suggestion): void => {
    setGoal(suggestion.name);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveSuggestion(prev =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveSuggestion(prev => prev > 0 ? prev - 1 : -1);
    } else if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault();
      if (activeSuggestion >= 0 && activeSuggestion < suggestions.length) {
        handleSuggestionClick(suggestions[activeSuggestion]);
      }
    } else if (event.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleInputFocus = (): void => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = (): void => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 150);
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setTargetDate(event.target.value);
  };

  const handleQuestionAnswerChange = (id: string, answer: string): void => {
    setClarifyingQuestions(prev =>
      prev.map(q => q.id === id ? { ...q, answer } : q)
    );
  };

  const handleDragStart = (e: React.DragEvent, index: number): void => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number): void => {
    e.preventDefault();

    if (draggedItem !== null && draggedItem !== dropIndex) {
      const newMilestones = [...milestones];
      const draggedMilestone = newMilestones[draggedItem];

      newMilestones.splice(draggedItem, 1);
      newMilestones.splice(dropIndex, 0, draggedMilestone);

      setMilestones(newMilestones);
    }
    setDraggedItem(null);
  };

  const addCustomMilestone = (): void => {
    const newMilestone: Milestone = {
      id: Date.now().toString(),
      title: 'Custom Milestone',
      description: 'Add your description here',
      dueDate: targetDate,
      completed: false
    };
    setMilestones([...milestones, newMilestone]);
  };

  const deleteMilestone = (id: string): void => {
    setMilestones(milestones.filter(m => m.id !== id));
  };

  const updateMilestone = (id: string, field: keyof Milestone, value: string | boolean): void => {
    setMilestones(prev =>
      prev.map(m => m.id === id ? { ...m, [field]: value } : m)
    );
  };

  const nextStep = (): void => {
    if (currentStep === 1) {
      generateClarifyingQuestions();
    } else if (currentStep === 2) {
      generateMilestones();
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = (): void => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const createPlan = (): void => {
    const planData = {
      goalType: selectedGoalType,
      goal,
      targetDate,
      clarifyingQuestions,
      milestones
    };
    console.log('Creating plan:', planData);
    alert('Plan created successfully! Check console for details.');
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0:
        return goal.trim() !== '' && targetDate !== '';
      case 1:
        return true; // Can always proceed from step 1
      case 2:
        return clarifyingQuestions.every(q => q.answer.trim() !== '');
      case 3:
        return milestones.length > 0;
      default:
        return true;
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <div className={styles.section}>
              <h2 className={styles.subtitle}>Goal Type Selection</h2>
              <select
                value={selectedGoalType}
                onChange={handleGoalTypeChange}
                className={styles.goalTypeDropdown}
              >
                <option value="">Select a goal type...</option>
                {goalTemplates.map((template) => (
                  <option key={template.value} value={template.value}>
                    {template.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.section}>
              <h2 className={styles.subtitle}>Goal Entry</h2>
              <p className={styles.helperText}>
                {selectedGoalType
                  ? "Customize the template below with your specific details and timeline:"
                  : "Select a goal type above to see a helpful template, or write your own goal below:"
                }
              </p>
              <div className={styles.autosuggestContainer}>
                <textarea
                  ref={inputRef}
                  value={goal}
                  onChange={handleGoalChange}
                  onKeyDown={handleKeyDown}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  placeholder="What do you want to achieve? Describe your goal in detail..."
                  rows={6}
                  className={styles.goalTextarea}
                />

                {showSuggestions && suggestions.length > 0 && (
                  <div className={styles.suggestionsContainer}>
                    <ul className={styles.suggestionsList}>
                      {suggestions.map((suggestion, index) => (
                        <li
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className={`${styles.suggestion} ${
                            index === activeSuggestion ? styles.suggestionHighlighted : ''
                          }`}
                        >
                          {suggestion.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.subtitle}>Target Date</h2>
              <input
                type="date"
                value={targetDate}
                onChange={handleDateChange}
                min={today}
                className={styles.datePicker}
              />
            </div>
          </>
        );

      case 1:
        return (
          <div className={styles.section}>
            <h2 className={styles.subtitle}>Goal Summary</h2>
            <div className={styles.goalSummary}>
              {selectedGoalType && (
                <>
                  <h3>Goal Type:</h3>
                  <p>{goalTemplates.find(t => t.value === selectedGoalType)?.label}</p>
                </>
              )}
              <h3>Your Goal:</h3>
              <p>{goal}</p>
              <h3>Target Date:</h3>
              <p>{new Date(targetDate).toLocaleDateString()}</p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className={styles.section}>
            <h2 className={styles.subtitle}>Clarifying Questions</h2>
            {isLoading ? (
              <div className={styles.loading}>
                <p>Generating personalized questions...</p>
              </div>
            ) : (
              <div className={styles.questionsContainer}>
                {clarifyingQuestions.map((question) => (
                  <div key={question.id} className={styles.questionItem}>
                    <label className={styles.questionLabel}>
                      {question.question}
                    </label>
                    <textarea
                      value={question.answer}
                      onChange={(e) => handleQuestionAnswerChange(question.id, e.target.value)}
                      placeholder="Enter your answer here..."
                      rows={3}
                      className={styles.questionAnswer}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className={styles.section}>
            <h2 className={styles.subtitle}>Milestone Review</h2>
            {isLoading ? (
              <div className={styles.loading}>
                <p>Generating your personalized milestones...</p>
              </div>
            ) : (
              <>
                <div className={styles.milestonesContainer}>
                  {milestones.map((milestone, index) => (
                    <div
                      key={milestone.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`${styles.milestoneItem} ${
                        draggedItem === index ? styles.dragging : ''
                      }`}
                    >
                      <div className={styles.milestoneHeader}>
                        <input
                          type="text"
                          value={milestone.title}
                          onChange={(e) => updateMilestone(milestone.id, 'title', e.target.value)}
                          className={styles.milestoneTitle}
                        />
                        <button
                          onClick={() => deleteMilestone(milestone.id)}
                          className={styles.deleteButton}
                        >
                          ×
                        </button>
                      </div>
                      <textarea
                        value={milestone.description}
                        onChange={(e) => updateMilestone(milestone.id, 'description', e.target.value)}
                        className={styles.milestoneDescription}
                        rows={2}
                      />
                      <input
                        type="date"
                        value={milestone.dueDate}
                        onChange={(e) => updateMilestone(milestone.id, 'dueDate', e.target.value)}
                        className={styles.milestoneDueDate}
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={addCustomMilestone}
                  className={styles.addMilestoneButton}
                >
                  + Add Custom Milestone
                </button>

                <div className={styles.ganttChart}>
                  <h3>Timeline Overview</h3>
                  <div className={styles.timelineContainer}>
                    {milestones.map((milestone, index) => (
                      <div key={milestone.id} className={styles.timelineItem}>
                        <div className={styles.timelineDate}>
                          {new Date(milestone.dueDate).toLocaleDateString()}
                        </div>
                        <div className={styles.timelineBar}>
                          <div
                            className={styles.timelineProgress}
                            style={{ width: `${((index + 1) / milestones.length) * 100}%` }}
                          />
                        </div>
                        <div className={styles.timelineTitle}>
                          {milestone.title}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case 4:
        return (
          <div className={styles.section}>
            <h2 className={styles.subtitle}>Confirm Your Plan</h2>
            <div className={styles.planSummary}>
              {selectedGoalType && (
                <div className={styles.summarySection}>
                  <h3>Goal Type:</h3>
                  <p>{goalTemplates.find(t => t.value === selectedGoalType)?.label}</p>
                </div>
              )}

              <div className={styles.summarySection}>
                <h3>Goal:</h3>
                <p>{goal}</p>
              </div>

              <div className={styles.summarySection}>
                <h3>Target Date:</h3>
                <p>{new Date(targetDate).toLocaleDateString()}</p>
              </div>

              <div className={styles.summarySection}>
                <h3>Milestones ({milestones.length}):</h3>
                <ul className={styles.milestoneList}>
                  {milestones.map((milestone) => (
                    <li key={milestone.id} className={styles.milestoneListItem}>
                      <strong>{milestone.title}</strong> - {new Date(milestone.dueDate).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={createPlan}
                className={styles.createPlanButton}
              >
                🎯 Create Plan
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>🧠 Goal Setting Wizard</h1>

      <div className={styles.stepIndicator}>
        {['Goal Entry', 'Review', 'Questions', 'Milestones', 'Confirm'].map((step, index) => (
          <div
            key={index}
            className={`${styles.stepItem} ${
              index === currentStep ? styles.stepActive : ''
            } ${index < currentStep ? styles.stepCompleted : ''}`}
          >
            <div className={styles.stepNumber}>{index}</div>
            <div className={styles.stepLabel}>{step}</div>
          </div>
        ))}
      </div>

      <div className={styles.stepContent}>
        {renderStepContent()}
      </div>

      <div className={styles.navigationButtons}>
        {currentStep > 0 && (
          <button
            onClick={prevStep}
            className={styles.navButton}
          >
            ← Previous
          </button>
        )}

        {currentStep < 4 && (
          <button
            onClick={nextStep}
            disabled={!canProceed()}
            className={`${styles.navButton} ${styles.navButtonPrimary}`}
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
};

export default GoalWizard;