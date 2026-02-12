import React, { useState, useCallback } from 'react';
import GameNudgeSlider from './GameNudgeSlider';
import StepsList from './StepsList';
import { CalendarIcon, AlertTriangleIcon, ZapIcon } from './Icons';
import { Step } from '../Models/Step';

interface Milestone {
  id: string;
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  completed: boolean;
  blindSpotTip?: string;
  strengthHook?: string;
  steps?: Step[];
}

interface Notification {
  id: string;
  prompt: string;
  createdAt: any;
  feedback?: string | null;
  type: string;
}

export interface AccentTheme {
  bg: string;
  badgeBg: string;
  border: string;
  text: string;
  darkText: string;
  shadow: string;
}

// Default copper theme (used when no accentTheme is provided)
const defaultAccent: AccentTheme = {
  bg: '#FDF0E7', badgeBg: '#FAE0CE', border: '#C27A3E',
  text: '#9C4B20', darkText: '#7D3C19', shadow: 'rgba(156, 75, 32, 0.12)',
};

interface MilestoneCardProps {
  milestone: Milestone;
  status: 'completed' | 'current' | 'future';
  notifications?: Notification[];
  isLoadingNotification?: boolean;
  goalType?: string;
  enneagramData?: {
    type?: string;
    summary?: string;
    blindSpots?: string[];
    strengths?: string[];
  };
  showOnlyLatestNotification?: boolean;
  hideFeedbackStatus?: boolean;
  hideTimeline?: boolean;
  hideNudges?: boolean;
  planId?: string;
  accentTheme?: AccentTheme;
}

