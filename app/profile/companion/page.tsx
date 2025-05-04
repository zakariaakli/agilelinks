'use client';
import React from 'react';
import styles from '../../../Styles/companion.module.css';
import Link from 'next/link';

const CompanionPage = () => {
  const enneagramSummary = `
    You are a Type 4: The Individualist. You seek identity, authenticity, and deep connection. As a Type 4, you are emotionally honest, creative, and sensitive. You often feel different or misunderstood and long to express your uniqueness. Your strength lies in your ability to sit with emotional depth and turn it into insight, but you may struggle with envy, comparison, and moodiness when unbalanced.`;

  const userGoals = [
    'Improve emotional regulation',
    'Practice daily journaling',
    'Develop assertiveness',
  ];

  const reminder = '✨ Remember: As a Type 4, your sensitivity is your strength — embrace it with balance.';

  const pastConversation = `Last week, we discussed your tendency to withdraw during emotional stress and the importance of re-engaging through creative expression.`;

  const outcomes = [
    { step: 'Start journaling every evening', status: '✅ Completed' },
    { step: 'Identify emotional triggers', status: '🕓 In Progress' },
    { step: 'Reach out to a friend when feeling low', status: '❌ Not Started' },
  ];

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>🧠 Your AI Companion</h1>

      <div className={styles.section}>
        <h2 className={styles.subtitle}>Your Enneagram Summary</h2>
        <div className={styles.box}>{enneagramSummary}</div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.subtitle}>Your Personal Goals</h2>
        <ul className={styles.goalList}>
          {userGoals.map((goal, index) => (
            <li key={index} className={styles.goalItem}>✅ {goal}</li>
          ))}
        </ul>
      </div>

      <div className={styles.section}>
        <h2 className={styles.subtitle}>Last Week's Reflection</h2>
        <div className={styles.box}>{pastConversation}</div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.subtitle}>Agreed Next Steps</h2>
        <ul className={styles.goalList}>
          {outcomes.map((item, index) => (
            <li key={index} className={styles.goalItem}>{item.status} {item.step}</li>
          ))}
        </ul>
      </div>

      <div className={styles.section}>
        <h2 className={styles.subtitle}>Today’s Insight</h2>
        <div className={styles.reminderBox}>{reminder}</div>
      </div>

      <Link href="/profile" className={styles.backLink}>← Back to Profile</Link>
    </div>
  );
};

export default CompanionPage;
