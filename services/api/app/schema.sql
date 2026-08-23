-- UnStuck schema. Every table lives in the attached schema "unstuck".
-- Applied by db.init_db() with CREATE TABLE IF NOT EXISTS semantics.

CREATE TABLE IF NOT EXISTS unstuck.skills(
  id TEXT PRIMARY KEY,
  grade INTEGER NOT NULL,
  name TEXT NOT NULL,
  subject TEXT DEFAULT 'mathematics',
  difficulty REAL DEFAULT 0.5,
  description TEXT DEFAULT '',
  standards TEXT DEFAULT '[]'            -- JSON array of CCSS ids
);

CREATE TABLE IF NOT EXISTS unstuck.skill_edges(
  from_skill TEXT NOT NULL,
  to_skill   TEXT NOT NULL,
  PRIMARY KEY(from_skill, to_skill),
  FOREIGN KEY(from_skill) REFERENCES skills(id),
  FOREIGN KEY(to_skill)   REFERENCES skills(id)
);

CREATE TABLE IF NOT EXISTS unstuck.students(
  id TEXT PRIMARY KEY,
  name TEXT DEFAULT '',
  grade_level INTEGER,
  gap_skill TEXT,
  strategy TEXT,
  sessions_completed INTEGER DEFAULT 0,
  target_skill TEXT,
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  badges TEXT DEFAULT '[]',              -- JSON array
  notes TEXT DEFAULT '{}',               -- JSON: {parent:{...}, teacher:{...}}
  themes TEXT DEFAULT '[]',              -- JSON array of interest tags
  created_at TEXT DEFAULT '',
  updated_at TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS unstuck.mastery(
  student_id TEXT NOT NULL,
  skill_id   TEXT NOT NULL,
  value      REAL NOT NULL DEFAULT 0.5,
  updated_at TEXT DEFAULT '',
  PRIMARY KEY(student_id, skill_id),
  FOREIGN KEY(student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS unstuck.questions(
  id TEXT PRIMARY KEY,
  skill_id TEXT NOT NULL,
  grade INTEGER,
  prompt TEXT DEFAULT '',
  choices TEXT DEFAULT '[]',             -- JSON array
  correct_index INTEGER                 -- never leaves the API layer
);

CREATE TABLE IF NOT EXISTS unstuck.assessments(
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  status TEXT DEFAULT 'started',
  started_at TEXT DEFAULT '',
  finished_at TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS unstuck.assessment_questions(
  assessment_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  question_id TEXT NOT NULL,
  PRIMARY KEY(assessment_id, question_id)
);

CREATE TABLE IF NOT EXISTS unstuck.answers(
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  assessment_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  answer TEXT,                           -- JSON-encoded value
  correct INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  answered_at TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS unstuck.assessment_results(
  assessment_id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  evaluated_by TEXT DEFAULT '',
  result TEXT DEFAULT '{}',              -- full diagnostic result JSON
  created_at TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS unstuck.worksheets(
  id TEXT PRIMARY KEY,
  student_id TEXT,
  target_skill TEXT,
  grade_level INTEGER,
  strategy TEXT DEFAULT '',
  created_at TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS unstuck.worksheet_items(
  worksheet_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  item TEXT DEFAULT '{}',                -- whole item JSON incl answer key
  PRIMARY KEY(worksheet_id, position),
  FOREIGN KEY(worksheet_id) REFERENCES worksheets(id)
);

CREATE TABLE IF NOT EXISTS unstuck.attempts(
  id TEXT PRIMARY KEY,
  worksheet_id TEXT,
  student_id TEXT,
  score REAL,
  decision TEXT,
  next_target_skill TEXT,
  next_grade_level INTEGER,
  payload TEXT DEFAULT '{}',             -- full grading result JSON
  created_at TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS unstuck.sequences(
  prefix TEXT PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 100
);
