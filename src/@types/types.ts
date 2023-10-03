import { Exercise, Workout } from "@prisma/client";

export type DeserializerUser = {
  id: string;
  email: string;
  role: string
}

export interface WorkoutAndExerciseProps {
  Workout: Workout;
  Exercise: Exercise;
}