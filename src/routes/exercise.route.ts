import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authLogin } from "../middlewares/auth.middleware";
import { z } from "zod";
import { DeserializerUser } from "../@types/types";

export const routeExercise = Router();

//Lista todos os exercicios de todos os alunos
routeExercise.get("/exercises", async (req: Request, res: Response) => {
  const exercises = await prisma.exercise.findMany();
  return res.status(200).json(exercises);
});

//Student lista todos os seus exercicios
routeExercise.get("/student/exercises", authLogin, async (req: Request, res: Response) => {
  try {
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

      if (!student) {
          return res.status(404).json({ message: "Student not found" });
      }

      const exercises = student.workouts.flatMap((workout) => workout.exercises);

      if (exercises.length === 0) {
          return res.status(401).json({ message: "Student does not have exercises" });
      }

      return res.status(200).json(exercises);
  } catch (error) {
      console.error("[INTERNAL_SERVER_ERROR_get_exercises]", error);
      return res.status(500).json({ message: "Internal Server Error" });
  }
});


//Teacher lista execicios de aluno
routeExercise.get("/exercises/:studentId", authLogin, async (req: Request, res: Response) => {
  const authToken = req.cookies.authToken;
  const user: DeserializerUser = JSON.parse(authToken);

  const paramsSchema = z.object({
      studentId: z.string(),
  });

  try {
      const { studentId } = paramsSchema.parse(req.params);

      const student = await prisma.student.findUnique({
          where: {
              id: studentId,
          },
          include: {
              workouts: {
                  include: {
                      exercises: true,
                  },
              },
          },
      });

      const teacher = await prisma.professor.findUnique({
          where: {
              id: user.id,
          },
      });

      if (!student || !teacher) {
          return res.status(404).json({ message: "Teacher or Student not found" });
      }

      if (student.professorId !== teacher.id) {
          return res.status(403).json({ message: "Unauthorized" });
      }

      if (student.workouts.length === 0) {
          return res.status(401).json({ message: "Student does not have exercises" });
      }

      const exercises = student.workouts.flatMap(workout => workout.exercises)

      return res.status(200).json(exercises);
  } catch (error) {
      console.log("INTERNAL_SERVER_ERROR", error);
      return res.status(500).json("Internal server error_get_exercises");
  }
});
