// Weekly milestone reminder scheduler
// This function should be called by a cron job or scheduled task

import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export async function runWeeklyMilestoneCheck() {
  try {
    console.log('🔄 Starting weekly milestone reminder check...');
    
    // Call the API endpoint that handles milestone reminder logic
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/weeklyMilestoneReminders`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Milestone reminder check completed:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error in milestone scheduler:', error);
    throw error;
  }
}

// Function to manually trigger milestone reminders (for testing)
export async function triggerMilestoneReminders() {
  return await runWeeklyMilestoneCheck();
}