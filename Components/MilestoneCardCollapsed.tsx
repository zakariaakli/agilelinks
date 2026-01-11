"use client";
import React from "react";
import styles from "../Styles/milestoneEditor.module.css";
import { EditIcon, TrashIcon } from "./Icons";

interface Milestone {
  id: string;
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  completed: boolean;
  blindSpotTip?: string;
  strengthHook?: string;
  measurableOutcome?: string;
}

interface MilestoneCardCollapsedProps {
  milestone: Milestone;
  milestoneNumber: number;
  onEdit: () => void;
  onDelete: () => void;
  isDragging?: boolean;
  dragHandleProps?: any;
}

const MilestoneCardCollapsed: React.FC<MilestoneCardCollapsedProps> = ({
  milestone,
  milestoneNumber,
  onEdit,
  onDelete,
  isDragging,
  dragHandleProps,
}) => {
  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div
      className={`${styles.milestoneCardCollapsed} ${isDragging ? styles.dragging : ""}`}
      onClick={onEdit}
    >
      {/* Left: Number Badge */}
      <div className={styles.milestoneBadge}>
        <span className={styles.milestoneNumber}>{milestoneNumber}</span>
      </div>

      {/* Middle: Content */}
      <div className={styles.milestoneCardContent}>
        <h3 className={styles.milestoneCardTitle}>
          {truncateText(milestone.title || "Untitled Milestone")}
        </h3>
        {milestone.description && (
          <p className={styles.milestoneCardPreview}>
            {truncateText(milestone.description, 80)}
          </p>
        )}
        {milestone.dueDate && (
          <div className={styles.milestoneCardMeta}>
            <span className={styles.metaLabel}>Due:</span>
            <span className={styles.metaValue}>
              {new Date(milestone.dueDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className={styles.milestoneCardActions}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className={styles.iconButton}
          aria-label="Edit milestone"
        >
          <EditIcon size={20} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className={`${styles.iconButton} ${styles.iconButtonDanger}`}
          aria-label="Delete milestone"
        >
          <TrashIcon size={20} />
        </button>
      </div>

      {/* Drag Handle (Optional) */}
      {dragHandleProps && (
        <div {...dragHandleProps} className={styles.dragHandle}>
          <span className={styles.dragIcon}>☰</span>
        </div>
      )}
    </div>
  );
};

export default MilestoneCardCollapsed;
