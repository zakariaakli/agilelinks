"use client";

import React, { useState, useEffect, useCallback } from "react";
import { auth } from "../../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { TrackedFirestoreClient } from "../../../lib/trackedFirestoreClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StepItem from "../../../Components/StepItem";
import { Step } from "../../../Models/Step";
import { ArrowLeftIcon, LoaderIcon } from "../../../Components/Icons";
import styles from "../../../Styles/steps.module.css";

interface EnrichedStep extends Step {
  planId: string;
  milestoneId: string;
  goalName: string;
  milestoneTitle: string;
}

interface PlanData {
  id: string;
  goal: string;
  goalName?: string;
  milestones: Array<{
    id: string;
    title: string;
    steps?: Step[];
  }>;
}

export default function CommitmentsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [allSteps, setAllSteps] = useState<EnrichedStep[]>([]);
  const [activeTab, setActiveTab] = useState<"active" | "done">("active");
  const [updatingStepId, setUpdatingStepId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        await loadAllSteps(user.uid);
      } else {
        router.push("/login");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const loadAllSteps = async (userId: string) => {
    try {
      const querySnapshot = await TrackedFirestoreClient.collection("plans")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(10)
        .get({
          userId,
          source: "commitments_page",
          functionName: "load_all_steps",
        });

      const steps: EnrichedStep[] = [];
      querySnapshot.forEach((doc) => {
        const plan = { id: doc.id, ...doc.data() } as PlanData;
        const goalName = plan.goalName || plan.goal;
        plan.milestones.forEach((milestone) => {
          (milestone.steps || []).forEach((step) => {
            steps.push({
              ...step,
              planId: plan.id,
              milestoneId: milestone.id,
              goalName,
              milestoneTitle: milestone.title,
            });
          });
        });
      });

      setAllSteps(steps);
    } catch (error) {
      console.error("Error loading steps:", error);
    }
  };

  const handleUpdate = useCallback(
    async (planId: string, milestoneId: string, stepId: string, completed: boolean) => {
      setUpdatingStepId(stepId);
      try {
        const response = await fetch("/api/steps", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId, milestoneId, stepId, completed }),
        });
        if (response.ok) {
          setAllSteps((prev) =>
            prev.map((s) =>
              s.id === stepId ? { ...s, completed, completedAt: completed ? new Date() : null } : s
            )
          );
        }
      } catch (error) {
        console.error("Error updating step:", error);
      } finally {
        setUpdatingStepId(null);
      }
    },
    []
  );

  const handleDelete = useCallback(
    async (planId: string, milestoneId: string, stepId: string) => {
      try {
        const response = await fetch("/api/steps", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId, milestoneId, stepId }),
        });
        if (response.ok) {
          setAllSteps((prev) => prev.filter((s) => s.id !== stepId));
        }
      } catch (error) {
        console.error("Error deleting step:", error);
      }
    },
    []
  );

  const activeSteps = allSteps.filter((s) => !s.completed);
  const doneSteps = allSteps.filter((s) => s.completed);
  const displaySteps = activeTab === "active" ? activeSteps : doneSteps;

  // Group steps by goal name
  const grouped = displaySteps.reduce<Record<string, EnrichedStep[]>>((acc, step) => {
    const key = step.goalName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(step);
    return acc;
  }, {});

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <LoaderIcon size={32} color="#6366f1" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", padding: "1.5rem 1rem 6rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <Link
          href="/profile"
          style={{
            display: "flex",
            alignItems: "center",
            color: "#6b7280",
            textDecoration: "none",
          }}
        >
          <ArrowLeftIcon size={20} />
        </Link>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827", margin: 0 }}>
          My Commitments
        </h1>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.5rem",
          background: "#f3f4f6",
          borderRadius: "0.5rem",
          padding: "0.25rem",
        }}
      >
        <button
          onClick={() => setActiveTab("active")}
          style={{
            flex: 1,
            padding: "0.5rem",
            border: "none",
            borderRadius: "0.375rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
            background: activeTab === "active" ? "#fff" : "transparent",
            color: activeTab === "active" ? "#4f46e5" : "#6b7280",
            boxShadow: activeTab === "active" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            transition: "all 0.15s ease",
          }}
        >
          Active ({activeSteps.length})
        </button>
        <button
          onClick={() => setActiveTab("done")}
          style={{
            flex: 1,
            padding: "0.5rem",
            border: "none",
            borderRadius: "0.375rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
            background: activeTab === "done" ? "#fff" : "transparent",
            color: activeTab === "done" ? "#15803d" : "#6b7280",
            boxShadow: activeTab === "done" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            transition: "all 0.15s ease",
          }}
        >
          Done ({doneSteps.length})
        </button>
      </div>

      {/* Steps grouped by goal */}
      {Object.keys(grouped).length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem 1rem",
            color: "#9ca3af",
            fontSize: "0.875rem",
          }}
        >
          {activeTab === "active"
            ? "No active commitments. Add some from your nudges!"
            : "No completed commitments yet."}
        </div>
      ) : (
        Object.entries(grouped).map(([goalName, steps]) => (
          <div key={goalName} style={{ marginBottom: "1.5rem" }}>
            <h3
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                margin: "0 0 0.5rem",
              }}
            >
              {goalName}
            </h3>
            <div className={styles.stepsList}>
              {steps.map((step) => (
                <StepItem
                  key={step.id}
                  step={step}
                  planId={step.planId}
                  milestoneId={step.milestoneId}
                  milestoneLabel={step.milestoneTitle}
                  onUpdate={(stepId, completed) =>
                    handleUpdate(step.planId, step.milestoneId, stepId, completed)
                  }
                  onDelete={(stepId) =>
                    handleDelete(step.planId, step.milestoneId, stepId)
                  }
                  isUpdating={updatingStepId === step.id}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
