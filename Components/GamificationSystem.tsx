import React from 'react';
import { CheckCircleIcon, TrophyIcon, ZapIcon, FireIcon, StarIcon } from './Icons';

interface UserStats {
  totalPlans: number;
  completedMilestones: number;
  totalMilestones: number;
  nudgeStreak: number;
  totalNudgeResponses: number;
  daysActive: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  requirement: string;
  progress?: number;
  maxProgress?: number;
}

interface GamificationSystemProps {
  userStats: UserStats;
  className?: string;
}

const GamificationSystem: React.FC<GamificationSystemProps> = ({ userStats, className = '' }) => {
  const [isMobile, setIsMobile] = React.useState(false);
  const [isStatsExpanded, setIsStatsExpanded] = React.useState(false);
  const [isAchievementsExpanded, setIsAchievementsExpanded] = React.useState(false);

  // Check if mobile on mount
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate user level based on total activity
  const calculateLevel = (stats: UserStats) => {
    const totalXP =
      (stats.completedMilestones * 100) +
      (stats.totalNudgeResponses * 25) +
      (stats.nudgeStreak * 10) +
      (stats.totalPlans * 200) +
      (stats.daysActive * 5);

    return Math.floor(totalXP / 500) + 1; // Level up every 500 XP
  };

  const calculateXPForNextLevel = (stats: UserStats) => {
    const currentLevel = calculateLevel(stats);
    const totalXP =
      (stats.completedMilestones * 100) +
      (stats.totalNudgeResponses * 25) +
      (stats.nudgeStreak * 10) +
      (stats.totalPlans * 200) +
      (stats.daysActive * 5);
    const xpForCurrentLevel = (currentLevel - 1) * 500;
    const xpForNextLevel = currentLevel * 500;
    const currentLevelProgress = totalXP - xpForCurrentLevel;
    const progressPercentage = (currentLevelProgress / 500) * 100;

    return {
      currentXP: currentLevelProgress,
      neededXP: 500 - currentLevelProgress,
      progressPercentage: Math.min(progressPercentage, 100)
    };
  };

  // Generate achievements based on user stats
  const generateAchievements = (stats: UserStats): Achievement[] => {
    return [
      {
        id: 'first_plan',
        title: 'Goal Setter',
        description: 'Created your first plan',
        icon: '🎯',
        unlocked: stats.totalPlans >= 1,
        requirement: 'Create 1 plan',
        progress: Math.min(stats.totalPlans, 1),
        maxProgress: 1
      },
      {
        id: 'milestone_achiever',
        title: 'Milestone Master',
        description: 'Completed 5 milestones',
        icon: '🏆',
        unlocked: stats.completedMilestones >= 5,
        requirement: 'Complete 5 milestones',
        progress: Math.min(stats.completedMilestones, 5),
        maxProgress: 5
      },
      {
        id: 'streak_keeper',
        title: 'Consistency King',
        description: 'Maintained a 7-day nudge streak',
        icon: '🔥',
        unlocked: stats.nudgeStreak >= 7,
        requirement: 'Keep 7-day streak',
        progress: Math.min(stats.nudgeStreak, 7),
        maxProgress: 7
      },
      {
        id: 'active_participant',
        title: 'Engaged Achiever',
        description: 'Responded to 20 nudges',
        icon: '💬',
        unlocked: stats.totalNudgeResponses >= 20,
        requirement: 'Respond to 20 nudges',
        progress: Math.min(stats.totalNudgeResponses, 20),
        maxProgress: 20
      },
      {
        id: 'dedication',
        title: 'Dedicated Dreamer',
        description: 'Active for 30 days',
        icon: '⭐',
        unlocked: stats.daysActive >= 30,
        requirement: 'Stay active 30 days',
        progress: Math.min(stats.daysActive, 30),
        maxProgress: 30
      },
      {
        id: 'overachiever',
        title: 'Overachiever',
        description: 'Completed 20 milestones',
        icon: '💎',
        unlocked: stats.completedMilestones >= 20,
        requirement: 'Complete 20 milestones',
        progress: Math.min(stats.completedMilestones, 20),
        maxProgress: 20
      }
    ];
  };

  const userLevel = calculateLevel(userStats);
  const xpProgress = calculateXPForNextLevel(userStats);
  const achievements = generateAchievements(userStats);
  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const completionRate = userStats.totalMilestones > 0 ? Math.round((userStats.completedMilestones / userStats.totalMilestones) * 100) : 0;

  return (
    <div className={`gamification-system ${className}`}>

      {/* Mobile Stats Header */}
      {isMobile && (
        <div
          onClick={() => setIsStatsExpanded(!isStatsExpanded)}
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--color-primary-200)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '1rem',
            marginBottom: '1rem',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <TrophyIcon size={20} color="var(--color-primary-600)" />
            <div>
              <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                Level {userLevel} • {completionRate}% Complete
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {unlockedAchievements.length} achievements unlocked
              </div>
            </div>
          </div>
          <div style={{ color: 'var(--color-primary-600)' }}>
            {isStatsExpanded ? '▼' : '▶'}
          </div>
        </div>
      )}

      {/* Progress Stats Grid */}
      <div style={{
        display: isMobile && !isStatsExpanded ? 'none' : 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: isMobile ? '0.75rem' : '1rem',
        marginBottom: isMobile ? '1rem' : '1.5rem'
      }}>
        <div style={{
          background: 'var(--bg-primary)',
          border: isMobile ? '1px solid var(--color-success-200)' : '2px solid var(--color-success-200)',
          borderRadius: 'var(--border-radius-lg)',
          padding: isMobile ? '0.875rem' : '1.25rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            color: 'var(--color-success-600)',
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            marginBottom: '0.5rem'
          }}>
            ✅
          </div>
          <div style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--text-primary)'
          }}>
            {userStats.completedMilestones}
          </div>
          <div style={{
            fontSize: isMobile ? '0.75rem' : '0.875rem',
            color: 'var(--text-secondary)',
            marginTop: '0.25rem'
          }}>
            Completed
          </div>
        </div>

        <div style={{
          background: 'var(--bg-primary)',
          border: '2px solid var(--color-warning-200)',
          borderRadius: 'var(--border-radius-lg)',
          padding: '1.25rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            color: 'var(--color-warning-600)',
            fontSize: '1.5rem',
            marginBottom: '0.5rem'
          }}>
            🔥
          </div>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--text-primary)'
          }}>
            {userStats.nudgeStreak}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            marginTop: '0.25rem'
          }}>
            Day Streak
          </div>
        </div>

        <div style={{
          background: 'var(--bg-primary)',
          border: '2px solid var(--color-primary-200)',
          borderRadius: 'var(--border-radius-lg)',
          padding: '1.25rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            color: 'var(--color-primary-600)',
            fontSize: '1.5rem',
            marginBottom: '0.5rem'
          }}>
            📊
          </div>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--text-primary)'
          }}>
            {completionRate}%
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            marginTop: '0.25rem'
          }}>
            Progress
          </div>
        </div>

        <div style={{
          background: 'var(--bg-primary)',
          border: '2px solid var(--color-secondary-200)',
          borderRadius: 'var(--border-radius-lg)',
          padding: '1.25rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            color: 'var(--color-secondary-600)',
            fontSize: '1.5rem',
            marginBottom: '0.5rem'
          }}>
            📋
          </div>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--text-primary)'
          }}>
            {userStats.totalPlans}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            marginTop: '0.25rem'
          }}>
            Active Plans
          </div>
        </div>
      </div>

      {/* Learning Milestones */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius-xl)',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        {/* Mobile Achievements Header */}
        {isMobile ? (
          <div
            onClick={() => setIsAchievementsExpanded(!isAchievementsExpanded)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              cursor: 'pointer'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <TrophyIcon size={20} color="var(--color-warning-600)" />
              <div>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)'
                }}>
                  Achievements
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)'
                }}>
                  {unlockedAchievements.length}/{achievements.length} unlocked
                </div>
              </div>
            </div>
            <div style={{ color: 'var(--color-primary-600)' }}>
              {isAchievementsExpanded ? '▼' : '▶'}
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <TrophyIcon size={20} color="var(--color-warning-600)" />
            <h3 style={{
              margin: 0,
              fontSize: '1.125rem',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)'
            }}>
              Learning Milestones ({unlockedAchievements.length}/{achievements.length})
            </h3>
          </div>
        )}

        <div style={{
          display: isMobile && !isAchievementsExpanded ? 'none' : 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: isMobile ? '0.75rem' : '1rem'
        }}>
          {achievements.slice(0, 6).map((achievement) => (
            <div
              key={achievement.id}
              style={{
                background: achievement.unlocked
                  ? 'var(--bg-primary)'
                  : 'var(--bg-tertiary)',
                border: achievement.unlocked
                  ? (isMobile ? '1px solid var(--color-success-400)' : '2px solid var(--color-success-400)')
                  : '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-lg)',
                padding: isMobile ? '0.75rem' : '1rem',
                textAlign: 'center',
                opacity: achievement.unlocked ? 1 : 0.7,
                boxShadow: achievement.unlocked ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                fontSize: isMobile ? '1.5rem' : '2rem',
                marginBottom: '0.5rem',
                filter: achievement.unlocked ? 'none' : 'grayscale(100%)'
              }}>
                {achievement.icon}
              </div>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                fontWeight: 'var(--font-weight-semibold)',
                color: achievement.unlocked ? 'var(--text-primary)' : 'var(--text-secondary)',
                marginBottom: '0.25rem'
              }}>
                {achievement.title}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-tertiary)',
                marginBottom: '0.5rem'
              }}>
                {achievement.description}
              </div>

              {!achievement.unlocked && achievement.maxProgress && (
                <div style={{
                  background: '#e5e7eb',
                  borderRadius: '10px',
                  height: '4px',
                  overflow: 'hidden',
                  marginTop: '0.5rem'
                }}>
                  <div style={{
                    background: '#6b7280',
                    width: `${((achievement.progress || 0) / achievement.maxProgress) * 100}%`,
                    height: '100%',
                    borderRadius: '10px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              )}

              {achievement.unlocked && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.25rem',
                  marginTop: '0.5rem'
                }}>
                  <CheckCircleIcon size={14} color="#10b981" />
                  <span style={{
                    fontSize: '0.7rem',
                    color: '#10b981',
                    fontWeight: 'bold'
                  }}>
                    UNLOCKED
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .gamification-system {
          position: relative;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        @keyframes glow {
          0% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.5); }
          50% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.8); }
          100% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.5); }
        }
      `}</style>
    </div>
  );
};

export default GamificationSystem;