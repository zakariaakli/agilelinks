"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import styles from '../../Styles/profile.module.css';
import { EnneagramResult } from '../../Models/EnneagramResult';
import MilestoneCard from '../../Components/MilestoneCard';
import GamificationSystem from '../../Components/GamificationSystem';
import GamifiedEnneagram from '../../Components/GamifiedEnneagram';
import Link from 'next/link';
import { LinkButton } from '../../Components/Button';
import { PlusIcon, EditIcon, EyeIcon, TargetIcon } from '../../Components/Icons';

interface PlanData {
  id: string;
  userId: string;
  goalType: string;
  goal: string;
  targetDate: string;
  hasTimePressure: boolean;
  milestones: Milestone[];
  createdAt: any;
  status: 'active' | 'completed' | 'paused';
}

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

interface Notification {
  id: string;
  prompt: string;
  createdAt: any;
  feedback?: string | null;
  type: string;
}

const enneagramLabels = {
  enneagramType1: 'Type 1 – The Reformer',
  enneagramType2: 'Type 2 – The Helper',
  enneagramType3: 'Type 3 – The Achiever',
  enneagramType4: 'Type 4 – The Individualist',
  enneagramType5: 'Type 5 – The Investigator',
  enneagramType6: 'Type 6 – The Loyalist',
  enneagramType7: 'Type 7 – The Enthusiast',
  enneagramType8: 'Type 8 – The Challenger',
  enneagramType9: 'Type 9 – The Peacemaker',
};

