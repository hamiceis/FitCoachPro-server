import { Exercise, Workout } from "@prisma/client";

export type DeserializerUser = {
  id: string;
  email: string;
  role: string
}

export interface WorkoutAndExerciseProps {
  Workout: Omit<Workout, "id">
  Exercise: Omit<Exercise, "id" | "workoutId">;
}