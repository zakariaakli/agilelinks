"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "../Styles/milestoneEditor.module.css";
import { XIcon } from "./Icons";

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

interface MilestoneEditorModalProps {
  milestone: Milestone;
  milestoneNumber: number;
  totalMilestones: number;
  isOpen: boolean;
  onClose: () => void;
  onSave: (milestone: Milestone) => void;
  onDelete: (milestoneId: string) => void;
}

const MilestoneEditorModal: React.FC<MilestoneEditorModalProps> = ({
  milestone,
  milestoneNumber,
  totalMilestones,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [editedMilestone, setEditedMilestone] = useState<Milestone>(milestone);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [titleError, setTitleError] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Update local state when prop changes
  useEffect(() => {
    setEditedMilestone(milestone);
    setTitleError("");
  }, [milestone]);

  // Auto-focus title input when modal opens
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Auto-expand textarea
  useEffect(() => {
    if (descriptionRef.current) {
      descriptionRef.current.style.height = "auto";
      descriptionRef.current.style.height = `${descriptionRef.current.scrollHeight}px`;
    }
  }, [editedMilestone.description]);

  const handleTitleChange = (value: string) => {
    setEditedMilestone({ ...editedMilestone, title: value });
    if (value.trim()) {
      setTitleError("");
    }
  };

  const handleDescriptionChange = (value: string) => {
    setEditedMilestone({ ...editedMilestone, description: value });
  };

  const handleSave = () => {
    if (!editedMilestone.title.trim()) {
      setTitleError("Title is required");
      titleInputRef.current?.focus();
      return;
    }

    onSave(editedMilestone);
    onClose();
  };

  const handleDelete = () => {
    onDelete(milestone.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleCancel = () => {
    setEditedMilestone(milestone);
    setTitleError("");
    setShowDeleteConfirm(false);
    onClose();
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className={styles.modalBackdrop} onClick={handleCancel} />

      {/* Modal */}
      <div className={styles.modalContainer}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderContent}>
            <h2 className={styles.modalTitle}>
              Editing Milestone {milestoneNumber}
            </h2>
            <p className={styles.modalSubtitle}>
              Milestone {milestoneNumber} of {totalMilestones}
            </p>
          </div>
          <button
            onClick={handleCancel}
            className={styles.closeButton}
            aria-label="Close modal"
          >
            <XIcon size={24} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.modalContent}>
          {/* Title Field */}
          <div className={styles.fieldGroup}>
            <label htmlFor="milestone-title" className={styles.fieldLabel}>
              Milestone Title
              <span className={styles.required}>*</span>
            </label>
            <input
              ref={titleInputRef}
              id="milestone-title"
              type="text"
              value={editedMilestone.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className={`${styles.titleInput} ${titleError ? styles.inputError : ""}`}
              placeholder="Enter a clear, specific milestone title"
              maxLength={100}
            />
            <div className={styles.fieldFooter}>
              {titleError ? (
                <span className={styles.errorText}>{titleError}</span>
              ) : (
                <span className={styles.hint}>
                  Make it specific and measurable
                </span>
              )}
              <span className={styles.charCount}>
                {editedMilestone.title.length}/100
              </span>
            </div>
          </div>

          {/* Description Field */}
          <div className={styles.fieldGroup}>
            <label
              htmlFor="milestone-description"
              className={styles.fieldLabel}
            >
              Description
            </label>
            <textarea
              ref={descriptionRef}
              id="milestone-description"
              value={editedMilestone.description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              className={styles.descriptionInput}
              placeholder="Describe what needs to be accomplished and any important details..."
              maxLength={500}
              rows={4}
            />
            <div className={styles.fieldFooter}>
              <span className={styles.hint}>
                Include key actions and expected outcomes
              </span>
              <span className={styles.charCount}>
                {editedMilestone.description.length}/500
              </span>
            </div>
          </div>

          {/* Date Fields */}
          <div className={styles.dateFieldsContainer}>
            <div className={styles.fieldGroup}>
              <label htmlFor="milestone-start-date" className={styles.fieldLabel}>
                Start Date
              </label>
              <input
                id="milestone-start-date"
                type="date"
                value={editedMilestone.startDate}
                onChange={(e) =>
                  setEditedMilestone({
                    ...editedMilestone,
                    startDate: e.target.value,
                  })
                }
                className={styles.dateInput}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="milestone-due-date" className={styles.fieldLabel}>
                Due Date
              </label>
              <input
                id="milestone-due-date"
                type="date"
                value={editedMilestone.dueDate}
                onChange={(e) =>
                  setEditedMilestone({
                    ...editedMilestone,
                    dueDate: e.target.value,
                  })
                }
                className={styles.dateInput}
              />
            </div>
          </div>

          {/* Personality Tips (Read-only) */}
          {(editedMilestone.blindSpotTip || editedMilestone.strengthHook) && (
            <div className={styles.personalityTips}>
              {editedMilestone.blindSpotTip && (
                <div className={styles.tipCard}>
                  <div className={styles.tipHeader}>
                    <span className={styles.tipIcon}>⚠️</span>
                    <span className={styles.tipTitle}>Blind Spot Alert</span>
                  </div>
                  <p className={styles.tipText}>{editedMilestone.blindSpotTip}</p>
                </div>
              )}

              {editedMilestone.strengthHook && (
                <div className={styles.tipCard}>
                  <div className={styles.tipHeader}>
                    <span className={styles.tipIcon}>💪</span>
                    <span className={styles.tipTitle}>Leverage Your Strength</span>
                  </div>
                  <p className={styles.tipText}>{editedMilestone.strengthHook}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className={styles.modalActions}>
          {showDeleteConfirm ? (
            <div className={styles.deleteConfirmContainer}>
              <p className={styles.deleteConfirmText}>
                Delete this milestone? This cannot be undone.
              </p>
              <div className={styles.deleteConfirmButtons}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className={styles.cancelDeleteButton}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className={styles.confirmDeleteButton}
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className={styles.deleteButton}
              >
                Delete
              </button>
              <div className={styles.actionButtonGroup}>
                <button onClick={handleCancel} className={styles.cancelButton}>
                  Cancel
                </button>
                <button onClick={handleSave} className={styles.saveButton}>
                  Save Changes
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default MilestoneEditorModal;
