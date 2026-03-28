'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = 'intro' | 'loading' | 'phase1' | 'tiebreaker' | 'phase2' | 'phase3' | 'scoring' | 'results';
type Center = 'gut' | 'head' | 'heart';

interface Option {
  label: 'A' | 'B' | 'C';
  text: string;
  center?: Center;
  type?: number;
}

interface Question {
  id: string;
  text: string;
  hint?: string;
  options: Option[];
}

interface Phase1Scores { gut: number; head: number; heart: number }
interface Phase2Scores { [typeKey: string]: number }

interface AssessmentDetail {
  phase1: { answers: string[]; scores: Phase1Scores; dominantTriad: string; secondaryTriad: string | null };
  phase2: { triad: string; answers: string[]; scores: Phase2Scores };
  candidateTypes: number[];
}

interface ChatMessage { role: 'user' | 'assistant'; content: string }

// ── Constants ──────────────────────────────────────────────────────────────────

const PHASE3_MAX_TURNS = 8;
const PHASE3_CONVERGE_TURN = 6;

// ── Helpers ────────────────────────────────────────────────────────────────────

async function fetchQuestions(set: string): Promise<Question[]> {
  const res = await fetch(`/api/assessment-config?set=${set}`);
  if (!res.ok) throw new Error(`Failed to fetch ${set}`);
  const data = await res.json();
  return data.questions as Question[];
}

function getCandidateTypes(scores: Phase2Scores): number[] {
  return Object.entries(scores)
    .filter(([k]) => !k.startsWith('center_'))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([k]) => Number(k));
}

function getTriadResult(scores: Phase1Scores) {
  const sorted = (Object.entries(scores) as [Center, number][]).sort((a, b) => b[1] - a[1]);
  const [first, second] = sorted;
  const isTied = first[1] === second[1];
  return {
    dominant: first[0],
    secondary: (!isTied && second[1] > 0) ? second[0] : null,
    isTied,
    tiedCenters: isTied ? [first[0], second[0]] as Center[] : [] as Center[],
  };
}

