"use client";

import React from 'react';
import PushNotificationManager from './PushNotificationManager';
import PostHogProvider from './PostHogProvider';

export default function ClientProviders() {
  return (
    <PostHogProvider>
      <PushNotificationManager />
    </PostHogProvider>
  );
}
