"use client";

import { useEffect, useRef, ChangeEvent } from "react";

interface AutoExpandingTextareaProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  minRows?: number;
  disabled?: boolean;
  ariaLabel?: string;
}

/**
 * A textarea component that automatically expands its height based on content.
 * Follows modern UX patterns - expands fully with no scrollbars.
 *
 * @param value - The current text value
 * @param onChange - Callback fired when text changes
 * @param className - Optional CSS class for styling
 * @param placeholder - Placeholder text
 * @param minRows - Minimum number of visible rows (default: 1)
 * @param disabled - Whether the textarea is disabled
 * @param ariaLabel - Accessibility label
 */
export default function AutoExpandingTextarea({
  value,
  onChange,
  className = "",
  placeholder = "",
  minRows = 1,
  disabled = false,
  ariaLabel,
}: AutoExpandingTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize logic - expands to fit all content, no scrollbars
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to recalculate scrollHeight
    textarea.style.height = "0px";

    // Get computed styles
    const computedStyle = window.getComputedStyle(textarea);
    const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
    const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
    const borderTop = parseFloat(computedStyle.borderTopWidth) || 0;
    const borderBottom = parseFloat(computedStyle.borderBottomWidth) || 0;
    const lineHeight = parseFloat(computedStyle.lineHeight) || 24;

    // Calculate minimum height constraint
    const extraSpace = paddingTop + paddingBottom + borderTop + borderBottom;
    const minHeight = lineHeight * minRows + extraSpace;

    // Always expand to fit content (no max limit for full visibility)
    const contentHeight = textarea.scrollHeight;
    const newHeight = Math.max(contentHeight, minHeight);

    textarea.style.height = `${newHeight}px`;
    textarea.style.overflowY = "hidden"; // Never show scrollbar
  };

  // Adjust height on value change
  useEffect(() => {
    adjustHeight();
  }, [value]);

  // Adjust height on mount and window resize
  useEffect(() => {
    adjustHeight();
    window.addEventListener("resize", adjustHeight);
    return () => window.removeEventListener("resize", adjustHeight);
  }, []);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      className={className}
      placeholder={placeholder}
      disabled={disabled}
      aria-label={ariaLabel}
      rows={minRows}
      style={{
        resize: "none",
        minHeight: "auto",
        maxHeight: "none",
      }}
    />
  );
}
