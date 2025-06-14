import React, { useState } from 'react';
import { StarIcon, TrophyIcon, ZapIcon, SparklesIcon } from './Icons';
import { EnneagramResult } from '../Models/EnneagramResult';

interface GamifiedEnneagramProps {
  enneagramResult: EnneagramResult;
  className?: string;
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

const typeEmojis = {
  enneagramType1: '⚖️',
  enneagramType2: '❤️',
  enneagramType3: '🏆',
  enneagramType4: '🎨',
  enneagramType5: '🔍',
  enneagramType6: '🛡️',
  enneagramType7: '🎉',
  enneagramType8: '💪',
  enneagramType9: '☮️',
};

const GamifiedEnneagram: React.FC<GamifiedEnneagramProps> = ({ 
  enneagramResult, 
  className = '' 
}) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Get top 3 types for highlights
  const typeEntries = Object.entries(enneagramResult)
    .filter(([key]) => key.startsWith("enneagramType"))
    .sort(([, a], [, b]) => (b as number) - (a as number));

  const topType = typeEntries[0];
  const secondType = typeEntries[1];
  const thirdType = typeEntries[2];

  const getTypeRank = (key: string): 'first' | 'second' | 'third' | 'other' => {
    if (key === topType[0]) return 'first';
    if (key === secondType[0]) return 'second';
    if (key === thirdType[0]) return 'third';
    return 'other';
  };

  const getRankIcon = (rank: 'first' | 'second' | 'third' | 'other') => {
    switch (rank) {
      case 'first': return <TrophyIcon size={20} color="#FFD700" />;
      case 'second': return <StarIcon size={18} color="#C0C0C0" />;
      case 'third': return <SparklesIcon size={16} color="#CD7F32" />;
      default: return null;
    }
  };

