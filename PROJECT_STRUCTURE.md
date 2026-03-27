# Project Structure — Role-Based File Organization

This file maps every file/folder in the project to its role: **Trainer**, **Customer**, or **Common (Shared)**.

---

## TRAINER

### Backend
| Path | Purpose |
|------|---------|
| `controllers/trainerProfile.controller.js` | Trainer profile, certifications, bio |
| `controllers/trainerClients.controller.js` | Manage clients, assign programs |
| `controllers/programTemplate.controller.js` | Reusable workout templates |
| `routes/trainer.routes.js` | All trainer-only API routes |
| `models/trainerProfile.model.js` | Trainer profile schema |
| `uploads/certifications/` | Uploaded trainer certification docs |

### Frontend
| Path | Purpose |
|------|---------|
| `client/src/components/dashboard/trainer/TrainerDashboard.jsx` | Trainer main dashboard |
| `client/src/components/dashboard/trainer/TrainerSidebar.jsx` | Trainer navigation sidebar |
| `client/src/components/dashboard/trainer/TrainerOverview.jsx` | Trainer overview/home panel |
| `client/src/components/dashboard/trainer/TrainerOverview.css` | Styles for trainer overview |
| `client/src/components/dashboard/trainer/TrainerProfile.jsx` | Trainer profile editor |
| `client/src/components/dashboard/trainer/TrainerClients.jsx` | Clients list & program management |

---

## CUSTOMER

### Backend
| Path | Purpose |
|------|---------|
| `controllers/dailylog.controller.js` | Daily nutrition & activity logs |
| `controllers/workoutLog.controller.js` | Workout completion tracking |
| `controllers/WeeklyMeasurements.controller.js` | Weight/body measurement tracking |
| `models/workoutLog.model.js` | Workout session log schema |
| `models/dailyLog.model.js` | Daily calories, water, macros |
| `models/userStat.model.js` | Streaks, compliance, progress metrics |
| `models/WeeklyMeasurements.model.js` | Weekly body measurements |
| `uploads/avatars/` | Customer profile pictures |

### Frontend
| Path | Purpose |
|------|---------|
| `client/src/components/dashboard/CustomerDashboard.jsx` | Customer main dashboard |
| `client/src/components/dashboard/Sidebar.jsx` | Customer navigation sidebar |
| `client/src/components/dashboard/Workout/Workout.jsx` | View and log workouts |
| `client/src/components/dashboard/Workout/Workout.css` | Workout page styles |
| `client/src/components/dashboard/Nutrition/Nutrition.jsx` | Log meals & view macros |
| `client/src/components/dashboard/Nutrition/Nutrition.css` | Nutrition page styles |
| `client/src/components/dashboard/FindTrainer/FindTrainer.jsx` | Browse and connect with trainers |
| `client/src/components/dashboard/Void/Void.jsx` | Placeholder (unused section) |
| `client/src/components/dashboard/widgets/TodayWorkout/TodayWorkout.jsx` | Today's assigned workout widget |
| `client/src/components/dashboard/widgets/TodayWorkout/TodayWorkout.css` | TodayWorkout widget styles |
| `client/src/components/dashboard/widgets/TodayNutrition/TodayNutrition.jsx` | Today's nutrition summary widget |
| `client/src/components/dashboard/widgets/TodayMacros/TodayMacros.jsx` | Daily macros breakdown widget |
| `client/src/components/dashboard/widgets/TodayEvents/TodayEvents.jsx` | Today's scheduled events widget |
| `client/src/components/dashboard/widgets/WeeklyMeasurements/WeeklyMeasurements.jsx` | Weekly body measurements widget |
| `client/src/components/dashboard/widgets/WeeklySteps/WeeklySteps.jsx` | Step count tracker widget |
| `client/src/components/dashboard/widgets/DailyTargets/DailyTargets.jsx` | Daily goal progress widget |
| `client/src/components/dashboard/widgets/StreaksStats/StreaksStats.jsx` | Streak & compliance stats widget |

---

## COMMON (Shared by Both Roles)

### Backend — Server & Config
| Path | Purpose |
|------|---------|
| `app.js` | Express server entry point |
| `package.json` | Backend dependencies |
| `package-lock.json` | Locked dependency tree |
| `config/env.js` | Environment variable loading |
| `config/arcjet.js` | Rate limiting / security config |
| `database/mysql.js` | MySQL connection setup |
| `database/mongodb.js` | MongoDB connection (backup/unused) |

### Backend — Middleware
| Path | Purpose |
|------|---------|
| `middlewares/auth.middleware.js` | JWT authentication for all routes |
| `middlewares/arcjet.middleware.js` | Security/rate-limiting middleware |
| `middlewares/error.middleware.js` | Global error handler |

