'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { MailIcon, MessageCircleIcon, ArrowRightIcon } from './Icons';
import NudgeFormatter from './NudgeFormatter';
import FeedbackForm from './FeedbackForm';

interface Notification {
  id: string;
  prompt: string;
  createdAt: any;
  feedback?: string | null;
  type: string;
  planId?: string;
}

interface NotificationPreviewProps {
  notification: Notification | null;
  isLoading?: boolean;
}

const NotificationPreview: React.FC<NotificationPreviewProps> = ({
  notification,
  isLoading = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (isLoading) {
    return (
      <div style={{ 
        background: '#f8fafc', 
        padding: '1rem', 
        borderRadius: '0.5rem',
        marginTop: '1rem',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ 
          height: '1rem', 
          background: '#e2e8f0', 
          borderRadius: '0.25rem',
          marginBottom: '0.5rem',
          animation: 'pulse 2s infinite'
        }} />
        <div style={{ 
          height: '0.75rem', 
          background: '#e2e8f0', 
          borderRadius: '0.25rem',
          width: '60%'
        }} />
      </div>
    );
  }

  if (!notification) {
    return (
      <div style={{ 
        background: '#fafafa', 
        padding: '1rem', 
        borderRadius: '0.5rem',
        marginTop: '1rem',
        border: '1px solid #e5e7eb',
        textAlign: 'center'
      }}>
        <p style={{ 
          color: '#6b7280', 
          fontSize: '0.875rem',
          margin: 0,
          fontStyle: 'italic'
        }}>
          No recent notifications for this milestone
        </p>
      </div>
    );
  }

  const formatDate = (date: any) => {
    try {
      const dateObj = date?.toDate?.() || new Date(date);
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Recently';
    }
  };

  const getTimeAgo = (date: any) => {
    try {
      const dateObj = date?.toDate?.() || new Date(date);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60));
      
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div style={{
      background: '#f0f9ff',
      padding: '1rem',
      borderRadius: '0.5rem',
      marginTop: '1rem',
      border: '1px solid #0ea5e9',
      transition: 'all 0.3s ease'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.75rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <MailIcon size={16} color="#0369a1" />
          <span style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#0369a1'
          }}>
            Latest Nudge
          </span>
        </div>
        <span style={{
          fontSize: '0.75rem',
          color: '#0369a1',
          background: '#bae6fd',
          padding: '0.25rem 0.5rem',
          borderRadius: '0.375rem'
        }}>
          {getTimeAgo(notification.createdAt)}
        </span>
      </div>

      {/* Notification Content - Collapsed or Expanded */}
      {!isExpanded ? (
        <>
          <div style={{ marginBottom: '0.75rem' }}>
            <p style={{
              fontSize: '0.875rem',
              color: '#0c4a6e',
              lineHeight: '1.5',
              margin: 0
            }}>
              {(() => {
                // Strip markdown formatting for preview (remove ** markers)
                const cleanText = notification.prompt.replace(/\*\*/g, '');
                return cleanText.length > 120
                  ? `${cleanText.slice(0, 120)}...`
                  : cleanText;
              })()}
            </p>
          </div>

          {/* Feedback Section */}
          {notification.feedback ? (
            <div style={{
              background: '#dcfce7',
              padding: '0.75rem',
              borderRadius: '0.375rem',
              marginBottom: '0.75rem',
              border: '1px solid #bbf7d0'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}>
                <MessageCircleIcon size={14} color="#15803d" />
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#15803d'
                }}>
                  Your Feedback
                </span>
              </div>
              <p style={{
                fontSize: '0.875rem',
                color: '#166534',
                margin: 0,
                fontStyle: 'italic'
              }}>
                "{notification.feedback}"
              </p>
            </div>
          ) : (
            <div style={{
              background: '#fef3c7',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.375rem',
              marginBottom: '0.75rem'
            }}>
              <span style={{
                fontSize: '0.75rem',
                color: '#92400e'
              }}>
                💭 No feedback given yet
              </span>
            </div>
          )}

          {/* Read More Button */}
          <button
            onClick={() => setIsExpanded(true)}
            style={{
              fontSize: '0.75rem',
              color: '#0369a1',
              background: 'transparent',
              border: 'none',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              cursor: 'pointer',
              padding: '0.5rem 0',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#0284c7';
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#0369a1';
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            <span>Read More & Give Feedback</span>
            <span style={{ fontSize: '0.875rem' }}>↓</span>
          </button>
        </>
      ) : (
        <>
          {/* Expanded View - Full Formatted Nudge */}
          <div style={{ marginBottom: '1.5rem' }}>
            <NudgeFormatter text={notification.prompt} />
          </div>

          {/* Feedback Form */}
          <div style={{ marginBottom: '1rem' }}>
            <FeedbackForm
              notifId={notification.id}
              existingFeedback={notification.feedback}
              planId={notification.planId}
              nudgeText={notification.prompt || ''}
            />
          </div>

          {/* Collapse Button */}
          <button
            onClick={() => setIsExpanded(false)}
            style={{
              fontSize: '0.75rem',
              color: '#0369a1',
              background: 'transparent',
              border: 'none',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              cursor: 'pointer',
              padding: '0.5rem 0',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#0284c7';
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#0369a1';
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            <span style={{ fontSize: '0.875rem' }}>↑</span>
            <span>Collapse</span>
          </button>

          {/* Link to Full Page (Optional) */}
          <Link
            href={`/nudge/${notification.id}`}
            style={{
              fontSize: '0.75rem',
              color: '#64748b',
              textDecoration: 'none',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              marginTop: '0.5rem'
            }}
          >
            <span>View on separate page</span>
            <ArrowRightIcon size={12} />
          </Link>
        </>
      )}
    </div>
  );
};

export default NotificationPreview;