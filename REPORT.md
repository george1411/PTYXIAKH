# GymApp — Technical Documentation Report

> Generated: 2026-05-07

---

## 1. Tech Stack

GymApp is a full-stack web application built on **Node.js** with **Express.js** as the backend framework and **MySQL 8+** as the database, accessed through the **Sequelize 6.37** ORM. The frontend is a **React 18** single-page application bundled with **Vite**.

Authentication uses **JWT tokens** (2-day expiry) stored in httpOnly cookies, with passwords hashed via **bcryptjs**. File uploads (avatars) are handled by **Multer** and stored in the `/uploads/` directory. Emails (password reset) are sent through **Nodemailer**.

Security is layered: **Helmet** sets secure HTTP headers, **CORS** controls cross-origin access, and **Arcjet** provides rate limiting and bot detection. Background tasks (weekly program resets) run via **node-cron**.

AI-powered features use the **Anthropic Claude SDK** (`@anthropic-ai/sdk`), specifically Claude Haiku for exercise conflict analysis. Nutrition search is powered by the **Calorie Ninjas API**, and fitness data (step counts) syncs from **Fitbit** via OAuth 2.0. The app is deployed on **Railway** using `railway.toml` and `nixpacks.toml` configuration.

---

## 2. Project Structure

```
PTYXIAKH/
├── app.js                        # Express entry point, route/middleware setup
├── config/
│   ├── env.js                    # Loads .env.*.local variables
│   └── arcjet.js                 # Arcjet security config
├── database/
│   └── mysql.js                  # Raw SQL schema creation for advanced tables
├── models/
│   ├── index.js                  # Central model registry + associations
│   ├── common/                   # Shared models (User, Workout, Message, etc.)
│   ├── customer/                 # Customer-only models (DailyLog, WorkoutLog, etc.)
│   └── trainer/                  # Trainer-only models (TrainerProfile)
├── controllers/
│   ├── common/                   # Auth, workouts, nutrition, chat, schedule, groups
│   ├── customer/                 # Daily logs, weekly measurements
│   ├── trainer/                  # Client management, templates, pain logs
│   └── fitbit.controller.js      # Fitbit OAuth + step sync
├── routes/
│   ├── common/                   # Auth, users, workouts, nutrition, chat, etc.
│   ├── trainer/trainer.routes.js # All /api/v1/trainer/* routes
│   └── fitbit.routes.js          # Fitbit OAuth routes
├── middlewares/
│   ├── auth.middleware.js        # JWT validation → req.user
│   ├── error.middleware.js       # Global error handler
│   └── arcjet.middleware.js      # Rate limit + bot detection
├── jobs/
│   └── weeklyReset.js            # Cron: resets programs every Monday 00:00 (Athens)
├── client/                       # React frontend (Vite)
│   └── src/
│       ├── main.jsx              # React entry point
│       ├── App.jsx               # Root router
│       ├── components/
│       │   ├── onboarding/       # Landing page, hero, navbar
│       │   ├── SignIn/SignUp/ForgotPassword/ResetPassword
│       │   └── dashboard/
│       │       ├── common/       # Shared dashboard components (chat, settings, widgets)
│       │       ├── customer/     # Customer dashboard + tabs + widgets
│       │       └── trainer/      # Trainer dashboard + tabs
└── seed*.js / check_db.js        # DB seed + utility scripts
```

---

## 3. Database Schema

### Core Tables (Sequelize models)

| Table | Columns |
|-------|---------|
| `Users` | id, name, email, password, role, age, gender, height, trainerId, resetPasswordCode, resetPasswordExpiry |
| `Exercises` | id, name, description, category, difficulty, targetMuscles (JSON), equipment, instructions, videoUrl, imageUrl |
| `Workouts` | id, name, day, status, weekOf |
| `WorkoutExercises` | id, sets, reps, weight, notes |
| `WorkoutLogs` | id, setNumber, kg, reps, completed, loggedAt |
| `DailyGoals` | id, userId, date, calories, protein, carbs, fat |
| `DailyLogs` | id, userId, date, caloriesBurned, proteinConsumed, waterIntake |
| `Meals` | id, userId, date, mealType, foodName, calories, protein, carbs, fat |
| `Messages` | id, senderId, receiverId, content, isRead |
| `ScheduleEvents` | id, userId, title, day, date, startTime, endTime, color |
| `TrainerProfiles` | id, userId, bio, specializations (JSON), certifications (JSON), experienceYears, phone, location |
| `UserStats` | id, userId, dayStreak, weeklyWorkouts, complianceScore |
| `WeeklyMeasurements` | id, userId, date, weight |

