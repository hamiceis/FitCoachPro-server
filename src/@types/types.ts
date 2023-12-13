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

export type StudentDataProps = {
  name?: string;
  email?: string;
  gender?: string;
  height?: number;
  age?: number;
  password?: string | null;
  [key: string]: string | number | undefined | null
}

export type KeysProps = keyof StudentDataProps