const MilestoneCard: React.FC<MilestoneCardProps> = ({
  milestone,
  status,
  notifications = [],
  isLoadingNotification = false,
  goalType,
  enneagramData,
  showOnlyLatestNotification = false,
  hideFeedbackStatus = false,
  hideTimeline = false,
  hideNudges = false,
  planId,
  accentTheme
}) => {
  const accent = accentTheme || defaultAccent;
  const [isMobile, setIsMobile] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Shared steps state - managed here so both StepsList and GameNudgeSlider can sync
  const [steps, setSteps] = useState<Step[]>(milestone.steps || []);

  // Check if mobile on mount
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Callback when steps change from StepsList
  const handleStepsChange = useCallback((newSteps: Step[]) => {
    setSteps(newSteps);
  }, []);

  // Callback when a step is added from the nudge action items
  const handleStepAddedFromNudge = useCallback((newStep: { id: string; title: string }) => {
    setSteps(prev => [...prev, newStep as Step]);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'completed': return {
        background: '#EEF5EF',
        border: '2px solid #3D7A4A',
        titleColor: '#274F30'
      };
      case 'current': return {
        background: accent.bg,
        border: `2px solid ${accent.border}`,
        titleColor: accent.text
      };
      case 'future': return {
        background: '#F5F3F0',
        border: '2px dashed #D5CFC8',
        titleColor: '#6B6560'
      };
      default: return {
        background: '#F5F3F0',
        border: '1px solid #E8E4DF',
        titleColor: '#44403C'
      };
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const statusStyles = getStatusColor();

  return (
    <div
      style={{
        background: statusStyles.background,
        border: statusStyles.border,
        borderRadius: status === 'current' ? '0.75rem' : '0',
        padding: isMobile ? '1rem' : '1.25rem',
        marginBottom: status === 'current' ? '0.5rem' : '0',
        position: 'relative',
        transition: 'all 0.2s ease',
        boxShadow: status === 'current' ? `0 2px 12px ${accent.shadow}` : 'none',
      }}
    >
      {/* Milestone Header */}
      <div>
        {status === 'current' && (
          <span style={{
            display: 'inline-block',
            fontSize: '0.625rem',
            fontWeight: 700,
            color: accent.darkText,
            background: accent.badgeBg,
            padding: '0.125rem 0.5rem',
            borderRadius: '1rem',
            marginBottom: '0.375rem',
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
          }}>
            In Progress
          </span>
        )}
        <h4 style={{
          color: statusStyles.titleColor,
          fontSize: isMobile ? '1rem' : '1.125rem',
          fontWeight: '700',
          margin: '0',
          lineHeight: '1.4'
        }}>
          {milestone.title}
        </h4>

        <p style={{
          color: status === 'future' ? '#9C9690' : '#6B6560',
          fontSize: isMobile ? '0.8rem' : '0.875rem',
          lineHeight: '1.5',
          margin: '0',
          fontStyle: status === 'future' ? 'italic' : 'normal'
        }}>
          {status === 'future' && '📋 Planned: '}
          {isMobile && milestone.description.length > 100 ? (
            <>
              {isExpanded ? milestone.description : `${milestone.description.substring(0, 100)}...`}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                  display: 'block',
                  marginTop: '0.25rem',
                  background: 'none',
                  border: 'none',
                  color: statusStyles.titleColor,
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                {isExpanded ? 'Show less' : 'Read more'}
              </button>
            </>
          ) : (
            milestone.description
          )}
        </p>
      </div>

      {/* Timeline - Show unless hideTimeline is true */}
      {!hideTimeline && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginTop: '0.75rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem'
          }}>
            <CalendarIcon size={14} color={statusStyles.titleColor} />
            <span style={{
              fontSize: isMobile ? '0.75rem' : '0.8125rem',
              color: statusStyles.titleColor,
              fontWeight: '500'
            }}>
              {formatDate(milestone.startDate)}
            </span>
          </div>
          <span style={{
            fontSize: isMobile ? '0.75rem' : '0.8125rem',
            color: '#9C9690'
          }}>
            →
          </span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem'
          }}>
            <CalendarIcon size={14} color={statusStyles.titleColor} />
            <span style={{
              fontSize: isMobile ? '0.75rem' : '0.8125rem',
              color: statusStyles.titleColor,
              fontWeight: '500'
            }}>
              {formatDate(milestone.dueDate)}
            </span>
          </div>
        </div>
      )}

      {/* Personality Tips - Only show for current milestones */}
      {status === 'current' && (milestone.blindSpotTip || milestone.strengthHook) && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.625rem',
          marginBottom: 0,
        }}>
          {milestone.blindSpotTip && (
            <div style={{
              display: 'flex',
              gap: isMobile ? '0.625rem' : '0.75rem',
              alignItems: 'flex-start',
              background: '#FFFFFF',
              border: '1px solid #E8D5D3',
              borderRadius: '0.75rem',
              padding: isMobile ? '0.75rem' : '1rem',
              boxShadow: '0 2px 8px rgba(184, 74, 66, 0.08)',
            }}>
              <div style={{
                width: isMobile ? '36px' : '40px',
                height: isMobile ? '36px' : '40px',
                minWidth: isMobile ? '36px' : '40px',
                borderRadius: '10px',
                background: '#B84A42',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '2px',
              }}>
                <AlertTriangleIcon size={isMobile ? 16 : 18} color="#FFFFFF" />
              </div>
              <div>
                <span style={{
                  display: 'block',
                  fontSize: isMobile ? '0.6875rem' : '0.75rem',
                  fontWeight: '700',
                  color: '#B84A42',
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                  marginBottom: '0.25rem',
                }}>
                  Blind Spot Alert
                </span>
                <p style={{
                  fontSize: isMobile ? '0.8125rem' : '0.875rem',
                  color: '#44403C',
                  margin: 0,
                  lineHeight: '1.5',
                }}>
                  {milestone.blindSpotTip}
                </p>
              </div>
            </div>
          )}

          {milestone.strengthHook && (
            <div style={{
              display: 'flex',
              gap: isMobile ? '0.625rem' : '0.75rem',
              alignItems: 'flex-start',
              background: '#FFFFFF',
              border: '1px solid #C8DEC9',
              borderRadius: '0.75rem',
              padding: isMobile ? '0.75rem' : '1rem',
              boxShadow: '0 2px 8px rgba(61, 122, 74, 0.08)',
            }}>
              <div style={{
                width: isMobile ? '36px' : '40px',
                height: isMobile ? '36px' : '40px',
                minWidth: isMobile ? '36px' : '40px',
                borderRadius: '10px',
                background: '#3D7A4A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '2px',
              }}>
                <ZapIcon size={isMobile ? 16 : 18} color="#FFFFFF" />
              </div>
              <div>
                <span style={{
                  display: 'block',
                  fontSize: isMobile ? '0.6875rem' : '0.75rem',
                  fontWeight: '700',
                  color: '#3D7A4A',
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                  marginBottom: '0.25rem',
                }}>
                  Leverage Your Strength
                </span>
                <p style={{
                  fontSize: isMobile ? '0.8125rem' : '0.875rem',
                  color: '#44403C',
                  margin: 0,
                  lineHeight: '1.5',
                }}>
                  {milestone.strengthHook}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Show Gamified Nudge Slider (above steps) - hidden on goal detail page */}
      {!hideNudges && (notifications.length > 0 || isLoadingNotification) && (
        <div>
          <div style={{
            borderTop: showOnlyLatestNotification ? 'none' : `1px solid ${accent.border}33`,
            paddingTop: isMobile ? '0.75rem' : '1rem'
          }}>
            <GameNudgeSlider
              notifications={notifications}
              isLoading={isLoadingNotification}
              milestoneStartDate={milestone.startDate}
              milestoneDueDate={milestone.dueDate}
              milestoneTitle={milestone.title}
              milestoneDescription={milestone.description}
              goalType={goalType}
              enneagramData={enneagramData}
              showOnlyLatest={showOnlyLatestNotification}
              hideFeedbackStatus={hideFeedbackStatus}
              compactView={showOnlyLatestNotification}
              flatLayout={showOnlyLatestNotification}
              planId={planId}
              milestoneId={milestone.id}
              onStepAdded={handleStepAddedFromNudge}
              existingStepTitles={steps.map(s => s.title)}
            />
          </div>
        </div>
      )}

      {/* Steps Section - Show for current milestones (below nudge) */}
      {status === 'current' && planId && (
        <StepsList
          planId={planId}
          milestoneId={milestone.id}
          initialSteps={steps}
          onStepsChange={handleStepsChange}
        />
      )}
    </div>
  );
};

export default MilestoneCard;