### Advanced Tables (raw SQL in `database/mysql.js`)

| Table | Columns |
|-------|---------|
| `TrainerInviteCodes` | id, trainerId, code, usedBy, usedAt, createdAt |
| `WorkoutTemplates` | id, trainerId, name, programData (JSON), type |
| `FitbitTokens` | id, userId, accessToken, refreshToken, expiresAt |
| `ClientPainLogs` | id, clientId, trainerId, zone, severity, note |
| `Groups` | id, trainerId, name |
| `GroupMembers` | id, groupId, userId |
| `GroupMessages` | id, groupId, senderId, content |
| `GroupPrograms` | id, groupId, trainerId, name, programData |
| `GroupProgramLogs` | id, groupProgramId, userId, dayLabel, exerciseName, setsCompleted, repsCompleted, weight, note, loggedAt |

### Relationships

| Relationship | Type | Key |
|-------------|------|-----|
| `Users` → `Workouts` | One-to-Many | `Workouts.userId` → `Users.id` |
| `Users` → `DailyLogs` | One-to-Many | `DailyLogs.userId` → `Users.id` |
| `Users` → `DailyGoals` | One-to-Many | `DailyGoals.userId` → `Users.id` |
| `Users` → `Meals` | One-to-Many | `Meals.userId` → `Users.id` |
| `Users` → `WorkoutLogs` | One-to-Many | `WorkoutLogs.userId` → `Users.id` |
| `Users` → `ScheduleEvents` | One-to-Many | `ScheduleEvents.userId` → `Users.id` |
| `Users` → `Messages` (sent) | One-to-Many | `Messages.senderId` → `Users.id` |
| `Users` → `Messages` (received) | One-to-Many | `Messages.receiverId` → `Users.id` |
| `Users` → `TrainerProfiles` | One-to-One | `TrainerProfiles.userId` → `Users.id` |
| `Users` → `UserStats` | One-to-One | `UserStats.userId` → `Users.id` |
| `Users` → `WeeklyMeasurements` | One-to-Many | `WeeklyMeasurements.userId` → `Users.id` |
| `Users` → `Users` (trainer) | Self-reference | `Users.trainerId` → `Users.id` |
| `Workouts` ↔ `Exercises` | Many-to-Many | through `WorkoutExercises` (`workoutId`, `exerciseId`) |
| `WorkoutExercises` → `WorkoutLogs` | One-to-Many | `WorkoutLogs.workoutExerciseId` → `WorkoutExercises.id` |
| `Users` → `TrainerInviteCodes` | One-to-Many | `TrainerInviteCodes.trainerId` → `Users.id` |
| `Users` → `FitbitTokens` | One-to-One | `FitbitTokens.userId` → `Users.id` |
| `Users` → `ClientPainLogs` (client) | One-to-Many | `ClientPainLogs.clientId` → `Users.id` |
| `Users` → `ClientPainLogs` (trainer) | One-to-Many | `ClientPainLogs.trainerId` → `Users.id` |
| `Users` → `Groups` | One-to-Many | `Groups.trainerId` → `Users.id` |
| `Groups` ↔ `Users` | Many-to-Many | through `GroupMembers` (`groupId`, `userId`) |
| `Groups` → `GroupMessages` | One-to-Many | `GroupMessages.groupId` → `Groups.id` |
| `Groups` → `GroupPrograms` | One-to-Many | `GroupPrograms.groupId` → `Groups.id` |
| `GroupPrograms` → `GroupProgramLogs` | One-to-Many | `GroupProgramLogs.groupProgramId` → `GroupPrograms.id` |
| `Users` → `WorkoutTemplates` | One-to-Many | `WorkoutTemplates.trainerId` → `Users.id` |

