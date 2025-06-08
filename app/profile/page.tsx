"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import styles from '../../Styles/profile.module.css';
import { EnneagramResult } from '../../Models/EnneagramResult';
import Link from 'next/link';

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
  dueDate: string;
  completed: boolean;
  blindSpotTip?: string;
  strengthHook?: string;
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

  if (loading) return <div className={styles.loading}>Loading your profile...</div>;
  if (!user) return <div className={styles.loading}>Please log in to view your profile.</div>;

  return (
    <div className={styles.profileContainer}>
      <h1 className={styles.profileTitle}>Welcome back, {user.displayName}</h1>
      <p className={styles.email}>{user.email}</p>
      {/* Plans Section */}
      <div className={styles.plansSection}>
        <div className={styles.plansSectionHeader}>
          <h2 className={styles.sectionTitle}>Your Plans</h2>
          <Link href="/profile/companion" className={styles.createPlanLink}>
            + Create New Plan
          </Link>
        </div>

        {userPlans.length > 0 ? (
          <div className={styles.plansGrid}>
            {userPlans.map((plan) => (
              <div key={plan.id} className={styles.planCard}>
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
                      <div className={styles.milestonesList}>
                        {plan.milestones?.map((milestone) => (
                          <div
                            key={milestone.id}
                            className={`${styles.milestoneItem} ${
                              milestone.completed ? styles.milestoneCompleted : ''
                            }`}
                          >
                            <div className={styles.milestoneHeader}>
                              <span className={styles.milestoneCheckbox}>
                                {milestone.completed ? '✅' : '⏳'}
                              </span>
                              <span className={styles.milestoneTitle}>
                                {milestone.title}
                              </span>
                              <span className={styles.milestoneDueDate}>
                                {new Date(milestone.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                            <p className={styles.milestoneDescription}>
                              {milestone.description}
                            </p>

                            {/* Personality Tips */}
                            {(milestone.blindSpotTip || milestone.strengthHook) && (
                              <div className={styles.personalityTips}>
                                {milestone.blindSpotTip && (
                                  <div className={styles.tip}>
                                    <span className={styles.tipIcon}>⚠️</span>
                                    <span className={styles.tipText}>{milestone.blindSpotTip}</span>
                                  </div>
                                )}
                                {milestone.strengthHook && (
                                  <div className={styles.tip}>
                                    <span className={styles.tipIcon}>💪</span>
                                    <span className={styles.tipText}>{milestone.strengthHook}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
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
                      <button className={styles.editPlanButton}>
                        ✏️ Edit Plan
                      </button>
                      <button className={styles.viewPlanButton}>
                        👁️ View Full Plan
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.noPlans}>
            <div className={styles.noPlansIcon}>🎯</div>
            <h3>No plans yet!</h3>
            <p>Create your first goal-oriented plan to get started on your journey.</p>
            <Link href="/profile/companion" className={styles.createFirstPlanButton}>
              Create Your First Plan
            </Link>
          </div>
        )}
      </div>

      {/* Enneagram Results Section */}
      {enneagramResult ? (
        <div className={styles.enneagramResultContainer}>
          <h2 className={styles.sectionTitle}>Your Enneagram Scores</h2>
          <div className={styles.enneagramGrid}>
            {Object.entries(enneagramResult)
              .filter(([key]) => key.startsWith("enneagramType"))
              .map(([key, value]) => (
                <div className={styles.enneagramItem} key={key}>
                  <div className={styles.enneagramType}>
                    {enneagramLabels[key as keyof typeof enneagramLabels] || key}
                  </div>
                  <div className={styles.enneagramValue}>Score: {value}</div>
                  <div className={styles.enneagramDescription}>📝 Explanation coming soon</div>
                </div>
              ))}
          </div>
          <div className={styles.summary}>
            <h3>Summary</h3>
            <p>{enneagramResult.summary}</p>
          </div>
        </div>
      ) : (
        <div className={styles.noData}>No Enneagram results found yet.</div>
      )}
    </div>
  );
};

export default ProfilePage;