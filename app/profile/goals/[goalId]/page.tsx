"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth } from "../../../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { TrackedFirestoreClient } from "../../../../lib/trackedFirestoreClient";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../../../../firebase";
import MilestoneCard from "../../../../Components/MilestoneCard";
import ConfirmationModal from "../../../../Components/ConfirmationModal";
import Toast, { ToastType } from "../../../../Components/Toast";
import { ArrowLeftIcon } from "../../../../Components/Icons";
import Link from "next/link";
import styles from "../../../../Styles/profile.module.css";

interface MilestoneStep {
  id: string;
  title: string;
  completed: boolean;
  createdAt: any;
  source: 'user' | 'ai';
  completedAt?: any;
  nudgeId?: string | null;
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
  steps?: MilestoneStep[];
}

interface PlanData {
  id: string;
  userId: string;
  goalType: string;
  goal: string;
  targetDate: string;
  hasTimePressure: boolean;
  milestones: Milestone[];
  createdAt: any;
  status: "active" | "completed" | "paused";
}

interface Notification {
  id: string;
  prompt: string;
  createdAt: any;
  feedback?: string | null;
  type: string;
}

const GoalDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const goalId = params.goalId as string;

  const [user, setUser] = useState<any>(null);
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        await loadPlanData(user.uid, goalId);
      } else {
        router.push("/login");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [goalId, router]);

  const loadPlanData = async (userId: string, planId: string) => {
    try {
      const planDoc = await TrackedFirestoreClient.doc(`plans/${planId}`).get({
        userId,
        userEmail: user?.email || undefined,
        source: "goal_details_page",
        functionName: "load_plan_data",
      });

      if (planDoc.exists()) {
        const docData = planDoc.data();
        // Use the id field from document data if it exists, otherwise use Firestore doc ID
        const actualPlanId = docData?.id || planDoc.id;

        const planData = {
          id: actualPlanId,
          ...docData,
        } as PlanData;

        console.log(`📋 Loaded plan with ID: ${actualPlanId} (Firestore doc ID: ${planDoc.id})`);

        // Verify this plan belongs to the user
        if (planData.userId !== userId) {
          showToast("You don't have permission to view this plan", "error");
          router.push("/profile");
          return;
        }

        setPlan(planData);
        await loadMilestoneNotifications(userId, planData);
      } else {
        showToast("Plan not found", "error");
        router.push("/profile");
      }
    } catch (error) {
      console.error("Error loading plan:", error);
      showToast("Failed to load plan details", "error");
    }
  };

  const loadMilestoneNotifications = async (
    userId: string,
    planData: PlanData
  ) => {
    if (!planData.milestones) return;

    const loadingState: Record<string, boolean> = {};
    planData.milestones.forEach((milestone) => {
      loadingState[milestone.id] = true;
    });
    setLoadingNotifications(loadingState);

    const notificationPromises = planData.milestones.map(
      async (milestone) => {
        const notifications = await fetchMilestoneNotifications(
          userId,
          planData.id,
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

  const fetchMilestoneNotifications = async (
    userId: string,
    planId: string,
    milestoneId: string
  ): Promise<Notification[]> => {
    try {
      console.log(`🔍 Fetching notifications for:`, { userId, planId, milestoneId });
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", userId),
        where("planId", "==", planId),
        where("milestoneId", "==", milestoneId),
        where("type", "==", "milestone_reminder"),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);

      await fetch("/api/track-firebase-usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "read",
          collection: "notifications",
          documentCount: querySnapshot.size,
          userId,
          userEmail: user?.email || undefined,
          source: "goal_details_page",
          functionName: "fetch_milestone_notifications",
        }),
      }).catch(console.warn);

      if (querySnapshot.empty) {
        console.log(`✅ No notifications found for milestone ${milestoneId}`);
        return [];
      }

      const notifications = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Notification
      );

      console.log(`✅ Found ${notifications.length} notification(s) for milestone ${milestoneId}:`,
        notifications.map(n => ({ id: n.id, planId: (n as any).planId, milestoneId: (n as any).milestoneId }))
      );

      return notifications;
    } catch (error) {
      console.error("Error fetching milestone notifications:", error);
      return [];
    }
  };

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

    if (startDate <= today && today <= dueDate) {
      return "current";
    }

    return "future";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#10B981";
      case "completed":
        return "#6366F1";
      case "paused":
        return "#F59E0B";
      default:
        return "#6B7280";
    }
  };

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
      } else if (m.steps && m.steps.length > 0) {
        const done = m.steps.filter((s) => s.completed).length;
        totalProgress += done / m.steps.length;
      }
    }
    return Math.round((totalProgress / milestones.length) * 100);
  };

  const getCompletedMilestoneCount = (milestones: Milestone[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return milestones.filter(
      (m) => m.completed || new Date(m.dueDate) < today
    ).length;
  };

  const getDaysUntilTarget = (targetDate: string) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 30) {
      const months = Math.round(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'}`;
    }

    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
  };

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

        showToast("Plan deleted successfully", "success");
        router.push("/profile");
      } else if (modalState.type === "pause" || modalState.type === "resume") {
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

        setPlan((prevPlan) =>
          prevPlan ? { ...prevPlan, status: newStatus } : null
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

  if (loading) {
    return (
      <div className={styles.loading}>Loading goal details...</div>
    );
  }

  if (!plan) {
    return (
      <div className={styles.loading}>Plan not found</div>
    );
  }

  return (
    <div className={`${styles.profileContainer} container my20`}>
      {/* Back Navigation */}
      <div style={{ marginBottom: "2rem" }}>
        <Link
          href="/profile"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "#6b7280",
            textDecoration: "none",
            fontSize: "0.875rem",
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#3b82f6")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
        >
          <ArrowLeftIcon size={16} />
          Back to Dashboard
        </Link>
      </div>

      {/* Goal Header */}
      <div className={`${styles.profileHeader} slideInDown`}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                marginBottom: "0.5rem",
              }}
            >
              {plan.goalType
                ? plan.goalType.charAt(0).toUpperCase() +
                  plan.goalType.slice(1) +
                  " Goal"
                : "Personal Goal"}
            </div>
            <h1
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                color: "#111827",
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {plan.goal}
            </h1>
          </div>
          <div
            style={{
              backgroundColor: getStatusColor(plan.status),
              color: "white",
              padding: "0.5rem 1rem",
              borderRadius: "9999px",
              fontSize: "0.875rem",
              fontWeight: "600",
            }}
          >
            {plan.status.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Goal Metrics */}
      <section
        className={`${styles.plansSection} section slideInUp staggerDelay1`}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              background: "#f9fafb",
              padding: "1.5rem",
              borderRadius: "0.75rem",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.5rem" }}
            >
              Progress
            </div>
            <div style={{ fontSize: "1.875rem", fontWeight: "700", color: "#111827" }}>
              {getProgressPercentage(plan.milestones)}%
            </div>
          </div>

          <div
            style={{
              background: "#f9fafb",
              padding: "1.5rem",
              borderRadius: "0.75rem",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.5rem" }}
            >
              Target Date
            </div>
            <div style={{ fontSize: "1.125rem", fontWeight: "600", color: "#111827" }}>
              {new Date(plan.targetDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.25rem" }}>
              {getDaysUntilTarget(plan.targetDate)} remaining
            </div>
          </div>

          <div
            style={{
              background: "#f9fafb",
              padding: "1.5rem",
              borderRadius: "0.75rem",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.5rem" }}
            >
              Milestones
            </div>
            <div style={{ fontSize: "1.875rem", fontWeight: "700", color: "#111827" }}>
              {getCompletedMilestoneCount(plan.milestones || [])}/
              {plan.milestones?.length || 0}
            </div>
          </div>
        </div>

        {plan.hasTimePressure && (
          <div
            style={{
              background: "#fef3c7",
              border: "1px solid #f59e0b",
              padding: "1rem",
              borderRadius: "0.5rem",
              marginBottom: "2rem",
              textAlign: "center",
              fontWeight: "600",
              color: "#92400e",
            }}
          >
            ⚡ Accelerated Timeline
          </div>
        )}

        {/* Overall Progress Bar */}
        <div style={{ marginBottom: "2rem" }}>
          <div
            style={{
              fontSize: "0.875rem",
              fontWeight: "600",
              color: "#374151",
              marginBottom: "0.5rem",
            }}
          >
            Overall Progress: {getProgressPercentage(plan.milestones)}%
          </div>
          <div
            style={{
              width: "100%",
              height: "0.75rem",
              background: "#e5e7eb",
              borderRadius: "9999px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                background: "linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)",
                width: `${getProgressPercentage(plan.milestones)}%`,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* All Milestones */}
        <div>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              color: "#111827",
              marginBottom: "1.5rem",
            }}
          >
            All Milestones ({plan.milestones?.length || 0})
          </h2>
          <div className={styles.enhancedMilestonesList}>
            {plan.milestones?.map((milestone) => {
              const status = getMilestoneStatus(milestone);
              const notifications = milestoneNotifications[milestone.id] || [];
              const isLoadingNotification =
                loadingNotifications[milestone.id] || false;

              return (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  status={status}
                  notifications={notifications}
                  isLoadingNotification={isLoadingNotification}
                  planId={plan.id}
                  hideNudges
                />
              );
            })}
          </div>
        </div>

        {/* Plan Actions */}
        <div
          style={{
            marginTop: "3rem",
            paddingTop: "2rem",
            borderTop: "2px solid #e5e7eb",
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {plan.status === "active" ? (
            <button
              onClick={() => handlePausePlan(plan.id, plan.goal)}
              className={`${styles.planActionButton} ${styles.planActionButtonWarning}`}
              disabled={actionLoading === plan.id}
            >
              {actionLoading === plan.id ? "⏳ Pausing..." : "⏸️ Pause Plan"}
            </button>
          ) : plan.status === "paused" ? (
            <button
              onClick={() => handleResumePlan(plan.id, plan.goal)}
              className={`${styles.planActionButton} ${styles.planActionButtonPrimary}`}
              disabled={actionLoading === plan.id}
            >
              {actionLoading === plan.id ? "⏳ Resuming..." : "▶️ Resume Plan"}
            </button>
          ) : null}

          <button
            onClick={() => handleDeletePlan(plan.id, plan.goal)}
            className={`${styles.planActionButton} ${styles.planActionButtonDanger}`}
            disabled={actionLoading === plan.id}
          >
            {actionLoading === plan.id ? "⏳ Deleting..." : "🗑️ Delete Plan"}
          </button>
        </div>
      </section>

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
};

export default GoalDetailsPage;
