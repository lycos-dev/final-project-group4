import db from './client';

/**
 * Runs once on app startup.
 * Creates all tables if they don't already exist.
 */
export const initializeDatabase = (): void => {
  db.execSync(`
    PRAGMA journal_mode = WAL;

    -- ────────────────────────────────────────────
    -- USERS
    -- Stores the single local user's account data
    -- ────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      email       TEXT    NOT NULL UNIQUE,
      password    TEXT    NOT NULL,
      age         INTEGER,
      weight      REAL,
      height      REAL,
      weight_unit TEXT    NOT NULL DEFAULT 'kg',
      theme       TEXT    NOT NULL DEFAULT 'dark',
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- ────────────────────────────────────────────
    -- EXERCISES (Library)
    -- Preset + user-created exercises
    -- ────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS exercises (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      name            TEXT    NOT NULL,
      category        TEXT    NOT NULL, -- 'cardio' | 'strength' | 'flexibility'
      muscle_group    TEXT,
      instructions    TEXT,
      image_url       TEXT,
      video_url       TEXT,
      is_preset       INTEGER NOT NULL DEFAULT 0, -- 1 = built-in, 0 = user-created
      is_favourite    INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- ────────────────────────────────────────────
    -- WORKOUT SESSIONS
    -- Each logged workout session
    -- ────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS workout_sessions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT,
      date        TEXT    NOT NULL DEFAULT (date('now')),
      duration    INTEGER, -- in seconds
      notes       TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- ────────────────────────────────────────────
    -- WORKOUT SETS
    -- Individual sets within a workout session
    -- ────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS workout_sets (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_session_id  INTEGER NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
      exercise_id         INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
      sets                INTEGER,
      reps                INTEGER,
      weight              REAL,
      duration            INTEGER, -- in seconds (for cardio/timed)
      created_at          TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- ────────────────────────────────────────────
    -- GOALS
    -- User fitness goals
    -- ────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS goals (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      type          TEXT    NOT NULL, -- 'weight_loss' | 'weight_gain' | 'endurance'
      target_value  REAL    NOT NULL,
      current_value REAL    NOT NULL DEFAULT 0,
      deadline      TEXT,
      is_completed  INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- ────────────────────────────────────────────
    -- BODY MEASUREMENTS
    -- Manually logged body stats over time
    -- ────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS body_measurements (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      date            TEXT    NOT NULL DEFAULT (date('now')),
      weight          REAL,
      body_fat        REAL,
      waist           REAL,
      chest           REAL,
      arms            REAL,
      thighs          REAL,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- ────────────────────────────────────────────
    -- PERSONAL RECORDS
    -- Best weight/reps per exercise (auto-updated)
    -- ────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS personal_records (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_id  INTEGER NOT NULL UNIQUE REFERENCES exercises(id) ON DELETE CASCADE,
      best_weight  REAL    NOT NULL DEFAULT 0,
      best_reps    INTEGER NOT NULL DEFAULT 0,
      achieved_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- ────────────────────────────────────────────
    -- ROUTINES
    -- Weekly workout plans / schedules
    -- ────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS routines (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      is_template INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- ────────────────────────────────────────────
    -- ROUTINE DAYS
    -- Exercises assigned to each day of a routine
    -- ────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS routine_days (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      routine_id  INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
      day_of_week TEXT    NOT NULL, -- 'Monday' | 'Tuesday' | ...
      exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE
    );

    -- ────────────────────────────────────────────
    -- NOTIFICATIONS
    -- In-app notification log
    -- ────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS notifications (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT    NOT NULL,
      body        TEXT    NOT NULL,
      is_read     INTEGER NOT NULL DEFAULT 0,
      type        TEXT,   -- 'workout_reminder' | 'milestone' | 'general'
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- ────────────────────────────────────────────
    -- GALLERY
    -- Workout / body progress photos
    -- ────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS gallery (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_session_id  INTEGER REFERENCES workout_sessions(id) ON DELETE SET NULL,
      image_uri           TEXT    NOT NULL,
      date                TEXT    NOT NULL DEFAULT (date('now')),
      notes               TEXT,
      created_at          TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);
};