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
  planId
}) => {
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
        background: '#dcfce7',
        border: '2px solid #22c55e',
        titleColor: '#15803d'
      };
      case 'current': return {
        background: '#eef2ff',
        border: '2px solid #818cf8',
        titleColor: '#1d4ed8'
      };
      case 'future': return {
        background: '#fafafa',
        border: '2px dashed #d1d5db',
        titleColor: '#6b7280'
      };
      default: return {
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        titleColor: '#374151'
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
        boxShadow: status === 'current' ? '0 2px 12px rgba(99, 102, 241, 0.15)' : 'none',
      }}
    >
      {/* Milestone Header */}
      <div>
        {status === 'current' && (
          <span style={{
            display: 'inline-block',
            fontSize: '0.6875rem',
            fontWeight: 700,
            color: '#4f46e5',
            background: '#c7d2fe',
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
          fontWeight: '600',
          margin: '0',
          lineHeight: '1.4'
        }}>
          {milestone.title}
        </h4>

        <p style={{
          color: status === 'future' ? '#9ca3af' : '#6b7280',
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
            color: '#9ca3af'
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
        <div style={{ marginBottom: isMobile ? '0.75rem' : '1rem' }}>
          {milestone.blindSpotTip && (
            <div style={{
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              padding: isMobile ? '0.5rem' : '0.75rem',
              borderRadius: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.25rem'
              }}>
                <AlertTriangleIcon size={16} color="#92400e" />
                <span style={{
                  fontSize: isMobile ? '0.65rem' : '0.75rem',
                  fontWeight: '600',
                  color: '#92400e'
                }}>
                  Blind Spot Alert
                </span>
              </div>
              <p style={{
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                color: '#78350f',
                margin: 0,
                lineHeight: '1.4'
              }}>
                {milestone.blindSpotTip}
              </p>
            </div>
          )}

          {milestone.strengthHook && (
            <div style={{
              background: '#d1fae5',
              border: '1px solid #10b981',
              padding: isMobile ? '0.5rem' : '0.75rem',
              borderRadius: '0.5rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.25rem'
              }}>
                <ZapIcon size={16} color="#047857" />
                <span style={{
                  fontSize: isMobile ? '0.65rem' : '0.75rem',
                  fontWeight: '600',
                  color: '#047857'
                }}>
                  Leverage Your Strength
                </span>
              </div>
              <p style={{
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                color: '#065f46',
                margin: 0,
                lineHeight: '1.4'
              }}>
                {milestone.strengthHook}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Show Gamified Nudge Slider (above steps) - hidden on goal detail page */}
      {!hideNudges && (notifications.length > 0 || isLoadingNotification) && (
        <div>
          <div style={{
            borderTop: showOnlyLatestNotification ? 'none' : '1px solid rgba(59, 130, 246, 0.2)',
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
