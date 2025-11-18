'use client';
import React from 'react';
import styles from '../Styles/nudgeFormatter.module.css';

interface Props {
  text: string;
}

/**
 * NudgeFormatter
 *
 * Transforms LLM-generated nudge text into Gen Z-friendly, scannable format.
 *
 * Handles:
 * - **Bold text** → styled emphasis
 * - Line breaks → proper spacing
 * - Numbered lists → visual formatting
 * - Copy-paste templates → highlighted boxes
 */
export default function NudgeFormatter({ text }: Props) {
  // Split by double OR single line breaks to create paragraphs
  const paragraphs = text.split(/\n\n|\n/).filter(p => p.trim());

  console.log('NudgeFormatter received:', text);
  console.log('Paragraphs:', paragraphs);

  return (
    <div className={styles.nudgeContent}>
      {paragraphs.map((paragraph, index) => {
        // Check if it's a bullet point list item (starts with - or •)
        if (/^[-•]/.test(paragraph.trim())) {
          const match = paragraph.match(/^[-•]\s*(.+)/);
          if (match) {
            return (
              <div className={styles.bulletItem} key={index}>
                <span className={styles.bulletIcon}>→</span>
                <span>{formatInlineText(match[1])}</span>
              </div>
            );
          }
        }

        // Check if it's a numbered list item
        if (/^\d+\./.test(paragraph.trim())) {
          const match = paragraph.match(/^(\d+)\.\s*(.+)/);
          if (match) {
            return (
              <div className={styles.actionItem} key={index}>
                <span className={styles.actionNumber}>{match[1]}</span>
                <span>{formatInlineText(match[2])}</span>
              </div>
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
