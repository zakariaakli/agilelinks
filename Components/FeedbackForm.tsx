'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Form, FormGroup, RadioGroup, RadioOption, Textarea, FormButton, Field } from './Form';
import { CheckCircleIcon } from './Icons';
import Toast, { ToastType } from './Toast';
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
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const router = useRouter();

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!feedback) {
      showToast('Please select a feedback option first', 'warning');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Submitting feedback:', { feedback, note, notifId });

      const notificationRef = doc(db, 'notifications', notifId);
      const feedbackText = note ? `${feedback} | Note: ${note}` : feedback;

      await updateDoc(notificationRef, {
        feedback: feedbackText,
        read: true,
      });

      console.log('Feedback saved successfully');
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showToast('An error occurred. Please try again.', 'error');
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
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <CheckCircleIcon size={48} color="var(--color-success-500)" />
        </div>
        <h2>Thanks for your previous feedback!</h2>
        <p>You already shared your thoughts on this nudge.</p>
        <div style={{ 
          marginTop: '1rem', 
          padding: '0.75rem', 
          background: 'var(--color-neutral-50)', 
          borderRadius: 'var(--border-radius-lg)',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-primary)'
        }}>
          <strong>Your feedback:</strong> {existingFeedback}
        </div>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginTop: '1rem' }}>
          <a href="/profile" style={{ color: 'var(--color-primary-500)', textDecoration: 'none' }}>
            ← Back to Profile
          </a>
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className={styles.thankYou}>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <CheckCircleIcon size={48} color="var(--color-success-500)" />
        </div>
        <h2>Thank you for your feedback!</h2>
        <p>Your response helps us improve your experience.</p>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginTop: '1rem' }}>
          Redirecting to your profile in 2 seconds...
        </p>
      </div>
    );
  }

  return (
    <div className={styles.feedbackBox}>
      <Form onSubmit={handleSubmit}>
        <Field 
          label="How was this nudge for you?"
          helperText="Please choose one option to help us improve your experience"
        >
          <RadioGroup
            name="feedback"
            value={feedback}
            onChange={setFeedback}
          >
            {feedbackOptions.map((label) => (
              <RadioOption key={label} value={label}>
                {label}
              </RadioOption>
            ))}
          </RadioGroup>
        </Field>

        {feedback && (
          <Field
            label="Want to tell us more? (Optional)"
            helperText="Share any additional thoughts or suggestions..."
          >
            <Textarea
              placeholder="Your additional feedback..."
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              name="note"
            />
          </Field>
        )}

        {feedback && (
          <FormButton 
            type="button"
            onClick={handleSubmit}
            loading={isLoading}
            variant="primary"
            fullWidth
          >
            {isLoading ? 'Sending...' : 'Send Feedback'}
          </FormButton>
        )}
      </Form>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