---

## 4. Authentication & Security

- **Sign-up**: POST `/api/v1/auth/signup` — hashes password with bcryptjs, creates User row, issues JWT in httpOnly cookie.
- **Sign-in**: POST `/api/v1/auth/signin` — validates credentials, refreshes JWT.
- **`authorize` middleware**: Reads JWT from cookie or `Authorization` header, attaches `req.user`.
- **Role-based access**: Routes under `/api/v1/trainer/*` check `req.user.role === 'trainer'`.
- **Invite codes**: Trainer generates code → customer enters it at signup → sets `trainerId` on User.
- **Rate limiting**: Arcjet middleware applied globally — blocks bots and abusive IPs.
- **Helmet**: Sets secure HTTP headers on all responses.
- **Avatar upload**: Multer validates file type, stores in `/uploads/`, URL saved on User row.

---

## 5. Pages & Widgets

### 5.1 Onboarding / Landing

**`onboarding/Hero.jsx`**
Full-screen landing hero. Displays app tagline, CTA buttons (Sign Up / Sign In), and links to feature sections. Responsive layout.

**`onboarding/Navbar.jsx`**
Top navigation for the public landing page. Logo on left, nav links + auth buttons on right.

**`SignIn.jsx` / `SignUp.jsx`**
Standard auth forms with validation. SignUp includes role selector (Customer / Trainer). On success, redirects to appropriate dashboard.

**`ForgotPassword.jsx` / `ResetPassword.jsx`**
Two-step password recovery: enter email → receive link via Nodemailer → set new password via token URL.

---

### 5.2 Customer Dashboard

**`customer/Sidebar.jsx`**
Left nav rail with icon+label tabs: Home, Workout, Nutrition, Chat, Profile. Highlights active tab.

#### Tab: Home (Overview)

**`widgets/TodayWorkout/TodayWorkout.jsx`**
Shows today's assigned workout program. Lists exercises with sets/reps. Customer can mark exercises as done, which writes a `WorkoutLog` entry. Pulls from `/api/v1/workouts?day=today`.

**`widgets/TodayNutrition/TodayNutrition.jsx`**
Displays daily calorie progress bar vs. goal. Shows total consumed vs. `DailyGoal.calories`. Data from `/api/v1/dailylogs` + `/api/v1/dailygoals`.

**`widgets/TodayMacros/TodayMacros.jsx`**
Donut/pie chart of today's macro split (protein / carbs / fat). Computes percentages from `DailyLog` data. Visual-only, no editing.

**`widgets/TodayEvents/TodayEvents.jsx`**
Lists `ScheduleEvents` for today (classes, trainer sessions). Shows title, time, location. Pulls from `/api/v1/schedule?date=today`.

**`widgets/StreaksStats/StreaksStats.jsx`**
Displays workout streaks and habit consistency stats. Reads from `UserStats` table. Shows current streak, longest streak, total sessions.

**`widgets/WeeklyMeasurements/WeeklyMeasurements.jsx`**
Form + history chart for body measurements (weight, etc.) entered weekly. POSTs to `/api/v1/measurements`, renders historical line chart.

**`widgets/WeeklySteps/WeeklySteps.jsx`**
Bar chart of daily step counts for the past 7 days. Data sourced from Fitbit via `/api/v1/fitbit/steps`. Falls back to manual entry if Fitbit not connected.

#### Tab: Workout

**`customer/Workout/Workout.jsx`**
Full workout logging interface. Shows weekly program grid (Mon–Sun). Customer taps a day → sees exercises → logs actual sets/reps/weight → submits workout log. Reads templates from trainer-assigned program.

#### Tab: Nutrition

**`customer/Nutrition/Nutrition.jsx`**
Nutrition dashboard. Features:
- **Meal logger**: Search food via Calorie Ninjas API, add to daily log with portion size.
- **Macro summary**: Real-time totals as meals are added.
- **Goal progress**: Progress bars per macro vs. `DailyGoal`.
- **Meal history**: List of all logged meals today with delete option.

