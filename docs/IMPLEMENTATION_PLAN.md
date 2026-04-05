# Exercise Tracker Application Implementation Plan

# Created: 2026-02-13

# Last Updated: 2026-02-13

This document outlines the phased implementation plan for the Exercise Tracker application - a personal journal for capturing weekly coaching program exercises and answers.

---

## Application Overview

The Exercise Tracker allows users to:

- Create and manage weekly exercise modules from their coaching program
- Add questions manually or bulk import them by pasting from the official platform
- Record their answers to each reflection question and action item
- Navigate between weeks to review past exercises and answers
- All data is private and belongs only to the individual user

---

## Core Features (Implemented)

### Exercise Week Management

- Create weeks with: Week Number, Module Title (e.g., "Power"), Topic (e.g., "War on Weakness")
- Edit and delete existing weeks
- Navigate between weeks with Previous/Next buttons and week tabs

### Question Management

- Add individual questions with Label (e.g., "Reflectie 1a") and full question text
- Edit and delete questions
- Bulk import questions by pasting formatted text from the official platform
- Questions are displayed in order within each week

### Answer Entry

- Each question has an amber-colored text area matching the official platform style
- Auto-save functionality with save button for manual saves
- Character count indicator
- Visual feedback when changes are saved

### Data Privacy

- All data is user-owned via Row Level Security
- Users can only see and modify their own exercises
- No admin access to user exercise content

---

---

## Privacy and Access Control Requirements

### Core Privacy Principles

- Users have complete ownership of their personal data
- Users can only view, create, update, and delete their own content
- Admin role is strictly limited to account management
- No admin access to user-generated content or progress data
- All data operations enforced at database level via RLS policies

### User Permissions

- View own profile and settings
- Create, read, update, delete own exercise completions
- Create, read, update, delete own daily notes
- Create, read, update, delete own community posts
- View own achievements and progress
- View shared program content (exercises, weeks, meetings)

### Admin Permissions

- View list of user accounts (email, created date, last login)
- Activate/deactivate user accounts
- Reset user passwords (trigger reset email only)
- View aggregate statistics (total users, active users)
- Manage program content (exercises, weeks, meetings)
- **CANNOT** view user exercise completions
- **CANNOT** view user daily notes or reflections
- **CANNOT** view user community posts content
- **CANNOT** view user achievements or progress details

---

## Phase 1: Design System Foundation (No Backend)

### Deliverables

- Configure Tailwind with custom color palette matching the design image
- Set up typography scale and font weights
- Create reusable UI primitives

### Specific Tasks

