# Notifications Admin API

This document describes the `GET /api/admin/notifications` endpoint and recommended Firestore indexes.

## Purpose

- Provide filtered, paginated access to `notifications` for admin UI.
- Support filters: date range (`createdAt`), `userEmail`/`userId`, `milestoneTitle`, `read` flag, `hasFeedback`.
- Return stable pages of up to 50 items using cursor-based paging.

## Index recommendations

Firestore requires composite indexes when you combine `where` with `orderBy` on different fields.
Add the following composite indexes in your Firestore console (or `firestore.indexes.json`) to ensure queries remain fast:

1. createdAt (desc) + userId

   - Collection: `notifications`
   - Query: where `userId` == X, orderBy `createdAt` desc

2. createdAt (desc) + milestoneTitle

   - Collection: `notifications`
   - Query: where `milestoneTitle` == X, orderBy `createdAt` desc

3. createdAt (desc) + read

   - Collection: `notifications`
   - Query: where `read` == true/false, orderBy `createdAt` desc

4. createdAt (desc) + feedback

   - Collection: `notifications`
   - Query: where `feedback` == null or != null, orderBy `createdAt` desc

5. createdAt (desc) + userId + read
   - Optional: for combined filters on a user and read status

Notes:

- Firestore may prompt to create necessary indexes when a query fails — follow the console link to create them.
- Keep index count manageable by adding only those combinations used in the UI.

## Performance considerations

- The API fetches one extra document (limit + 1) to detect `nextCursor`.
- Resolving `userEmail` for returned items is done with batched `get()` calls per-page to avoid extra client-side reads.
- For very large datasets, consider server-side caching (Redis) or pre-computed aggregates for summaries.

## Security

- The route requires a Firebase ID token in `Authorization: Bearer <idToken>` header.
- Only users with the admin email (`zakaria.akli.ensa@gmail.com`) or `admin` custom claim are allowed.
