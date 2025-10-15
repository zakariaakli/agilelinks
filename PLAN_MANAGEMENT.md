# Plan Management Features

## Overview

Users can now fully manage their plans with pause, resume, and delete functionalities directly from the profile dashboard.

---

## ✨ New Features

### 1. **Pause Plan** ⏸️
- **Purpose**: Temporarily stop a plan without deleting it
- **Effect**: Stops all automated milestone reminders
- **Status Change**: `active` → `paused`
- **Reversible**: Yes, can be resumed anytime

**Use Cases**:
- Taking a break from a goal
- Temporarily focusing on other priorities
- Pausing during vacation or busy periods

### 2. **Resume Plan** ▶️
- **Purpose**: Reactivate a paused plan
- **Effect**: Restarts automated milestone reminders for current milestones
- **Status Change**: `paused` → `active`
- **Automatic**: Reminders resume on next cron run (9 AM UTC daily)

**Use Cases**:
- Ready to continue working on goal
- Returning from break
- Refocusing on paused objectives

### 3. **Delete Plan** 🗑️
- **Purpose**: Permanently remove a plan
- **Effect**: Complete deletion from database
- **Status Change**: Plan removed entirely
- **Reversible**: No - action is permanent

**Use Cases**:
- Goal no longer relevant
- Started wrong plan by mistake
- Cleaning up old/abandoned plans

---

## 🎯 How to Use

### From Profile Dashboard

1. **Navigate to Profile** (`/profile`)
2. **Expand a Plan** by clicking on it
3. **Scroll to Actions** at the bottom of the expanded plan
4. **Click Action Button**:
   - **Active plans** show: "⏸️ Pause Plan" and "🗑️ Delete Plan"
   - **Paused plans** show: "▶️ Resume Plan" and "🗑️ Delete Plan"
5. **Confirm Action** in the modal dialog

---

## 🔒 Safety Features

### Confirmation Modals

All actions require explicit confirmation:

**Delete Plan Modal**:
```
Title: Delete Plan?
Message: Are you sure you want to permanently delete this plan?
         This action cannot be undone.
Buttons: [Cancel] [Delete Permanently]
Color: Red (Danger)
```

**Pause Plan Modal**:
```
Title: Pause Plan?
Message: Pausing this plan will stop all automated reminders.
         You can resume it anytime.
Buttons: [Cancel] [Pause Plan]
Color: Orange (Warning)
```

**Resume Plan Modal**:
```
Title: Resume Plan?
Message: Resuming this plan will reactivate automated reminders
         for current milestones.
Buttons: [Cancel] [Resume Plan]
Color: Blue (Primary)
```

### Authorization

- Users can only manage their own plans
- API validates user ownership before any action
- Unauthorized attempts return 403 Forbidden

---

## 🛠️ Technical Implementation

### API Endpoints

#### PATCH `/api/plans/[planId]`
**Purpose**: Update plan status (pause/resume)

**Request**:
```json
{
  "status": "paused" | "active" | "completed",
  "userId": "user-id",
  "userEmail": "user@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Plan status updated to paused",
  "planId": "plan-123",
  "status": "paused"
}
```

#### DELETE `/api/plans/[planId]`
**Purpose**: Permanently delete a plan

**Query Parameters**:
- `userId`: User ID for authorization
- `userEmail`: User email for tracking

**Response**:
```json
{
  "success": true,
  "message": "Plan deleted successfully",
  "planId": "plan-123"
}
```

### Database Changes

**Plan Status Values**:
- `active` - Plan is active, receives reminders
- `paused` - Plan is paused, no reminders
- `completed` - Plan is finished, no reminders

**Firestore Update**:
```javascript
// Pause/Resume
await updateDoc(planRef, {
  status: 'paused',
  updatedAt: new Date()
});

// Delete
await deleteDoc(planRef);
```

### Cost Tracking

All operations are tracked for Firebase usage:
- Read: Checking plan existence and ownership
- Write: Updating plan status
- Delete: Removing plan document

---

## 🎨 UI Components

### Plan Action Buttons

**Location**: Bottom of expanded plan details
**Styling**: Color-coded by action type
- Pause: Orange/Yellow (`#f59e0b`)
- Resume: Blue (`#3b82f6`)
- Delete: Red (`#ef4444`)

**States**:
- Normal: Full opacity, hover effects
- Loading: Disabled, shows "⏳ Pausing..." text
- Disabled: 60% opacity, no hover

### Confirmation Modal

**Component**: `ConfirmationModal.tsx`
**Features**:
- Backdrop click to cancel
- ESC key to cancel (browser default)
- Mobile responsive
- Slide-up animation
- Color-coded confirm buttons