1. Update tailwind.config.js with custom colors:
   - Primary background: Dark navy (#1a1d2e)
   - Secondary background: Lighter navy (#252842)
   - Accent blue: Royal blue (#4F6FFF) for active states and buttons
   - Content cards: Off-white (#f5f7fa)
   - Gold accent: (#f59e0b) for achievements/notifications
   - Text colors: White on dark, dark gray on light

2. Add Inter font family to index.html and configure in Tailwind

3. Create base component files:
   - Button component with primary (blue pill), secondary, and dark variants
   - Card component with light and dark background options
   - Badge component for notification counts
   - Avatar component with circular styling

### Acceptance Criteria

- [ ] Color palette defined and accessible throughout app
- [ ] Typography hierarchy established (headings, body, labels)
- [ ] Components render correctly with new theme

---

## Phase 2: Navigation and Layout Structure (No Backend)

### Deliverables

- Main navigation header matching design
- Page layout wrapper component
- Responsive breakpoints

### Specific Tasks

1. Create MainNavigation component:
   - Dark navy background full-width header
   - Golden logo icon on far left (stylized X pattern)
   - Pill-shaped navigation items: Dashboard, Power, Bibliotheek, My Stance, Community
   - Active state: Blue background with white text and icon
   - Inactive state: Transparent with light gray text
   - Golden rocket icon for achievements (right side)
   - Circular profile avatar (far right)

2. Create DashboardLayout wrapper component:
   - Full-page dark navy background
   - Proper content container with max-width
   - Consistent padding and spacing

3. Update App.tsx routing structure:
   - Add routes for new pages: /dashboard, /power, /library, /stance, /community
   - Integrate new navigation component
   - Keep existing auth and legal routes

4. Implement mobile responsive navigation:
   - Bottom tab bar for mobile devices
   - Collapsible menu for tablet

### Dependencies

- Phase 1

### Acceptance Criteria

- [ ] Navigation renders with correct styling on all screen sizes
- [ ] Active navigation state works correctly
- [ ] Layout provides consistent dark background

---

## Phase 3: Dashboard Page UI (No Backend)

### Deliverables

- Main dashboard page with greeting section
- Online meeting notification banner
- Current week indicator
- Content card for active exercise

### Specific Tasks

1. Create Dashboard page component with two-column layout:
   - Left panel: Dark card with user greeting
   - Right panel: Light content cards

2. Build greeting card component:
   - Large white heading "Hello, [Name]"
   - Subheading with announcement text (styled with bold emphasis)
   - Week indicator button (blue pill with checkmark and badge count)

3. Create online meeting banner:
   - White/light background rounded pill
   - Red dot indicator for live status
   - Meeting date/time display
   - Arrow icon for navigation

4. Build exercise/content card:
   - Light off-white background with rounded corners
   - Icon with gradient background (sun icon style)
   - Title "Power" with week number below
   - Inspirational description text
   - Nested content section with exercise title
   - Black "Read" button with arrow icon
   - Progress indicator (circle outline)

### Dependencies

- Phase 1, Phase 2

### Acceptance Criteria

- [ ] Dashboard displays with correct two-column layout
- [ ] All cards styled according to design image
- [ ] Static content displays properly

---

## Phase 4: Exercise Tracker Page (COMPLETED)

### Deliverables

- Week selector with navigation
- Question/answer cards with amber styling
- Modals for adding/editing weeks and questions
- Bulk import functionality

### Implemented Components

1. **WeekSelector** (`src/components/exercises/WeekSelector.tsx`)
   - Displays week tabs for quick navigation
   - Shows formatted header: "Power | Exercise Week 3 | War on Weakness"
   - Add Week and Settings buttons
   - Previous/Next navigation arrows

2. **ExerciseQuestionCard** (`src/components/exercises/ExerciseQuestionCard.tsx`)
   - Question label and text display
   - Amber-colored text area for answers (matching official platform)
   - Save button with loading and success states
   - Edit/delete controls in edit mode

3. **WeekModal** (`src/components/exercises/WeekModal.tsx`)
   - Add/edit week with number, title, and topic
   - Delete week functionality
   - Validation for duplicate week numbers

4. **QuestionModal** (`src/components/exercises/QuestionModal.tsx`)
   - Add/edit individual questions
   - Label and full question text fields

5. **BulkImportModal** (`src/components/exercises/BulkImportModal.tsx`)
   - Paste text from official platform
   - Auto-parse questions by pattern (Reflectie, Actie, etc.)
   - Preview parsed questions before import

### Database Tables

- `exercise_weeks` - Week metadata (number, title, topic)
- `exercise_questions` - Questions within weeks
- `exercise_answers` - User answers to questions

### Acceptance Criteria

- [x] Power page displays exercise tracker interface
- [x] Users can create weeks with title and topic
- [x] Users can add questions manually or bulk import
- [x] Users can enter and save answers
- [x] Data persists in Supabase with RLS protection

---

## Phase 5: Library and Profile Pages UI (No Backend)

### Deliverables

- Library page with content categories
- Updated profile page with new styling

### Specific Tasks

1. Create Library (Bibliotheek) page:
   - Search bar with dark styling
   - Category filters (tabs or dropdown)
   - Grid of content cards
   - Pagination or infinite scroll placeholder

2. Build content card for library:
   - Thumbnail/icon area
   - Title and description
   - Category tag
   - Action button

3. Restyle existing ProfilePage:
   - Apply dark theme wrapper
   - Update form styling to match design
   - Add avatar upload placeholder
   - Update button styles

### Dependencies

- Phase 1, Phase 2

### Acceptance Criteria

- [ ] Library page renders with grid layout
- [ ] Profile page updated with new styling
- [ ] Consistent design language across pages

---

## Phase 6: Community and Stance Pages UI (No Backend)

### Deliverables

- My Stance page with personal tracking
- Community page with feed structure

### Specific Tasks

1. Create My Stance page:
   - Personal progress dashboard
   - Goal tracking cards
   - Statistics/metrics display
   - Achievement badges section

2. Build Community page structure:
   - Post feed layout
   - User post card component
   - Comment section placeholder
   - Interaction buttons (like, comment, share)

3. Create floating action components:
   - Chat bubble button (bottom right)
   - Quick action menu

### Dependencies

- Phase 1, Phase 2

### Acceptance Criteria

- [ ] Both pages render with correct layout
- [ ] Components match design aesthetic
- [ ] Placeholder content displays properly

---

## Phase 7: Database Schema with Privacy-First RLS Policies

### Deliverables

- New database tables for program content
- Tables for user progress tracking
- Strict RLS policies enforcing privacy requirements

### Database Tables to Create

**user_roles table:**

- id, user_id (FK to auth.users), role (enum: user, admin), created_at

**programs table:**

- id, name, description, icon_url, created_at

**program_weeks table:**

- id, program_id, week_number, title, description, theme

**exercises table:**

- id, week_id, title, description, content_type, content_url, duration_minutes, sequence

**user_program_enrollments table:**

- id, user_id, program_id, enrolled_at, current_week

**user_exercise_completions table:**

- id, user_id, exercise_id, completed_at, notes

**user_daily_notes table:**

- id, user_id, date, content, created_at, updated_at

### RLS Policies (Privacy-First)

**User Data Tables (completions, notes, achievements):**

```sql
- SELECT: auth.uid() = user_id (users see only own data)
- INSERT: auth.uid() = user_id (users create only own data)
- UPDATE: auth.uid() = user_id (users update only own data)
- DELETE: auth.uid() = user_id (users delete only own data)
- NO admin access policies for user content
```

**Program Content Tables (programs, weeks, exercises):**

```sql
- SELECT: All authenticated users can read
- INSERT/UPDATE/DELETE: Only admin role
```

**User Accounts (for admin):**

```sql
- Admin can SELECT from auth.users (email, created_at, last_sign_in)
- Admin can UPDATE user status (banned, active)
- Admin CANNOT access any user_* tables
```

### Dependencies

- None (can run parallel to UI phases)

### Acceptance Criteria

- [ ] All tables created with proper constraints
- [ ] RLS policies strictly enforce user data ownership
- [ ] Admin cannot query user content tables
- [ ] Foreign key relationships properly defined

---

## Phase 8: Program and Content API Integration

### Deliverables

- Hooks for fetching program data
- Hooks for user progress tracking (own data only)
- Real-time subscription for updates

### Specific Tasks

1. Create useProgram hook:
   - Fetch current program and weeks
   - Get exercises for specific week
   - Cache data appropriately

2. Create useProgress hook:
   - Track exercise completions (own data only)
   - Save/load daily notes (own data only)
   - Calculate week completion percentage
   - All queries filtered by auth.uid()

3. Update Dashboard page:
   - Connect to real user data
   - Display actual current week
   - Show real exercise content

4. Update Power page:
   - Load exercises from database
   - Implement completion toggle functionality
   - Save notes to database

### Privacy Implementation

- All hooks automatically filter by current user
- No ability to query other users' progress
- Error handling for unauthorized access attempts

### Dependencies

- Phase 7 (database), Phases 3-4 (UI)

### Acceptance Criteria

- [ ] Data loads correctly for current user only
- [ ] Completion status persists correctly
- [ ] Notes save and load properly
- [ ] Cannot access other users' data

---

## Phase 8a: AI-Powered Exercise Parsing (OpenAI Integration)

### Deliverables

- Supabase Edge Function for secure OpenAI API calls
- Enhanced bulk import with intelligent text parsing
- Automatic question/answer separation

### Specific Tasks

1. Create `parse-exercises` Edge Function:
   - Proxy OpenAI API calls through Supabase Edge Function
   - Use GPT-4o-mini model for cost-effective parsing
   - Handle CORS and authentication properly
   - Store OPENAI_API_KEY in Supabase Edge Function secrets

2. Implement parsing prompt:
   - Extract week number and theme from text
   - Identify question labels (Reflectie, Actie, Vraag, etc.)
   - Separate question text from user answers
   - Return structured JSON with parsed data

3. Update BulkImportModal:
   - Replace client-side regex with API call to edge function
   - Add loading state during AI parsing
   - Show preview of parsed questions and answers
   - Allow user to edit parsed results before import

4. Error handling:
   - Graceful fallback if API unavailable
   - Rate limiting awareness
   - Clear error messages for users

### Security Considerations

- API key stored in Supabase secrets (never exposed to client)
- Edge function requires authenticated user
- Input validation and sanitization

### Dependencies

- Phase 4 (Exercise Tracker UI), Phase 7 (Database)

### Acceptance Criteria

- [ ] Edge function deployed and callable from frontend
- [ ] OpenAI API key securely stored in Supabase secrets
- [ ] Parsing correctly separates questions from answers
- [ ] Fallback works when API is unavailable
- [ ] No API key exposure in client code

---

## Phase 9: Online Meetings Integration

### Deliverables

- Meetings table and scheduling
- Calendar integration
- Meeting notification system

### Specific Tasks

1. Create online_meetings table:
   - id, title, scheduled_at, duration_minutes, meeting_url, program_id

2. Create user_meeting_registrations table:
   - id, user_id, meeting_id, registered_at
   - RLS: Users can only see/manage own registrations

3. Build meeting service:
   - Fetch upcoming meetings (public program data)
   - Register for meetings (own registrations only)
   - Send reminders

4. Update Dashboard meeting banner:
   - Show next scheduled meeting
   - Countdown to meeting start
   - Direct link to join

### Dependencies

- Phase 7

### Acceptance Criteria

- [ ] Meetings display with correct date/time
- [ ] Users can only see own registrations
- [ ] Join link works correctly

---

## Phase 10: Community Features with Privacy Controls

### Deliverables

- Posts and comments tables with ownership
- Social interactions (likes)
- Privacy-respecting feed

### Specific Tasks

1. Create community_posts table:
   - id, user_id, content, is_anonymous, created_at, updated_at
   - RLS: Users can edit/delete only own posts

2. Create post_comments table:
   - id, post_id, user_id, content, created_at
   - RLS: Users can edit/delete only own comments

3. Create post_likes table:
   - id, post_id, user_id, created_at
   - RLS: Users can only manage own likes

4. Build community hooks:
   - usePosts for feed loading (public posts visible)
   - useComments for post comments
   - useLikes for interaction tracking
   - All mutations restricted to own content

5. Connect Community page to backend:
   - Load posts feed
   - Enable posting new content
   - Implement commenting
   - Add like functionality

### Privacy Implementation

- Users can only edit/delete their own posts
- Users can only edit/delete their own comments
- Anonymous posting option hides author
- Admin CANNOT view or moderate post content

### Dependencies

- Phase 6 (UI), Phase 7

### Acceptance Criteria

- [ ] Posts create and display correctly
- [ ] Users can only modify own content
- [ ] Admin has no access to community content

---

## Phase 11: Admin Account Management (Limited Scope)

### Deliverables

- Admin dashboard for account management only
- User account listing (no personal data)
- Account status controls

### Specific Tasks

1. Create admin_audit_log table:
   - id, admin_id, action_type, target_user_id, timestamp
   - Track all admin actions for accountability

2. Build admin user list view:
   - Display: email, created_at, last_sign_in, account_status
   - NO display of: exercise completions, notes, posts, progress

3. Implement account management functions:
   - Activate/deactivate accounts
   - Trigger password reset email
   - View aggregate statistics only

4. Create admin-specific RLS policies:
   - Can query auth.users metadata
   - CANNOT query user_exercise_completions
   - CANNOT query user_daily_notes
   - CANNOT query community_posts content
   - All actions logged to audit table

### Privacy Enforcement

- Separate admin interface with no links to user data
- Database-level blocks prevent admin data access
- Audit log tracks all admin actions

### Dependencies

- Phase 7

### Acceptance Criteria

- [ ] Admin can manage accounts
- [ ] Admin cannot see any user content
- [ ] All admin actions logged
- [ ] RLS policies block unauthorized queries

---

## Phase 12: Achievement and Gamification System

### Deliverables

- Achievement definitions table
- User achievement tracking (private)
- Badge display components

### Specific Tasks

1. Create achievements table:
   - id, name, description, icon_url, criteria_type, criteria_value

2. Create user_achievements table:
   - id, user_id, achievement_id, earned_at
   - RLS: Users can only see own achievements

3. Build achievement service:
   - Check criteria on progress events
   - Award achievements automatically
   - Notification on new achievement

4. Implement achievement UI:
   - Badge display in navigation (gold rocket)
   - Achievement list in profile/stance page
   - Toast notification for new achievements

### Privacy

- User achievements visible only to that user

### Dependencies

- Phase 8

### Acceptance Criteria

- [ ] Achievements award based on criteria
- [ ] Users see only own badges
- [ ] Admin cannot view user achievements

---

## Phase 13: Polish and Optimization

### Deliverables

- Performance optimizations
- Animation and transition refinements
- Error handling improvements

### Specific Tasks

1. Add loading skeletons for all data-dependent sections

2. Implement optimistic updates for better UX

3. Add error boundaries and fallback UI

4. Refine animations:
   - Button hover effects (scale, brightness)
   - Card hover lift with shadow
   - Page transitions
   - Checkbox/toggle animations

5. Accessibility improvements:
   - Keyboard navigation
   - ARIA labels
   - Focus indicators on dark background
   - Color contrast verification

6. Privacy error handling:
   - Graceful handling of unauthorized access attempts
   - Clear error messages without data leakage
   - Automatic redirect on permission denied

### Dependencies

- All previous phases

### Acceptance Criteria

- [ ] Lighthouse performance score above 90
- [ ] All interactive elements keyboard accessible
- [ ] Smooth animations without jank
- [ ] Privacy violations handled gracefully

---

## Questions for Clarification

1. **Content Source**: Should the program content (exercises, readings) come from a CMS, be hardcoded initially, or do you have existing content files to import?

2. **Meeting Platform**: For online meetings, should we integrate with a specific platform (Zoom, Google Meet) or just display meeting links?

3. **Anonymous Posting**: Should community posts allow anonymous mode, and if so, should even the system store the author (for moderation) or truly anonymous?

---

## Summary

This 13-phase plan builds a privacy-first dashboard application with strict data ownership. Users control their own data completely, while admins are limited to account management with no visibility into personal content. All privacy rules are enforced at the database level via RLS policies, making them impossible to bypass from the application layer.
