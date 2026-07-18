"use client";

import React from "react";
import { MatrixAction, Quadrant } from "../Models/PriorityMatrix";
import MatrixQuadrant from "./MatrixQuadrant";
import styles from "../Styles/priorityMatrix.module.css";

const QUADRANTS: Quadrant[] = [
  "urgent_important",
  "not_urgent_important",
  "urgent_not_important",
  "not_urgent_not_important",
];

interface Props {
  actions: MatrixAction[];
  onMove: (actionId: string, quadrant: Quadrant) => void;
  onDone: (actionId: string) => void;
  onRemove: (actionId: string) => void;
  onEdit: (actionId: string, title: string) => void;
  onAdd: (quadrant: Quadrant, title: string) => void;
  onDrilldown: (action: MatrixAction) => void;
}

const PriorityMatrixBoard: React.FC<Props> = ({
  actions,
  onMove,
  onDone,
  onRemove,
  onEdit,
  onAdd,
  onDrilldown,
}) => {
  return (
    <>
      {/* Axis labels */}
      <div className={styles.axisRow}>
        <div className={styles.axisLabel}>⚡ Urgent</div>
        <div className={styles.axisLabel}>— Not Urgent</div>
      </div>

      <div className={styles.board}>
        {QUADRANTS.map(q => (
          <MatrixQuadrant
            key={q}
            quadrant={q}
            actions={actions.filter(a => a.quadrant === q)}
            onDrop={onMove}
            onDone={onDone}
            onRemove={onRemove}
            onEdit={onEdit}
            onAdd={title => onAdd(q, title)}
            onDrilldown={onDrilldown}
          />
        ))}
      </div>
    </>
  );
};

export default PriorityMatrixBoard;
