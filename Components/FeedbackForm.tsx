'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Form, FormGroup, RadioGroup, RadioOption, Textarea, FormButton, Field } from './Form';
import { CheckCircleIcon } from './Icons';
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
    </div>
  );
}
