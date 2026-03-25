# Data Retention Policy

## Overview

This document describes how user accounts are retained and automatically deleted in the application.

## User Account Retention

### Soft Delete Process

When a user requests account deletion:

- **Immediate Effect**: Account is deactivated immediately and user cannot login
- **Data Access**: User profile is marked as deleted but data remains in the database
- **Grace Period**: 15-day window before permanent deletion
- **Scope**: User profile, authentication record, and all associated data

### Hard Delete Process

After the 15-day grace period:

- **Automatic Deletion**: Account and all associated data is permanently deleted
- **What's Deleted**:
  - User profile (display name, email, timezone, security question/answer)
  - Authentication record (Supabase auth.users table)
  - Terms and Privacy acceptance records
  - Audit records are retained for compliance

### Technical Implementation

#### Automatic Cleanup Process

- A scheduled cleanup job can be configured to run daily
- User accounts scheduled for purge are processed automatically
- All deletions are logged in the `user_purge_audit` table for accountability
- Failed deletions are marked for retry

#### Audit Trail

- All account deletions are recorded in the `user_purge_audit` table
- Audit records include: user ID, email, deletion reason, timestamp, and success/failure status
- Audit logs are retained indefinitely for compliance and debugging purposes

## User Visibility

When a user deletes their account:

- A confirmation modal clearly states the deletion schedule
- The exact purge date is shown in the user's local timezone
- User is immediately signed out after confirming deletion
- User cannot login during the 15-day grace period

## Privacy & Security

- No user data is retained longer than necessary
- Deleted data after the 15-day period is not recoverable
- All deletions comply with data minimization principles
- Users maintain full control over their account until automatic deletion

## Data Export

Currently, there is no automated data export feature. Users who wish to preserve their data should:

- Note their profile information (display name, email, timezone)
- Keep a record of their security question (for reference)

## Questions or Concerns

If you have questions about data retention or account deletion, please contact support before initiating the deletion process.

---

**Last Updated**: 2025-12-26
**Version**: 2.0
