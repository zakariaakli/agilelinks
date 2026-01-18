# PostHog Analytics Troubleshooting Guide

## Quick Diagnostics

### 1. Check if PostHog is Installed
```bash
npm list posthog-js
```
Should show: `posthog-js@1.x.x`

### 2. Verify Environment Variables
```bash
# Check if variables are set
echo $NEXT_PUBLIC_POSTHOG_KEY
echo $NEXT_PUBLIC_POSTHOG_HOST
```

**In .env.local**:
```bash
NEXT_PUBLIC_POSTHOG_KEY='phc_FzoPmYaHl8l5N1BRI4f1eKWc6VUTU2msOrLQHo0iFS4'
NEXT_PUBLIC_POSTHOG_HOST='https://eu.i.posthog.com'
```

### 3. Restart Dev Server
**CRITICAL**: After adding/changing env variables, you MUST restart:
```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## Browser Console Checks

### Expected Logs (Development Mode)

When page loads:
```
🔑 PostHog Key: phc_icrimA...
🌐 PostHog Host: https://app.posthog.com
🚀 Initializing PostHog...
✅ PostHog loaded successfully!
📊 PostHog ready to track events
✅ PostHog initialization complete
```

When navigating:
```
📄 Page view: /profile
```

When events fire:
```
📊 Event tracked: goal_created { milestoneCount: 5, hasTimePressure: true }
👤 User identified: user_abc123 { email: "user@example.com" }
```

### Error Logs to Watch For

#### ⚠️ "PostHog key not found"
**Problem**: Environment variable not loaded
**Solution**:
1. Check `.env.local` has `NEXT_PUBLIC_POSTHOG_KEY`
2. Variable MUST start with `NEXT_PUBLIC_` to be available in browser
3. Restart dev server
4. Hard refresh browser (Ctrl+Shift+R)

#### ⚠️ "PostHog not initialized"
**Problem**: PostHog failed to initialize before events fired
**Solution**:
1. Check browser console for initialization errors
2. Verify API key is correct in PostHog dashboard
3. Check network tab for blocked requests to posthog.com
4. Disable ad blockers (they often block analytics)

#### ❌ "Error initializing PostHog"
**Problem**: Network error or invalid API key
**Solution**:
1. Check internet connection
2. Verify API key in PostHog dashboard (Settings → Project)
3. Check browser console for specific error message
4. Try using US cloud: `https://us.posthog.com`

---

## Testing PostHog

### Test Page
Visit: `http://localhost:3000/test-analytics`

This dedicated test page lets you:
- ✅ Test page view tracking
- ✅ Test custom events
- ✅ Test user identification
- ✅ See console logs in real-time

### Manual Test in Browser Console
```javascript
// Check if PostHog is loaded
console.log('PostHog loaded:', typeof posthog !== 'undefined');

// Test event
posthog.capture('test_event', { test: true });

// Check current user
console.log('Current user:', posthog.get_distinct_id());
```

---

## PostHog Dashboard Verification

### 1. Go to Live Events
1. Open PostHog: https://app.posthog.com
2. Click "Events" in sidebar
3. Click "Live Events"
4. You should see events streaming in real-time

### 2. Check for Your Events
Look for:
- `$pageview` - Every page navigation
- `goal_created` - When user creates goal
- `app_feedback_submitted` - When feedback is given
- `enneagram_completed` - When Enneagram test finished

### 3. Event Properties
Click any event to see properties:
- User ID
- Email, Name
- Custom properties (milestoneCount, sentiment, etc.)
- Device info (browser, OS)

---

## Common Issues & Solutions

### Issue: Events not appearing in PostHog

**Checklist**:
- [ ] PostHog API key is correct
- [ ] Dev server restarted after adding env variables
- [ ] Browser console shows "✅ PostHog loaded successfully"
- [ ] No ad blockers enabled
- [ ] Events are actually firing (check console for "📊 Event tracked")
- [ ] Waiting 10-60 seconds (events can take time to appear)

**Debug Steps**:
1. Open browser DevTools → Network tab
2. Filter by "posthog"
3. Look for POST requests to `https://app.posthog.com/e/`
4. Check if requests are successful (Status 200)

### Issue: "Mixed Content" errors