#### Tab: Chat (Messages)

**`common/Messages/CustomerMessages.jsx`**
Full messaging interface between customer and their trainer.

Widgets inside:
- **Sidebar**: Conversation list showing trainer name + last message preview. Detects `__WORKOUT__` prefix in messages → displays `Workout: <program name>` instead of raw JSON.
- **Message thread**: Chronological bubbles (own = right, other = left). Renders workout cards for shared programs.
- **Input row**: Text input + send button + "+" menu for attachments.
- **Report Pain modal**: Triggered from "+" menu. Shows simple SVG body diagram (head + torso + arms + legs as rectangles, `viewBox="0 0 120 260"`). Customer clicks body zones (19 named dot positions). Selected zones highlighted in orange. Severity slider + note text. Submits to `/api/v1/trainer/pain-log`.
- **Workout picker modal**: Customer can share a workout program from their list. Selected program serialized as `__WORKOUT__{json}` message.

#### Tab: Profile

**`customer/CustomerProfile.jsx`**
Customer profile view and editor.

Sections:
- **Header**: Avatar (click to upload in edit mode), name, email, role badge, age/gender/height chips. Sign Out + Edit Profile buttons.
- **Personal Info card**: Editable fields — Full Name, Email, Age, Gender, Height (cm), Weight Goal (kg). Weight goal persisted to `localStorage`.
- **My Trainer card**: Shows assigned trainer's avatar, name, email, experience, client count, bio, location, phone, specializations. Data from `/api/v1/trainer/:id/public`.

---

### 5.3 Trainer Dashboard

Entry: `TrainerDashboard.jsx` — manages tabs, global search state, navigation.

**`trainer/TrainerSidebar.jsx`**
Left nav rail: Overview, Clients, Programs, Groups, Schedule, Profile, Chat tabs.

**Global Search Bar** (in `TrainerDashboard.jsx`)
Input at top of trainer dashboard. On first focus, lazily fetches all clients + programs in parallel. Filters in-memory as user types. Dropdown shows two groups: Clients (navigates to Clients tab) and Programs (navigates to Programs tab and auto-opens that program via `initialProgramId` prop).

#### Tab: Overview

**`trainer/TrainerOverview.jsx`**
Top-level stats at a glance.

Widgets:
- **KPI cards**: Total clients, active programs, weekly sessions, avg. client progress.
- **Client overview blocks**: For each client — weight trend sparkline, today's targets (calories / workout done), last active timestamp. Each block is a unified dark card with subtle inner sections.
- **Recent activity feed**: Latest client actions (workout logged, meal added, measurement entered).

#### Tab: Clients

**`trainer/TrainerClients.jsx`**
Per-client management panel. Selecting a client loads their full data.

Widgets inside:
- **Client selector list**: All assigned clients with avatar, name, last active.
- **Client header**: Avatar, name, stats chips (age, height, weight goal).
- **Program panel (`ProgramPanel`)**: The client's current weekly workout program.
  - Days of the week tabs.
  - Exercise list per day with sets/reps/weight.
  - Add exercise: search by name, add to day. Triggers AI conflict check (see below).
  - **AI Exercise Conflict Check**: After adding an exercise, calls `/api/v1/trainer/clients/:id/check-exercise` (hybrid rule-based + Claude Haiku fallback). If conflict detected, shows `AlertTriangle` icon next to exercise name + subtle orange reason text below. Conflict persists across saves/reloads (re-checked via `Promise.all` on program load).
  - Save / cancel program edits.
- **Pain log panel**: Displays `ClientPainLogs` entries — body zone, severity, date, note.
- **"No program" badge**: Shown in client list if client has no assigned workouts.

#### Tab: Programs

**`trainer/TrainerPrograms.jsx`**
Workout template builder and library.

