"use client";
import React, { useState, useRef, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { serverTimestamp } from "firebase/firestore";
import { TrackedFirestoreClient } from "../../../lib/trackedFirestoreClient";
import { auth, db } from "../../../firebase"; // Adjust path as needed
import { useRouter } from "next/navigation";
import Toast, { ToastType } from "../../../Components/Toast";
import styles from "../../../Styles/companion.module.css";

interface PlanData {
  id?: string;
  userId: string;
  goalType: string;
  goal: string;
  targetDate: string;
  hasTimePressure: boolean;
  nudgeFrequency: "daily" | "weekly";
  clarifyingQuestions: ClarifyingQuestion[];
  milestones: Milestone[];
  createdAt: any; // Will be server timestamp
  status: "active" | "completed" | "paused";
}

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
  startDate: string;
  dueDate: string;
  completed: boolean;
  blindSpotTip?: string;
  strengthHook?: string;
}

interface GoalTemplate {
  value: string;
  label: string;
  template: string;
}

interface EnneagramResult {
  enneagramType1: number;
  enneagramType2: number;
  enneagramType3: number;
  enneagramType4: number;
  enneagramType5: number;
  enneagramType6: number;
  enneagramType7: number;
  enneagramType8: number;
  enneagramType9: number;
  summary: string;
  name: string;
  email: string;
}

// Using FirebaseUser from firebase/auth instead of custom User interface

interface OpenAIQuestionsResponse {
  questions: string[];
  isPersonalized?: boolean;
  personalizationLevel?:
    | "ai-enhanced"
    | "standard"
    | "fallback"
    | "error-fallback";
}

interface OpenAIMilestonesResponse {
  milestones: {
    id: string;
    title: string;
    description: string;
    dueDate: string;
    blindSpotTip: string;
    strengthHook: string;
    startDate: string;
  }[];
}

interface GoalTemplateItem {
  id: string;
  title: string;
  description: string;
  defaultOffsetDays: number;
}

// Static goal templates for milestone generation
const goalTemplateItems: { [key: string]: GoalTemplateItem[] } = {
  consultant: [
    {
      id: "network",
      title: "Target-firm networking",
      description: "Schedule coffee chats with alumni and recruiters.",
      defaultOffsetDays: -120,
    },
    {
      id: "case_core",
      title: "Master core cases",
      description: "Drill 20 profitability and market-entry cases.",
      defaultOffsetDays: -90,
    },
    {
      id: "fit_stories",
      title: "Craft fit-interview stories",
      description: "Write STAR stories for leadership and impact themes.",
      defaultOffsetDays: -80,
    },
    {
      id: "mock_interviews",
      title: "Mock interview sprint",
      description: "Complete 8 peer mocks and 2 pro mocks.",
      defaultOffsetDays: -60,
    },
    {
      id: "apply",
      title: "Submit applications",
      description: "Polish CV and cover letters; send to target offices.",
      defaultOffsetDays: -45,
    },
    {
      id: "first_round",
      title: "First-round interviews",
      description: "Live cases with managers.",
      defaultOffsetDays: -30,
    },
    {
      id: "partner_round",
      title: "Partner / final interviews",
      description: "Advanced cases and PEI.",
      defaultOffsetDays: -20,
    },
    {
      id: "decision",
      title: "Offer decision & negotiation",
      description: "Compare offers and negotiate start date.",
      defaultOffsetDays: -10,
    },
  ],
  manager: [
    {
      id: "assess_skills",
      title: "Skills assessment",
      description: "Evaluate current competencies and gaps.",
      defaultOffsetDays: -180,
    },
    {
      id: "leadership_training",
      title: "Leadership development",
      description: "Complete leadership courses and workshops.",
      defaultOffsetDays: -150,
    },
    {
      id: "mentor_relationships",
      title: "Build mentor network",
      description: "Establish relationships with senior leaders.",
      defaultOffsetDays: -120,
    },
    {
      id: "project_leadership",
      title: "Lead high-impact project",
      description: "Take ownership of strategic initiative.",
      defaultOffsetDays: -90,
    },
    {
      id: "team_building",
      title: "Develop team skills",
      description: "Practice mentoring and team management.",
      defaultOffsetDays: -60,
    },
    {
      id: "performance_review",
      title: "Mid-cycle review",
      description: "Discuss promotion timeline with manager.",
      defaultOffsetDays: -30,
    },
    {
      id: "promotion_discussion",
      title: "Formal promotion request",
      description: "Present case for promotion to leadership.",
      defaultOffsetDays: -14,
    },
  ],
};

