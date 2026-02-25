"use client";

import { useEffect, useRef } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Client-side component that marks a notification as read
 * when the user actually views the nudge page in the browser.
 * This prevents SSG/build-time pre-rendering from falsely marking all notifications as read.
 */
const NudgeReadTracker = ({ notificationId }: { notificationId: string }) => {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    const notifRef = doc(db, "notifications", notificationId);
    updateDoc(notifRef, { read: true }).catch((err) => {
      console.error("Failed to mark notification as read:", err);
    });
  }, [notificationId]);

  return null;
};

export default NudgeReadTracker;