Widgets:
- **Template list**: All saved templates with name, type, last edited.
- **Template editor**: Select a template → edit week structure (day-by-day). Add/remove/reorder exercises. Set sets/reps/notes per exercise.
- **Auto-open**: Accepts `initialProgramId` prop — automatically opens and loads a specific template when navigated from global search.
- **Save / delete template** actions.

#### Tab: Groups

**`trainer/TrainerGroups.jsx`**
Group client management.

Widgets:
- **Group list**: All trainer's groups with member count.
- **Group detail**: Member list, group chat feed, group program assignment.
- **Add/remove members**.

**`trainer/TrainerGroupPrograms.jsx`**
Assign a workout template to an entire group. Tracks per-member completion via `GroupProgramLogs`.

#### Tab: Schedule / Calendar

**`common/widgets/Schedule/Schedule.jsx`**
Week-view calendar. Trainer can create events (class, session, reminder) linked to a client or group. Events stored as `ScheduleEvents`. Color-coded by type.

#### Tab: Chat

**`common/Messages/CustomerMessages.jsx`** (shared component, trainer side)
Same messaging interface as customer side but from trainer perspective — sees all client conversations, can share workout programs, respond to pain reports.

#### Tab: Profile

**`trainer/TrainerProfile.jsx`**
Trainer profile editor.

Fields: Name, email, bio, location, phone, experience years, specializations (tag list). Avatar upload. Data saved to both `Users` and `TrainerProfiles` tables.

---

## 6. AI Features

### Exercise Conflict Detection
- **Route**: `POST /api/v1/trainer/clients/:clientId/check-exercise`
- **Controller**: `controllers/trainer/exerciseCheck.controller.js`
- **Logic**:
  1. Fetch client's `ClientPainLogs` (active pain zones).
  2. Rule-based keyword match: exercise name vs. pain zone keywords.
  3. If no rule match, send to Claude Haiku (`claude-haiku-*`) with context prompt.
  4. Returns `{ conflict: bool, severity: string, reason: string }`.
- **Frontend**: After adding an exercise, conflict shown as `AlertTriangle` icon + reason text. Re-checked on every program load via `Promise.all`.

---

## 7. External Integrations

### Fitbit
- OAuth 2.0 flow: trainer/customer connects Fitbit account.
- Stores tokens in `FitbitTokens` table.
- Syncs daily step count to `DailyLogs`.
- `WeeklySteps` widget reads this data for bar chart.

### Calorie Ninjas
- Nutrition search API.
- Called from `Nutrition.jsx` when customer searches for food.
- Returns calories + macros per 100g / per serving.

### Nodemailer
- Used for password reset emails.
- SMTP config in `.env`.

### Anthropic (Claude)
- Used for exercise conflict checking (Haiku model) and optionally for AI chat coaching.
- API key in `.env` as `ANTHROPIC_API_KEY`.

---

## 8. Key Workflows

### Customer onboarding
1. Trainer generates invite code → shares with client.
2. Customer signs up with invite code → `trainerId` set automatically.
3. Customer sees their trainer in Profile tab.

### Weekly program flow
1. Trainer creates template in Programs tab.
2. Trainer assigns template to client in Clients tab.
3. Customer sees program in Workout tab, logs sessions.
4. Cron job resets program every Monday 00:00 (Athens time).

### Pain reporting
1. Customer opens Chat → "+" menu → Report Pain.
2. Clicks body zones on SVG diagram, sets severity, adds note.
3. Submits → `ClientPainLogs` entry created.
4. Trainer sees pain log in Clients tab.
5. Next time trainer adds an exercise for that client, conflict check runs against active pain logs.

### Group coaching
1. Trainer creates group, adds clients.
2. Assigns a workout template to the group.
3. All group members see the program in their Workout tab.
4. Completion tracked per member in `GroupProgramLogs`.

---

## 10. Deployment

- **Backend**: Railway (Node.js). Config in `railway.toml` and `nixpacks.toml`.
- **Frontend**: Built via `npm run build` in `client/`, served as static files from Express.
- **DB**: MySQL hosted on Railway or external MySQL provider.
- **Environment**: `.env.development.local` for local, Railway env vars for production.
