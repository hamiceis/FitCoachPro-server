-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_exercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name_exercise" TEXT NOT NULL,
    "repetitions" TEXT NOT NULL,
    "interval" TEXT NOT NULL,
    "method" TEXT,
    "load" REAL NOT NULL,
    "cadence" TEXT NOT NULL,
    "observation" TEXT,
    "workoutId" TEXT NOT NULL,
    CONSTRAINT "exercise_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "workout" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_exercise" ("cadence", "id", "interval", "load", "method", "name_exercise", "observation", "repetitions", "workoutId") SELECT "cadence", "id", "interval", "load", "method", "name_exercise", "observation", "repetitions", "workoutId" FROM "exercise";
DROP TABLE "exercise";
ALTER TABLE "new_exercise" RENAME TO "exercise";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
