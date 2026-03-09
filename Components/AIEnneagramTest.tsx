'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { EnneagramResult } from '../Models/EnneagramResult';
import styles from '../Styles/enneagramTest.module.css';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type Phase = 'intro' | 'chat' | 'scoring' | 'results';

const TYPE_NAMES: { [key: number]: string } = {
  1: 'The Perfectionist',
  2: 'The Helper',
  3: 'The Achiever',
  4: 'The Individualist',
  5: 'The Investigator',
  6: 'The Loyalist',
  7: 'The Enthusiast',
  8: 'The Challenger',
  9: 'The Peacemaker',
};

const INITIAL_GREETING =
  "Welcome. I'm here to help you explore your Enneagram type through a conversation — not a quiz. There are no right or wrong answers; I'll simply ask you about how you naturally experience and navigate life.\n\nTo start: think of a time when you were under real pressure — something important was at stake. What was your first impulse? What happened inside you?";

const TARGET_TURNS = 14;
const RESULTS_UNLOCK_TURN = 10;

export default function AIEnneagramTest() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('intro');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [result, setResult] = useState<(EnneagramResult & { dominantType?: number; coachNote?: string }) | null>(null);
  const [leadEmail, setLeadEmail] = useState('');
  const [leadCaptureVisible, setLeadCaptureVisible] = useState(false);
  const [leadSaving, setLeadSaving] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleBegin = () => {
    setMessages([{ role: 'assistant', content: INITIAL_GREETING }]);
    setPhase('chat');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: inputValue.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    const newTurnCount = turnCount + 1;
    setTurnCount(newTurnCount);

    try {
      const response = await fetch('/api/chatbot/enneagram-assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          turnCount: newTurnCount,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "I'm sorry, there was a connection issue. Please try sending your message again.",
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const handleGetResults = async () => {
    setPhase('scoring');

    try {
      const response = await fetch('/api/chatbot/enneagram-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: messages }),
      });

      if (!response.ok) throw new Error('Scoring failed');

      const data = await response.json();

      // Persist to localStorage so Auth.tsx picks it up at signup
      const enneagramResult: EnneagramResult = {
        enneagramType1: data.enneagramType1,
        enneagramType2: data.enneagramType2,
        enneagramType3: data.enneagramType3,
        enneagramType4: data.enneagramType4,
        enneagramType5: data.enneagramType5,
        enneagramType6: data.enneagramType6,
        enneagramType7: data.enneagramType7,
        enneagramType8: data.enneagramType8,
        enneagramType9: data.enneagramType9,
        summary: data.summary,
        coreMotivation: data.coreMotivation,
        keyStrengths: data.keyStrengths,
        growthAreas: data.growthAreas,
        blindSpots: data.blindSpots,
      };
      localStorage.setItem('userTestResult', JSON.stringify(enneagramResult));

      setResult({ ...enneagramResult, dominantType: data.dominantType, coachNote: data.coachNote });
      setPhase('results');
    } catch {
      // Fall back to chat phase if scoring fails
      setPhase('chat');
    }
  };

  const handleBookSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadEmail.trim() || !result) return;
    setLeadSaving(true);
    try {
      await addDoc(collection(db, 'leads'), {
        email: leadEmail.trim(),
        enneagramResult: result,
        dominantType: result.dominantType ?? null,
        source: 'enneagram-test',
        createdAt: serverTimestamp(),
      });
      // Also persist locally so Auth.tsx picks it up if they sign up later
      localStorage.setItem('userTestResult', JSON.stringify(result));
      setLeadSaved(true);
      const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL;
      if (calendlyUrl) {
        const url = `${calendlyUrl}?email=${encodeURIComponent(leadEmail.trim())}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch {
      // Still open Calendly even if save fails
      const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL;
      if (calendlyUrl) window.open(calendlyUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setLeadSaving(false);
    }
  };

  const progress = Math.min((turnCount / TARGET_TURNS) * 100, 100);
  const canViewResults = turnCount >= RESULTS_UNLOCK_TURN;

  const radarData = result
    ? {
        labels: [
          'Perfectionist',
          'Helper',
          'Achiever',
          'Individualist',
          'Investigator',
          'Loyalist',
          'Enthusiast',
          'Challenger',
          'Peacemaker',
        ],
        datasets: [
          {
            label: 'Your profile',
            backgroundColor: 'rgba(156, 75, 32, 0.12)',
            borderColor: '#9C4B20',
            pointBackgroundColor: '#9C4B20',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#C68B2C',
            data: [
              result.enneagramType1,
              result.enneagramType2,
              result.enneagramType3,
              result.enneagramType4,
              result.enneagramType5,
              result.enneagramType6,
              result.enneagramType7,
              result.enneagramType8,
              result.enneagramType9,
            ],
          },
        ],
      }
    : null;

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 20,
        ticks: { stepSize: 5, backdropColor: 'transparent', color: '#9CA3AF', font: { size: 10 } },
        angleLines: { color: '#E8E0D6', lineWidth: 1 },
        grid: { color: '#E8E0D6', circular: true },
        pointLabels: { color: '#4b5563', font: { size: 11 } },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { raw: unknown }) => ` Score: ${ctx.raw}`,
        },
      },
    },
  };

  // ── Intro phase ──────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className={styles.container}>
        <div className={styles.introCard}>
          <div className={styles.introIcon}>🔮</div>
          <h1 className={styles.introTitle}>Discover Your Enneagram Type</h1>
          <p className={styles.introSubtitle}>
            A 10–12 minute AI conversation that explores your core motivations — not just your
            behaviors.
          </p>
          <ul className={styles.introBullets}>
            <li>
              <span className={styles.bulletIcon}>💬</span>
              Natural conversation — one question at a time, no jargon
            </li>
            <li>
              <span className={styles.bulletIcon}>🎯</span>
              Focuses on WHY you do things, not just what you do
            </li>
            <li>
              <span className={styles.bulletIcon}>📊</span>
              Ends with a radar diagram showing all 9 types with your scores
            </li>
            <li>
              <span className={styles.bulletIcon}>🌱</span>
              Designed to give your coach a starting point — a hypothesis to explore together
            </li>
          </ul>

          {/* Preparation tips */}
          <div className={styles.prepSection}>
            <div className={styles.prepSectionTitle}>Before you begin — how to get the most out of this</div>
            <ul className={styles.prepTips}>
              <li>
                <span>🧠</span>
                <span><strong>Answer from your gut, not your ideal self.</strong> The AI is looking for your natural, automatic patterns — not who you aspire to be.</span>
              </li>
              <li>
                <span>⏸️</span>
                <span><strong>Take time to reflect before answering.</strong> There is no rush. A thoughtful, honest answer is far more valuable than a quick one.</span>
              </li>
              <li>
                <span>🔍</span>
                <span><strong>Go beneath the surface.</strong> When you share a situation, try to describe what was happening <em>inside</em> you — the impulse, the feeling, the fear — not just what you did.</span>
              </li>
              <li>
                <span>🚫</span>
                <span><strong>Avoid the "good person" answers.</strong> The most revealing responses are often the ones that feel slightly uncomfortable to admit.</span>
              </li>
            </ul>
          </div>

          {/* Provisional disclaimer */}
          <div className={styles.disclaimerBanner}>
            <span className={styles.disclaimerIcon}>🌱</span>
            <p className={styles.disclaimerText}>
              <strong>This is a first hypothesis, not a verdict.</strong> The results you receive are a starting point — a map for your coach to explore with you, not a fixed label. Your type will be validated and refined through coaching conversation.
            </p>
          </div>

          <button className={styles.beginButton} onClick={handleBegin} style={{ marginTop: '1.75rem' }}>
            I&apos;m ready — begin the conversation →
          </button>
        </div>
      </div>
    );
  }

  // ── Scoring phase ─────────────────────────────────────────────────────────
  if (phase === 'scoring') {
    return (
      <div className={styles.container}>
        <div className={styles.scoringOverlay}>
          <div className={styles.scoringSpinner} />
          <p className={styles.scoringLabel}>
            Analyzing your conversation and computing your Enneagram profile…
          </p>
        </div>
      </div>
    );
  }

  // ── Results phase ─────────────────────────────────────────────────────────
  if (phase === 'results' && result && radarData) {
    const dominantType = result.dominantType ?? 1;
    const typeName = TYPE_NAMES[dominantType];

    return (
      <div className={styles.container}>
        <div className={styles.resultsWrapper}>
          <div className={styles.resultsHeader}>
            <h2 className={styles.resultsTitle}>Your Enneagram Profile</h2>
            <p className={styles.resultsSubtitle}>
              Based on your conversation — a provisional hypothesis for coaching exploration.
            </p>
          </div>

          {/* Provisional results banner */}
          <div className={styles.provisionalBanner}>
            <span className={styles.provisionalIcon}>⚠️</span>
            <div className={styles.provisionalContent}>
              <div className={styles.provisionalTitle}>Provisional Results</div>
              <p className={styles.provisionalText}>
                This profile is an AI-generated hypothesis based on a single conversation. It is a starting point — not a diagnosis. Your coach will use this radar to dig deeper with you, challenge the assumptions, and confirm or refine your type together.
              </p>
            </div>
          </div>

          {/* Dominant type badge */}
          <div className={styles.dominantBadge}>
            <div className={styles.dominantLabel}>Dominant Type</div>
            <div className={styles.dominantTypeName}>{typeName}</div>
            <div className={styles.dominantTypeNum}>Type {dominantType}</div>
          </div>

          {/* Radar chart */}
          <div className={styles.radarCard}>
            <div className={styles.radarTitle}>All 9 Types — Score Distribution</div>
            <div className={styles.chartContainer}>
              <Radar data={radarData} options={radarOptions} />
            </div>
          </div>

          {/* Summary + traits */}
          <div className={styles.summaryCard}>
            <p className={styles.summaryText}>{result.summary}</p>

            <div className={styles.traitsGrid}>
              <div className={styles.traitSection}>
                <div className={styles.traitLabel}>Key Strengths</div>
                <ul className={styles.traitList}>
                  {(result.keyStrengths ?? []).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div className={styles.traitSection}>
                <div className={styles.traitLabel}>Blind Spots</div>
                <ul className={styles.traitList}>
                  {(result.blindSpots ?? []).map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Coach note */}
          {result.coachNote && (
            <div className={styles.coachNote}>
              <div className={styles.coachNoteLabel}>Note for your coach</div>
              <p className={styles.coachNoteText}>{result.coachNote}</p>
            </div>
          )}

          {/* Signup CTA */}
          <div className={styles.signupCta}>
            {leadSaved ? (
              <>
                <h3 className={styles.signupCtaTitle}>You&apos;re all set 🎉</h3>
                <p className={styles.signupCtaSubtitle}>
                  Your profile has been saved and Calendly is open. Once you&apos;ve booked, create an account to track your progress between sessions.
                </p>
                <button className={styles.signupCtaButton} onClick={() => router.push('/signup')}>
                  Create my account →
                </button>
              </>
            ) : leadCaptureVisible ? (
              <>
                <h3 className={styles.signupCtaTitle}>One last step — enter your email</h3>
                <p className={styles.signupCtaSubtitle}>
                  We&apos;ll save your profile and open the booking page with your email prefilled.
                </p>
                <form className={styles.leadForm} onSubmit={handleBookSession}>
                  <input
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    className={styles.leadEmailInput}
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={leadSaving || !leadEmail.trim()}
                    className={styles.signupCtaButton}
                  >
                    {leadSaving ? 'Saving…' : '📅 Book my session →'}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h3 className={styles.signupCtaTitle}>Validate your profile with a coach</h3>
                <p className={styles.signupCtaSubtitle}>
                  These results are provisional. A session with your coach will confirm or refine your type — and show you exactly how to use it.
                </p>
                {process.env.NEXT_PUBLIC_CALENDLY_URL && (
                  <button
                    className={styles.signupCtaButton}
                    onClick={() => setLeadCaptureVisible(true)}
                  >
                    📅 Book a session →
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Chat phase ────────────────────────────────────────────────────────────
  return (
    <div className={styles.container}>
      <div className={styles.chatWrapper}>
        {/* Progress */}
        <div className={styles.progressBar}>
          <span className={styles.progressLabel}>
            {turnCount < TARGET_TURNS
              ? `Exchange ${turnCount} of ~${TARGET_TURNS}`
              : 'Ready for results'}
          </span>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Messages */}
        <div className={styles.messagesArea}>
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`${styles.messageRow} ${msg.role === 'user' ? styles.messageRowUser : ''}`}
            >
              {msg.role === 'assistant' && (
                <div className={styles.messageAvatar}>🔮</div>
              )}
              <div
                className={`${styles.messageBubble} ${
                  msg.role === 'user'
                    ? styles.messageBubbleUser
                    : styles.messageBubbleAssistant
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className={styles.messageRow}>
              <div className={styles.messageAvatar}>🔮</div>
              <div className={styles.typingIndicator}>
                <div className={styles.typingDot} />
                <div className={styles.typingDot} />
                <div className={styles.typingDot} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={styles.inputArea}>
          <div className={styles.inputRow}>
            <textarea
              ref={inputRef}
              className={styles.textarea}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Share your thoughts…"
              disabled={isLoading}
              rows={1}
            />
            <button
              className={styles.sendButton}
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
            >
              Send
            </button>
          </div>

          {/* Results prompt — appears after RESULTS_UNLOCK_TURN exchanges */}
          {canViewResults && (
            <div className={styles.resultsPrompt}>
              <p className={styles.resultsPromptText}>
                Ready to see your Enneagram profile? You can keep talking or view your results now.
              </p>
              <button
                className={styles.resultsButton}
                onClick={handleGetResults}
                disabled={isLoading}
              >
                View my profile →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
