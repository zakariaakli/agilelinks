// lib/planPersistence.ts - Firestore persistence for plan generation state

import { db } from '../firebase';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export type PlanStatus = 'framed' | 'drafted' | 'finalized' | 'error';

export interface PlanInput {
  goalDescription: string;
  targetDate: string;
  hasTimePressure: boolean;
  personalitySummary: string;
  enneagramType: string;
  userId: string;
}

export interface GoalFrame {
  successCriteria: string;
  failureCriteria: string;
  mustAvoid: string[];
}

export interface Assumptions {
  constraints: string[];
  risks: string[];
  nonGoals: string[];
}

export interface PlanDocument {
  status: PlanStatus;
  input: PlanInput;
  goalFrame?: GoalFrame;
  assumptions?: Assumptions;
  goalName?: string;
  draftMilestones?: any[];
  finalMilestones?: any[];
  reviewNotes?: string[];
  error?: string;
  createdAt: any;
  updatedAt: any;
}

// Initialize a new plan document
export async function createPlanDocument(planId: string, input: PlanInput): Promise<void> {
  const planRef = doc(db, 'plans', planId);
  await setDoc(planRef, {
    status: 'framed',
    input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// Update plan with goalFrame, assumptions, and goalName (after Pass 1 + 2)
export async function updatePlanWithFrame(
  planId: string,
  goalFrame: GoalFrame,
  assumptions: Assumptions,
  goalName?: string
): Promise<void> {
  const planRef = doc(db, 'plans', planId);
  await updateDoc(planRef, {
    status: 'framed',
    goalFrame,
    assumptions,
    ...(goalName && { goalName }),
    updatedAt: serverTimestamp(),
  });
}

// Update plan with draft milestones (after Pass 3)
export async function updatePlanWithDraft(
  planId: string,
  draftMilestones: any[]
): Promise<void> {
  const planRef = doc(db, 'plans', planId);
  await updateDoc(planRef, {
    status: 'drafted',
    draftMilestones,
    updatedAt: serverTimestamp(),
  });
}

// Update plan with final milestones (after Pass 4 + 5)
export async function updatePlanWithFinal(
  planId: string,
  finalMilestones: any[],
  reviewNotes: string[]
): Promise<void> {
  const planRef = doc(db, 'plans', planId);
  await updateDoc(planRef, {
    status: 'finalized',
    finalMilestones,
    reviewNotes,
    updatedAt: serverTimestamp(),
  });
}

// Get plan document
export async function getPlanDocument(planId: string): Promise<PlanDocument | null> {
  const planRef = doc(db, 'plans', planId);
  const planSnap = await getDoc(planRef);

  if (!planSnap.exists()) {
    return null;
  }

  return planSnap.data() as PlanDocument;
}

// Update plan with error
export async function updatePlanWithError(planId: string, error: string): Promise<void> {
  const planRef = doc(db, 'plans', planId);
  await updateDoc(planRef, {
    status: 'error',
    error,
    updatedAt: serverTimestamp(),
  });
}
