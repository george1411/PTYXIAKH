# GymLit — Technical Manual

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Authentication & Security](#4-authentication--security)
5. [Database Schema](#5-database-schema)
6. [Backend — API Routes](#6-backend--api-routes)
7. [Frontend — Architecture](#7-frontend--architecture)
8. [Customer Dashboard](#8-customer-dashboard)
9. [Trainer Dashboard](#9-trainer-dashboard)
10. [Shared Components](#10-shared-components)
11. [Key Features In Depth](#11-key-features-in-depth)

---

## 1. Project Overview

GymLit is a full-stack fitness management web application that connects personal trainers with their clients. Trainers can manage clients, assign workout programs, track pain and progress, and communicate via chat. Clients can log workouts and nutrition, track body weight, view their schedule, sync steps with Fitbit, and report pain or discomfort to their trainer.

The application has two distinct user roles — **personal_trainer** and **customer** — each with their own dashboard, navigation, and feature set.

---

## 2. Tech Stack

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js (ES Modules) | — | Runtime |
| Express.js | ~4.16.1 | HTTP server & routing |
| MySQL | — | Relational database |
| mysql2 | 3.16.3 | MySQL driver |
| Sequelize | 6.37.7 | ORM for model definitions |
| jsonwebtoken | 9.0.3 | JWT authentication |
| bcryptjs | 3.0.3 | Password hashing |
| Helmet | 8.1.0 | HTTP security headers |
| CORS | 2.8.6 | Cross-origin resource sharing |
| Arcjet | 1.0.0-beta.17 | Rate limiting & bot protection |
| Multer | 2.1.1 | File uploads (avatars, certs) |
| Nodemailer | 8.0.5 | Password reset emails |
| Axios | 1.13.5 | HTTP client (Fitbit API calls) |
| dotenv | 17.2.3 | Environment variable loading |
| Morgan | 1.9.1 | HTTP request logging |
| cookie-parser | 1.4.4 | Cookie parsing |

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19.2.0 | UI library |
| React Router DOM | 7.12.0 | Client-side routing |
| Vite | 7.2.4 | Build tool & dev server |
| Tailwind CSS | 4.1.18 | Utility-first styling |
| PostCSS | 8.5.6 | CSS processing |
| Lucide React | 0.563.0 | Icon library |
| Recharts | 3.7.0 | Charts (line, bar) |
| Axios | 1.13.2 | HTTP requests to backend |
| XLSX | 0.18.5 | Spreadsheet export |

### Dev Environment

- **Backend dev server:** nodemon via `npm run dev` in root
- **Frontend dev server:** Vite via `npm run dev` in `/client`
- **Proxy:** Vite proxies `/api/*` requests to the Express backend
- **Ports:** Backend on `3000`, frontend on `5173`

---

## 3. Project Structure

```
PTYXIAKH/
├── app.js                        # Express entry point, middleware setup
├── package.json                  # Backend dependencies
├── config/
│   └── env.js                   # Environment config (DB, JWT secret, etc.)
├── database/
│   └── mysql.js                 # Sequelize init + raw SQL table creation
├── models/
│   ├── index.js                 # Model imports & associations
│   ├── common/                  # Shared models (User, Exercise, Workout…)
│   ├── customer/                # Customer models (DailyLog, WorkoutLog…)
│   └── trainer/                 # Trainer models (TrainerProfile)
├── routes/
│   ├── common/                  # Routes accessible to both roles
│   ├── trainer/                 # Trainer-only routes
│   └── fitbit.routes.js
├── controllers/
│   ├── common/
│   ├── customer/
│   ├── trainer/
│   └── fitbit.controller.js
├── middlewares/
│   ├── auth.middleware.js       # JWT verification
│   ├── error.middleware.js      # Global error handler
│   └── arcjet.middleware.js     # Rate limiting
├── uploads/                     # Stored user files (avatars, certificates)
├── scripts/                     # Utility / one-off scripts
├── preview/                     # Static HTML previews for UI development
├── docs/
│   └── MANUAL.md                # This file
└── client/
    ├── package.json
    ├── vite.config.js           # Vite config with /api proxy
    └── src/
        ├── main.jsx             # React app entry point
        ├── App.jsx              # Root component with auth routing
        ├── assets/
        └── components/
            ├── onboarding/      # Login / register pages
            └── dashboard/
                ├── common/      # Shared widgets & components
                ├── customer/    # Customer dashboard & widgets
                └── trainer/     # Trainer dashboard & components
```

---

## 4. Authentication & Security

### Sign Up

1. User submits name, email, password, and role (`personal_trainer` or `customer`).
2. Backend validates format and checks email uniqueness.
3. Password is hashed with bcryptjs before storage.
4. A JWT is generated containing `{ userId }` and returned to the client.

### Sign In

1. User submits email and password.
2. Backend queries the Users table by email.
3. bcryptjs compares the submitted password against the stored hash.
4. On match, a JWT is signed and sent back (via cookie and/or response body).

### Protected Routes

Every route that requires authentication uses the `authorize` middleware:

1. Middleware reads the JWT from `Authorization: Bearer <token>` header or cookie.
2. JWT is verified against the secret.
3. Decoded `userId` is used to load the full user record from the database.
4. `req.user` is populated with the user object. Request proceeds.
5. On any failure (missing token, expired, user not found) → `401 Unauthorized`.

### Password Reset

1. User requests reset by submitting their email.
2. A random code is generated and stored on the User record with an expiry timestamp.
3. Nodemailer sends an email with the reset code or link.
4. User submits new password + code.
5. Backend verifies the code against the DB and checks it hasn't expired.
6. Password is re-hashed and saved; reset code is cleared.

### Additional Security

- **Helmet** sets secure HTTP response headers.
- **CORS** restricts which origins can call the API.
- **Arcjet** middleware provides rate limiting and bot/abuse protection on all routes.

---

## 5. Database Schema

All tables are created on server start via Sequelize models (`.sync()`) and supplemented by raw `CREATE TABLE IF NOT EXISTS` SQL for tables not covered by Sequelize models.

---

### Users

The central table. Both trainers and customers are stored here, distinguished by `role`.

| Column | Type | Notes |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| name | VARCHAR | 2–25 characters |
| email | VARCHAR UNIQUE | Valid email required |
| password | VARCHAR | bcryptjs hash |
| role | ENUM | `personal_trainer` or `customer` |
| age | INT | Nullable |
| gender | ENUM | `M` or `F`, nullable |
| height | FLOAT | Nullable |
| trainerId | INT FK → Users.id | Set when customer redeems invite code |
| profileImage | VARCHAR | Path to uploaded avatar |
| resetPasswordCode | VARCHAR | Nullable, cleared after use |
| resetPasswordExpiry | DATETIME | Nullable |

---

### Exercises

The exercise library. Exercises are global and shared across all users.

| Column | Type | Notes |
|---|---|---|
| id | INT PK | |
| name | VARCHAR UNIQUE | |
| description | TEXT | |
| category | ENUM | Strength, Cardio, Stretching, Plyometrics, Other |
| difficulty | ENUM | Beginner, Intermediate, Advanced |
| targetMuscles | JSON | Array e.g. `["Chest", "Triceps"]` |
| equipment | VARCHAR | |
| instructions | TEXT | |
| videoUrl | VARCHAR | Nullable |
| imageUrl | VARCHAR | Nullable |

---

### Workouts

A workout is a named collection of exercises, assigned to a user for a specific day of the week.

| Column | Type | Notes |
|---|---|---|
| id | INT PK | |
| userId | INT FK → Users | Owner of this workout |
| name | VARCHAR | |
| day | ENUM | Monday–Sunday, nullable |
| status | ENUM | `active`, `completed`, `template` |
| weekOf | DATE | Week start date, nullable |

---

### WorkoutExercises

Junction table between Workouts and Exercises, storing the prescribed sets/reps/weight.

| Column | Type | Notes |
|---|---|---|
| id | INT PK | |
| workoutId | INT FK → Workouts | |
| exerciseId | INT FK → Exercises | |
| sets | INT | |
| reps | VARCHAR | String e.g. `"8-12"` |
| weight | FLOAT | In kg, nullable |
| notes | TEXT | Nullable |

---

### WorkoutLogs

Tracks each individual set as a customer completes it.

| Column | Type | Notes |
|---|---|---|
| id | INT PK | |
| workoutExerciseId | INT FK → WorkoutExercises | |
| userId | INT FK → Users | |
| setNumber | INT | |
| kg | FLOAT | Nullable |
| reps | INT | Nullable |
| completed | BOOLEAN | Default false |
| loggedAt | DATETIME | |

---

### DailyLogs

One record per user per day, tracking calorie burn, protein intake, water, and steps.

| Column | Type | Notes |
|---|---|---|
| id | INT PK | |
| userId | INT FK → Users | |
| date | DATE | |
| caloriesBurned | INT | |
| proteinConsumed | INT | |
| waterIntake | INT | In ml or glasses |
| steps | INT | Updated by Fitbit sync or manual entry |
| **Unique** | (userId, date) | One log per day per user |

---

### DailyGoals

Stores daily nutritional targets per user. Defaults provided, updated via settings.

| Column | Type | Notes |
|---|---|---|
| id | INT PK | |
| userId | INT FK → Users | |
| date | DATE | |
| calories | INT | Default 2500 |
| protein | INT | Default 150g |
| carbs | INT | Default 250g |
| fat | INT | Default 70g |
| **Unique** | (userId, date) | |

---

### UserStats

One record per user. Aggregated stats updated when workouts are logged.

| Column | Type | Notes |
|---|---|---|
| id | INT PK | |
| userId | INT UNIQUE FK → Users | |
| dayStreak | INT | Consecutive days with a workout |
| weeklyWorkouts | INT | Workouts completed this week |
| complianceScore | INT | Percentage 0–100 |

---

### WeeklyMeasurements

Body weight entries, one per user per date.

| Column | Type | Notes |
|---|---|---|
| id | INT PK | |
| userId | INT FK → Users | |
| date | DATE | |
| weight | FLOAT | In kg |
| **Unique** | (userId, date) | |

---

### Messages

Direct messages between users (trainer ↔ customer).

| Column | Type | Notes |
|---|---|---|
| id | INT PK | |
| senderId | INT FK → Users | |
| receiverId | INT FK → Users | |
| content | TEXT | Plain text or `__WORKOUT__<JSON>` for workout cards |
| isRead | BOOLEAN | Default false |

---

### ScheduleEvents

Calendar events for both trainers and customers.

| Column | Type | Notes |
|---|---|---|
| id | INT PK | |
| userId | INT FK → Users | |
| title | VARCHAR | |
| day | VARCHAR | Day name e.g. `"Monday"` |
| date | DATE | Nullable, specific date |
| startTime | VARCHAR | e.g. `"09:00"` |
| endTime | VARCHAR | e.g. `"10:00"` |
| color | VARCHAR | CSS class key e.g. `"event-1"` |
| clientId | INT | Nullable, links trainer event to client |

---

### TrainerProfiles

Extended profile data for trainers, separate from the core Users table.

| Column | Type | Notes |
|---|---|---|
| id | INT PK | |
| userId | INT UNIQUE FK → Users | |
| bio | TEXT | Nullable |
| specializations | JSON | Array of strings |
| certifications | JSON | Array of `{ name, fileUrl }` objects |
| experienceYears | INT | |
| phone | VARCHAR | Nullable |
| location | VARCHAR | Nullable |

---

### Meals

Individual food log entries for nutrition tracking.

| Column | Type | Notes |
|---|---|---|
| id | INT PK | |
| userId | INT FK → Users | |
| date | DATE | |
| mealType | ENUM | `breakfast`, `lunch`, `dinner`, `snack` |
| foodName | VARCHAR | |
| calories | INT | |
| protein | FLOAT | In grams |
| carbs | FLOAT | In grams |
| fat | FLOAT | In grams |

---

### TrainerInviteCodes

Codes generated by trainers. Customers redeem them to link their account to a trainer.

| Column | Type | Notes |
|---|---|---|
| id | INT PK | |
| trainerId | INT FK → Users | |
| code | VARCHAR(20) UNIQUE | |
| usedBy | INT FK → Users | Nullable — the customer who redeemed it |
| usedAt | DATETIME | Nullable |

---

### WorkoutTemplates

Reusable workout programs saved by trainers. Can be a full weekly plan or a single-day program.

| Column | Type | Notes |
|---|---|---|
| id | INT PK | |
| trainerId | INT FK → Users | |
| name | VARCHAR | |
| programData | JSON | Full program structure including exercises, sets, reps, notes |
| type | ENUM | `week` (full weekly plan) or `day` (single session) |

---

### FitbitTokens

OAuth2 tokens for Fitbit integration. One per user.

| Column | Type | Notes |
|---|---|---|
| id | INT PK | |
| userId | INT UNIQUE FK → Users | |
| accessToken | TEXT | |
| refreshToken | TEXT | |
| expiresAt | DATETIME | Used to detect expired tokens |

---

### ClientPainLogs

Pain and discomfort reports submitted by customers, visible to their trainer.

| Column | Type | Notes |
|---|---|---|
| id | INT PK | |
| clientId | INT FK → Users | The customer who reported it |
| trainerId | INT FK → Users | Their assigned trainer |
| zone | VARCHAR(50) | Body zone name e.g. `"Lower Back"` |
| severity | ENUM | `Low`, `Moderate`, `High` |
| note | TEXT | Optional description |

---

## 6. Backend — API Routes

All routes are prefixed with `/api/v1/`. All routes marked **[Auth]** require a valid JWT.

---

### Authentication — `/api/v1/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/sign-up` | — | Register new user |
| POST | `/sign-in` | — | Login, returns JWT |
| POST | `/sign-out` | — | Logout (clears cookie) |
| GET | `/me` | ✓ | Get own profile |
| PUT | `/profile` | ✓ | Update name, age, height, gender |
| PUT | `/change-password` | ✓ | Change password (requires current) |
| DELETE | `/delete-account` | ✓ | Permanently delete account |
| POST | `/avatar` | ✓ | Upload profile picture (multipart) |
| POST | `/forgot-password` | — | Send reset code via email |
| POST | `/reset-password` | — | Submit new password + code |

---

### Users — `/api/v1/users`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | ✓ | List all users |
| GET | `/:id` | ✓ | Get user by ID |
| POST | `/report-pain` | ✓ | Submit pain report (customer) |
| GET | `/pain` | ✓ | Get own pain logs |
| DELETE | `/pain/:painId` | ✓ | Delete a pain log entry |

---

### Exercises — `/api/v1/exercises`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | ✓ | List all exercises |
| GET | `/:id` | ✓ | Get exercise by ID |
| POST | `/` | ✓ | Create exercise |
| PUT | `/:id` | ✓ | Update exercise |
| DELETE | `/:id` | ✓ | Delete exercise |

---

### Workouts — `/api/v1/workouts`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | ✓ | List user's workouts |
| POST | `/` | ✓ | Create workout |
| GET | `/:id` | ✓ | Get workout with exercises |
| DELETE | `/:id` | ✓ | Delete workout |
| POST | `/logs` | ✓ | Save workout completion logs |

---

### Daily Logs — `/api/v1/dailylogs`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/today` | ✓ | Get today's log |
| POST | `/add` | ✓ | Create or update today's log |
| POST | `/water` | ✓ | Log water intake |
| POST | `/steps` | ✓ | Manually log steps |
| GET | `/weekly-steps` | ✓ | Steps for each day this week |

---

### Daily Goals — `/api/v1/dailygoals`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/update` | ✓ | Set or update macro/calorie targets |

---

### Stats — `/api/v1/stats`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | ✓ | Streak, weekly workouts, compliance |
| GET | `/weekly-measurements` | ✓ | Weight entries for chart |
| POST | `/weekly-measurements` | ✓ | Log a new weight entry |
| GET | `/weight-history` | ✓ | Full weight history |
| GET | `/exercise-prs` | ✓ | Personal records per exercise |
| GET | `/workout-calendar` | ✓ | Calendar heatmap data (6 months) |
| POST | `/predict-weight` | ✓ | AI weight prediction |
| GET | `/predict-baseline` | ✓ | Data needed to run prediction |

---

### Chat — `/api/v1/chat`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/conversations` | ✓ | All conversations with last message |
| GET | `/unread` | ✓ | Total unread message count |
| POST | `/mark-read` | ✓ | Mark all messages from `partnerId` as read |
| GET | `/` | ✓ | Message history with `?partnerId=<id>` |
| POST | `/` | ✓ | Send a message |

**Special message format:** Messages containing workout cards are stored as `__WORKOUT__<JSON>` where the JSON contains `{ name, exercises }`. Both chat panels detect this prefix and render a workout card instead of plain text.

---

### Schedule — `/api/v1/schedule`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | ✓ | Get all events for the user |
| GET | `/my-appointments` | ✓ | Appointments for customers |
| POST | `/` | ✓ | Create event |
| PUT | `/:id` | ✓ | Update event |
| DELETE | `/:id` | ✓ | Delete event |

---

### Meals — `/api/v1/meals`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | ✓ | Today's meals |
| POST | `/` | ✓ | Add a food log entry |
| PATCH | `/:id/type` | ✓ | Change meal type (breakfast/lunch/…) |
| DELETE | `/:id` | ✓ | Delete meal entry |

---

### Nutrition — `/api/v1/nutrition`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/lookup` | ✓ | Search food database for macros |
| GET | `/history` | ✓ | Historical nutrition entries |
| GET | `/weekly` | ✓ | Weekly macro summary |
| GET | `/balance` | ✓ | Today's consumed vs target |

---

### Invite Codes — `/api/v1/invite`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | ✓ | List trainer's invite codes |
| POST | `/` | ✓ | Generate a new code |
| DELETE | `/:id` | ✓ | Delete a code |
| POST | `/redeem` | ✓ | Redeem code, links customer to trainer |

---

### Trainer — `/api/v1/trainer`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/list` | ✓ | List all trainers (public) |
| GET | `/:id/public` | ✓ | Trainer's public profile |
| GET | `/profile` | ✓ | Own trainer profile |
| PUT | `/profile` | ✓ | Update trainer profile |
| POST | `/upload-cert` | ✓ | Upload certification file |
| GET | `/dashboard` | ✓ | Trainer dashboard summary |

**Clients:**

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/clients` | ✓ | List all clients |
| GET | `/clients/:clientId` | ✓ | Client details (stats, weight, logs) |
| GET | `/clients/:clientId/program` | ✓ | Client's current workout program |
| POST | `/clients/:clientId/program` | ✓ | Assign/update workout program |
| DELETE | `/clients/:clientId/program/:workoutId` | ✓ | Remove workout from program |
| GET | `/clients/:clientId/pain` | ✓ | Client's pain logs |
| POST | `/clients/:clientId/pain` | ✓ | Log pain on behalf of client |
| PUT | `/clients/:clientId/pain/:painId` | ✓ | Edit pain log |
| DELETE | `/clients/:clientId/pain/:painId` | ✓ | Delete pain log |

**Templates:**

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/templates` | ✓ | List saved templates |
| POST | `/templates` | ✓ | Save new template |
| GET | `/templates/:id` | ✓ | Get template with full program data |
| PUT | `/templates/:id` | ✓ | Update template |
| DELETE | `/templates/:id` | ✓ | Delete template |

---

### Fitbit — `/api/v1/fitbit`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/connect` | ✓ | Generate Fitbit OAuth2 authorization URL |
| GET | `/callback` | — | OAuth2 callback, stores tokens |
| GET | `/switch` | ✓ | Re-initiate Fitbit connection |
| GET | `/status` | ✓ | Check if Fitbit is connected |
| POST | `/sync` | ✓ | Pull today's steps from Fitbit API |
| DELETE | `/disconnect` | ✓ | Revoke Fitbit connection |

---

## 7. Frontend — Architecture

The React app uses a simple role-based routing pattern at the top level:

```
App.jsx
 └── if not authenticated → Onboarding (Login / Register)
 └── if role === 'personal_trainer' → TrainerDashboard
 └── if role === 'customer' → CustomerDashboard
```

Each dashboard is a single-page layout with a left sidebar for navigation. The `activeTab` state controls which panel is rendered in the main content area. There is no URL-based routing within the dashboards — navigation is purely state-driven.

**Styling approach:**
- Tailwind CSS utility classes are used for layout, spacing, and responsive behavior.
- Component-level `.css` files handle complex, stateful, or reusable styles (chat, pain modal, trainer clients, etc.).
- All design uses a black/dark theme (`#000000` backgrounds, `rgba(255,255,255,0.x)` borders and text) with purple accents (`#818cf8`, `#a5b4fc`).

**HTTP requests:**
- All requests use Axios with `{ withCredentials: true }` to include cookies.
- The Vite dev server proxies `/api/*` to the backend, so no hardcoded URLs in frontend code.
- Polling is done with `setInterval` inside `useEffect`, cleaned up on unmount with `clearInterval`.

---

## 8. Customer Dashboard

**File:** `client/src/components/dashboard/customer/CustomerDashboard.jsx`

The customer layout has a fixed left sidebar, a header bar, and a scrollable main content area. The header shows the current date, a search box, and a notification bell. The notification bell polls for unread messages every 10 seconds and shows a red badge with the count.

### Sidebar Tabs

| Tab | Component | Description |
|---|---|---|
| Overview | Grid of widgets | Main dashboard with all summary widgets |
| Workout | `Workout` | Full workout logger |
| Schedule | `Schedule` | Weekly calendar |
| Progress | `Progress` | Charts and metrics |
| Nutrition | `Nutrition` | Full nutrition tracker |
| Messages | `CustomerMessages` | Chat with trainer |
| Settings | `Settings` | Profile and account settings |

### Overview Grid (4-column)

The overview tab renders a responsive grid:

- **Row 1 (full width):** Weekly Schedule widget
- **Row 2:** Today's Workout · Today's Events · Weekly Measurements (2 cols)
- **Row 3:** Today's Macros (2 cols) · Consistency Calendar (2 cols)

---

### Widget: StreaksStats

**File:** `customer/widgets/StreaksStats/StreaksStats.jsx`

Displays three KPI cards:
- **Day Streak** — consecutive days with at least one workout logged
- **Weekly Workouts** — number of sessions completed this week
- **Compliance Score** — percentage of assigned workouts completed

Fetches from `GET /api/v1/stats` on mount.

---

### Widget: TodayWorkout

**File:** `customer/widgets/TodayWorkout/TodayWorkout.jsx`

Shows the workout assigned for today:
- Displays workout name and up to 6 exercises (exercise name · sets×reps)
- Shows a green "Done" badge if the workout was already logged today
- Shows "Rest Day" if no workout is assigned
- "Start Workout" button navigates to the Workout tab

Fetches from `GET /api/v1/workouts` and filters by today's day name.

---

### Widget: TodayEvents

**File:** `customer/widgets/TodayEvents/TodayEvents.jsx`

Shows schedule events for today:
- Displays each event's title, start time, and end time
- Empty state if no events scheduled
- "View Schedule" link navigates to the Schedule tab

Fetches from `GET /api/v1/schedule` and filters by today's date.

---

### Widget: TodayMacros

**File:** `customer/widgets/TodayMacros/TodayMacros.jsx`

Compact macro tracker showing three progress bars:
- **Calories** — kcal consumed vs daily target
- **Protein** — grams consumed vs daily goal
- **Water** — intake vs 8-glass target

Fetches from `GET /api/v1/nutrition/balance` and `GET /api/v1/dailylogs/today`.

---

### Widget: TodayNutrition

**File:** `customer/widgets/TodayNutrition/TodayNutrition.jsx`

Larger nutrition widget with a prominent calorie display and macro breakdown:
- Total calories with a circular or linear progress indicator
- Protein, Carbs, Fat bars with gram amounts
- Pulls from today's logged meals

---

### Widget: WeeklyMeasurements

**File:** `customer/widgets/WeeklyMeasurements/WeeklyMeasurements.jsx`

Weight tracking line chart:
- Plots weight entries over time using Recharts
- Toggle between 1M / 3M / 1Y / All time ranges
- Hover tooltip shows exact weight and date
- Optional reference line for weight goal (stored in localStorage)
- Header shows current weight and change since previous entry

Fetches from `GET /api/v1/stats/weekly-measurements`.

---

### Widget: WeeklySteps

**File:** `customer/widgets/WeeklySteps/WeeklySteps.jsx`

Step count bar chart for the current week:
- One bar per day (Mon–Sun)
- Today's bar highlighted
- 10,000 step goal reference line
- Manual step entry form
- Fitbit sync button (calls `POST /api/v1/fitbit/sync`)
- Shows weekly total and today's count

Fetches from `GET /api/v1/dailylogs/weekly-steps`.

---

### Component: Workout (Full Page)

**File:** `customer/Workout/Workout.jsx`

Full workout logging interface:
- Loads the weekly program (workouts assigned Mon–Sun)
- Day selector to switch between days
- Exercise list with sets and reps
- Per-set input fields for kg and reps
- Checkbox to mark sets as complete
- "Finish Workout" button saves all logs via `POST /api/v1/workouts/logs`

---

### Component: Nutrition (Full Page)

**File:** `customer/Nutrition/Nutrition.jsx`

Full nutrition tracker:
- Food search with nutrition lookup (`GET /api/v1/nutrition/lookup`)
- Add meals grouped by type (breakfast, lunch, dinner, snack)
- Daily macro totals with targets
- Weekly summary chart
- Set/edit daily macro goals

---

### Component: CustomerMessages

**File:** `common/Messages/CustomerMessages.jsx`

Chat interface for customers to message their trainer:
- Left sidebar: conversation list with unread badge, search, online dot
- Right panel: message thread with timestamps, date separators, and avatar
- Workout cards: messages prefixed with `__WORKOUT__` render as a formatted exercise list
- **`+` button** opens a dropdown menu with:
  - **Report Pain** — opens the pain report modal
- **Pain Report Modal:**
  - Severity selector strip (Mild / Moderate / High) with color coding
  - Interactive SVG anatomical body silhouette (13 zones)
  - Tap a zone to add it to the selection with the active severity
  - Right panel shows selected zones as removable rows
  - Optional note textarea
  - Submit posts each zone to `POST /api/v1/users/report-pain`
  - Success screen with "Trainer notified" confirmation

---

## 9. Trainer Dashboard

**File:** `client/src/components/dashboard/trainer/TrainerDashboard.jsx`

The trainer layout mirrors the customer layout: fixed sidebar, header with notification bell, scrollable main area.

### Sidebar Tabs

| Tab | Component | Description |
|---|---|---|
| Overview | `TrainerOverview` | Summary cards |
| Clients | `TrainerClients` | Full client management |
| Programs | `TrainerPrograms` | Template library |
| Schedule | `Schedule` | Calendar (edit mode) |
| Settings | `Settings` | Profile and account |
| Profile | `TrainerProfile` | Public-facing profile |

---

### Component: TrainerClients

**File:** `trainer/TrainerClients.jsx`

The largest and most complex component in the application. Split into a client list (left) and a detail panel (right).

#### Left Panel — Client List

- Searchable list of all clients linked to this trainer
- Each row shows: avatar initial, client name, last active time
- "No program" badge appears if the client has no workouts assigned
- Online/offline indicator based on last message time

#### Right Panel — Client Detail

Three tabs: **Overview**, **Program**, **Messages**

---

##### Overview Tab

Contains four sections:

**KPI Strip** (4 cards)
- Day Streak, Workouts/week, Last Weight (kg), Compliance (%)
- Data from `GET /api/v1/trainer/clients/:clientId`

**Today's Targets** (3 progress bars)
- Calories — consumed vs goal (orange)
- Protein — consumed vs goal (blue)
- Water — intake vs 8-glass target (cyan)

**Weight Trend** (line chart)
- Recharts line chart of the client's weight history
- Fetches from the client detail endpoint

**Pain & Discomfort Widget**
- Interactive SVG body silhouette with pulsing colored dots at active pain zones
- Color codes: Low = yellow, Moderate = orange, High = red
- Hovering a dot highlights the corresponding list entry and vice versa
- List shows zone name, severity label, optional note, edit button, delete button
- "Log pain" button opens a modal to add a new entry:
  - Select zone from dropdown
  - Select severity
  - Add optional note
  - Submits to `POST /api/v1/trainer/clients/:clientId/pain`
- Edit button pre-fills the modal and submits to `PUT /api/v1/trainer/clients/:clientId/pain/:painId`
- Delete calls `DELETE /api/v1/trainer/clients/:clientId/pain/:painId`

---

##### Program Tab

Assign a weekly workout program to the client:

- **Day selector:** Mon–Sun buttons with the date shown
- **Exercise search:** Text input with autocomplete from the exercise library
- **Exercise list:** Each row has exercise name, sets, reps, weight (kg), notes, and a remove button
- **Drag-and-drop reordering** of exercises within a day
- **Save program:** Saves the current day's exercise list
- **Load weekly template:** Opens a picker to apply a saved weekly program
- **Load day template (1-Day Program):** Opens a picker to apply a saved single-day template
- **Save as template:** Saves the current program as a reusable weekly or day template

---

##### Messages Tab (Trainer side)

Same functionality as the customer chat, but from the trainer's perspective:
- Full message history with the selected client
- Workout card rendering
- **Send Workout button:** Opens a picker of day templates; selecting one sends a `__WORKOUT__<JSON>` message

---

### Component: TrainerOverview

**File:** `trainer/TrainerOverview.jsx`

Summary dashboard for the trainer:
- Total clients count
- Upcoming schedule events
- Recent messages

---

### Component: TrainerPrograms

**File:** `trainer/TrainerPrograms.jsx`

Template library manager:
- Lists all saved workout templates (week and day types)
- Create, rename, delete templates
- View template contents

---

### Component: TrainerProfile

**File:** `trainer/TrainerProfile.jsx`

Public-facing trainer profile editor:
- Edit bio, specializations, certifications, experience, phone, location
- Upload certification files (multipart form → `POST /api/v1/trainer/upload-cert`)
- Preview of public profile appearance

---

## 10. Shared Components

### Schedule Widget

**File:** `common/widgets/Schedule/Schedule.jsx`

Used on both dashboards:
- **Mini mode** (overview): shows the current week at a glance with event pills
- **Full page mode**: shows a full weekly grid with time slots
- Create events with title, day, start/end time, color
- Trainers can attach a `clientId` to events
- Customers see events as read-only when embedded in the overview

---

### Progress Component

**File:** `common/widgets/Progress/Progress.jsx`

Multi-section progress page with five sub-sections:

| Section | Description |
|---|---|
| Weight History | Line chart with time range selector (1M / 3M / 1Y / All) and log weight button |
| Exercise PRs | Grid of personal records (heaviest set per exercise) with rank badges |
| Consistency Calendar | 6-month heatmap of workout days (darker = more workouts) |
| Weight Prediction | Form for duration, activity level, sleep, stress → AI-generated prediction |
| BMI Calculator | Height/weight inputs with a color-coded gauge showing BMI category |

---

### Settings Component

**File:** `common/Settings/Settings.jsx`

Account management for both roles:
- Edit name, age, height, gender
- Change password (requires current password)
- Upload/change profile picture
- Delete account

---

### ProgressSnapshot

**File:** `common/widgets/ProgressSnapshot.jsx`

Compact summary card showing key progress stats in a small format for embedding in overview pages.

---

## 11. Key Features In Depth

### Fitbit Integration

1. Trainer or customer clicks "Connect Fitbit".
2. Frontend calls `GET /api/v1/fitbit/connect` which returns an OAuth2 authorization URL.
3. User is redirected to Fitbit's consent page.
4. Fitbit redirects back to `GET /api/v1/fitbit/callback` with an authorization code.
5. Backend exchanges the code for access + refresh tokens and stores them in `FitbitTokens`.
6. On sync (`POST /api/v1/fitbit/sync`), the backend calls the Fitbit API using the stored access token.
7. If the token is expired, it is automatically refreshed using the refresh token before the sync.
8. Today's step count is written to the user's `DailyLog`.

---

### Invite Code System

1. Trainer generates an invite code via the Clients tab (calls `POST /api/v1/invite`).
2. The code is stored in `TrainerInviteCodes` linked to the trainer's ID.
3. Trainer shares the code with a prospective client.
4. Customer redeems the code (`POST /api/v1/invite/redeem`).
5. Backend verifies the code exists and is unused, then sets `Users.trainerId` to the trainer's ID.
6. The customer now appears in the trainer's client list.

---

### Workout Card Messages

Messages that contain workout data are stored with the prefix `__WORKOUT__` followed by a JSON payload:

```json
{
  "name": "Push Day A",
  "exercises": [
    { "exerciseName": "Bench Press", "sets": 4, "reps": "8-10" },
    { "exerciseName": "Shoulder Press", "sets": 3, "reps": "10-12" }
  ]
}
```

Both chat components (`CustomerMessages` and the trainer chat panel) detect this prefix and render a formatted workout card instead of plain text. The card shows the workout name and a list of exercises, with a "Show more" toggle if there are more than 4.

---

### Pain Tracking System

**Customer side:**
- Customer opens the `+` menu in chat and selects "Report Pain".
- Multi-zone selection: tap body zones, each with an independently chosen severity.
- Submits each zone as a separate `ClientPainLog` record.
- The modal shows a success screen ("Trainer notified") after submission.

**Trainer side:**
- Pain & Discomfort widget in the client Overview tab.
- Fetches all pain logs for the client on load.
- Interactive SVG silhouette shows colored pulsing dots at each logged zone.
- Hovering a dot or a list row cross-highlights both.
- Trainer can add, edit, or delete entries directly from the widget.

**Severity mapping:**
- UI uses `Mild / Moderate / High` for display
- Database stores `Low / Moderate / High` (`Mild` → `Low` on write, `Low` → `Mild` on read)

---

### Weight Prediction (AI Feature)

1. Customer opens the Progress page and selects the Weight Prediction section.
2. Inputs: target duration (weeks), activity level, average sleep, stress level.
3. Frontend fetches baseline data (`GET /api/v1/stats/predict-baseline`): current weight, calorie balance, workout frequency.
4. Combined data is sent to `POST /api/v1/stats/predict-weight`.
5. Backend runs a prediction model and returns a projected weight trajectory.
6. Results are displayed as a line chart.

---

*End of Manual*