function getPhase2SetKey(dominant: Center, secondary: Center | null, isTied: boolean): string {
  if (!isTied) return `phase2_${dominant}`;
  const pair = [dominant, secondary ?? ''].sort().join('_');
  return `phase2_mixed_${pair}`;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function AIEnneagramTest() {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>('intro');
  const [loadError, setLoadError] = useState<string | null>(null);

  // Phase 1
  const [p1Questions, setP1Questions] = useState<Question[]>([]);
  const [p1Index, setP1Index] = useState(0);
  const [p1Answers, setP1Answers] = useState<string[]>([]);
  const [p1Scores, setP1Scores] = useState<Phase1Scores>({ gut: 0, head: 0, heart: 0 });
  const [p1Animating, setP1Animating] = useState(false);

  // Tiebreaker
  const [tiebreakerQuestion, setTiebreakerQuestion] = useState('');
  const [tiebreakerOptions, setTiebreakerOptions] = useState<{ label: string; text: string; center: Center }[]>([]);
  const [tiedCenters, setTiedCenters] = useState<Center[]>([]);
  const [tiebreakerLoading, setTiebreakerLoading] = useState(false);

  // Phase 2
  const [p2Questions, setP2Questions] = useState<Question[]>([]);
  const [p2Index, setP2Index] = useState(0);
  const [p2Answers, setP2Answers] = useState<string[]>([]);
  const [p2Scores, setP2Scores] = useState<Phase2Scores>({});
  const [p2Triad, setP2Triad] = useState('');
  const [p2Animating, setP2Animating] = useState(false);

  // Phase 3
  const [p3Messages, setP3Messages] = useState<ChatMessage[]>([]);
  const [p3Input, setP3Input] = useState('');
  const [p3Loading, setP3Loading] = useState(false);
  const [p3TurnCount, setP3TurnCount] = useState(0);
  const [candidateTypes, setCandidateTypes] = useState<number[]>([]);

  // Results
  const [result, setResult] = useState<(EnneagramResult & { dominantType?: number; coachNote?: string }) | null>(null);
  const [assessmentDetail, setAssessmentDetail] = useState<AssessmentDetail | null>(null);

  // Lead capture
  const [leadEmail, setLeadEmail] = useState('');
  const [leadCaptureVisible, setLeadCaptureVisible] = useState(false);
  const [leadSaving, setLeadSaving] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [p3Messages]);

  // ── Start ──────────────────────────────────────────────────────────────────

  const startTest = useCallback(async () => {
    setPhase('loading');
    setLoadError(null);
    try {
      const questions = await fetchQuestions('phase1');
      setP1Questions(questions);
      setPhase('phase1');
    } catch {
      setLoadError('Failed to load questions. Please try again.');
      setPhase('intro');
    }
  }, []);

  // ── Phase 1 ────────────────────────────────────────────────────────────────

  const handleP1Answer = useCallback(async (option: Option) => {
    if (p1Animating) return;
    setP1Animating(true);

    const newAnswers = [...p1Answers, option.label];
    const newScores = { ...p1Scores };
    if (option.center) newScores[option.center] = (newScores[option.center] ?? 0) + 1;

    setP1Answers(newAnswers);
    setP1Scores(newScores);
    await new Promise((r) => setTimeout(r, 380));

    if (p1Index < p1Questions.length - 1) {
      setP1Index(p1Index + 1);
      setP1Animating(false);
      return;
    }

    const { dominant, secondary, isTied, tiedCenters: tied } = getTriadResult(newScores);
    setP1Animating(false);

    if (isTied) {
      setTiedCenters(tied);
      await loadTiebreaker(tied, newScores, newAnswers, dominant, secondary);
    } else {
      await loadPhase2(dominant, secondary, false, newScores, newAnswers);
    }
  }, [p1Animating, p1Answers, p1Scores, p1Index, p1Questions]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tiebreaker ─────────────────────────────────────────────────────────────

  const loadTiebreaker = useCallback(async (
    tied: Center[], scores: Phase1Scores, answers: string[], dominant: Center, secondary: Center | null
  ) => {
    setTiebreakerLoading(true);
    setPhase('tiebreaker');
    try {
      const res = await fetch('/api/chatbot/enneagram-assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Generate a tiebreaker question.' }],
          mode: 'tiebreaker',
          tiedCenters: tied,
        }),
      });
      const data = await res.json();
      const raw: string = data.response ?? '';
      const qMatch = raw.match(/QUESTION:\s*(.+?)(?:\n|$)/i);
      const aMatch = raw.match(/A:\s*(.+?)(?:\n|$)/i);
      const bMatch = raw.match(/B:\s*(.+?)(?:\n|$)/i);

      if (qMatch && aMatch && bMatch) {
        setTiebreakerQuestion(qMatch[1].trim());
        setTiebreakerOptions([
          { label: 'A', text: aMatch[1].trim(), center: tied[0] },
          { label: 'B', text: bMatch[1].trim(), center: tied[1] },
        ]);
      } else {
        await loadPhase2(dominant, secondary, false, scores, answers);
      }
    } catch {
      await loadPhase2(dominant, secondary, false, scores, answers);
    } finally {
      setTiebreakerLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTiebreakerAnswer = useCallback(async (center: Center) => {
    const loser = tiedCenters.find((c) => c !== center) ?? null;
    await loadPhase2(center, loser, false, p1Scores, p1Answers);
  }, [tiedCenters, p1Scores, p1Answers]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Phase 2 ────────────────────────────────────────────────────────────────

  const loadPhase2 = useCallback(async (
    dominant: Center, secondary: Center | null, isTied: boolean,
    _scores: Phase1Scores, _answers: string[]
  ) => {
    setPhase('loading');
    try {
      const setKey = getPhase2SetKey(dominant, secondary, isTied);
      const questions = await fetchQuestions(setKey);
      setP2Questions(questions);
      setP2Triad(dominant);
      setP2Index(0);
      setP2Answers([]);
      setP2Scores({});
      setPhase('phase2');
    } catch {
      setLoadError('Failed to load phase 2 questions. Please try again.');
      setPhase('intro');
    }
  }, []);

  const handleP2Answer = useCallback(async (option: Option) => {
    if (p2Animating) return;
    setP2Animating(true);

    const newAnswers = [...p2Answers, option.label];
    const newScores = { ...p2Scores };

    if (option.type != null) {
      const key = String(option.type);
      newScores[key] = (newScores[key] ?? 0) + 1;
    } else if (option.center) {
      const key = `center_${option.center}`;
      newScores[key] = (newScores[key] ?? 0) + 1;
    }

    setP2Answers(newAnswers);
    setP2Scores(newScores);
    await new Promise((r) => setTimeout(r, 380));

    if (p2Index < p2Questions.length - 1) {
      setP2Index(p2Index + 1);
      setP2Animating(false);
      return;
    }

    setP2Animating(false);

    // Mixed questions resolve to a winning center, then reload with full type set
    const hasCenterScores = Object.keys(newScores).some((k) => k.startsWith('center_'));
    if (hasCenterScores) {
      const centerTotals: Record<string, number> = {};
      Object.entries(newScores).forEach(([k, v]) => {
        if (k.startsWith('center_')) centerTotals[k.replace('center_', '')] = v;
      });
      const winnerCenter = Object.entries(centerTotals).sort((a, b) => b[1] - a[1])[0][0] as Center;
      await loadPhase2(winnerCenter, null, false, p1Scores, p1Answers);
      return;
    }

    const candidates = getCandidateTypes(newScores);
    setCandidateTypes(candidates);

    const detail: AssessmentDetail = {
      phase1: { answers: p1Answers, scores: p1Scores, dominantTriad: p2Triad, secondaryTriad: null },
      phase2: { triad: p2Triad, answers: newAnswers, scores: newScores },
      candidateTypes: candidates,
    };
    setAssessmentDetail(detail);
    localStorage.setItem('assessmentDetail', JSON.stringify(detail));

    await startPhase3(candidates);
  }, [p2Animating, p2Answers, p2Scores, p2Index, p2Questions, p2Triad, p1Scores, p1Answers]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Phase 3 ────────────────────────────────────────────────────────────────

  const startPhase3 = useCallback(async (candidates: number[]) => {
    setPhase('phase3');
    setP3TurnCount(0);
    setP3Messages([]);
    try {
      const res = await fetch('/api/chatbot/enneagram-assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Please begin the validation phase.' }],
          mode: 'phase3',
          candidateTypes: candidates,
          turnCount: 0,
        }),
      });
      const data = await res.json();
      if (data.response) setP3Messages([{ role: 'assistant', content: data.response }]);
    } catch {
      setP3Messages([{ role: 'assistant', content: "Let's go a bit deeper. Think of a recent moment when you felt most like yourself — what were you doing, and what made it feel right?" }]);
    }
  }, []);

  const sendP3Message = useCallback(async () => {
    const text = p3Input.trim();
    if (!text || p3Loading) return;

    const newMessages: ChatMessage[] = [...p3Messages, { role: 'user', content: text }];
    setP3Messages(newMessages);
    setP3Input('');
    setP3Loading(true);
    const newTurn = p3TurnCount + 1;
    setP3TurnCount(newTurn);

    if (newTurn >= PHASE3_MAX_TURNS) {
      setP3Loading(false);
      await runScoring(newMessages);
      return;
    }

    try {
      const res = await fetch('/api/chatbot/enneagram-assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          mode: 'phase3',
          candidateTypes,
          turnCount: newTurn,
        }),
      });
      const data = await res.json();
      if (data.response) {
        setP3Messages([...newMessages, { role: 'assistant', content: data.response }]);
      }
    } catch {
      setP3Messages([...newMessages, { role: 'assistant', content: "Tell me more — what does that feel like from the inside?" }]);
    } finally {
      setP3Loading(false);
    }
  }, [p3Input, p3Loading, p3Messages, p3TurnCount, candidateTypes]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Scoring ────────────────────────────────────────────────────────────────

  const runScoring = useCallback(async (transcript: ChatMessage[]) => {
    setPhase('scoring');
    try {
      const detail = assessmentDetail;
      const structuredContext = detail
        ? {
            phase1: detail.phase1.scores,
            phase2: { triad: detail.phase2.triad, scores: detail.phase2.scores },
            candidateTypes: detail.candidateTypes,
          }
        : undefined;

      const res = await fetch('/api/chatbot/enneagram-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, structuredContext }),
      });
      const scored = await res.json();
      setResult(scored);
      localStorage.setItem('userTestResult', JSON.stringify(scored));
      setPhase('results');
    } catch {
      setPhase('phase3');
    }
  }, [assessmentDetail]);

  // ── Lead & booking ─────────────────────────────────────────────────────────

  const handleBookSession = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadEmail.trim() || !result) return;
    setLeadSaving(true);

    // Open Calendly synchronously before any await — browsers block window.open() after async ops
    const url = process.env.NEXT_PUBLIC_CALENDLY_URL;
    if (url) window.open(`${url}?email=${encodeURIComponent(leadEmail.trim())}`, '_blank', 'noopener,noreferrer');

    try {
      const detail = assessmentDetail;
      await addDoc(collection(db, 'leads'), {
        email: leadEmail.trim(),
        enneagramResult: result,
        assessmentDetail: detail ?? null,
        dominantType: result.dominantType ?? null,
        candidateTypes: detail?.candidateTypes ?? [],
        source: 'enneagram-test',
        createdAt: serverTimestamp(),
      });
      localStorage.setItem('userTestResult', JSON.stringify(result));
      fetch('/api/notify-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: leadEmail.trim(),
          dominantType: result.dominantType,
          candidateTypes: detail?.candidateTypes,
          phase1Scores: detail?.phase1?.scores,
          completedAt: new Date().toISOString(),
        }),
      }).catch(() => {});
      setLeadSaved(true);
    } catch {
      setLeadSaved(true);
    } finally {
      setLeadSaving(false);
    }
  }, [leadEmail, result, assessmentDetail]);

  // ── Radar ──────────────────────────────────────────────────────────────────

  const radarData = result ? {
    labels: ['Type 1','Type 2','Type 3','Type 4','Type 5','Type 6','Type 7','Type 8','Type 9'],
    datasets: [{
      label: 'Your Profile',
      data: [1,2,3,4,5,6,7,8,9].map((t) => (result[`enneagramType${t}` as keyof EnneagramResult] as number) ?? 0),
      backgroundColor: 'rgba(156, 75, 32, 0.15)',
      borderColor: '#9C4B20',
      borderWidth: 2,
      pointBackgroundColor: '#C68B2C',
      pointRadius: 4,
    }],
  } : null;

  const radarOptions = {
    scales: { r: { min: 0, max: 20, ticks: { stepSize: 5, font: { size: 10 } }, pointLabels: { font: { size: 12 } } } },
    plugins: { legend: { display: false } },
    maintainAspectRatio: true,
  };

  // ── Progress ───────────────────────────────────────────────────────────────

  const phaseLabel = (): string => {
    if (phase === 'phase1') return `Phase 1 of 3 — Question ${p1Index + 1} of ${p1Questions.length}`;
    if (phase === 'tiebreaker') return 'Phase 1 of 3 — One more to decide';
    if (phase === 'phase2') return `Phase 2 of 3 — Question ${p2Index + 1} of ${p2Questions.length}`;
    if (phase === 'phase3') return `Phase 3 of 3 — Turn ${p3TurnCount} of ${PHASE3_MAX_TURNS}`;
    return '';
  };

  const phaseProgress = (): number => {
    if (phase === 'phase1') return Math.round((p1Index / (p1Questions.length || 5)) * 33);
    if (phase === 'tiebreaker') return 33;
    if (phase === 'phase2') return 33 + Math.round((p2Index / (p2Questions.length || 5)) * 33);
    if (phase === 'phase3') return 66 + Math.round((p3TurnCount / PHASE3_MAX_TURNS) * 34);
    return 0;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  if (phase === 'intro') {
    return (
      <div className={styles.introShell}>
        <div className={styles.introCard}>
          <div className={styles.disclaimerBanner}>
            This is a first hypothesis — not a verdict. Results will be validated with your coach.
          </div>
          <h1 className={styles.introTitle}>Discover your Enneagram type</h1>
          <p className={styles.introSubtitle}>
            A 10-minute guided assessment — structured questions followed by a short AI conversation. Answer from instinct, not reflection.
          </p>
          <div className={styles.prepSection}>
            <p className={styles.prepSectionTitle}>Before you start</p>
            <ul className={styles.prepTips}>
              <li>Answer fast — your first instinct is the most accurate</li>
              <li>Choose what feels true, not what sounds best</li>
              <li>Think of how you actually behave, not how you&apos;d like to</li>
              <li>There are no right or wrong answers</li>
            </ul>
          </div>
          {loadError && <p style={{ color: '#B84A42', fontSize: '0.875rem', marginBottom: '1rem' }}>{loadError}</p>}
          <button className={styles.startButton} onClick={startTest}>
            Start the assessment →
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className={styles.scoringOverlay}>
        <div className={styles.scoringSpinner} />
        <p className={styles.scoringText}>Loading…</p>
      </div>
    );
  }

  if (phase === 'phase1' && p1Questions.length > 0) {
    const q = p1Questions[p1Index];
    return (
      <div className={styles.questionShell}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${phaseProgress()}%` }} />
        </div>
        <p className={styles.phaseLabel}>{phaseLabel()}</p>
        <div className={`${styles.questionCard} ${p1Animating ? styles.questionFade : ''}`}>
          <p className={styles.questionText}>{q.text}</p>
          {q.hint && <p className={styles.questionHint}>{q.hint}</p>}
          <div className={styles.optionList}>
            {q.options.map((opt) => (
              <button key={opt.label} className={styles.optionButton} onClick={() => handleP1Answer(opt)} disabled={p1Animating}>
                <span className={styles.optionLabel}>{opt.label}</span>
                <span className={styles.optionText}>{opt.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'tiebreaker') {
    return (
      <div className={styles.questionShell}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: '33%' }} />
        </div>
        <p className={styles.phaseLabel}>{phaseLabel()}</p>
        <div className={styles.questionCard}>
          {tiebreakerLoading ? (
            <p className={styles.questionHint}>Preparing your question…</p>
          ) : (
            <>
              <p className={styles.questionText}>{tiebreakerQuestion}</p>
              <div className={styles.optionList}>
                {tiebreakerOptions.map((opt) => (
                  <button key={opt.label} className={styles.optionButton} onClick={() => handleTiebreakerAnswer(opt.center)}>
                    <span className={styles.optionLabel}>{opt.label}</span>
                    <span className={styles.optionText}>{opt.text}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'phase2' && p2Questions.length > 0) {
    const q = p2Questions[p2Index];
    return (
      <div className={styles.questionShell}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${phaseProgress()}%` }} />
        </div>
        <p className={styles.phaseLabel}>{phaseLabel()}</p>
        <div className={`${styles.questionCard} ${p2Animating ? styles.questionFade : ''}`}>
          <p className={styles.questionText}>{q.text}</p>
          {q.hint && <p className={styles.questionHint}>{q.hint}</p>}
          <div className={styles.optionList}>
            {q.options.map((opt) => (
              <button key={opt.label} className={styles.optionButton} onClick={() => handleP2Answer(opt)} disabled={p2Animating}>
                <span className={styles.optionLabel}>{opt.label}</span>
                <span className={styles.optionText}>{opt.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'phase3') {
    const canFinish = p3TurnCount >= 4;
    const isConverging = p3TurnCount >= PHASE3_CONVERGE_TURN;
    return (
      <div className={styles.chatShell}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${phaseProgress()}%` }} />
        </div>
        <p className={styles.phaseLabel}>{phaseLabel()}</p>
        {isConverging && (
          <p className={styles.convergingNote}>Almost there — a couple more exchanges and your results will be ready.</p>
        )}
        <div className={styles.chatMessages}>
          {p3Messages.map((msg, i) => (
            <div key={i} className={msg.role === 'assistant' ? styles.assistantBubble : styles.userBubble}>
              {msg.content}
            </div>
          ))}
          {p3Loading && (
            <div className={styles.assistantBubble}>
              <span className={styles.typingDots}><span /><span /><span /></span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className={styles.chatInputRow}>
          <textarea
            className={styles.chatInput}
            value={p3Input}
            onChange={(e) => setP3Input(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendP3Message(); } }}
            placeholder="Share your thoughts…"
            rows={2}
            disabled={p3Loading}
          />
          <div className={styles.chatActions}>
            <button className={styles.sendButton} onClick={sendP3Message} disabled={p3Loading || !p3Input.trim()}>
              Send
            </button>
            {canFinish && (
              <button className={styles.finishButton} onClick={() => runScoring(p3Messages)} disabled={p3Loading}>
                Get my results →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'scoring') {
    return (
      <div className={styles.scoringOverlay}>
        <div className={styles.scoringSpinner} />
        <p className={styles.scoringText}>Analysing your responses…</p>
        <p className={styles.scoringSubtext}>This takes about 15 seconds</p>
      </div>
    );
  }

  if (phase === 'results' && result) {
    return (
      <div className={styles.resultsShell}>
        <div className={styles.resultsContainer}>
          <div className={styles.provisionalBanner}>
            These results are a provisional hypothesis — your coach will validate and deepen them in your first session.
          </div>

          {result.dominantType && (
            <div className={styles.dominantBadge}>
              <span className={styles.dominantLabel}>Your dominant profile</span>
              <span className={styles.dominantType}>Type {result.dominantType}</span>
            </div>
          )}

          {radarData && (
            <div className={styles.radarContainer}>
              <Radar data={radarData} options={radarOptions} />
            </div>
          )}

          {result.summary && (
            <div className={styles.summaryBlock}>
              <h3 className={styles.summaryTitle}>What emerged</h3>
              <p className={styles.summaryText}>{result.summary}</p>
            </div>
          )}

          {result.coachNote && (
            <div className={styles.coachNoteBlock}>
              <h3 className={styles.coachNoteTitle}>Note for your coach</h3>
              <p className={styles.coachNoteText}>{result.coachNote}</p>
            </div>
          )}

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
                  <button type="submit" disabled={leadSaving || !leadEmail.trim()} className={styles.signupCtaButton}>
                    {leadSaving ? 'Saving…' : '📅 Book my session →'}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h3 className={styles.signupCtaTitle}>Validate your profile with a coach</h3>
                <p className={styles.signupCtaSubtitle}>
                  These results are a starting point. A session with your coach will confirm or refine your type — and show you exactly how to use it.
                </p>
                {process.env.NEXT_PUBLIC_CALENDLY_URL && (
                  <button className={styles.signupCtaButton} onClick={() => setLeadCaptureVisible(true)}>
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

  return null;
}
