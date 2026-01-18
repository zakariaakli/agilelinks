"use client";

import { useState, useEffect } from "react";
import { AppFeedback } from "../../../types/feedback";
import styles from "../../../Styles/admin.module.css";

export default function FeedbackAdminPage() {
  const [feedbackList, setFeedbackList] = useState<AppFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchFeedback();
  }, [filter]);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.append("sentiment", filter);
      }

      const response = await fetch(`/api/feedback?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setFeedbackList(data.feedback);
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment) {
      case 'love': return '😍';
      case 'good': return '😊';
      case 'okay': return '😐';
      case 'frustrated': return '😞';
      default: return '❓';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'love': return '#10B981';
      case 'good': return '#3B82F6';
      case 'okay': return '#F59E0B';
      case 'frustrated': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const stats = {
    total: feedbackList.length,
    love: feedbackList.filter(f => f.sentiment === 'love').length,
    good: feedbackList.filter(f => f.sentiment === 'good').length,
    okay: feedbackList.filter(f => f.sentiment === 'okay').length,
    frustrated: feedbackList.filter(f => f.sentiment === 'frustrated').length,
    mobile: feedbackList.filter(f => f.deviceType === 'mobile').length,
    desktop: feedbackList.filter(f => f.deviceType === 'desktop').length,
  };

  return (
    <div className={styles.adminContainer}>
      <div className={styles.adminHeader}>
        <h1>User Feedback Dashboard</h1>
        <p className={styles.subtitle}>Monitor user sentiment and feedback across the app</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>Total Feedback</div>
        </div>
        <div className={styles.statCard} style={{ borderLeft: `4px solid ${getSentimentColor('love')}` }}>
          <div className={styles.statValue}>{getSentimentEmoji('love')} {stats.love}</div>
          <div className={styles.statLabel}>Love it</div>
        </div>
        <div className={styles.statCard} style={{ borderLeft: `4px solid ${getSentimentColor('good')}` }}>
          <div className={styles.statValue}>{getSentimentEmoji('good')} {stats.good}</div>
          <div className={styles.statLabel}>Good</div>
        </div>
        <div className={styles.statCard} style={{ borderLeft: `4px solid ${getSentimentColor('okay')}` }}>
          <div className={styles.statValue}>{getSentimentEmoji('okay')} {stats.okay}</div>
          <div className={styles.statLabel}>Okay</div>
        </div>
        <div className={styles.statCard} style={{ borderLeft: `4px solid ${getSentimentColor('frustrated')}` }}>
          <div className={styles.statValue}>{getSentimentEmoji('frustrated')} {stats.frustrated}</div>
          <div className={styles.statLabel}>Frustrated</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>📱 {stats.mobile} / 💻 {stats.desktop}</div>
          <div className={styles.statLabel}>Mobile / Desktop</div>
        </div>
      </div>

      <div className={styles.filterBar}>
        <button
          className={filter === "all" ? styles.filterActive : styles.filterButton}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          className={filter === "love" ? styles.filterActive : styles.filterButton}
          onClick={() => setFilter("love")}
        >
          😍 Love
        </button>
        <button
          className={filter === "good" ? styles.filterActive : styles.filterButton}
          onClick={() => setFilter("good")}
        >
          😊 Good
        </button>
        <button
          className={filter === "okay" ? styles.filterActive : styles.filterButton}
          onClick={() => setFilter("okay")}
        >
          😐 Okay
        </button>
        <button
          className={filter === "frustrated" ? styles.filterActive : styles.filterButton}
          onClick={() => setFilter("frustrated")}
        >
          😞 Frustrated
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading feedback...</div>
      ) : (
        <div className={styles.feedbackList}>
          {feedbackList.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No feedback yet. The feedback button is live and waiting for user input!</p>
            </div>
          ) : (
            feedbackList.map((feedback) => (
              <div key={feedback.id} className={styles.feedbackCard}>
                <div className={styles.feedbackHeader}>
                  <div className={styles.feedbackSentiment}>
                    <span className={styles.sentimentEmoji}>
                      {getSentimentEmoji(feedback.sentiment)}
                    </span>
                    <span className={styles.sentimentLabel}>
                      {feedback.sentiment.charAt(0).toUpperCase() + feedback.sentiment.slice(1)}
                    </span>
                  </div>
                  <div className={styles.feedbackMeta}>
                    <span className={styles.device}>
                      {feedback.deviceType === 'mobile' ? '📱 Mobile' : '💻 Desktop'}
                    </span>
                    <span className={styles.timestamp}>
                      {feedback.timestamp && new Date((feedback.timestamp as any).seconds * 1000).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className={styles.feedbackDetails}>
                  <div className={styles.feedbackPage}>
                    <strong>Page:</strong> {feedback.page}
                  </div>
                  <div className={styles.feedbackUser}>
                    <strong>User:</strong> {feedback.userName || 'Anonymous'} ({feedback.userEmail || 'No email'})
                  </div>
                  {feedback.comment && (
                    <div className={styles.feedbackComment}>
                      <strong>Comment:</strong>
                      <p>{feedback.comment}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
