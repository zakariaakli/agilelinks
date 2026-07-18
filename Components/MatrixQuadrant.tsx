"use client";

import React, { useState } from "react";
import { MatrixAction, Quadrant } from "../Models/PriorityMatrix";
import { CheckCircleIcon, EditIcon, TrashIcon, PlusIcon } from "./Icons";
import styles from "../Styles/priorityMatrix.module.css";

const QUADRANT_META: Record<
  Quadrant,
  { label: string; hint: string; dotClass: string; labelClass: string; quadrantClass: string }
> = {
  urgent_important: {
    label: "Do First",
    hint: "Urgent & Important — protect this time",
    dotClass: styles.dot_urgent_important,
    labelClass: styles.label_urgent_important,
    quadrantClass: styles.quadrant_urgent_important,
  },
  not_urgent_important: {
    label: "Schedule",
    hint: "Not Urgent & Important — where the quarter is won",
    dotClass: styles.dot_not_urgent_important,
    labelClass: styles.label_not_urgent_important,
    quadrantClass: styles.quadrant_not_urgent_important,
  },
  urgent_not_important: {
    label: "Delegate",
    hint: "Urgent & Not Important — beware false urgency",
    dotClass: styles.dot_urgent_not_important,
    labelClass: styles.label_urgent_not_important,
    quadrantClass: styles.quadrant_urgent_not_important,
  },
  not_urgent_not_important: {
    label: "Eliminate",
    hint: "Not Urgent & Not Important — stop spending here",
    dotClass: styles.dot_not_urgent_not_important,
    labelClass: styles.label_not_urgent_not_important,
    quadrantClass: styles.quadrant_not_urgent_not_important,
  },
};

interface Props {
  quadrant: Quadrant;
  actions: MatrixAction[];
  onDrop: (actionId: string, targetQuadrant: Quadrant) => void;
  onDone: (actionId: string) => void;
  onRemove: (actionId: string) => void;
  onEdit: (actionId: string, title: string) => void;
  onAdd: (title: string) => void;
  onDrilldown: (action: MatrixAction) => void;
}

const MatrixQuadrant: React.FC<Props> = ({
  quadrant,
  actions,
  onDrop,
  onDone,
  onRemove,
  onEdit,
  onAdd,
  onDrilldown,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [addText, setAddText] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const meta = QUADRANT_META[quadrant];
  const visible = actions.filter(a => a.status !== "removed");

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const actionId = e.dataTransfer.getData("actionId");
    if (actionId) onDrop(actionId, quadrant);
  };

  const startEdit = (action: MatrixAction) => {
    setEditingId(action.id);
    setEditValue(action.title);
  };

  const commitEdit = (actionId: string) => {
    if (editValue.trim()) onEdit(actionId, editValue.trim());
    setEditingId(null);
  };

  const handleAdd = () => {
    if (addText.trim()) {
      onAdd(addText.trim());
      setAddText("");
      setShowAdd(false);
    }
  };

  return (
    <div
      className={`${styles.quadrant} ${meta.quadrantClass} ${dragOver ? styles.dragOver : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <div className={styles.quadrantHeader}>
        <span className={`${styles.quadrantDot} ${meta.dotClass}`} />
        <span className={`${styles.quadrantTitle} ${meta.labelClass}`}>{meta.label}</span>
      </div>
      <div className={styles.quadrantHint}>{meta.hint}</div>

      <div className={styles.actionList}>
        {visible.map(action => {
          const isGoalLevel = !action.sourceMilestoneId && action.source === "ai";
          return (
          <div
            key={action.id}
            className={`${styles.actionCard} ${action.status === "done" ? styles.done : ""}`}
            draggable={action.status !== "done"}
            onDragStart={e => e.dataTransfer.setData("actionId", action.id)}
            onClick={isGoalLevel && action.status !== "done"
              ? (e) => { e.stopPropagation(); onDrilldown(action); }
              : undefined}
            style={isGoalLevel && action.status !== "done" ? { cursor: "pointer" } : undefined}
          >
            {editingId === action.id ? (
              <div style={{ flex: 1, minWidth: 0 }}>
                <input
                  className={styles.actionEditInput}
                  value={editValue}
                  autoFocus
                  onChange={e => setEditValue(e.target.value)}
                  onBlur={() => commitEdit(action.id)}
                  onKeyDown={e => {
                    if (e.key === "Enter") commitEdit(action.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                />
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <span className={styles.actionText}>{action.title}</span>
                  {isGoalLevel && action.status !== "done" && (
                    <span style={{ fontSize: "0.65rem", color: "#9C4B20", opacity: 0.7, flexShrink: 0 }}>›</span>
                  )}
                </div>
                {action.sourcePlanTitle && action.source === "ai" && action.sourceMilestoneId && (
                  <span className={styles.sourcePlanChip}>📌 {action.sourcePlanTitle}</span>
                )}
              </div>
            )}

            {action.effortMinutes > 0 && (
              <span className={styles.actionMeta}>{action.effortMinutes}m</span>
            )}

            <div className={styles.actionMenu}>
              {action.status !== "done" && (
                <button
                  className={styles.iconBtn}
                  title="Mark done"
                  onClick={() => onDone(action.id)}
                >
                  <CheckCircleIcon size={13} strokeWidth={2} />
                </button>
              )}
              {action.status !== "done" && (
                <button
                  className={styles.iconBtn}
                  title="Edit"
                  onClick={() => startEdit(action)}
                >
                  <EditIcon size={13} strokeWidth={2} />
                </button>
              )}
              <button
                className={styles.iconBtn}
                title="Remove"
                onClick={() => onRemove(action.id)}
              >
                <TrashIcon size={13} strokeWidth={2} />
              </button>
            </div>
          </div>
          );
        })}

        {showAdd ? (
          <div className={styles.addActionRow}>
            <input
              className={styles.addInput}
              placeholder="Action title…"
              value={addText}
              autoFocus
              onChange={e => setAddText(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") setShowAdd(false);
              }}
            />
            <button className={styles.addBtn} onClick={handleAdd}>Add</button>
          </div>
        ) : (
          <button
            className={styles.iconBtn}
            style={{ alignSelf: "flex-start", marginTop: "0.25rem" }}
            onClick={() => setShowAdd(true)}
            title="Add action"
          >
            <PlusIcon size={13} strokeWidth={2} /> add
          </button>
        )}
      </div>
    </div>
  );
};

export default MatrixQuadrant;
