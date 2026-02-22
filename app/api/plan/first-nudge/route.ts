import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import {
  generateMilestoneNudgeFromAI,
  parseNudgeResponse,
} from "../../../../lib/generateMilestoneNudgeFromAI";
import {
  getDefaultEmailStatus,
  getDefaultNotificationMeta,
} from "../../../../lib/notificationTracking";
import {
  trackFirebaseRead,
  trackFirebaseWrite,
} from "../../../../lib/firebaseTracker";

interface Milestone {
  id: string;
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  completed: boolean;
  blindSpotTip?: string;
  strengthHook?: string;
}

/**
 * POST /api/plan/first-nudge
 *
 * Generates the first nudge immediately after plan creation.
 * Finds the current active milestone, creates a notification,
 * and generates AI content in one shot.
 */
export async function POST(request: NextRequest) {
  try {
    const { planId, userId } = await request.json();

    if (!planId || !userId) {
      return NextResponse.json(
        { error: "planId and userId are required" },
        { status: 400 }
      );
    }

    console.log(`🚀 First nudge: generating for plan ${planId}, user ${userId}`);

    // Fetch the plan
    const planRef = doc(db, "plans", planId);
    const planSnap = await getDoc(planRef);

    await trackFirebaseRead(
      "plans",
      1,
      userId,
      "first-nudge@system.com",
      "server",
      "first_nudge_read_plan"
    );

    if (!planSnap.exists()) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const planData = planSnap.data();
    const planUserId = planData.userId || planData.input?.userId;

    if (planUserId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const milestones: Milestone[] = planData.milestones || [];
    if (milestones.length === 0) {
      return NextResponse.json(
        { error: "Plan has no milestones" },
        { status: 400 }
      );
    }

    // Find the current active milestone (startDate <= today <= dueDate)
    // For brand new plans, fall back to the first uncompleted milestone
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let targetMilestone = milestones.find((m) => {
      if (m.completed) return false;
      const start = new Date(m.startDate);
      const due = new Date(m.dueDate);
      start.setHours(0, 0, 0, 0);
      due.setHours(0, 0, 0, 0);
      return start <= today && today <= due;
    });

    if (!targetMilestone) {
      targetMilestone = milestones.find((m) => !m.completed);
    }

    if (!targetMilestone) {
      return NextResponse.json(
        { error: "No active milestone found" },
        { status: 400 }
      );
    }

    console.log(`📋 First nudge: target milestone "${targetMilestone.title}"`);

    // Get user email for AI tracking
    let userEmail = "";
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        userEmail = userData.email || userData.userEmail || "";
      }
    } catch {
      // Non-critical
    }

    // Generate AI nudge
    const goalContext = planData.goal || planData.input?.goalDescription || "";
    const nudgeResponse = await generateMilestoneNudgeFromAI(
      {
        milestone: {
          ...targetMilestone,
          planId,
        },
        goalContext,
        userId,
      },
      userEmail || undefined
    );

    const { nudgeText, suggestedStep } = parseNudgeResponse(nudgeResponse);

    // Create the notification document
    const notificationRef = doc(collection(db, "notifications"));
    await setDoc(notificationRef, {
      userId,
      type: "milestone_reminder" as const,
      planId,
      milestoneId: targetMilestone.id,
      milestoneTitle: targetMilestone.title,
      blindSpotTip: targetMilestone.blindSpotTip || null,
      strengthHook: targetMilestone.strengthHook || null,
      startDate: targetMilestone.startDate,
      dueDate: targetMilestone.dueDate,
      prompt: nudgeText,
      suggestedStep: suggestedStep || null,
      goalContext,
      createdAt: Timestamp.now(),
      read: false,
      feedback: null,
      emailStatus: getDefaultEmailStatus(),
      notificationMeta: getDefaultNotificationMeta("milestone_reminder"),
    });

    await trackFirebaseWrite(
      "notifications",
      1,
      userId,
      userEmail || "first-nudge@system.com",
      "server",
      "first_nudge_create_notification"
    );

    console.log(
      `✅ First nudge created: ${notificationRef.id} for milestone "${targetMilestone.title}"`
    );

    return NextResponse.json({
      success: true,
      notificationId: notificationRef.id,
    });
  } catch (error) {
    console.error("❌ First nudge generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate first nudge", details: String(error) },
      { status: 500 }
    );
  }
}
