"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { PriorityMatrix, MatrixAction, Quadrant, MatrixPeriodType } from "../../../Models/PriorityMatrix";
import PriorityMatrixBoard from "../../../Components/PriorityMatrixBoard";
import MatrixPeriodSettings from "../../../Components/MatrixPeriodSettings";
import QuarterTrajectory from "../../../Components/QuarterTrajectory";
import GoalDrilldown from "../../../Components/GoalDrilldown";
import { computeTrajectory } from "../../../lib/matrixTrajectory";
import { daysRemaining } from "../../../lib/matrixPeriod";
import styles from "../../../Styles/priorityMatrix.module.css";

const MatrixPage = () => {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [matrix, setMatrix] = useState<PriorityMatrix | null>(null);
  const [actions, setActions] = useState<MatrixAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [drilldown, setDrilldown] = useState<{ planId: string; planTitle: string } | null>(null);
  const [drilldownLoading, setDrilldownLoading] = useState(false);

  // ── Auth guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      if (!user) { router.replace("/login"); return; }
      setUserId(user.uid);
    });
    return () => unsub();
  }, [router]);

  // ── Load matrix ─────────────────────────────────────────────────────────
  const loadMatrix = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/matrix?userId=${uid}`);
      const data = await res.json();
      setMatrix(data.matrix);
      setActions(data.actions || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) loadMatrix(userId);
  }, [userId, loadMatrix]);

  // ── Seed / period change ─────────────────────────────────────────────────
  const handleSeed = async (
    periodType: MatrixPeriodType = "quarter",
    customStart?: string,
    customEnd?: string
  ) => {
    if (!userId) return;
    setSeeding(true);
    try {
      const res = await fetch("/api/matrix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, periodType, customStart, customEnd }),
      });
      const data = await res.json();
      setMatrix(data.matrix);
      setActions(data.actions || []);
    } finally {
      setSeeding(false);
    }
  };

  // ── Refresh (re-classify + add new milestones) ──────────────────────────
  const handleRefresh = async () => {
    if (!matrix || !userId) return;
    setRefreshing(true);
    try {
      const res = await fetch("/api/matrix", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "refresh", matrixId: matrix.id, userId }),
      });
      const data = await res.json();
      if (data.actions) setActions(data.actions);
    } finally {
      setRefreshing(false);
    }
  };

  // ── Board callbacks ──────────────────────────────────────────────────────
  const patch = async (body: object) => {
    await fetch("/api/matrix", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  const handleMove = async (actionId: string, quadrant: Quadrant) => {
    if (!matrix) return;
    setActions(prev =>
      prev.map(a => a.id === actionId ? { ...a, quadrant, manualOverride: true } : a)
    );
    await patch({ op: "move", matrixId: matrix.id, actionId, quadrant });
  };

  const handleDone = async (actionId: string) => {
    if (!matrix) return;
    setActions(prev => prev.map(a => a.id === actionId ? { ...a, status: "done" } : a));
    await patch({ op: "done", matrixId: matrix.id, actionId });
  };

  const handleRemove = async (actionId: string) => {
    if (!matrix) return;
    setActions(prev => prev.map(a => a.id === actionId ? { ...a, status: "removed" } : a));
    await patch({ op: "remove", matrixId: matrix.id, actionId });
  };

  const handleEdit = async (actionId: string, title: string) => {
    if (!matrix) return;
    setActions(prev => prev.map(a => a.id === actionId ? { ...a, title } : a));
    await patch({ op: "edit", matrixId: matrix.id, actionId, title });
  };

  const handleAdd = async (quadrant: Quadrant, title: string) => {
    if (!matrix || !userId) return;
    const res = await fetch("/api/matrix", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "add", matrixId: matrix.id, userId, title, quadrant }),
    });
    const data = await res.json();
    if (data.actionId) {
      const newAction: MatrixAction = {
        id: data.actionId,
        title,
        quadrant,
        source: "user",
        manualOverride: true,
        status: "open",
        effortMinutes: 0,
        createdAt: new Date(),
      };
      setActions(prev => [...prev, newAction]);
    }
  };

  // ── Drilldown ────────────────────────────────────────────────────────────
  const handleDrilldown = (action: import("../../../Models/PriorityMatrix").MatrixAction) => {
    setDrilldown({ planId: action.sourcePlanId!, planTitle: action.title });
  };

  const handleSeedMilestones = async (planId: string) => {
    if (!matrix || !userId) return;
    setDrilldownLoading(true);
    try {
      const res = await fetch("/api/matrix", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "drilldown", matrixId: matrix.id, planId, userId }),
      });
      const data = await res.json();
      if (data.actions) {
        setActions(prev => {
          const newIds = new Set((data.actions as import("../../../Models/PriorityMatrix").MatrixAction[]).map(a => a.id));
          return [...prev.filter(a => !newIds.has(a.id)), ...data.actions];
        });
      }
    } finally {
      setDrilldownLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading) return <div className={styles.loader}>Loading your matrix…</div>;

  if (!matrix) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>
          <h2>No matrix yet</h2>
          <p>Seed your quarterly Priority Matrix from your active goals.</p>
          <button
            className={styles.addBtn}
            style={{ marginTop: "1rem", padding: "0.5rem 1.25rem", fontSize: "0.9rem" }}
            onClick={() => handleSeed("quarter")}
            disabled={seeding}
          >
            {seeding ? "Seeding…" : "Seed Q2 Matrix"}
          </button>
        </div>
      </div>
    );
  }

  const trajectory = computeTrajectory(actions, matrix.periodStart, matrix.periodEnd, new Date());
  const daysLeft = daysRemaining(matrix.periodEnd, new Date());

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Priority Matrix</h1>
        <span className={styles.periodLabel}>{matrix.periodLabel}</span>
        <span className={styles.daysRemaining}>{daysLeft}d remaining</span>
      </div>

      <MatrixPeriodSettings
        current={matrix.periodType}
        onChange={(type, customStart, customEnd) => handleSeed(type, customStart, customEnd)}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {actions.some(a => a.status !== "removed") && (
        <QuarterTrajectory trajectory={trajectory} periodLabel={matrix.periodLabel} />
      )}

      {/* Board shows goal-level cards only */}
      <PriorityMatrixBoard
        actions={actions.filter(a => !a.sourceMilestoneId)}
        onMove={handleMove}
        onDone={handleDone}
        onRemove={handleRemove}
        onEdit={handleEdit}
        onAdd={handleAdd}
        onDrilldown={handleDrilldown}
      />

      {/* Goal drill-down sheet */}
      {drilldown && (
        <GoalDrilldown
          planId={drilldown.planId}
          planTitle={drilldown.planTitle}
          matrixId={matrix.id}
          actions={actions}
          loading={drilldownLoading}
          onSeedMilestones={handleSeedMilestones}
          onMove={handleMove}
          onDone={handleDone}
          onRemove={handleRemove}
          onAdd={(title, quadrant) => handleAdd(quadrant, title)}
          onClose={() => setDrilldown(null)}
        />
      )}
    </div>
  );
};

export default MatrixPage;
