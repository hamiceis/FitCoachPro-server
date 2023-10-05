/*
  Warnings:

  - A unique constraint covering the columns `[workoutId]` on the table `exercise` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "exercise_workoutId_key" ON "exercise"("workoutId");
