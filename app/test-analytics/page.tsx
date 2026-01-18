"use client";

import { useState } from 'react';
import { trackEvent, trackPageView, identifyUser } from '../../lib/analytics';

export default function TestAnalyticsPage() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testPageView = () => {
    addLog('Testing page view...');
    trackPageView('/test-analytics');
  };

  const testCustomEvent = () => {
    addLog('Testing custom event...');
    trackEvent('test_button_clicked', {
      button_name: 'Test Button',
      timestamp: new Date().toISOString(),
    });
  };

  const testUserIdentify = () => {
    addLog('Testing user identification...');
    identifyUser('test_user_123', {
      email: 'test@example.com',
      name: 'Test User',
    });
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>PostHog Analytics Test Page</h1>
      <p>Use this page to verify PostHog is working correctly.</p>

      <div style={{ marginTop: '30px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={testPageView}
          style={{
            padding: '12px 24px',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          Test Page View
        </button>

        <button
          onClick={testCustomEvent}
          style={{
            padding: '12px 24px',
            backgroundColor: '#10B981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          Test Custom Event
        </button>

        <button
          onClick={testUserIdentify}
          style={{
            padding: '12px 24px',
            backgroundColor: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          Test User Identify
        </button>

        <button
          onClick={() => setLogs([])}
          style={{
            padding: '12px 24px',
            backgroundColor: '#EF4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          Clear Logs
        </button>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h2>Console Logs</h2>
        <div
          style={{
            backgroundColor: '#1e1e1e',
            color: '#00ff00',
            padding: '20px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '14px',
            minHeight: '200px',
            maxHeight: '400px',
            overflow: 'auto',
          }}
        >
          {logs.length === 0 ? (
            <div style={{ color: '#888' }}>No logs yet. Click a button to test!</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ marginBottom: '4px' }}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
        <h3>How to Verify</h3>
        <ol>
          <li>Open your browser's Developer Console (F12)</li>
          <li>Click the buttons above</li>
          <li>Check the console for PostHog logs:
            <ul>
              <li>✅ PostHog loaded successfully!</li>
              <li>📊 Event tracked: ...</li>
              <li>📄 Page view: ...</li>
              <li>👤 User identified: ...</li>
            </ul>
          </li>
          <li>Go to PostHog dashboard → Live Events</li>
          <li>You should see your events appearing in real-time</li>
        </ol>

        <h3 style={{ marginTop: '20px' }}>Troubleshooting</h3>
        <ul>
          <li>If you see "⚠️ PostHog not initialized", check your .env.local file</li>
          <li>Make sure NEXT_PUBLIC_POSTHOG_KEY is set correctly</li>
          <li>Restart your dev server after adding env variables</li>
          <li>Check PostHog dashboard for any API key errors</li>
        </ul>
      </div>
    </div>
  );
}
