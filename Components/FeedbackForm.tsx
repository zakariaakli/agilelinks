'use client';
import { useState } from 'react';
import styles from '../Styles/nudge.module.css';

interface Props {
  notifId: string;
}

const feedbackOptions = [
  'I like this nudge',
  'You can do better next time',
  'I really do not relate to that'
];

export default function FeedbackForm({ notifId }: Props) {
  const [feedback, setFeedback] = useState('');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('feedback', feedback);
    formData.append('note', note);

    const res = await fetch(`/api/feedback?id=${notifId}`, {
      method: 'POST',
      body: formData
    });

    if (res.ok) setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className={styles.thankYou}>
        <h2>🎉 Thank you!</h2>
        <p>Your response helps us improve your experience.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.feedbackBox}>
      <p className={styles.feedbackTitle}>Was this helpful?</p>
      <div className={styles.buttonsGroup}>
        {feedbackOptions.map((label, idx) => (
          <button
            key={idx}
            type="button"
            value={label}
            onClick={() => setFeedback(label)}
            className={styles[`btn${idx + 1}`]}
          >
            {label}
          </button>
        ))}
      </div>

      <textarea
        placeholder="Want to add something more?"
        className={styles.textarea}
        rows={3}
        value={note}
        onChange={e => setNote(e.target.value)}
        name="note"
      />

      <button type="submit" className={styles.btnSubmit} disabled={!feedback}>
        Send Feedback
      </button>
    </form>
  );
}