  const getRankColors = (rank: 'first' | 'second' | 'third' | 'other') => {
    switch (rank) {
      case 'first': return {
        background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
        border: '3px solid #FFD700',
        glow: '0 0 20px rgba(255, 215, 0, 0.4)'
      };
      case 'second': return {
        background: 'linear-gradient(135deg, #E6E6FA 0%, #C0C0C0 100%)',
        border: '2px solid #C0C0C0',
        glow: '0 0 15px rgba(192, 192, 192, 0.3)'
      };
      case 'third': return {
        background: 'linear-gradient(135deg, #DEB887 0%, #CD7F32 100%)',
        border: '2px solid #CD7F32',
        glow: '0 0 12px rgba(205, 127, 50, 0.3)'
      };
      default: return {
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        border: '1px solid #cbd5e1',
        glow: 'none'
      };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'var(--color-success-500)';
    if (score >= 6) return 'var(--color-warning-500)';
    if (score >= 4) return 'var(--color-primary-500)';
    return 'var(--color-neutral-400)';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return 'Dominant';
    if (score >= 6) return 'Strong';
    if (score >= 4) return 'Moderate';
    return 'Mild';
  };

  return (
    <div className={`gamified-enneagram ${className}`}>
      {/* Header with Podium Style */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '1rem',
        padding: '2rem',
        color: 'white',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          pointerEvents: 'none'
        }} />
        
        <div style={{
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            margin: '0 0 1rem 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem'
          }}>
            <TrophyIcon size={32} color="#FFD700" />
            Your Personality Profile
          </h2>
          
          {/* Top 3 Podium */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'end',
            gap: '1rem',
            marginTop: '2rem'
          }}>
            {/* Second Place */}
            <div style={{
              textAlign: 'center',
              transform: 'translateY(20px)'
            }}>
              <div style={{
                background: 'var(--color-neutral-100)',
                border: '2px solid var(--color-neutral-300)',
                borderRadius: '50%',
                width: '60px',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                margin: '0 auto 0.5rem'
              }}>
                {typeEmojis[secondType[0] as keyof typeof typeEmojis]}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>2nd</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)' }}>{secondType[1]}</div>
            </div>

            {/* First Place */}
            <div style={{
              textAlign: 'center',
              transform: 'scale(1.1)'
            }}>
              <div style={{
                background: 'var(--color-warning-100)',
                border: '3px solid var(--color-warning-400)',
                borderRadius: '50%',
                width: '80px',
                height: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                margin: '0 auto 0.5rem',
                position: 'relative'
              }}>
                {typeEmojis[topType[0] as keyof typeof typeEmojis]}
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  background: 'var(--color-warning-400)',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: 'white'
                }}>
                  👑
                </div>
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Dominant</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)' }}>{topType[1]}</div>
            </div>

            {/* Third Place */}
            <div style={{
              textAlign: 'center',
              transform: 'translateY(30px)'
            }}>
              <div style={{
                background: 'var(--color-neutral-50)',
                border: '2px solid var(--color-neutral-200)',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                margin: '0 auto 0.5rem'
              }}>
                {typeEmojis[thirdType[0] as keyof typeof typeEmojis]}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>3rd</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--text-primary)' }}>{thirdType[1]}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {typeEntries.map(([key, value], index) => {
          const rank = getTypeRank(key);
          const colors = getRankColors(rank);
          const score = value as number;
          const isSelected = selectedType === key;
          
          return (
            <div
              key={key}
              onClick={() => setSelectedType(isSelected ? null : key)}
              style={{
                background: colors.background,
                border: colors.border,
                borderRadius: '1rem',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                boxShadow: isSelected ? colors.glow : 'none',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Rank badge */}
              {rank !== 'other' && (
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  {getRankIcon(rank)}
                </div>
              )}

              {/* Type Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  fontSize: '2rem',
                  filter: rank === 'other' ? 'grayscale(50%)' : 'none'
                }}>
                  {typeEmojis[key as keyof typeof typeEmojis]}
                </div>
                <div>
                  <h3 style={{
                    margin: 0,
                    fontSize: '1.125rem',
                    fontWeight: 'bold',
                    color: rank === 'other' ? '#374151' : '#1f2937'
                  }}>
                    {enneagramLabels[key as keyof typeof enneagramLabels]}
                  </h3>
                </div>
              </div>

              {/* Score Display */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{
                    fontSize: '2rem',
                    fontWeight: 'var(--font-weight-bold)',
                    color: rank === 'other' ? 'var(--text-secondary)' : 'var(--text-primary)'
                  }}>
                    {score}
                  </span>
                  <span style={{
                    background: getScoreColor(score),
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    {getScoreLabel(score)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div style={{
                  background: 'var(--color-neutral-200)',
                  borderRadius: '10px',
                  height: '8px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    background: getScoreColor(score),
                    width: `${(score / 10) * 100}%`,
                    height: '100%',
                    borderRadius: '10px',
                    transition: 'width 0.8s ease'
                  }} />
                </div>
              </div>

              {/* Expandable Description */}
              {isSelected && (
                <div style={{
                  background: 'rgba(255,255,255,0.9)',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  fontSize: '0.875rem',
                  color: '#374151',
                  animation: 'slideDown 0.3s ease-out'
                }}>
                  <p style={{ margin: 0 }}>
                    Click to learn more about your {enneagramLabels[key as keyof typeof enneagramLabels].toLowerCase()} traits and how they influence your goal achievement style.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Gamified Summary */}
      <div style={{
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        borderRadius: '1rem',
        padding: '2rem',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 70% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          pointerEvents: 'none'
        }} />
        
        <div style={{
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <ZapIcon size={24} />
            <h3 style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}>
              Your Personality Insights
            </h3>
          </div>
          
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            backdropFilter: 'blur(10px)'
          }}>
            <p style={{
              margin: 0,
              fontSize: '1.125rem',
              lineHeight: '1.6',
              fontWeight: '500'
            }}>
              {enneagramResult.summary}
            </p>
          </div>

          {/* Achievement-style stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
            marginTop: '1.5rem'
          }}>
            <div style={{
              textAlign: 'center',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '0.5rem',
              padding: '1rem'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎯</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                {enneagramLabels[topType[0] as keyof typeof enneagramLabels].split('–')[1].trim()}
              </div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Primary Type</div>
            </div>
            
            <div style={{
              textAlign: 'center',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '0.5rem',
              padding: '1rem'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📊</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                {topType[1]}%
              </div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Dominance Score</div>
            </div>
            
            <div style={{
              textAlign: 'center',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '0.5rem',
              padding: '1rem'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎪</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                {typeEntries.filter(([, score]) => (score as number) >= 40).length}
              </div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Strong Types</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .gamified-enneagram div:hover {
          transition: all 0.3s ease;
        }
      `}</style>
    </div>
  );
};

export default GamifiedEnneagram;