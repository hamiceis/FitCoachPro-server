import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authLogin } from "../middlewares/auth.middleware";
import { DeserializerUser } from "../@types/types";

export const routeExercise = Router();

//Lista todos os exercicios de todos os alunos
routeExercise.get("/exercises", async (req: Request, res: Response) => {
  const exercises = await prisma.exercise.findMany();
  return res.status(200).json(exercises);
});

//Student lista todos os seus exercicios
routeExercise.get("/student/exercises", authLogin, async (req: Request, res: Response) => {
    const authToken = req.cookies.authToken;
    const user: DeserializerUser = JSON.parse(authToken);

    const student = await prisma.student.findUnique({
      where: {
        id: user.id,
      },
      include: {
        workouts: {
          include: {
            exercises: true,
          },
        },
      },
    });

    try {
      if (!student) {
        return res.status(400).json({ message: "Student not found" });
      }

      const isExerciseExist = student.workouts[0] ?? null;

      if (!isExerciseExist) {
        return res
          .status(400)
          .json({ message: "Student does not have exercises" });
      }

      const filteredExercises = student.workouts.map(
        (workout) => workout.exercises
      );

      return res.status(200).json(filteredExercises);
    } catch (error) {
      console.log("[INTERNAL_SERVER_ERROR_get_exercises]", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
);
