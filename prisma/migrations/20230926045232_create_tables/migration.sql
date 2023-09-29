-- CreateTable
CREATE TABLE "professor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "cref" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tel" TEXT,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "gender" TEXT,
    "age" INTEGER NOT NULL,
    "height" REAL NOT NULL,
    "weight" REAL,
    "imc" REAL,
    "training_level" INTEGER,
    "conditioning_level" INTEGER,
    "weekly_Frequency" INTEGER,
    "goal" TEXT,
    "protocol_start_date" DATETIME,
    "protocol_end_date" DATETIME,
    "observations" TEXT,
    "professorId" TEXT,
    CONSTRAINT "student_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "professor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "week_day" INTEGER NOT NULL,
    "studentId" TEXT NOT NULL,
    CONSTRAINT "workout_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "exercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name_exercise" TEXT NOT NULL,
    "repetitions" TEXT NOT NULL,
    "interval" TEXT NOT NULL,
    "method" TEXT,
    "load" REAL NOT NULL,
    "cadence" TEXT NOT NULL,
    "observation" TEXT,
    "workoutId" TEXT NOT NULL,
    CONSTRAINT "exercise_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "workout" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "professor_email_key" ON "professor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "student_email_key" ON "student"("email");
