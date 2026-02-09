"use client";
import React, { useState, useEffect, useRef, Suspense } from "react";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { TrackedFirestoreClient } from "../../lib/trackedFirestoreClient";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import Toast, { ToastType } from "../../Components/Toast";
import styles from "../../Styles/profile.module.css";
import { EnneagramResult } from "../../Models/EnneagramResult";
import MilestoneCard from "../../Components/MilestoneCard";
import ConfirmationModal from "../../Components/ConfirmationModal";
import Link from "next/link";
import { LinkButton } from "../../Components/Button";
import {
  PlusIcon,
  EditIcon,
  EyeIcon,
  TargetIcon,
} from "../../Components/Icons";
import SimplifiedEnneagramInput from "../../Components/SimplifiedEnneagramInput";

interface PlanData {
  id: string;
  userId: string;
  goalType: string;
  goal: string;
  goalName?: string;
  targetDate: string;
  hasTimePressure: boolean;
  milestones: Milestone[];
  createdAt: any;
  status: "active" | "completed" | "paused";
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

interface Notification {
  id: string;
  prompt: string;
  createdAt: any;
  feedback?: string | null;
  type: string;
}

const enneagramLabels = {
  enneagramType1: "Type 1 – The Reformer",
  enneagramType2: "Type 2 – The Helper",
  enneagramType3: "Type 3 – The Achiever",
  enneagramType4: "Type 4 – The Individualist",
  enneagramType5: "Type 5 – The Investigator",
  enneagramType6: "Type 6 – The Loyalist",
  enneagramType7: "Type 7 – The Enthusiast",
  enneagramType8: "Type 8 – The Challenger",
  enneagramType9: "Type 9 – The Peacemaker",
};

// Component to handle search params (must be wrapped in Suspense)
function ProfileContent() {
  const searchParams = useSearchParams();
  const newPlanId = searchParams.get("newPlan");
  const planIdFromFeedback = searchParams.get("plan"); // From feedback redirect
  const planRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const [user, setUser] = useState<any>(null);
  const [enneagramResult, setEnneagramResult] =
    useState<EnneagramResult | null>(null);
  const [userPlans, setUserPlans] = useState<PlanData[]>([]);
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showEnneagramOnboarding, setShowEnneagramOnboarding] = useState(false);
  const [milestoneNotifications, setMilestoneNotifications] = useState<
    Record<string, Notification[]>
  >({});
  const [loadingNotifications, setLoadingNotifications] = useState<
    Record<string, boolean>
  >({});
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "pause" | "resume" | "delete" | null;
    planId: string | null;
    planTitle: string;
  }>({
    isOpen: false,
    type: null,
    planId: null,
    planTitle: "",
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  const showToast = (message: string, type: ToastType = "info") => {
    setToast({ message, type });
  };

  const handleEnneagramComplete = async (result: EnneagramResult) => {
    // Update local state
    setEnneagramResult(result);
    setShowEnneagramOnboarding(false);

    // Show success feedback
    showToast("Personality profile completed! 🎉", "success");
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        await Promise.all([loadUserProfile(user.uid), loadUserPlans(user.uid)]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const userDoc = await TrackedFirestoreClient.doc(`users/${userId}`).get({
        userId,
        userEmail: user?.email || undefined,
        source: "profile_page",
        functionName: "load_user_profile",
      });

      if (userDoc.exists()) {
        const data = userDoc.data();
        setEnneagramResult(data?.enneagramResult as EnneagramResult);

        // Check if enneagramResult is missing and show onboarding modal
        if (!data?.enneagramResult) {
          setShowEnneagramOnboarding(true);
        }
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

  const loadUserPlans = async (userId: string) => {
    try {
      const querySnapshot = await TrackedFirestoreClient.collection("plans")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(10)
        .get({
          userId,
          userEmail: user?.email || undefined,
          source: "profile_page",
          functionName: "load_user_plans",
        });

      const plans: PlanData[] = [];
      querySnapshot.forEach((doc) => {
        plans.push({
          id: doc.id,
          ...doc.data(),
        } as PlanData);
      });

      setUserPlans(plans);
    } catch (error) {
      console.error("Error loading user plans:", error);
    }
  };

  const togglePlanExpansion = (planId: string) => {
    setExpandedPlans((prev) => {
      const newSet = new Set<string>();
      // If clicking on already expanded plan, collapse it (empty set)
      // If clicking on different plan, expand only that one
      if (!prev.has(planId)) {
        newSet.add(planId);
      }
      return newSet;
    });
  };

  // Helper function to determine milestone status
  const getMilestoneStatus = (
    milestone: Milestone
  ): "completed" | "current" | "future" => {
    if (milestone.completed) return "completed";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(milestone.startDate);
    startDate.setHours(0, 0, 0, 0);

    const dueDate = new Date(milestone.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    // Current milestone: started but not completed, and due date hasn't passed
    if (startDate <= today && today <= dueDate) {
      return "current";
    }

    return "future";
  };

  // Fetch ALL notifications for a milestone
  const fetchMilestoneNotifications = async (
    userId: string,
    planId: string,
    milestoneId: string
  ): Promise<Notification[]> => {
    try {
      // Need to build complex query step by step for multiple where clauses
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", userId),
        where("planId", "==", planId),
        where("milestoneId", "==", milestoneId),
        where("type", "==", "milestone_reminder"),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);

      // Track the read operation manually since complex queries need custom handling
      await fetch("/api/track-firebase-usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "read",
          collection: "notifications",
          documentCount: querySnapshot.size,
          userId,
          userEmail: user?.email || undefined,
          source: "profile_page",
          functionName: "fetch_milestone_notifications",
        }),
      }).catch(console.warn);

      if (querySnapshot.empty) return [];

      return querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Notification
      );
    } catch (error) {
      console.error("Error fetching milestone notifications:", error);
      return [];
    }
  };

  // Load notifications for ALL milestones (to show past interactions)
  const loadCurrentMilestoneNotifications = async (plans: PlanData[]) => {
    if (!user) return;

    const allMilestones: { planId: string; milestone: Milestone }[] = [];

    // Find ALL milestones across all plans (current, completed, and future with notifications)
    plans.forEach((plan) => {
      plan.milestones?.forEach((milestone) => {
        allMilestones.push({ planId: plan.id, milestone });
      });
    });

    // Set loading state for all milestones
    const loadingState: Record<string, boolean> = {};
    allMilestones.forEach(({ milestone }) => {
      loadingState[milestone.id] = true;
    });
    setLoadingNotifications(loadingState);

    // Fetch notifications for each milestone
    const notificationPromises = allMilestones.map(
      async ({ planId, milestone }) => {
        const notifications = await fetchMilestoneNotifications(
          user.uid,
          planId,
          milestone.id
        );
        return { milestoneId: milestone.id, notifications };
      }
    );

    try {
      const results = await Promise.all(notificationPromises);

      const notifications: Record<string, Notification[]> = {};
      const finalLoadingState: Record<string, boolean> = {};

      results.forEach(({ milestoneId, notifications: milestoneNotifs }) => {
        notifications[milestoneId] = milestoneNotifs;
        finalLoadingState[milestoneId] = false;
      });

      setMilestoneNotifications(notifications);
      setLoadingNotifications(finalLoadingState);
    } catch (error) {
      console.error("Error loading milestone notifications:", error);
      setLoadingNotifications({});
    }
  };

  // Load notifications when plans change
  useEffect(() => {
    if (userPlans.length > 0) {
      loadCurrentMilestoneNotifications(userPlans);
    }
  }, [userPlans, user]);

  // Auto-expand first plan by default
  useEffect(() => {
    if (userPlans.length > 0 && expandedPlans.size === 0 && !newPlanId && !planIdFromFeedback) {
      setExpandedPlans(new Set([userPlans[0].id]));
    }
  }, [userPlans, expandedPlans.size, newPlanId, planIdFromFeedback]);

  // Auto-expand and scroll to newly created plan OR plan from feedback redirect
  useEffect(() => {
    const targetPlanId = newPlanId || planIdFromFeedback;

    if (targetPlanId && userPlans.length > 0) {
      const planExists = userPlans.some((plan) => plan.id === targetPlanId);

      if (planExists) {
        // Auto-expand the plan
        setExpandedPlans(new Set([targetPlanId]));

        // Scroll to the plan after a short delay to ensure rendering
        setTimeout(() => {
          const planElement = planRefs.current[targetPlanId];
          if (planElement) {
            planElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });

            // Add highlight animation
            planElement.style.animation = "highlight 2s ease-in-out";
          }
        }, 500);

        // Clear the URL parameter
        window.history.replaceState({}, "", "/profile");
      }
    }
  }, [newPlanId, planIdFromFeedback, userPlans]);

  const getProgressPercentage = (milestones: Milestone[]) => {
    if (!milestones || milestones.length === 0) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalProgress = 0;
    for (const m of milestones) {
      if (m.completed) {
        totalProgress += 1;
      } else if (new Date(m.dueDate) < today) {
        totalProgress += 1;
      } else if ((m as any).steps?.length > 0) {
        const steps = (m as any).steps;
        const done = steps.filter((s: any) => s.completed).length;
        totalProgress += done / steps.length;
      }
    }
    return Math.round((totalProgress / milestones.length) * 100);
  };

  // Helper to get primary enneagram type from result
  const getPrimaryEnneagramType = (
    result: EnneagramResult | null
  ): string | undefined => {
    if (!result) return undefined;

    const types = [
      { key: "enneagramType1", label: "Type 1", value: result.enneagramType1 },
      { key: "enneagramType2", label: "Type 2", value: result.enneagramType2 },
      { key: "enneagramType3", label: "Type 3", value: result.enneagramType3 },
      { key: "enneagramType4", label: "Type 4", value: result.enneagramType4 },
      { key: "enneagramType5", label: "Type 5", value: result.enneagramType5 },
      { key: "enneagramType6", label: "Type 6", value: result.enneagramType6 },
      { key: "enneagramType7", label: "Type 7", value: result.enneagramType7 },
      { key: "enneagramType8", label: "Type 8", value: result.enneagramType8 },
      { key: "enneagramType9", label: "Type 9", value: result.enneagramType9 },
    ];

    const maxType = types.reduce((max, type) =>
      type.value > max.value ? type : max
    );
    return maxType.label;
  };

  const getDaysUntilTarget = (targetDate: string) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 30) {
      const months = Math.round(diffDays / 30);
      return `${months} ${months === 1 ? "month" : "months"}`;
    }

    return `${diffDays} ${diffDays === 1 ? "day" : "days"}`;
  };

  // Calculate gamification stats
  const calculateUserStats = () => {
    const totalPlans = userPlans.length;
    const allMilestones = userPlans.flatMap((plan) => plan.milestones || []);
    const completedMilestones = allMilestones.filter((m) => m.completed).length;
    const totalMilestones = allMilestones.length;

    // Calculate nudge streak and responses from milestone notifications
    let totalNudgeResponses = 0;
    let nudgeStreak = 0;

    Object.values(milestoneNotifications).forEach((notifications) => {
      totalNudgeResponses += notifications.filter((n) => n.feedback).length;
      // Simple streak calculation - could be more sophisticated
      const recentResponses = notifications.filter((n) => n.feedback).length;
      nudgeStreak = Math.max(nudgeStreak, recentResponses);
    });

    // Simple days active calculation - could be based on actual user activity
    const daysActive =
      userPlans.length > 0
        ? Math.max(1, Math.floor(Math.random() * 30) + 1)
        : 0;

    return {
      totalPlans,
      completedMilestones,
      totalMilestones,
      nudgeStreak,
      totalNudgeResponses,
      daysActive,
    };
  };

  const userStats = calculateUserStats();

  // Plan action handlers
  const handlePausePlan = (planId: string, planTitle: string) => {
    setModalState({
      isOpen: true,
      type: "pause",
      planId,
      planTitle,
    });
  };

  const handleResumePlan = (planId: string, planTitle: string) => {
    setModalState({
      isOpen: true,
      type: "resume",
      planId,
      planTitle,
    });
  };

  const handleDeletePlan = (planId: string, planTitle: string) => {
    setModalState({
      isOpen: true,
      type: "delete",
      planId,
      planTitle,
    });
  };

  const handleModalCancel = () => {
    setModalState({
      isOpen: false,
      type: null,
      planId: null,
      planTitle: "",
    });
  };

  const handleModalConfirm = async () => {
    if (!modalState.planId || !user) return;

    setActionLoading(modalState.planId);

    try {
      if (modalState.type === "delete") {
        // Delete plan
        const response = await fetch(
          `/api/plans/${modalState.planId}?userId=${user.uid}&userEmail=${user.email}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to delete plan");
        }

        // Remove from local state
        setUserPlans((plans) =>
          plans.filter((p) => p.id !== modalState.planId)
        );
        showToast("Plan deleted successfully", "success");
      } else if (modalState.type === "pause" || modalState.type === "resume") {
        // Update plan status
        const newStatus = modalState.type === "pause" ? "paused" : "active";

        const response = await fetch(`/api/plans/${modalState.planId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
            userId: user.uid,
            userEmail: user.email,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update plan status");
        }

        // Update local state
        setUserPlans((plans) =>
          plans.map((p) =>
            p.id === modalState.planId ? { ...p, status: newStatus } : p
          )
        );

        const action = modalState.type === "pause" ? "paused" : "resumed";
        showToast(`Plan ${action} successfully`, "success");
      }
    } catch (error) {
      console.error("Error performing plan action:", error);
      showToast(
        error instanceof Error ? error.message : "Unknown error occurred",
        "error"
      );
    } finally {
      setActionLoading(null);
      handleModalCancel();
    }
  };

  if (loading)
    return <div className={styles.loading}>Loading your profile...</div>;
  if (!user)
    return (
      <div className={styles.loading}>Please log in to view your profile.</div>
    );

  return (
    <div className={`${styles.profileContainer} container my20`}>
      {/* Enneagram Onboarding Modal */}
      {showEnneagramOnboarding && (
        <div className={styles.onboardingModalOverlay}>
          <div className={styles.onboardingModalContent}>
            <div className={styles.onboardingHeader}>
              <h2 className={styles.onboardingTitle}>
                Complete Your Personality Profile
              </h2>
              <p className={styles.onboardingSubtitle}>
                To personalize your goal milestones and provide tailored coaching,
                we need to understand your personality type. This will only take a minute!
              </p>
            </div>
            <SimplifiedEnneagramInput onComplete={handleEnneagramComplete} />
          </div>
        </div>
      )}

      {/* Plans Section */}
      {userPlans.length > 0 ? (
        <div className={`${styles.plansGrid} gridAutoFit gapLg`}>
          {userPlans.map((plan, index) => {
            // Define color palette for plan cards
            const planColors = [
              '#4F46E5', // Indigo
              '#059669', // Emerald
              '#7C3AED', // Violet
              '#EA580C', // Orange
              '#DB2777', // Pink
            ];
            const planColor = planColors[index % planColors.length];

            return (
            <div
              key={plan.id}
              ref={(el) => {
                planRefs.current[plan.id] = el;
              }}
              className={`${styles.planCardContainer} slideInUp`}
              style={{
                animationDelay: `${0.1 * (index + 2)}s`,
                borderLeft: `4px solid ${planColor}`
              }}
            >
              {/* Plan Summary (Always Visible) */}
              <div
                className={styles.planSummarySimple}
                onClick={() => userPlans.length > 1 ? togglePlanExpansion(plan.id) : undefined}
                style={{
                  cursor: userPlans.length > 1 ? 'pointer' : 'default'
                }}
              >
                <div className={styles.planHeaderSimple}>
                  <div className={styles.planTitleSimple}>
                    {plan.goalName
                      ? plan.goalName
                      : plan.goalType
                      ? plan.goalType.charAt(0).toUpperCase() +
                        plan.goalType.slice(1) +
                        " Goal"
                      : "Personal Goal"}
                  </div>
                  {userPlans.length > 1 && (
                    <div className={styles.expandIconSimple}>
                      {expandedPlans.has(plan.id) ? "▼" : "▶"}
                    </div>
                  )}
                </div>

                <div className={styles.planMetricsSimple}>
                  <div className={styles.metricSimple}>
                    <span className={styles.metricLabel}>Target:</span>
                    <span className={styles.metricValue}>
                      {getDaysUntilTarget(plan.targetDate)}
                    </span>
                  </div>
                  <div className={styles.metricSimple}>
                    <span className={styles.metricLabel}>Milestones:</span>
                    <span className={styles.metricValue}>
                      {(() => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const done = (plan.milestones || []).filter(
                          (m) => m.completed || new Date(m.dueDate) < today
                        ).length;
                        return Math.min(done + 1, plan.milestones?.length || 0);
                      })()}
                      /{plan.milestones?.length || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expanded Plan Details */}
              {(userPlans.length === 1 || expandedPlans.has(plan.id)) && (
                <div className={styles.planDetailsSimple}>
                  <div className={styles.milestoneCardWrapper}>
                    {(() => {
                      // Find the current milestone
                      const currentMilestone = plan.milestones?.find(
                        (milestone) =>
                          getMilestoneStatus(milestone) === "current"
                      );

                      if (currentMilestone) {
                        const notifications =
                          milestoneNotifications[currentMilestone.id] || [];
                        const isLoadingNotification =
                          loadingNotifications[currentMilestone.id] || false;

                        return (
                          <MilestoneCard
                            key={currentMilestone.id}
                            milestone={currentMilestone}
                            status="current"
                            notifications={notifications}
                            isLoadingNotification={isLoadingNotification}
                            goalType={plan.goalType}
                            enneagramData={
                              enneagramResult
                                ? {
                                    type: getPrimaryEnneagramType(
                                      enneagramResult
                                    ),
                                    summary: enneagramResult.summary,
                                    blindSpots: undefined,
                                    strengths: undefined,
                                  }
                                : undefined
                            }
                            showOnlyLatestNotification={true}
                            hideFeedbackStatus={true}
                            hideTimeline={true}
                            planId={plan.id}
                          />
                        );
                      } else {
                        // No current milestone - show message
                        const allCompleted = plan.milestones?.every(
                          (m) => m.completed
                        );
                        return (
                          <div
                            style={{
                              padding: "1.5rem",
                              textAlign: "center",
                              color: "#6b7280",
                              background: "#f9fafb",
                              borderRadius: "0.5rem",
                              border: "1px dashed #d1d5db",
                            }}
                          >
                            {allCompleted
                              ? "🎉 All milestones completed! Great job!"
                              : "📋 No active milestone right now. Check full details to see upcoming milestones."}
                          </div>
                        );
                      }
                    })()}
                  </div>

                </div>
              )}

              {/* See Full Details Link - Always visible at bottom of card */}
              <div
                style={{
                  marginTop: (userPlans.length === 1 || expandedPlans.has(plan.id)) ? "1rem" : "0.5rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid #e5e7eb",
                  textAlign: "center",
                }}
              >
                <Link
                  href={`/profile/goals/${plan.id}`}
                  className={styles.viewDetailsLink}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: "#3b82f6",
                    fontWeight: "600",
                    textDecoration: "none",
                    fontSize: "0.875rem",
                    padding: "0.5rem 1rem",
                    borderRadius: "0.5rem",
                    transition: "all 0.2s ease",
                  }}
                >
                  <EyeIcon size={16} />
                  View Full Goal Details
                </Link>
              </div>
            </div>
            );
          })}
        </div>
      ) : (
        <div className={`${styles.noPlans} fadeIn textCenter py20`}>
          <div className={`${styles.noPlansIcon} float mb6`}>
            <TargetIcon size={64} color="var(--color-neutral-400)" />
          </div>
          <h3 className="mb4">No plans yet!</h3>
          <p className="mb8">
            Create your first goal-oriented plan to get started on your journey.
          </p>
          <LinkButton
            href="/profile/companion"
            variant="primary"
            size="lg"
            icon={<PlusIcon size={20} />}
            className={`${styles.createFirstPlanButton} bounce`}
          >
            Create Your First Plan
          </LinkButton>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        title={
          modalState.type === "delete"
            ? "Delete Plan?"
            : modalState.type === "pause"
              ? "Pause Plan?"
              : "Resume Plan?"
        }
        message={
          modalState.type === "delete"
            ? `Are you sure you want to permanently delete this plan? This action cannot be undone.\n\n"${modalState.planTitle.substring(0, 80)}${modalState.planTitle.length > 80 ? "..." : ""}"`
            : modalState.type === "pause"
              ? `Pausing this plan will stop all automated reminders. You can resume it anytime.\n\n"${modalState.planTitle.substring(0, 80)}${modalState.planTitle.length > 80 ? "..." : ""}"`
              : `Resuming this plan will reactivate automated reminders for current milestones.\n\n"${modalState.planTitle.substring(0, 80)}${modalState.planTitle.length > 80 ? "..." : ""}"`
        }
        confirmText={
          modalState.type === "delete"
            ? "Delete Permanently"
            : modalState.type === "pause"
              ? "Pause Plan"
              : "Resume Plan"
        }
        cancelText="Cancel"
        confirmVariant={
          modalState.type === "delete"
            ? "danger"
            : modalState.type === "pause"
              ? "warning"
              : "primary"
        }
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

// Main component with Suspense wrapper
const ProfilePage = () => {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
};

export default ProfilePage;