### Backend — Shared Controllers & Routes
| Path | Purpose |
|------|---------|
| `controllers/auth.controller.js` | Login, signup, token handling |
| `controllers/user.controller.js` | User CRUD |
| `controllers/chat.controller.js` | Messaging between trainer & customer |
| `controllers/workout.controller.js` | Workout CRUD (trainer creates, customer uses) |
| `controllers/exercise.controller.js` | Exercise library |
| `controllers/meal.controller.js` | Meal logging |
| `controllers/nutrition.controller.js` | Nutrition data aggregation |
| `controllers/dailyGoal.controller.js` | Daily goals (set by trainer or customer) |
| `controllers/schedule.controller.js` | Calendar event management |
| `controllers/stats.controller.js` | User statistics (viewed by both roles) |
| `controllers/inviteCode.controller.js` | Invite code system |
| `routes/auth.routes.js` | Auth API routes |
| `routes/user.routes.js` | User API routes |
| `routes/chat.routes.js` | Chat API routes |
| `routes/workout.routes.js` | Workout API routes |
| `routes/exercise.routes.js` | Exercise API routes |
| `routes/meal.routes.js` | Meal API routes |
| `routes/nutrition.routes.js` | Nutrition API routes |
| `routes/dailylog.routes.js` | Daily log API routes |
| `routes/dailyGoal.routes.js` | Daily goal API routes |
| `routes/schedule.routes.js` | Schedule API routes |
| `routes/stats.routes.js` | Stats API routes |
| `routes/invite.routes.js` | Invite code API routes |

### Backend — Shared Models
| Path | Purpose |
|------|---------|
| `models/user.model.js` | Base user (role: customer / personal_trainer) |
| `models/workout.model.js` | Workout plans |
| `models/workoutExercise.model.js` | Exercises within a workout plan |
| `models/dailyGoal.model.js` | Daily targets |
| `models/meal.model.js` | Nutrition entries |
| `models/exercise.model.js` | Exercise library |
| `models/message.model.js` | Chat messages |
| `models/scheduleEvent.model.js` | Calendar events |
| `models/index.js` | Model initialization / exports |

### Frontend — App Shell & Auth
| Path | Purpose |
|------|---------|
| `client/src/App.jsx` | Root router (role-based routing) |
| `client/src/main.jsx` | React entry point |
| `client/src/index.css` | Global base styles |
| `client/src/components/SignIn.jsx` | Login page (both roles) |
| `client/src/components/SignUp.jsx` | Signup page (both roles) |
| `client/src/components/onboarding/` | Onboarding flow (Hero, Navbar, Signup, Goals, VisualPanel) |
| `client/src/assets/` | Images, icons |
| `client/public/` | Static files served by Vite |
| `client/package.json` | Frontend dependencies |
| `client/vite.config.js` | Vite build config |
| `client/postcss.config.js` | CSS processing |
| `client/eslint.config.js` | Frontend lint rules |

### Frontend — Shared Dashboard Components & Widgets
| Path | Purpose |
|------|---------|
| `client/src/components/dashboard/DashboardPanel.jsx` | Generic dashboard panel wrapper |
| `client/src/components/dashboard/Messages/CustomerMessages.jsx` | Messaging UI (both roles use it) |
| `client/src/components/dashboard/Messages/CustomerMessages.css` | Message panel styles |
| `client/src/components/dashboard/Settings/Settings.jsx` | User settings (`isTrainer` flag for role-specific options) |
| `client/src/components/dashboard/Settings/Settings.css` | Settings page styles |
| `client/src/components/dashboard/widgets/Schedule/Schedule.jsx` | Calendar widget (trainer assigns, customer views) |
| `client/src/components/dashboard/widgets/Schedule/Schedule.css` | Schedule widget styles |
| `client/src/components/dashboard/widgets/Progress/Progress.jsx` | Progress chart (both roles view) |
| `client/src/components/dashboard/widgets/Progress/Progress.css` | Progress widget styles |
| `client/src/components/dashboard/widgets/QuickActions/QuickActions.jsx` | Quick navigation actions |
| `client/src/components/dashboard/widgets/ProgressSnapshot.jsx` | Progress summary snapshot |
| `client/src/components/dashboard/widgets/TrainerChat.jsx` | Chat widget embedded in dashboards |

### Seed / Utility Scripts
| Path | Purpose |
|------|---------|
| `seed.js` | General database seeding |
| `seed_mysql.js` | MySQL schema initialization |
| `seed-test-client.js` | Test customer data |
| `seed_user2_program.js` | Sample program data |
| `seed_real_workouts.js` | Real workout sample data |
| `seed_weekly_plan.js` | Sample weekly schedule |
| `create_db.js` | Database creation |
| `check_db.js` | Database health check |
| `copy_workouts.js` | Data migration utility |
| `scripts/seed_trainer.js` | Trainer seed data |
| `scripts/verify_compliance.js` | Validation checks |
| `scripts/verify_models.js` | Schema validation |
| `scripts/verify_update.js` | Migration verification |
| `python/` | ML / analytics scripts |
| `PREDICTION.ipynb` | Prediction notebook |
| `weight_change_dataset.csv` | Dataset for ML model |

---

## Architecture Notes

- **Role field** on `user` model drives all access: `'customer'` or `'personal_trainer'`
- **Backend** enforces role-based access in routes/controllers (trainer-only endpoints require role check)
- **Frontend** routes customers to `CustomerDashboard` and trainers to `TrainerDashboard` via `App.jsx`
- **Shared widgets** (Schedule, Progress, Messages, Settings) use conditional props/flags (`isTrainer`) to adapt their behavior per role
- **Workout flow**: trainer *creates* workouts → customer *views and logs* them → both can see stats