const goalTemplates: GoalTemplate[] = [
  {
    value: "consultant",
    label: "Become a Consultant after graduation",
    template:
      "I want to become a management consultant at a top-tier firm like McKinsey, BCG, or Bain after graduating with my MBA/Bachelor's degree. I need to develop case interview skills, build relevant business experience through internships, network with alumni in consulting, and maintain a strong GPA. My target is to secure a full-time offer by [specific month/year] and start working immediately after graduation.",
  },
  {
    value: "manager",
    label: "Get promoted to Manager",
    template:
      "I want to get promoted from my current [current position] role to Manager within my company. I need to demonstrate leadership skills, exceed my current performance metrics, take on additional responsibilities, mentor junior team members, and build strong relationships with senior leadership. My goal is to secure this promotion by [specific date] with an accompanying salary increase of [target amount/percentage].",
  },
];

const suggestedGoals: Suggestion[] = [
  { name: "Consulting offer" },
  { name: "Promotion to Manager" },
  { name: "Launch start-up" },
  { name: "Improve emotional regulation" },
  { name: "Practice daily journaling" },
  { name: "Develop assertiveness" },
];

const GoalWizard: React.FC = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedGoalType, setSelectedGoalType] = useState<string>("");
  const [goal, setGoal] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
  const [targetDate, setTargetDate] = useState<string>("");
  const [clarifyingQuestions, setClarifyingQuestions] = useState<
    ClarifyingQuestion[]
  >([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [enneagramResult, setEnneagramResult] =
    useState<EnneagramResult | null>(null);
  const [hasTimePressure, setHasTimePressure] = useState<boolean>(false);
  const [nudgeFrequency, setNudgeFrequency] = useState<"daily" | "weekly">(
    "weekly"
  );
  const [personalizationInfo, setPersonalizationInfo] = useState<{
    isPersonalized: boolean;
    level: string;
  }>({ isPersonalized: false, level: "standard" });
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const showToast = (message: string, type: ToastType = "info") => {
    setToast({ message, type });
  };

  // Firebase auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const userDoc = await TrackedFirestoreClient.doc(
          `users/${user.uid}`
        ).get({
          userId: user.uid,
          userEmail: user.email || undefined,
          source: "companion_page",
          functionName: "load_user_enneagram_data",
        });
        if (userDoc.exists()) {
          const data = userDoc.data();
          setEnneagramResult(data?.enneagramResult as EnneagramResult);
        }
      } else {
        setUser(null);
        setEnneagramResult(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Get dominant Enneagram type from summary
  const getDominantEnneagramType = (): string => {
    if (!enneagramResult || !enneagramResult.summary) return "1";

    // Extract Enneagram type number from summary text
    const typeMatch = enneagramResult.summary.match(/enneagram type (\d+)/i);
    if (typeMatch) {
      return typeMatch[1];
    }

    // Fallback to '1' if no type found in summary
    return "1";
  };

  // Call OpenAI Assistant
  const callOpenAIAssistant = async (
    objective: string,
    personalitySummary: string
  ): Promise<{
    questions: string[];
    personalizationInfo: { isPersonalized: boolean; level: string };
  }> => {
    try {
      console.log(personalitySummary);

      // Get auth token for API tracking
      let authHeader = {};
      if (user) {
        try {
          const token = await user.getIdToken();
          authHeader = { Authorization: `Bearer ${token}` };
        } catch (tokenError) {
          console.warn(
            "Could not get auth token for API tracking:",
            tokenError
          );
        }
      }

      const response = await fetch("/api/openAi/?type=questions", {
        // Add query parameter
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify({
          objective,
          personalitySummary,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: OpenAIQuestionsResponse = await response.json();
      return {
        questions: data.questions,
        personalizationInfo: {
          isPersonalized: data.isPersonalized || false,
          level: data.personalizationLevel || "fallback",
        },
      };
    } catch (error) {
      console.error("Error calling OpenAI Assistant:", error);
      // Fallback to default questions if API call fails
      return {
        questions: [
          "What specific skills do you need to develop to achieve this goal?",
          "What resources or support do you currently have available?",
          "What potential obstacles do you anticipate?",
          "How will you measure success?",
        ],
        personalizationInfo: {
          isPersonalized: false,
          level: "error-fallback",
        },
      };
    }
  };

  const callOpenAIMilestoneGenerator = async (): Promise<Milestone[]> => {
    try {
      const payload = {
        goalType: selectedGoalType,
        goalSummary: goal,
        targetDate: targetDate,
        enneagramType: getDominantEnneagramType(),
        personalitySummary:
          enneagramResult?.summary || "No personality data available",
        paceInfo: { hasTimePressure },
        qaPairs: clarifyingQuestions.map((q) => ({
          question: q.question,
          answer: q.answer,
        })),
        goalTemplate: goalTemplateItems[selectedGoalType] || [],
      };

      console.log("Sending milestone generation payload:", payload);

      // Get auth token for API tracking
      let authHeader = {};
      if (user) {
        try {
          const token = await user.getIdToken();
          authHeader = { Authorization: `Bearer ${token}` };
        } catch (tokenError) {
          console.warn(
            "Could not get auth token for API tracking:",
            tokenError
          );
        }
      }

      const response = await fetch("/api/openAi/?type=milestones", {
        // Add query parameter
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: OpenAIMilestonesResponse = await response.json();

      // Convert to our Milestone format
      return data.milestones.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        dueDate: m.dueDate,
        completed: false,
        blindSpotTip: m.blindSpotTip,
        strengthHook: m.strengthHook,
        startDate: m.startDate,
      }));
    } catch (error) {
      console.error("Error calling OpenAI Milestone Generator:", error);
      // Fallback to default milestones
      return generateFallbackMilestones();
    }
  };

  // Generate fallback milestones if API fails
  const generateFallbackMilestones = (): Milestone[] => {
    const today = new Date();
    const endDate = new Date(targetDate);
    const timeSpan = endDate.getTime() - today.getTime();
    const quarterSpan = timeSpan / 4;

    return [
      {
        id: "1",
        title: "Research and Planning Phase",
        description: "Conduct market research and create detailed action plan",
        startDate: today.toISOString().split("T")[0],
        dueDate: new Date(today.getTime() + quarterSpan)
          .toISOString()
          .split("T")[0],
        completed: false,
      },
      {
        id: "2",
        title: "Skill Development",
        description:
          "Complete necessary training and skill building activities",
        startDate: new Date(today.getTime() + quarterSpan)
          .toISOString()
          .split("T")[0],
        dueDate: new Date(today.getTime() + quarterSpan * 2)
          .toISOString()
          .split("T")[0],
        completed: false,
      },
      {
        id: "3",
        title: "Implementation Phase",
        description: "Execute the main activities towards achieving the goal",
        startDate: new Date(today.getTime() + quarterSpan * 2)
          .toISOString()
          .split("T")[0],
        dueDate: new Date(today.getTime() + quarterSpan * 3)
          .toISOString()
          .split("T")[0],
        completed: false,
      },
      {
        id: "4",
        title: "Final Push and Evaluation",
        description: "Complete final steps and evaluate progress",
        startDate: new Date(today.getTime() + quarterSpan * 3)
          .toISOString()
          .split("T")[0],
        dueDate: targetDate,
        completed: false,
      },
    ];
  };

  // Handle goal type selection
  const handleGoalTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    const selectedValue = event.target.value;
    setSelectedGoalType(selectedValue);

    if (selectedValue) {
      const template = goalTemplates.find((t) => t.value === selectedValue);
      if (template) {
        setGoal(template.template);
      }
    } else {
      setGoal("");
    }
  };

  // Generate clarifying questions using OpenAI
  const generateClarifyingQuestions = async () => {
    setIsLoading(true);

    try {
      let questionsArray: string[] = [];
      let personalizationData = { isPersonalized: false, level: "standard" };

      if (enneagramResult && enneagramResult.summary) {
        // Call OpenAI Assistant with user's goal and personality summary
        const result = await callOpenAIAssistant(goal, enneagramResult.summary);
        questionsArray = result.questions;
        personalizationData = result.personalizationInfo;
      } else {
        // Fallback to default questions if no personality data
        questionsArray = [
          "What specific skills do you need to develop to achieve this goal?",
          "What resources or support do you currently have available?",
          "What potential obstacles do you anticipate?",
          "How will you measure success?",
        ];
        personalizationData = {
          isPersonalized: false,
          level: "no-personality-data",
        };
      }

      // Update personalization info state
      setPersonalizationInfo(personalizationData);

      // Convert to ClarifyingQuestion format
      const questions: ClarifyingQuestion[] = questionsArray.map(
        (question, index) => ({
          id: (index + 1).toString(),
          question,
          answer: "",
        })
      );

      setClarifyingQuestions(questions);
    } catch (error) {
      console.error("Error generating clarifying questions:", error);
      // Fallback questions in case of error
      const fallbackQuestions: ClarifyingQuestion[] = [
        {
          id: "1",
          question:
            "What specific skills do you need to develop to achieve this goal?",
          answer: "",
        },
        {
          id: "2",
          question:
            "What resources or support do you currently have available?",
          answer: "",
        },
        {
          id: "3",
          question: "What potential obstacles do you anticipate?",
          answer: "",
        },
        { id: "4", question: "How will you measure success?", answer: "" },
      ];
      setClarifyingQuestions(fallbackQuestions);
      setPersonalizationInfo({ isPersonalized: false, level: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  // Generate milestones using OpenAI
  const generateMilestones = async () => {
    setIsLoading(true);
    try {
      const generatedMilestones = await callOpenAIMilestoneGenerator();
      setMilestones(generatedMilestones);
    } catch (error) {
      console.error("Error generating milestones:", error);
      // Fallback to default milestones
      const fallbackMilestones = generateFallbackMilestones();
      setMilestones(fallbackMilestones);
    } finally {
      setIsLoading(false);
    }
  };

  const getSuggestions = (value: string): Suggestion[] => {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;

    return inputLength === 0
      ? []
      : suggestedGoals.filter(
          (goalItem) =>
            goalItem.name.toLowerCase().slice(0, inputLength) === inputValue
        );
  };

  const handleGoalChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ): void => {
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

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ): void => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestion((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestion((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (event.key === "Enter" && event.ctrlKey) {
      event.preventDefault();
      if (activeSuggestion >= 0 && activeSuggestion < suggestions.length) {
        handleSuggestionClick(suggestions[activeSuggestion]);
      }
    } else if (event.key === "Escape") {
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

  const handleDateChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setTargetDate(event.target.value);
  };

  const handleQuestionAnswerChange = (id: string, answer: string): void => {
    setClarifyingQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, answer } : q))
    );
  };

  const handleDragStart = (e: React.DragEvent, index: number): void => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
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
    const today = new Date();
    const newMilestone: Milestone = {
      id: Date.now().toString(),
      title: "Custom Milestone",
      description: "Add your description here",
      startDate: today.toISOString().split("T")[0],
      dueDate: targetDate,
      completed: false,
    };
    setMilestones([...milestones, newMilestone]);
  };

  const deleteMilestone = (id: string): void => {
    setMilestones(milestones.filter((m) => m.id !== id));
  };

  const updateMilestone = (
    id: string,
    field: keyof Milestone,
    value: string | boolean
  ): void => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const nextStep = (): void => {
    if (currentStep === 1) {
      generateClarifyingQuestions();
    } else if (currentStep === 2) {
      generateMilestones();
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const prevStep = (): void => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const createPlan = async (): Promise<void> => {
    if (!user) {
      showToast("Please log in to create a plan.", "error");
      return;
    }

    setIsLoading(true);

    try {
      const planData: PlanData = {
        userId: user.uid,
        goalType: selectedGoalType,
        goal,
        targetDate,
        hasTimePressure,
        nudgeFrequency,
        clarifyingQuestions,
        milestones,
        createdAt: serverTimestamp(),
        status: "active",
      };

      // Add the plan to Firestore
      const docRef = await TrackedFirestoreClient.collection("plans").add(
        planData,
        {
          userId: user?.uid,
          userEmail: user?.email || undefined,
          source: "companion_page",
          functionName: "create_goal_plan",
        }
      );

      // Update the document with its ID
      await TrackedFirestoreClient.doc(`plans/${docRef.id}`).update(
        {
          id: docRef.id,
        },
        {
          userId: user?.uid,
          userEmail: user?.email || undefined,
          source: "companion_page",
          functionName: "update_plan_id",
        }
      );

      console.log("Plan created successfully with ID:", docRef.id);

      // Optional: Update user's document to track their plans
      await updateUserPlansCount(user.uid);

      // Show success message with toast
      showToast(
        "Plan created successfully! Redirecting to dashboard...",
        "success"
      );

      // Redirect to dashboard with new plan ID after short delay
      setTimeout(() => {
        router.push(`/profile?newPlan=${docRef.id}`);
      }, 1500);
    } catch (error) {
      console.error("Error creating plan:", error);
      showToast("Failed to create plan. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to update user's plan count (optional)
  const updateUserPlansCount = async (userId: string): Promise<void> => {
    try {
      const userDoc = await TrackedFirestoreClient.doc(`users/${userId}`).get({
        userId,
        userEmail: user?.email || undefined,
        source: "companion_page",
        functionName: "get_user_plan_count",
      });

      if (userDoc.exists()) {
        const currentData = userDoc.data();
        const currentPlanCount = currentData?.planCount || 0;

        await TrackedFirestoreClient.doc(`users/${userId}`).update(
          {
            planCount: currentPlanCount + 1,
            lastPlanCreated: serverTimestamp(),
          },
          {
            userId,
            userEmail: user?.email || undefined,
            source: "companion_page",
            functionName: "update_user_plan_count",
          }
        );
      }
    } catch (error) {
      console.error("Error updating user plan count:", error);
      // Don't throw error as this is optional functionality
    }
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0:
        return goal.trim() !== "" && targetDate !== "";
      case 1:
        return true; // Can always proceed from step 1
      case 2:
        return clarifyingQuestions.every((q) => q.answer.trim() !== "");
      case 3:
        return milestones.length > 0;
      default:
        return true;
    }
  };

  const today = new Date().toISOString().split("T")[0];

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
                  : "Select a goal type above to see a helpful template, or write your own goal below:"}
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
                            index === activeSuggestion
                              ? styles.suggestionHighlighted
                              : ""
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

            <div className={styles.section}>
              <h2 className={styles.subtitle}>Timeline Preference</h2>
              <div className={styles.paceSelection}>
                <label className={styles.paceOption}>
                  <input
                    type="radio"
                    name="pace"
                    value="normal"
                    checked={!hasTimePressure}
                    onChange={() => setHasTimePressure(false)}
                  />
                  <span>Normal pace - I have adequate time</span>
                </label>
                <label className={styles.paceOption}>
                  <input
                    type="radio"
                    name="pace"
                    value="accelerated"
                    checked={hasTimePressure}
                    onChange={() => setHasTimePressure(true)}
                  />
                  <span>Accelerated - I'm under time pressure</span>
                </label>
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.subtitle}>Reminder Frequency</h2>
              <p className={styles.helperText}>
                Choose how often you'd like to receive milestone reminders to
                stay on track:
              </p>
              <div className={styles.nudgeSelection}>
                <label className={styles.nudgeOption}>
                  <input
                    type="radio"
                    name="nudgeFrequency"
                    value="daily"
                    checked={nudgeFrequency === "daily"}
                    onChange={() => setNudgeFrequency("daily")}
                  />
                  <div className={styles.nudgeOptionContent}>
                    <span className={styles.nudgeOptionTitle}>
                      Daily Reminders
                    </span>
                    <span className={styles.nudgeOptionDescription}>
                      Get daily check-ins for active milestones to maintain
                      momentum
                    </span>
                  </div>
                </label>
                <label className={styles.nudgeOption}>
                  <input
                    type="radio"
                    name="nudgeFrequency"
                    value="weekly"
                    checked={nudgeFrequency === "weekly"}
                    onChange={() => setNudgeFrequency("weekly")}
                  />
                  <div className={styles.nudgeOptionContent}>
                    <span className={styles.nudgeOptionTitle}>
                      Weekly Reminders
                    </span>
                    <span className={styles.nudgeOptionDescription}>
                      Receive weekly progress updates for a balanced approach
                    </span>
                  </div>
                </label>
              </div>
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
                  <p>
                    {
                      goalTemplates.find((t) => t.value === selectedGoalType)
                        ?.label
                    }
                  </p>
                </>
              )}
              <h3>Your Goal:</h3>
              <p>{goal}</p>
              <h3>Target Date:</h3>
              <p>{new Date(targetDate).toLocaleDateString()}</p>
              <h3>Timeline Preference:</h3>
              <p>
                {hasTimePressure
                  ? "Accelerated (time pressure)"
                  : "Normal pace"}
              </p>
              <h3>Reminder Frequency:</h3>
              <p>
                {nudgeFrequency === "daily"
                  ? "Daily reminders"
                  : "Weekly reminders"}
              </p>
              {enneagramResult && (
                <>
                  <h3>Personality Insight:</h3>
                  <p className={styles.personalityInsight}>
                    Questions will be personalized based on your Enneagram
                    profile (Type {getDominantEnneagramType()})
                  </p>
                </>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className={styles.section}>
            <h2 className={styles.subtitle}>Clarifying Questions</h2>

            {/* Gamified Personalization Indicator */}
            {personalizationInfo.isPersonalized &&
              personalizationInfo.level === "ai-enhanced" && (
                <div className={styles.personalizationBadge}>
                  <div className={styles.personalizationIcon}>✨</div>
                  <div className={styles.personalizationContent}>
                    <div className={styles.personalizationTitle}>
                      AI-Enhanced Questions
                    </div>
                    <div className={styles.personalizationDescription}>
                      These questions are personalized for your profile and
                      personality type to help you craft the most adequate
                      milestones to achieve your goal.
                    </div>
                  </div>
                </div>
              )}

            {enneagramResult && !personalizationInfo.isPersonalized && (
              <p className={styles.personalizedNote}>
                These questions are personalized based on your personality
                profile and goal.
              </p>
            )}
            {isLoading ? (
              <div className={styles.loading}>
                <p>
                  Generating personalized questions based on your goal and
                  personality...
                </p>
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
                      onChange={(e) =>
                        handleQuestionAnswerChange(question.id, e.target.value)
                      }
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
                        draggedItem === index ? styles.dragging : ""
                      }`}
                    >
                      <div className={styles.milestoneHeader}>
                        <input
                          type="text"
                          value={milestone.title}
                          onChange={(e) =>
                            updateMilestone(
                              milestone.id,
                              "title",
                              e.target.value
                            )
                          }
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
                        onChange={(e) =>
                          updateMilestone(
                            milestone.id,
                            "description",
                            e.target.value
                          )
                        }
                        className={styles.milestoneDescription}
                        rows={2}
                      />
                      <div className={styles.milestoneDates}>
                        <div className={styles.dateField}>
                          <label className={styles.dateLabel}>
                            Start Date:
                          </label>
                          <input
                            type="date"
                            value={milestone.startDate}
                            onChange={(e) =>
                              updateMilestone(
                                milestone.id,
                                "startDate",
                                e.target.value
                              )
                            }
                            className={styles.milestoneStartDate}
                          />
                        </div>
                        <div className={styles.dateField}>
                          <label className={styles.dateLabel}>Due Date:</label>
                          <input
                            type="date"
                            value={milestone.dueDate}
                            onChange={(e) =>
                              updateMilestone(
                                milestone.id,
                                "dueDate",
                                e.target.value
                              )
                            }
                            className={styles.milestoneDueDate}
                          />
                        </div>
                      </div>

                      {/* Personality-based tips */}
                      {(milestone.blindSpotTip || milestone.strengthHook) && (
                        <div className={styles.personalityTips}>
                          {milestone.blindSpotTip && (
                            <div className={styles.blindSpotTip}>
                              <span className={styles.tipIcon}>⚠️</span>
                              <span className={styles.tipLabel}>
                                Blind Spot:
                              </span>
                              <span className={styles.tipText}>
                                {milestone.blindSpotTip}
                              </span>
                            </div>
                          )}
                          {milestone.strengthHook && (
                            <div className={styles.strengthHook}>
                              <span className={styles.tipIcon}>💪</span>
                              <span className={styles.tipLabel}>Leverage:</span>
                              <span className={styles.tipText}>
                                {milestone.strengthHook}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
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
                            style={{
                              width: `${((index + 1) / milestones.length) * 100}%`,
                            }}
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
                  <p>
                    {
                      goalTemplates.find((t) => t.value === selectedGoalType)
                        ?.label
                    }
                  </p>
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
                <h3>Reminder Frequency:</h3>
                <p>
                  {nudgeFrequency === "daily"
                    ? "Daily reminders"
                    : "Weekly reminders"}
                </p>
              </div>

              <div className={styles.summarySection}>
                <h3>Milestones ({milestones.length}):</h3>
                <ul className={styles.milestoneList}>
                  {milestones.map((milestone) => (
                    <li key={milestone.id} className={styles.milestoneListItem}>
                      <strong>{milestone.title}</strong> -{" "}
                      {new Date(milestone.dueDate).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={createPlan}
                disabled={isLoading}
                className={styles.createPlanButton}
              >
                {isLoading ? "⏳ Creating Plan..." : "🎯 Create Plan"}
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
        {["Goal Entry", "Review", "Questions", "Milestones", "Confirm"].map(
          (step, index) => (
            <div
              key={index}
              className={`${styles.stepItem} ${
                index === currentStep ? styles.stepActive : ""
              } ${index < currentStep ? styles.stepCompleted : ""}`}
            >
              <div className={styles.stepNumber}>{index}</div>
              <div className={styles.stepLabel}>{step}</div>
            </div>
          )
        )}
      </div>

      <div className={styles.stepContent}>{renderStepContent()}</div>

      <div className={styles.navigationButtons}>
        {currentStep > 0 && (
          <button onClick={prevStep} className={styles.navButton}>
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

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default GoalWizard;
