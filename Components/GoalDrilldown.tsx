"use client";

import React, { useState, useEffect, useRef } from "react";
import { MatrixAction, Quadrant } from "../Models/PriorityMatrix";
import { CheckCircleIcon, TrashIcon, PlusIcon } from "./Icons";
import styles from "../Styles/priorityMatrix.module.css";

const QUADRANT_LABELS: Record<Quadrant, string> = {
  urgent_important: "Do First",
  not_urgent_important: "Schedule",
  urgent_not_important: "Delegate",
  not_urgent_not_important: "Eliminate",
};

interface Props {
  planId: string;
  planTitle: string;
  matrixId: string;
  /** All matrix actions — component filters to this plan's milestone-level ones */
  actions: MatrixAction[];
  loading?: boolean;
  /** Called once on first open if no milestone actions exist yet */
  onSeedMilestones: (planId: string) => Promise<void>;
  onMove: (actionId: string, quadrant: Quadrant) => void;
  onDone: (actionId: string) => void;
  onRemove: (actionId: string) => void;
  onAdd: (title: string, quadrant: Quadrant) => void;
  onClose: () => void;
}

const GoalDrilldown: React.FC<Props> = ({
  planId,
  planTitle,
  matrixId,
  actions,
  loading,
  onSeedMilestones,
  onMove,
  onDone,
  onRemove,
  onAdd,
  onClose,
}) => {
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [addText, setAddText] = useState("");
  const [addQuadrant, setAddQuadrant] = useState<Quadrant>("not_urgent_important");
  const addInputRef = useRef<HTMLInputElement>(null);

  const milestoneActions = actions.filter(
    (a) => a.sourcePlanId === planId && !!a.sourceMilestoneId && a.status !== "removed"
  );

  // On first open, seed if empty
  useEffect(() => {
    if (!seeded && !seeding && milestoneActions.length === 0 && !loading) {
      setSeeding(true);
      onSeedMilestones(planId).finally(() => {
        setSeeding(false);
        setSeeded(true);
      });
    } else {
      setSeeded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = () => {
    const trimmed = addText.trim();
    if (!trimmed) return;
    onAdd(trimmed, addQuadrant);
    setAddText("");
    addInputRef.current?.focus();
  };

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={styles.drilldownOverlay} onClick={handleOverlayClick}>
      <div className={styles.drilldownSheet} role="dialog" aria-modal="true">
        {/* Drag handle (mobile only) */}
        <div className={styles.drilldownHandle} />

        {/* Header */}
        <div className={styles.drilldownHeader}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className={styles.drilldownTitle}>{planTitle}</h2>
            <div className={styles.drilldownSubtitle}>
              {milestoneActions.length} milestone{milestoneActions.length !== 1 ? "s" : ""} · tap a quadrant to re-prioritize
            </div>
          </div>
          <button className={styles.drilldownCloseBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className={styles.drilldownBody}>
          {(seeding || loading) && (
            <div className={styles.drilldownEmpty}>Loading milestones…</div>
          )}

          {!seeding && !loading && milestoneActions.length === 0 && (
            <div className={styles.drilldownEmpty}>
              No milestones found for this goal yet.
              <br />
              Add one below or update the goal in your plans.
            </div>
          )}

          {milestoneActions.map((action) => (
            <div key={action.id} className={styles.drilldownRow}>
              <div className={styles.drilldownRowContent}>
                <div className={`${styles.drilldownRowTitle} ${action.status === "done" ? styles.done : ""}`}>
                  {action.title}
                </div>

                {action.status !== "done" && (
                  <div className={styles.quadrantPicker}>
                    {(Object.keys(QUADRANT_LABELS) as Quadrant[]).map((q) => {
                      const isActive = action.quadrant === q;
                      return (
                        <button
                          key={q}
                          onClick={() => onMove(action.id, q)}
                          className={[
                            styles.qpBtn,
                            styles[`qpBtn_${q}`],
                            isActive ? styles[`active_${q}`] : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          {QUADRANT_LABELS[q]}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className={styles.drilldownRowActions}>
                {action.status !== "done" && (
                  <button
                    className={styles.iconBtn}
                    title="Mark done"
                    onClick={() => onDone(action.id)}
                  >
                    <CheckCircleIcon size={15} strokeWidth={2} />
                  </button>
                )}
                <button
                  className={styles.iconBtn}
                  title="Remove"
                  onClick={() => onRemove(action.id)}
                >
                  <TrashIcon size={15} strokeWidth={2} />
                </button>
              </div>
            </div>
          ))}

          {/* Add action */}
          <div className={styles.drilldownAddRow}>
            <input
              ref={addInputRef}
              className={styles.addInput}
              placeholder="Add an action…"
              value={addText}
              onChange={(e) => setAddText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            {/* Quadrant selector for new action */}
            <select
              value={addQuadrant}
              onChange={(e) => setAddQuadrant(e.target.value as Quadrant)}
              style={{
                fontSize: "0.75rem",
                border: "1px solid rgba(0,0,0,0.15)",
                borderRadius: 6,
                padding: "0.35rem 0.4rem",
                background: "#fff",
                color: "#6b6560",
                cursor: "pointer",
              }}
            >
              {(Object.entries(QUADRANT_LABELS) as [Quadrant, string][]).map(([q, label]) => (
                <option key={q} value={q}>{label}</option>
              ))}
            </select>
            <button className={styles.addBtn} onClick={handleAdd}>
              <PlusIcon size={13} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalDrilldown;