**Problem**: Using HTTP on page that loads HTTPS PostHog
**Solution**:
```bash
# In .env.local, ensure HTTPS
NEXT_PUBLIC_POSTHOG_HOST='https://app.posthog.com'
```

### Issue: Ad Blocker Blocking PostHog

**Problem**: Browser extensions blocking analytics
**Solution**:
1. Temporarily disable ad blockers
2. Or use PostHog's reverse proxy feature
3. Or whitelist `app.posthog.com` in your ad blocker

### Issue: Events firing but not in dashboard

**Problem**: Delay or API key mismatch
**Solution**:
1. Wait 60 seconds (PostHog can have slight delay)
2. Check you're looking at correct project in PostHog
3. Verify API key matches between .env.local and dashboard
4. Check project is not archived

---

## Debugging Event Tracking

### Add Debug Logging to Your Code

```typescript
import { trackEvent } from '@/lib/analytics';

const handleButtonClick = () => {
  console.log('🔍 About to track event...');

  trackEvent('button_clicked', {
    button_name: 'Test',
    page: window.location.pathname
  });

  console.log('✅ Event tracking call complete');
};
```

### Check PostHog Instance

```javascript
// In browser console
console.log('PostHog config:', posthog.config);
console.log('PostHog instance:', posthog);
```

---

## Environment-Specific Issues

### Development

**Problem**: Events not tracking in dev
**Check**:
```bash
# .env.local must exist and have:
NEXT_PUBLIC_POSTHOG_KEY='phc_...'
```

### Production

**Problem**: Events work in dev but not prod
**Check**:
1. Environment variables set in hosting platform (Vercel/Netlify)
2. Variables have `NEXT_PUBLIC_` prefix
3. Redeployed after adding variables

---

## Network Debugging

### Check PostHog API Calls

**In Browser DevTools → Network**:
1. Filter: `posthog.com`
2. Look for POST to `/e/`
3. Click request → Preview/Response
4. Should see: `{"status": 1}`

**Request Payload**:
```json
{
  "api_key": "phc_...",
  "event": "goal_created",
  "properties": {
    "milestoneCount": 5,
    ...
  }
}
```

### Blocked Requests

If requests show as blocked:
- Check CORS settings
- Disable ad blockers
- Check company firewall
- Try different network

---

## Quick Fixes Checklist

Try these in order:

1. **Hard Refresh**: Ctrl+Shift+R (Chrome/Firefox)
2. **Clear Cache**: DevTools → Application → Clear Storage
3. **Restart Dev Server**: Ctrl+C → `npm run dev`
4. **Check .env.local**: Ensure `NEXT_PUBLIC_POSTHOG_KEY` is set
5. **Verify API Key**: Copy from PostHog dashboard (Settings → Project)
6. **Disable Ad Blockers**: Temporarily turn off all extensions
7. **Check Console**: Look for PostHog initialization logs
8. **Wait 60 seconds**: Events can have slight delay
9. **Try Test Page**: Visit `/test-analytics`
10. **Check Dashboard**: Go to PostHog → Live Events

---

## Contact Support

If still having issues:

1. **PostHog Community**: https://posthog.com/questions
2. **PostHog Docs**: https://posthog.com/docs
3. **Check Status**: https://status.posthog.com

**Include in Support Request**:
- Browser console logs (with errors)
- Network tab screenshot (showing PostHog requests)
- PostHog project ID
- Code snippet showing where event is tracked

---

## Success Indicators

You'll know it's working when:

✅ Browser console shows: "✅ PostHog loaded successfully!"
✅ Console shows event tracking: "📊 Event tracked: ..."
✅ Network tab shows successful POST to `/e/`
✅ PostHog Live Events shows your events
✅ User appears in PostHog Persons list

---

## Performance Check

PostHog should have minimal impact:

- **Bundle size**: ~5KB gzipped
- **Init time**: < 100ms
- **Event tracking**: Non-blocking, async
- **Page load impact**: Negligible

If you notice slowdowns:
1. Check bundle size with `npm run build`
2. Verify PostHog isn't in critical rendering path
3. Consider lazy loading PostHog

---

**Need Help?** Start with the test page: `/test-analytics` 🚀
