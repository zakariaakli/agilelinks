"use client";

import React from "react";
import { TrajectoryResult } from "../lib/matrixTrajectory";
import styles from "../Styles/priorityMatrix.module.css";

interface Props {
  trajectory: TrajectoryResult;
  periodLabel: string;
}

const STATUS_LABELS: Record<string, string> = {
  on_track: "On Track",
  at_risk: "At Risk",
  off_track: "Off Track",
};

const QuarterTrajectory: React.FC<Props> = ({ trajectory, periodLabel }) => {
  const { status, completionRatio, timeRatio, daysLeft, totalImportant, doneImportant, insight } =
    trajectory;

  const fillPct = Math.round(completionRatio * 100);
  const timePct = Math.round(timeRatio * 100);

  return (
    <div className={styles.trajectory}>
      <div className={styles.trajectoryTitle}>Trajectory — {periodLabel}</div>

      {/* Completion bar */}
      <div className={styles.trajectoryBar}>
        <div
          className={`${styles.trajectoryFill} ${styles[`fill_${status}`]}`}
          style={{ width: `${fillPct}%` }}
        />
      </div>

      {/* Time marker line (thin overlay rendered via inline style) */}
      <div style={{ position: "relative", height: 0 }}>
        <div
          style={{
            position: "absolute",
            left: `${timePct}%`,
            top: -13,
            width: 2,
            height: 10,
            background: "rgba(0,0,0,0.25)",
            borderRadius: 1,
            transform: "translateX(-50%)",
          }}
          title={`${timePct}% of period elapsed`}
        />
      </div>

      <div className={styles.trajectoryStatus}>
        <span>
          {doneImportant}/{totalImportant} important actions done ({fillPct}%)
        </span>
        <span className={`${styles.statusBadge} ${styles[`badge_${status}`]}`}>
          {STATUS_LABELS[status]}
        </span>
        <span>{daysLeft}d left</span>
      </div>

      <div className={styles.trajectoryInsight}>{insight}</div>
    </div>
  );
};

export default QuarterTrajectory;
