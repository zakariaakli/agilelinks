import { NextResponse } from 'next/server';
import { db } from '../../../firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

interface PlanData {
  id: string;
  userId: string;
  goalType: string;
  goal: string;
  targetDate: string;
  hasTimePressure: boolean;
  nudgeFrequency?: 'daily' | 'weekly';
  milestones: any[];
  status: 'active' | 'completed' | 'paused';
  createdAt: any;
}

export async function POST(request: Request) {
  try {
    console.log('🔄 Starting migration of existing plans to add nudgeFrequency field...');

    // Get all plans from the database
    const plansSnapshot = await getDocs(collection(db, 'plans'));
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const planDoc of plansSnapshot.docs) {
      try {
        const planData = planDoc.data() as PlanData;
        const planId = planDoc.id;

        // Check if plan already has nudgeFrequency field
        if (planData.nudgeFrequency) {
          console.log(`⏭️ Plan ${planId} already has nudgeFrequency: ${planData.nudgeFrequency}`);
          skippedCount++;
          continue;
        }

        // Default nudgeFrequency to 'weekly' for existing plans
        const defaultNudgeFrequency = 'weekly';

        console.log(`📝 Migrating plan ${planId} for user ${planData.userId} - setting nudgeFrequency to '${defaultNudgeFrequency}'`);

        // Update the plan with the new nudgeFrequency field
        await updateDoc(doc(db, 'plans', planId), {
          nudgeFrequency: defaultNudgeFrequency
        });

        migratedCount++;
        console.log(`✅ Successfully migrated plan ${planId}`);

      } catch (error) {
        console.error(`❌ Error migrating plan ${planDoc.id}:`, error);
        errorCount++;
      }
    }

    const totalPlans = plansSnapshot.docs.length;
    console.log(`✅ Migration completed!`);
    console.log(`📊 Migration summary:`);
    console.log(`   Total plans: ${totalPlans}`);
    console.log(`   Migrated: ${migratedCount}`);
    console.log(`   Already had nudgeFrequency: ${skippedCount}`);
    console.log(`   Errors: ${errorCount}`);

    return NextResponse.json({
      status: 'success',
      message: 'Plan migration completed successfully',
      summary: {
        totalPlans,
        migratedCount,
        skippedCount,
        errorCount
      }
    });

  } catch (error) {
    console.error('❌ Error during plan migration:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Failed to migrate plans', 
        error: String(error) 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // GET endpoint to check migration status
  try {
    console.log('🔍 Checking migration status...');

    const plansSnapshot = await getDocs(collection(db, 'plans'));
    let totalPlans = 0;
    let plansWithNudgeFrequency = 0;
    let plansNeedingMigration = 0;

    for (const planDoc of plansSnapshot.docs) {
      totalPlans++;
      const planData = planDoc.data() as PlanData;
      
      if (planData.nudgeFrequency) {
        plansWithNudgeFrequency++;
      } else {
        plansNeedingMigration++;
      }
    }

    return NextResponse.json({
      status: 'info',
      message: 'Migration status check completed',
      migrationStatus: {
        totalPlans,
        plansWithNudgeFrequency,
        plansNeedingMigration,
        migrationNeeded: plansNeedingMigration > 0
      }
    });

  } catch (error) {
    console.error('❌ Error checking migration status:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Failed to check migration status', 
        error: String(error) 
      },
      { status: 500 }
    );
  }
}