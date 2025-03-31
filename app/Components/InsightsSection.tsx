import React from 'react';
import styles from '../Styles/insightsSection.module.css'; // Import CSS module

const mockInsights = [
  { title: "Digital Marketing Trends in 2025", type: "INSIGHTS" },
  { title: "PR. Valentina Pitardi: 'People Would Rather Obey A Sign Than A Robot'", type: "INSIGHTS" },
  { title: "Démarrer en Start-ups, Une Alternative Crédible Aux Grands Groupes ?", type: "INITIATIVES" },
];

const InsightsSection = () => {
  return (
    <div className={styles.insightsSection}>
      <h3 className={styles.heading}>Read also</h3>
      <ul className={styles.insightsList}>
        {mockInsights.map((insight, index) => (
          <li key={index} className={styles.insightItem}>
            <a href="#" className={styles.insightTitle}>{insight.title}</a>
            <span className={styles.insightType}>{insight.type}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InsightsSection;
