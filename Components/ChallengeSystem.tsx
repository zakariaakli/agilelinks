import React, { useState, useEffect } from 'react';
import { ZapIcon, FireIcon, StarIcon, ClockIcon, CheckCircleIcon } from './Icons';

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly';
  pointsReward: number;
  progress: number;
  maxProgress: number;
  completed: boolean;
  expiresAt: Date;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface ChallengeSystemProps {
  userStats: {
    totalPlans: number;
    completedMilestones: number;
    nudgeStreak: number;
    totalNudgeResponses: number;
  };
  onChallengeComplete?: (challengeId: string, pointsEarned: number) => void;
  className?: string;
}

const ChallengeSystem: React.FC<ChallengeSystemProps> = ({ 
  userStats, 
  onChallengeComplete,
  className = '' 
}) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedTab, setSelectedTab] = useState<'daily' | 'weekly'>('daily');

  // Generate challenges based on user stats and current date
  useEffect(() => {
    const generateChallenges = (): Challenge[] => {
      const now = new Date();
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);
      
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() + (7 - now.getDay())); // Next Sunday
      weekEnd.setHours(23, 59, 59, 999);

      const dailyChallenges: Challenge[] = [
        {
          id: 'daily_nudge_response',
          title: 'Daily Check-in',
          description: 'Respond to at least one nudge today',
          type: 'daily',
          pointsReward: 5,
          progress: 0, // This would be updated based on today's responses
          maxProgress: 1,
          completed: false,
          expiresAt: todayEnd,
          icon: '💬',
          difficulty: 'easy'
        },
        {
          id: 'daily_milestone_progress',
          title: 'Milestone Momentum',
          description: 'Make progress on your current milestone',
          type: 'daily',
          pointsReward: 10,
          progress: 0,
          maxProgress: 1,
          completed: false,
          expiresAt: todayEnd,
          icon: '🎯',
          difficulty: 'medium'
        },
        {
          id: 'daily_reflection',
          title: 'Quick Reflection',
          description: 'Spend 5 minutes reflecting on your goals',
          type: 'daily',
          pointsReward: 3,
          progress: 0,
          maxProgress: 1,
          completed: false,
          expiresAt: todayEnd,
          icon: '🤔',
          difficulty: 'easy'
        }
      ];

      const weeklyChallenges: Challenge[] = [
        {
          id: 'weekly_milestone_complete',
          title: 'Milestone Master',
          description: 'Complete 1 milestone this week',
          type: 'weekly',
          pointsReward: 25,
          progress: 0,
          maxProgress: 1,
          completed: false,
          expiresAt: weekEnd,
          icon: '🏆',
          difficulty: 'medium'
        },
        {
          id: 'weekly_streak_maintain',
          title: 'Consistency Champion',  
          description: 'Maintain your nudge streak for 7 days',
          type: 'weekly',
          pointsReward: 20,
          progress: Math.min(userStats.nudgeStreak, 7),
          maxProgress: 7,
          completed: userStats.nudgeStreak >= 7,
          expiresAt: weekEnd,
          icon: '🔥',
          difficulty: 'hard'
        },
        {
          id: 'weekly_engagement',
          title: 'Active Participant',
          description: 'Respond to 5 nudges this week',
          type: 'weekly',
          pointsReward: 15,
          progress: 0, // This would be updated based on this week's responses
          maxProgress: 5,
          completed: false,
          expiresAt: weekEnd,
          icon: '📊',
          difficulty: 'medium'
        }
      ];

      return [...dailyChallenges, ...weeklyChallenges];
    };

    setChallenges(generateChallenges());
  }, [userStats]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Easy';
      case 'medium': return 'Medium';
      case 'hard': return 'Hard';
      default: return 'Unknown';
    }
  };

  const getTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const handleChallengeAction = (challenge: Challenge) => {
    if (challenge.completed) return;
    
    // Simulate completing the challenge
    const updatedChallenges = challenges.map(c => {
      if (c.id === challenge.id) {
        const newProgress = Math.min(c.progress + 1, c.maxProgress);
        const isCompleted = newProgress >= c.maxProgress;
        
        if (isCompleted && onChallengeComplete) {
          onChallengeComplete(c.id, c.pointsReward);
        }
        
        return {
          ...c,
          progress: newProgress,
          completed: isCompleted
        };
      }
      return c;
    });
    
    setChallenges(updatedChallenges);
  };

  const currentChallenges = challenges.filter(c => c.type === selectedTab);
  const completedCount = currentChallenges.filter(c => c.completed).length;
  const totalPointsAvailable = currentChallenges.reduce((sum, c) => sum + c.pointsReward, 0);
  const earnedPoints = currentChallenges.filter(c => c.completed).reduce((sum, c) => sum + c.pointsReward, 0);

  return (
    <div className={`challenge-system ${className}`}>
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--color-primary-200)',
        borderRadius: 'var(--border-radius-xl)',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              background: 'var(--color-primary-100)',
              borderRadius: '50%',
              padding: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ZapIcon size={20} color="var(--color-primary-600)" />
            </div>
            <div>
              <h3 style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-primary)'
              }}>
                Learning Challenges
              </h3>
              <p style={{
                margin: 0,
                fontSize: '0.875rem',
                color: 'var(--text-secondary)'
              }}>
                Complete activities to earn progress points
              </p>
            </div>
          </div>
          
          <div style={{
            textAlign: 'right',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ 
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)'
            }}>
              {completedCount}/{currentChallenges.length} Complete
            </div>
            <div>
              {earnedPoints}/{totalPointsAvailable} Points
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '0.5rem',
          padding: '0.25rem',
          marginBottom: '1.5rem'
        }}>
          <button
            onClick={() => setSelectedTab('daily')}
            style={{
              flex: 1,
              background: selectedTab === 'daily' 
                ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
                : 'transparent',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              padding: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Daily Challenges
          </button>
          <button
            onClick={() => setSelectedTab('weekly')}
            style={{
              flex: 1,
              background: selectedTab === 'weekly' 
                ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
                : 'transparent',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              padding: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Weekly Challenges
          </button>
        </div>

        {/* Challenge List */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {currentChallenges.map((challenge) => (
            <div
              key={challenge.id}
              style={{
                background: challenge.completed 
                  ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                  : 'rgba(255,255,255,0.05)',
                border: challenge.completed 
                  ? '2px solid #34d399'
                  : '2px solid rgba(255,255,255,0.1)',
                borderRadius: '0.75rem',
                padding: '1.25rem',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Challenge Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>
                    {challenge.icon}
                  </span>
                  <div>
                    <h4 style={{
                      margin: 0,
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      color: challenge.completed ? 'white' : '#f1f5f9'
                    }}>
                      {challenge.title}
                    </h4>
                    <p style={{
                      margin: 0,
                      fontSize: '0.875rem',
                      opacity: 0.8,
                      color: challenge.completed ? 'white' : '#cbd5e1'
                    }}>
                      {challenge.description}
                    </p>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    background: getDifficultyColor(challenge.difficulty),
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    {getDifficultyLabel(challenge.difficulty)}
                  </div>
                  <div style={{
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    +{challenge.pointsReward} pts
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '10px',
                height: '6px',
                overflow: 'hidden',
                marginBottom: '0.75rem'
              }}>
                <div style={{
                  background: challenge.completed 
                    ? '#34d399'
                    : 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)',
                  width: `${(challenge.progress / challenge.maxProgress) * 100}%`,
                  height: '100%',
                  borderRadius: '10px',
                  transition: 'width 0.3s ease'
                }} />
              </div>

              {/* Footer */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: 0.8
                }}>
                  <ClockIcon size={14} />
                  <span>{getTimeRemaining(challenge.expiresAt)}</span>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  {challenge.completed ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      color: '#34d399',
                      fontWeight: 'bold'
                    }}>
                      <CheckCircleIcon size={14} />
                      COMPLETED
                    </div>
                  ) : (
                    <button
                      onClick={() => handleChallengeAction(challenge)}
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        padding: '0.5rem 1rem',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Take Action
                    </button>
                  )}
                  
                  <span style={{
                    opacity: 0.8,
                    fontWeight: 'bold'
                  }}>
                    {challenge.progress}/{challenge.maxProgress}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .challenge-system button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .challenge-system > div > div:last-child > div {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ChallengeSystem;