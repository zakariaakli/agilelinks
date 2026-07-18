"use client";

import React, { useState } from "react";
import { MatrixPeriodType } from "../Models/PriorityMatrix";
import styles from "../Styles/priorityMatrix.module.css";

interface Props {
  current: MatrixPeriodType;
  onChange: (type: MatrixPeriodType, customStart?: string, customEnd?: string) => void;
  onRefresh: () => void;
  refreshing?: boolean;
}

const TYPES: { value: MatrixPeriodType; label: string }[] = [
  { value: "quarter", label: "Quarter" },
  { value: "month", label: "Month" },
  { value: "custom", label: "Custom" },
];

const MatrixPeriodSettings: React.FC<Props> = ({ current, onChange, onRefresh, refreshing }) => {
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const handleTypeClick = (type: MatrixPeriodType) => {
    if (type === "custom") {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    onChange(type);
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      onChange("custom", customStart, customEnd);
      setShowCustom(false);
    }
  };

  return (
    <div className={styles.periodSettings}>
      {TYPES.map(t => (
        <button
          key={t.value}
          className={`${styles.periodBtn} ${current === t.value ? styles.active : ""}`}
          onClick={() => handleTypeClick(t.value)}
        >
          {t.label}
        </button>
      ))}

      {showCustom && (
        <>
          <input
            type="date"
            value={customStart}
            onChange={e => setCustomStart(e.target.value)}
            style={{ fontSize: "0.8rem", padding: "0.3rem 0.5rem", borderRadius: 6, border: "1px solid rgba(0,0,0,0.15)" }}
          />
          <span style={{ fontSize: "0.8rem", color: "#8A8378" }}>→</span>
          <input
            type="date"
            value={customEnd}
            onChange={e => setCustomEnd(e.target.value)}
            style={{ fontSize: "0.8rem", padding: "0.3rem 0.5rem", borderRadius: 6, border: "1px solid rgba(0,0,0,0.15)" }}
          />
          <button className={styles.addBtn} onClick={handleCustomApply}>Apply</button>
        </>
      )}

      <button className={styles.refreshBtn} onClick={onRefresh} disabled={refreshing}>
        {refreshing ? "Refreshing…" : "↻ Refresh from goals"}
      </button>
    </div>
  );
};

export default MatrixPeriodSettings;
