# Security Specification for Firestore Rules

## 1. Data Invariants
- Each user can only read, write, update, or delete their own profile at `/users/{userId}` where `request.auth.uid == userId`.
- Each user can only access and manage saved notes inside their own subcollection `/users/{userId}/saved_notes/{noteId}` where `request.auth.uid == userId`.
- All writes must maintain `userId == request.auth.uid` and valid document schemas.
- Unauthenticated requests are denied access to all collections and subcollections.

## 2. Dirty Dozen Test Payloads
1. Unauthenticated write to `/users/user123` -> DENIED
2. User A writing to `/users/userB` -> DENIED
3. User A creating a note under `/users/userB/saved_notes/note1` -> DENIED
4. User A updating a note belonging to User B -> DENIED
5. User A reading User B's profile `/users/userB` -> DENIED
6. User A listing notes under User B's subcollection `/users/userB/saved_notes` -> DENIED
7. User A creating a note under `/users/userA/saved_notes/note1` with `userId = 'userB'` -> DENIED
8. User A injecting extra untyped fields in note creation -> DENIED
9. User A creating a note without required fields -> DENIED
10. Anonymous/unverified user trying to write data when authentication is required -> DENIED
11. User A attempting to modify `userId` or `id` during update -> DENIED
12. Attempting to list all users at `/users` collection root -> DENIED

## 3. Rules Implementation
Rules enforce `request.auth != null && request.auth.uid == userId` for all operations under `/users/{userId}`.
