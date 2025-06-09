import React from 'react';
import NotificationPreview from './NotificationPreview';
import { CheckCircleIcon, ClockIcon, CalendarIcon, AlertTriangleIcon, ZapIcon } from './Icons';

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

interface MilestoneCardProps {
  milestone: Milestone;
  status: 'completed' | 'current' | 'future';
  notification?: Notification | null;
  isLoadingNotification?: boolean;
}

const MilestoneCard: React.FC<MilestoneCardProps> = ({ 
  milestone, 
  status, 
  notification,
  isLoadingNotification = false
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed': return <CheckCircleIcon size={16} />;
      case 'current': return <ClockIcon size={16} />;
      case 'future': return <CalendarIcon size={16} />;
      default: return <CalendarIcon size={16} />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed': return {
        background: '#dcfce7',
        border: '2px solid #22c55e',
        titleColor: '#15803d'
      };
      case 'current': return {
        background: 'linear-gradient(135deg, #dbeafe 0%, #fef3c7 100%)',
        border: '2px solid #3b82f6',
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

  const getStatusLabel = () => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'current': return 'In Progress';
      case 'future': return 'Upcoming';
      default: return 'Pending';
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
        borderRadius: '0.75rem',
        padding: '1.25rem',
        marginBottom: '1rem',
        position: 'relative',
        transition: 'all 0.2s ease',
        boxShadow: status === 'current' 
          ? '0 8px 25px rgba(59, 130, 246, 0.15)' 
          : '0 2px 8px rgba(0, 0, 0, 0.05)'
      }}
    >
      {/* Status Badge */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        background: status === 'current' ? '#3b82f6' : 
                   status === 'completed' ? '#22c55e' : '#6b7280',
        color: 'white',
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600'
      }}>
        {getStatusIcon()} {getStatusLabel()}
      </div>

      {/* Milestone Header */}
      <div style={{ marginRight: '6rem' }}>
        <h4 style={{
          color: statusStyles.titleColor,
          fontSize: '1.125rem',
          fontWeight: '600',
          margin: '0 0 0.5rem 0',
          lineHeight: '1.4'
        }}>
          {milestone.title}
        </h4>

        <p style={{
          color: status === 'future' ? '#9ca3af' : '#6b7280',
          fontSize: '0.875rem',
          lineHeight: '1.5',
          margin: '0 0 1rem 0',
          fontStyle: status === 'future' ? 'italic' : 'normal'
        }}>
          {status === 'future' && '📋 Planned: '}{milestone.description}
        </p>
      </div>

      {/* Timeline - Always show for all milestones */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
        marginBottom: status === 'current' ? '1rem' : '0'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.7)',
          padding: '0.75rem',
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '0.75rem',
            color: '#6b7280',
            fontWeight: '500',
            marginBottom: '0.25rem'
          }}>
            Start Date
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#111827',
            fontWeight: '600'
          }}>
            {formatDate(milestone.startDate)}
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.7)',
          padding: '0.75rem',
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '0.75rem',
            color: '#6b7280',
            fontWeight: '500',
            marginBottom: '0.25rem'
          }}>
            Due Date
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#111827',
            fontWeight: '600'
          }}>
            {formatDate(milestone.dueDate)}
          </div>
        </div>
      </div>

      {/* Personality Tips - Only show for current milestones */}
      {status === 'current' && (milestone.blindSpotTip || milestone.strengthHook) && (
        <div style={{ marginBottom: '1rem' }}>
          {milestone.blindSpotTip && (
            <div style={{
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              padding: '0.75rem',
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
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#92400e'
                }}>
                  Blind Spot Alert
                </span>
              </div>
              <p style={{
                fontSize: '0.875rem',
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
              padding: '0.75rem',
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
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#047857'
                }}>
                  Leverage Your Strength
                </span>
              </div>
              <p style={{
                fontSize: '0.875rem',
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

      {/* Current Milestone: Show Latest Notification */}
      {status === 'current' && (
        <div>
          <div style={{
            borderTop: '1px solid rgba(59, 130, 246, 0.2)',
            paddingTop: '1rem'
          }}>
            <NotificationPreview 
              notification={notification || null}
              isLoading={isLoadingNotification}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MilestoneCard;