---

## 📊 Impact on Automated Systems

### Milestone Reminders (`/api/milestoneReminders`)

The cron job respects plan status:

```typescript
// Only active plans get reminders
const plansQuery = query(
  collection(db, 'plans'),
  where('status', '==', 'active')  // Filters out paused plans
);
```

**Effect of Pausing**:
- Plan excluded from daily cron scan
- No new notifications created
- Existing notifications remain in database
- User can still view old notifications

**Effect of Resuming**:
- Plan included in next cron run
- Current milestones get reminders (if due)
- Respects duplicate prevention (7-day lookback for weekly)

**Effect of Deleting**:
- Plan removed from database
- No future reminders
- Existing notifications remain (orphaned but viewable)
- Milestone history preserved in notifications

---

## 🔄 User Journey Examples

### Example 1: Temporary Pause

**Scenario**: User going on 2-week vacation

1. User expands plan
2. Clicks "⏸️ Pause Plan"
3. Confirms in modal
4. Plan status → `paused`
5. No reminders for 2 weeks
6. Returns from vacation
7. Clicks "▶️ Resume Plan"
8. Plan status → `active`
9. Reminders resume next day (9 AM UTC)

### Example 2: Goal Abandonment

**Scenario**: User decides goal is no longer relevant

1. User expands plan
2. Clicks "🗑️ Delete Plan"
3. Reads warning: "This action cannot be undone"
4. Confirms deletion
5. Plan removed from list
6. No more reminders
7. Historical notifications still viewable at `/nudge/[id]`

### Example 3: Accidental Pause

**Scenario**: User accidentally pauses plan

1. User clicks "⏸️ Pause Plan"
2. Immediately realizes mistake
3. Clicks "Cancel" in modal
4. No changes made
5. Plan remains `active`

---

## 🧪 Testing

Run automated tests:

```bash
# All tests
npm test

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e
```

Manual testing checklist:
- [ ] Pause active plan
- [ ] Resume paused plan
- [ ] Delete plan
- [ ] Cancel each action in modal
- [ ] Verify plan disappears from list after delete
- [ ] Verify plan status updates after pause/resume
- [ ] Test unauthorized access (different user)
- [ ] Verify reminders stop for paused plans
- [ ] Verify reminders resume for resumed plans

---

## 📝 Future Enhancements

### Planned Features
1. **Bulk Actions**: Select multiple plans for pause/delete
2. **Archive**: Soft delete with restore option
3. **Status History**: Track all status changes with timestamps
4. **Reason for Pause**: Optional note when pausing
5. **Auto-Resume**: Schedule resume date when pausing
6. **Completion**: Mark plans as completed (not just deleted)
7. **Plan Templates**: Save deleted plans as templates

### Technical Improvements
1. **Optimistic Updates**: Update UI before API confirms
2. **Undo Feature**: 5-second window to undo delete
3. **Batch API**: Handle multiple plans in one request
4. **WebSocket Updates**: Real-time status sync across devices
5. **Export Before Delete**: Automatic backup before deletion

---

## 🐛 Troubleshooting

### Plan won't delete
- **Check**: User owns the plan
- **Check**: Network connection
- **Check**: Browser console for errors
- **Solution**: Refresh page and try again

### Plan status not updating
- **Check**: API response was successful
- **Check**: Page was refreshed if needed
- **Solution**: Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

### Reminders still coming after pause
- **Check**: Plan status in Firestore
- **Check**: Cron ran after status change
- **Wait**: Up to 24 hours for next cron run
- **Solution**: Status takes effect on next daily cron execution

### Modal not showing
- **Check**: Browser allows popups
- **Check**: JavaScript enabled
- **Check**: React hydration completed
- **Solution**: Check browser console for errors

---

## 📚 Related Documentation

- [Plan Lifecycle](./PLAN_LIFECYCLE.md) - Complete plan automation flow
- [Notification System](./NOTIFS.md) - How reminders work
- [Dashboard Documentation](./DASHBOARD_DOCUMENTATION.md) - Full dashboard features
- [Testing Guide](./TESTING.md) - Running automated tests

---

## ✅ Summary

Users now have **full control** over their plans with:
- ⏸️ **Pause** - Stop reminders temporarily
- ▶️ **Resume** - Restart reminders anytime
- 🗑️ **Delete** - Permanently remove plans

All actions:
- ✅ Require confirmation
- ✅ Are tracked for costs
- ✅ Validate authorization
- ✅ Update UI immediately
- ✅ Affect automated systems correctly

This gives users flexibility to manage their goals at their own pace while maintaining data integrity and system reliability.
