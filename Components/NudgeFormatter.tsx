'use client';
import React, { useState } from 'react';
import styles from '../Styles/nudgeFormatter.module.css';
import { PlusIcon, CheckCircleIcon, LoaderIcon } from './Icons';

interface Props {
  text: string;
  onAddStep?: (stepText: string) => Promise<void>;
  addedSteps?: Set<string>;
}

/**
 * NudgeFormatter
 *
 * Transforms LLM-generated nudge text into Gen Z-friendly, scannable format.
 *
 * Handles:
 * - **Bold text** → styled emphasis
 * - Line breaks → proper spacing
 * - Numbered lists → visual formatting with optional "Add" buttons
 * - Bullet lists → visual formatting with optional "Add" buttons
 * - Copy-paste templates → highlighted boxes
 */
export default function NudgeFormatter({ text, onAddStep, addedSteps = new Set() }: Props) {
  // Strip [SUGGESTED_STEP: ...] tag if present (fallback for older notifications)
  const cleanedText = text.replace(/\[SUGGESTED_STEP:\s*.+?\]/g, '').trim();

  // Split by double OR single line breaks to create paragraphs
  const paragraphs = cleanedText.split(/\n\n|\n/).filter(p => p.trim());

  return (
    <div className={styles.nudgeContent}>
      {paragraphs.map((paragraph, index) => {
        // Check if it's a bullet point list item (starts with - or •)
        if (/^[-•]/.test(paragraph.trim())) {
          const match = paragraph.match(/^[-•]\s*(.+)/);
          if (match) {
            const actionText = match[1].replace(/\*\*/g, '').trim();
            return (
              <ActionItemWithAdd
                key={index}
                actionText={actionText}
                displayContent={formatInlineText(match[1])}
                icon="→"
                isBullet={true}
                onAddStep={onAddStep}
                isAdded={addedSteps.has(actionText)}
              />
            );
          }
        }

        // Check if it's a numbered list item
        if (/^\d+\./.test(paragraph.trim())) {
          const match = paragraph.match(/^(\d+)\.\s*(.+)/);
          if (match) {
            const actionText = match[2].replace(/\*\*/g, '').trim();
            return (
              <ActionItemWithAdd
                key={index}
                actionText={actionText}
                displayContent={formatInlineText(match[2])}
                icon={match[1]}
                isBullet={false}
                onAddStep={onAddStep}
                isAdded={addedSteps.has(actionText)}
              />
            );
          }
        }

        // Check if it's a copyable template (text in quotes or after "Copy this:")
        if (paragraph.includes('Copy this:') || /^["'].+["']$/.test(paragraph.trim())) {
          const templateText = paragraph.replace(/Copy this:\s*/i, '').replace(/^["']|["']$/g, '');
          return (
            <div className={styles.copyableTemplate} key={index}>
              <div className={styles.copyLabel}>📋 Copy & paste this:</div>
              <div className={styles.templateText}>{templateText}</div>
            </div>
          );
        }

        // Check if it starts with ** (bold emphasis block)
        if (paragraph.trim().startsWith('**') && paragraph.trim().endsWith('**')) {
          const boldText = paragraph.replace(/^\*\*|\*\*$/g, '');
          return (
            <div className={styles.emphasisBlock} key={index}>
              {formatInlineText(boldText)}
            </div>
          );
        }

        // Regular paragraph with inline formatting
        return (
          <p className={styles.paragraph} key={index}>
            {formatInlineText(paragraph)}
          </p>
        );
      })}
    </div>
  );
}

/**
 * ActionItemWithAdd - Renders an action item with an optional "Add as commitment" button
 */
interface ActionItemWithAddProps {
  actionText: string;
  displayContent: React.ReactNode;
  icon: string;
  isBullet: boolean;
  onAddStep?: (stepText: string) => Promise<void>;
  isAdded: boolean;
}

function ActionItemWithAdd({
  actionText,
  displayContent,
  icon,
  isBullet,
  onAddStep,
  isAdded
}: ActionItemWithAddProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleAdd = async () => {
    if (!onAddStep || isAdding || isAdded || justAdded) return;
    setIsAdding(true);
    try {
      await onAddStep(actionText);
      setJustAdded(true);
    } catch (error) {
      console.error('Error adding step:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const showAdded = isAdded || justAdded;

  // Mobile: icon-only small button | Desktop: icon + text
  const buttonContent = isAdding ? (
    <span style={{ animation: 'spin 1s linear infinite', display: 'inline-flex' }}>
      <LoaderIcon size={isMobile ? 14 : 14} />
    </span>
  ) : showAdded ? (
    <>
      <CheckCircleIcon size={isMobile ? 14 : 14} />
      {!isMobile && <span>Added</span>}
    </>
  ) : (
    <>
      <PlusIcon size={isMobile ? 14 : 14} />
      {!isMobile && <span>Add</span>}
    </>
  );

  const buttonStyle: React.CSSProperties = {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: isMobile ? 0 : '0.25rem',
    padding: isMobile ? '0.375rem' : '0.375rem 0.75rem',
    background: showAdded ? '#EEF5EF' : '#FDF0E7',
    border: showAdded ? '1px solid #8FBC96' : '1px solid #F0C4A0',
    borderRadius: isMobile ? '0.375rem' : '0.5rem',
    color: showAdded ? '#274F30' : '#9C4B20',
    fontSize: '0.8125rem',
    fontWeight: 500,
    cursor: showAdded ? 'default' : 'pointer',
    transition: 'all 0.15s ease',
    minWidth: isMobile ? '32px' : 'auto',
    minHeight: isMobile ? '32px' : 'auto',
  };

  if (isBullet) {
    return (
      <div className={styles.bulletItem}>
        <span className={styles.bulletIcon}>{icon}</span>
        <span style={{ flex: 1 }}>{displayContent}</span>
        {onAddStep && (
          <button
            onClick={handleAdd}
            disabled={isAdding || showAdded}
            title={showAdded ? "Added to your commitments" : "Add as commitment"}
            style={{ ...buttonStyle, marginLeft: '0.5rem' }}
          >
            {buttonContent}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.actionItem}>
      <span className={styles.actionNumber}>{icon}</span>
      <span style={{ flex: 1 }}>{displayContent}</span>
      {onAddStep && (
        <button
          onClick={handleAdd}
          disabled={isAdding || showAdded}
          title={showAdded ? "Added to your commitments" : "Add as commitment"}
          style={buttonStyle}
        >
          {buttonContent}
        </button>
      )}
    </div>
  );
}

/**
 * Format inline markdown-style text:
 * - **bold text** → <strong>
 */
function formatInlineText(text: string): React.ReactNode {
  // Split by **text** pattern
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return (
    <>
      {parts.map((part, index) => {
        // Check if this part is bold (wrapped in **)
        if (part.startsWith('**') && part.endsWith('**')) {
          const boldText = part.slice(2, -2); // Remove ** from both ends
          return <strong key={index}>{boldText}</strong>;
        }
        // Return text in a fragment to ensure it renders
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </>
  );
}
