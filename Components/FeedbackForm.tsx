'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../Styles/nudge.module.css';

interface Props {
  notifId: string;
  existingFeedback?: string | null;
}

const feedbackOptions = [
  'I like this nudge',
  'You can do better next time',
  'I really do not relate to that'
];

export default function FeedbackForm({ notifId, existingFeedback }: Props) {
  const [feedback, setFeedback] = useState('');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback) {
      alert('Please select a feedback option first.');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('feedback', feedback);
      formData.append('note', note);

      console.log('Sending feedback:', { feedback, note, notifId });

      const res = await fetch(`/api/feedback?id=${notifId}`, {
        method: 'POST',
        body: formData
      });

      console.log('Response status:', res.status);
      const responseData = await res.json();
      console.log('Response data:', responseData);

      if (res.ok) {
        setSubmitted(true);
      } else {
        console.error('Failed to submit feedback:', responseData);
        alert('Failed to submit feedback. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect to profile after showing thank you message
  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        router.push('/profile');
      }, 2000); // Wait 2 seconds before redirecting

      return () => clearTimeout(timer);
    }
  }, [submitted, router]);

  // If feedback already exists, show thank you message
  if (existingFeedback) {
    return (
      <div className={styles.thankYou}>
        <h2>✅ Thanks for your previous feedback!</h2>
        <p>You already shared your thoughts on this nudge.</p>
        <div style={{ 
          marginTop: '1rem', 
          padding: '0.75rem', 
          background: '#f8fafc', 
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          color: '#374151'
        }}>
          <strong>Your feedback:</strong> {existingFeedback}
        </div>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '1rem' }}>
          <a href="/profile" style={{ color: '#6366f1', textDecoration: 'none' }}>
            ← Back to Profile
          </a>
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className={styles.thankYou}>
        <h2>🎉 Thank you for your feedback!</h2>
        <p>Your response helps us improve your experience.</p>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '1rem' }}>
          Redirecting to your profile in 2 seconds...
        </p>
      </div>
    );
  }

  return (
    <div className={styles.feedbackBox}>
      <div className={styles.feedbackSection}>
        <p className={styles.feedbackTitle}>How was this nudge for you?</p>
        <p style={{ 
          fontSize: '0.875rem', 
          color: '#6b7280', 
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          Please choose one option to help us improve your experience
        </p>
        
        <div className={styles.buttonsGroup}>
          {feedbackOptions.map((label, idx) => (
            <button
              key={idx}
              type="button"
              value={label}
              onClick={() => setFeedback(label)}
              className={`${styles[`btn${idx + 1}`]} ${feedback === label ? styles.selected : ''}`}
              style={feedback === label ? { 
                opacity: 1, 
                transform: 'scale(1.05)',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' 
              } : {}}
            >
              {feedback === label && '✓ '}{label}
            </button>
          ))}
        </div>

        {!feedback && (
          <p style={{ 
            fontSize: '0.875rem', 
            color: '#ef4444', 
            marginTop: '0.5rem',
            textAlign: 'center',
            fontWeight: '500'
          }}>
            👆 Please select one of the options above
          </p>
        )}
      </div>

      {feedback && (
        <div style={{ 
          marginTop: '1.5rem',
          padding: '1rem',
          background: '#f0f9ff',
          borderRadius: '0.5rem',
          border: '1px solid #e0f2fe'
        }}>
          <p style={{ 
            fontSize: '0.875rem', 
            color: '#0369a1', 
            marginBottom: '0.75rem',
            fontWeight: '500'
          }}>
            Want to tell us more? (Optional)
          </p>
          <textarea
            placeholder="Share any additional thoughts or suggestions..."
            className={styles.textarea}
            rows={3}
            value={note}
            onChange={e => setNote(e.target.value)}
            name="note"
            style={{ marginBottom: '1rem' }}
          />
          
          <button 
            onClick={handleSubmit}
            className={styles.btnSubmit} 
            disabled={isLoading}
            style={{ width: '100%' }}
          >
            {isLoading ? '✉️ Sending...' : '📤 Send Feedback'}
          </button>
        </div>
      )}
    </div>
  );
}