const ProfilePage = () => {
  const [user, setUser] = useState<any>(null);
  const [enneagramResult, setEnneagramResult] = useState<EnneagramResult | null>(null);
  const [userPlans, setUserPlans] = useState<PlanData[]>([]);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [milestoneNotifications, setMilestoneNotifications] = useState<Record<string, Notification[]>>({});
  const [loadingNotifications, setLoadingNotifications] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        await Promise.all([
          loadUserProfile(user.uid),
          loadUserPlans(user.uid)
        ]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        setEnneagramResult(data.enneagramResult as EnneagramResult);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadUserPlans = async (userId: string) => {
    try {
      const plansQuery = query(
        collection(db, 'plans'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      const querySnapshot = await getDocs(plansQuery);
      const plans: PlanData[] = [];

      querySnapshot.forEach((doc) => {
        plans.push({
          id: doc.id,
          ...doc.data()
        } as PlanData);
      });

      setUserPlans(plans);
    } catch (error) {
      console.error('Error loading user plans:', error);
    }
  };

  const togglePlanExpansion = (planId: string) => {
    setExpandedPlan(expandedPlan === planId ? null : planId);
  };

  // Helper function to determine milestone status
  const getMilestoneStatus = (milestone: Milestone): 'completed' | 'current' | 'future' => {
    if (milestone.completed) return 'completed';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startDate = new Date(milestone.startDate);
    startDate.setHours(0, 0, 0, 0);
    
    const dueDate = new Date(milestone.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    // Current milestone: started but not completed, and due date hasn't passed
    if (startDate <= today && today <= dueDate) {
      return 'current';
    }
    
    return 'future';
  };

  // Fetch ALL notifications for a milestone
  const fetchMilestoneNotifications = async (userId: string, milestoneId: string): Promise<Notification[]> => {
    try {
      const notificationQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('milestoneId', '==', milestoneId),
        where('type', '==', 'milestone_reminder'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(notificationQuery);
      
      if (querySnapshot.empty) return [];

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notification));
    } catch (error) {
      console.error('Error fetching milestone notifications:', error);
      return [];
    }
  };

  // Load notifications for current milestones
  const loadCurrentMilestoneNotifications = async (plans: PlanData[]) => {
    if (!user) return;

    const currentMilestones: { planId: string; milestone: Milestone }[] = [];
    
    // Find all current milestones across all plans
    plans.forEach(plan => {
      plan.milestones?.forEach(milestone => {
        if (getMilestoneStatus(milestone) === 'current') {
          currentMilestones.push({ planId: plan.id, milestone });
        }
      });
    });

    // Set loading state for all current milestones
    const loadingState: Record<string, boolean> = {};
    currentMilestones.forEach(({ milestone }) => {
      loadingState[milestone.id] = true;
    });
    setLoadingNotifications(loadingState);

    // Fetch notifications for each current milestone
    const notificationPromises = currentMilestones.map(async ({ milestone }) => {
      const notifications = await fetchMilestoneNotifications(user.uid, milestone.id);
      return { milestoneId: milestone.id, notifications };
    });

    try {
      const results = await Promise.all(notificationPromises);
      
      const notifications: Record<string, Notification[]> = {};
      const finalLoadingState: Record<string, boolean> = {};
      
      results.forEach(({ milestoneId, notifications: milestoneNotifs }) => {
        notifications[milestoneId] = milestoneNotifs;
        finalLoadingState[milestoneId] = false;
      });

      setMilestoneNotifications(notifications);
      setLoadingNotifications(finalLoadingState);
    } catch (error) {
      console.error('Error loading milestone notifications:', error);
      setLoadingNotifications({});
    }
  };

  // Load notifications when plans change
  useEffect(() => {
    if (userPlans.length > 0) {
      loadCurrentMilestoneNotifications(userPlans);
    }
  }, [userPlans, user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'completed': return '#6366F1';
      case 'paused': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getProgressPercentage = (milestones: Milestone[]) => {
    if (!milestones || milestones.length === 0) return 0;
    const completed = milestones.filter(m => m.completed).length;
    return Math.round((completed / milestones.length) * 100);
  };

  const getDaysUntilTarget = (targetDate: string) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calculate gamification stats
  const calculateUserStats = () => {
    const totalPlans = userPlans.length;
    const allMilestones = userPlans.flatMap(plan => plan.milestones || []);
    const completedMilestones = allMilestones.filter(m => m.completed).length;
    const totalMilestones = allMilestones.length;
    
    // Calculate nudge streak and responses from milestone notifications
    let totalNudgeResponses = 0;
    let nudgeStreak = 0;
    
    Object.values(milestoneNotifications).forEach(notifications => {
      totalNudgeResponses += notifications.filter(n => n.feedback).length;
      // Simple streak calculation - could be more sophisticated
      const recentResponses = notifications.filter(n => n.feedback).length;
      nudgeStreak = Math.max(nudgeStreak, recentResponses);
    });
    
    // Simple days active calculation - could be based on actual user activity
    const daysActive = userPlans.length > 0 ? Math.max(1, Math.floor(Math.random() * 30) + 1) : 0;
    
    return {
      totalPlans,
      completedMilestones,
      totalMilestones,
      nudgeStreak,
      totalNudgeResponses,
      daysActive
    };
  };

  const userStats = calculateUserStats();


  if (loading) return <div className={styles.loading}>Loading your profile...</div>;
  if (!user) return <div className={styles.loading}>Please log in to view your profile.</div>;

  return (
    <div className={`${styles.profileContainer} container my20`}>
      <div className={`${styles.profileHeader} slideInDown`}>
        <h1 className={styles.profileTitle}>Welcome back, {user.displayName}</h1>
        <p className={styles.email}>{user.email}</p>
      </div>
      
      {/* Gamification Dashboard */}
      <section className={`${styles.gamificationSection} section slideInUp staggerDelay1`}>
        <GamificationSystem userStats={userStats} className="mb8" />
      </section>

      {/* Plans Section */}
      <section className={`${styles.plansSection} section slideInUp staggerDelay3`}>
        <div className={`${styles.plansSectionHeader} flex justifyBetween itemsCenter mb6`}>
          <h2 className={styles.sectionTitle}>Your Plans</h2>
          <LinkButton 
            href="/profile/companion" 
            variant="primary"
            icon={<PlusIcon size={16} />}
            className={`${styles.createPlanLink} pulse`}
          >
            Create New Plan
          </LinkButton>
        </div>

        {userPlans.length > 0 ? (
          <div className={`${styles.plansGrid} gridAutoFit gapLg`}>
            {userPlans.map((plan, index) => (
              <div 
                key={plan.id} 
                className={`${styles.planCard} scaleHover slideInUp`}
                style={{ animationDelay: `${0.1 * (index + 2)}s` }}
              >
                {/* Plan Summary (Always Visible) */}
                <div
                  className={styles.planSummary}
                  onClick={() => togglePlanExpansion(plan.id)}
                >
                  <div className={styles.planHeader}>
                    <div className={styles.planTitle}>
                      {plan.goalType ?
                        plan.goalType.charAt(0).toUpperCase() + plan.goalType.slice(1) + ' Goal' :
                        'Personal Goal'
                      }
                    </div>
                    <div
                      className={styles.planStatus}
                      style={{ backgroundColor: getStatusColor(plan.status) }}
                    >
                      {plan.status.toUpperCase()}
                    </div>
                  </div>

                  <div className={styles.planGoalPreview}>
                    {plan.goal.length > 100 ?
                      plan.goal.substring(0, 100) + '...' :
                      plan.goal
                    }
                  </div>

                  <div className={styles.planMetrics}>
                    <div className={styles.metric}>
                      <span className={styles.metricLabel}>Progress:</span>
                      <span className={styles.metricValue}>
                        {getProgressPercentage(plan.milestones)}%
                      </span>
                    </div>
                    <div className={styles.metric}>
                      <span className={styles.metricLabel}>Target:</span>
                      <span className={styles.metricValue}>
                        {getDaysUntilTarget(plan.targetDate)} days
                      </span>
                    </div>
                    <div className={styles.metric}>
                      <span className={styles.metricLabel}>Milestones:</span>
                      <span className={styles.metricValue}>
                        {plan.milestones?.filter(m => m.completed).length || 0}/{plan.milestones?.length || 0}
                      </span>
                    </div>
                  </div>

                  <div className={styles.expandIcon}>
                    {expandedPlan === plan.id ? '▼' : '▶'}
                  </div>
                </div>

                {/* Plan Details (Expandable) */}
                {expandedPlan === plan.id && (
                  <div className={styles.planDetails}>
                    <div className={styles.planDetailsSection}>
                      <h4>Full Goal Description</h4>
                      <p className={styles.fullGoalText}>{plan.goal}</p>
                    </div>

                    <div className={styles.planDetailsSection}>
                      <h4>Target Date</h4>
                      <p className={styles.targetDate}>
                        {new Date(plan.targetDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>

                    {plan.hasTimePressure && (
                      <div className={styles.timePressureIndicator}>
                        ⚡ Accelerated Timeline
                      </div>
                    )}

                    <div className={styles.planDetailsSection}>
                      <h4>Milestones ({plan.milestones?.length || 0})</h4>
                      <div className={styles.enhancedMilestonesList}>
                        {plan.milestones?.map((milestone) => {
                          const status = getMilestoneStatus(milestone);
                          const notifications = status === 'current' ? milestoneNotifications[milestone.id] || [] : [];
                          const isLoadingNotification = loadingNotifications[milestone.id] || false;

                          return (
                            <MilestoneCard
                              key={milestone.id}
                              milestone={milestone}
                              status={status}
                              notifications={notifications}
                              isLoadingNotification={isLoadingNotification}
                            />
                          );
                        })}
                      </div>
                    </div>

                    <div className={styles.planDetailsSection}>
                      <div className={styles.progressBar}>
                        <div className={styles.progressBarLabel}>
                          Overall Progress: {getProgressPercentage(plan.milestones)}%
                        </div>
                        <div className={styles.progressBarTrack}>
                          <div
                            className={styles.progressBarFill}
                            style={{ width: `${getProgressPercentage(plan.milestones)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className={styles.planActions}>
                      <LinkButton 
                        href="#" 
                        variant="ghost" 
                        size="sm" 
                        icon={<EditIcon size={14} />}
                        className={styles.editPlanButton}
                      >
                        Edit Plan
                      </LinkButton>
                      <LinkButton 
                        href="#" 
                        variant="primary" 
                        size="sm" 
                        icon={<EyeIcon size={14} />}
                        className={styles.viewPlanButton}
                      >
                        View Full Plan
                      </LinkButton>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={`${styles.noPlans} fadeIn textCenter py20`}>
            <div className={`${styles.noPlansIcon} float mb6`}>
              <TargetIcon size={64} color="var(--color-neutral-400)" />
            </div>
            <h3 className="mb4">No plans yet!</h3>
            <p className="mb8">Create your first goal-oriented plan to get started on your journey.</p>
            <LinkButton 
              href="/profile/companion" 
              variant="primary"
              size="lg"
              icon={<PlusIcon size={20} />}
              className={`${styles.createFirstPlanButton} bounce`}
            >
              Create Your First Plan
            </LinkButton>
          </div>
        )}
      </section>

      {/* Enneagram Results Section */}
      {enneagramResult ? (
        <section className={`${styles.enneagramResultContainer} section slideInUp staggerDelay4`}>
          <GamifiedEnneagram enneagramResult={enneagramResult} />
        </section>
      ) : (
        <section className={`${styles.noData} section textCenter fadeIn`}>
          <p>No Enneagram results found yet.</p>
        </section>
      )}
    </div>
  );
};

export default ProfilePage;