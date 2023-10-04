import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { z } from "zod";
import { authLogin } from "../middlewares/auth.middleware";
import { DeserializerUser, WorkoutAndExerciseProps } from "../@types/types";
import { Workout } from "@prisma/client";

import { getStudentWorkouts } from "../utils/get-student-workout";
import { getTeacherStudentWorkouts } from "../utils/get-student-teacher-workdout";
import { verificationProperty } from "../utils/verification-data-body";

export const routeWorkout = Router();

// Rota verifica se quem se logou foi aluno ou professor, verifica as credenciais e devolve os treinos
routeWorkout.get("/workouts", async (req: Request, res: Response) => {
  const workouts = await prisma.workout.findMany();
  res.status(200);
  return res.json(workouts);
});

routeWorkout.get(
  "/workdouts/:studentId",
  authLogin,
  async (req: Request, res: Response) => {
    const authToken = req.cookies.authToken;
    const user: DeserializerUser = JSON.parse(authToken);
    const paramsSchema = z.object({
      studentId: z.string().uuid(),
    });

    try {
      const { studentId } = paramsSchema.parse(req.params);
      let result: Workout[];

      if (user.role === "user") {
        const student = await getStudentWorkouts(studentId);

        if (!student || student.id !== user.id) {
          return res
            .status(401)
            .json({ message: "Aluno não encontrado ou não se correspondem" });
        }
        result = student.workouts;
        if (result.length === 0) {
          return res
            .status(201)
            .json({ message: "Não foram encontrados treinos" });
        }
      } else {
        const student = await getTeacherStudentWorkouts(user.id, studentId);

        if (!student) {
          return res.status(400).json({
            message: "Esse aluno não está associado ao seu perfil de professor",
          });
        }

        if (student.workouts.length === 0) {
          return res
            .status(201)
            .json({ message: "Não foram encontrados treinos para esse aluno" });
        }

        result = student.workouts;
      }

      return res.status(200).json(result);
    } catch (error) {
      console.log("[ERROR_ROUTE_workouts_student]", error);
      return res.status(500).json({ message: "INTERNAL SERVER ERROR" });
    }
  }
);

// Rota para recuperar meus treinos de aluno
routeWorkout.get(
  "/workouts/student/:studentId",
  authLogin,
  async (req: Request, res: Response) => {
    const authToken = req.cookies.authToken;
    const user: DeserializerUser = JSON.parse(authToken);

    const paramsSchema = z.object({
      studentId: z.string().uuid(),
    });

    try {
      const { studentId } = paramsSchema.parse(req.params);

      if (user.role !== "user") {
        return res.status(401).json({
          message: "Você não tem permissão para acessar os treinos de alunos.",
        });
      }

      const student = await getStudentWorkouts(studentId);

      if (!student)
        return res.status(400).json({ message: "Aluno não encontrado" });

      if (student.id !== user.id) {
        return res.status(401).json({
          message: "Você não tem permissão para acessar os treinos de alunos.",
        });
      }

      const result = student.workouts;

      if (result.length === 0) {
        return res
          .status(201)
          .json({ message: "Não foram encontrado treinos" });
      }

      return res.status(200).json(result);
    } catch (error) {
      console.log("[ERROR_ROUTE_workouts_student]", error);
      return res.status(500).json({ message: "INTERNAL SERVER ERROR" });
    }
  }
);

// Rota para recuperar treinos do aluno,  passando o id pelos params
routeWorkout.get(
  "/workouts/teacher/:studentId",
  authLogin,
  async (req: Request, res: Response) => {
    const authToken = req.cookies.authToken;
    const user: DeserializerUser = JSON.parse(authToken);

    const paramsSchema = z.object({
      studentId: z.string().uuid(),
    });

    try {
      const { studentId } = paramsSchema.parse(req.params);

      if (user.role !== "admin") {
        return res.status(401).json({
          message: "Você não tem permissão para acessar os treinos de alunos.",
        });
      }

      const student = await getTeacherStudentWorkouts(user.id, studentId);

      if (!student) {
        return res.status(400).json({
          message: "Estudante não cadastrado na lista de alunos do professor",
        });
      }

      const result = student.workouts;

      if (result.length === 0) {
        return res
          .status(201)
          .json({ message: "Não foram encontrados treinos para esse aluno" });
      }

      return res.status(200).json(result);
    } catch (error) {
      console.log("[ERROR_ROUTE_workouts_teacher]", error);
      return res.status(500).json({ message: "INTERNAL SERVER ERROR" });
    }
  }
);

//Cadastrar um novo treino e exercicio
routeWorkout.post(
  "/workouts/:studentId",
  authLogin,
  async (req: Request, res: Response) => {
    const authToken = req.cookies.authToken;
    const user: DeserializerUser = JSON.parse(authToken);

    const paramsSchema = z.object({
      studentId: z.string().uuid(),
    });

    const bodySchema = z.object({
      type: z.string(),
      weekDay: z.number(),
      dayMonth: z.date().optional().default(new Date()),
      exerciseName: z.string(),
      repetitions: z.string(),
      interval: z.string(),
      method: z.string().optional(),
      load: z.string(),
      cadence: z.string(),
      observation: z.string().optional(),
    });

    const { studentId } = paramsSchema.parse(req.params);
    const body = bodySchema.parse(req.body);

    const teacher = await prisma.professor.findUnique({
      where: {
        id: user.id,
      },
    });

    const student = await prisma.student.findUnique({
      where: {
        id: studentId,
      },
      include: {
        professor: true,
      },
    });

    try {
      if (!student) {
        return res.status(400).json({ message: "Estudante não encontrado" });
      }

      if (!teacher) {
        return res.status(400).json({ message: "Professor não encontrado" });
      }

      if (student.professorId !== teacher.id || !student.professor) {
        return res.status(401).json({ message: "Unauthorized add workout" });
      }

      // Crie o objeto "data" que contém informações de Workout e Exercise
      const data: WorkoutAndExerciseProps = {
        Workout: {
          id: "",
          type: body.type,
          day_month: body.dayMonth || null,
          week_day: body.weekDay,
          studentId: student.id,
        },
        Exercise: {
          id: "",
          name_exercise: body.exerciseName,
          repetitions: body.repetitions,
          interval: body.interval,
          method: body.method || null,
          load: parseFloat(body.load),
          cadence: body.cadence,
          observation: body.observation || "",
          workoutId: "",
        },
      };

      const workout = await prisma.workout.create({
        data: {
          type: data.Workout.type,
          week_day: data.Workout.week_day,
          day_month: data.Workout.day_month,
          studentId: data.Workout.studentId,
        },
      });

      const exercise = await prisma.exercise.create({
        data: {
          ...data.Exercise,
          id: workout.id,
        },
      });

      const result = {
        workout,
        exercise,
      };

      return res.status(200).json(result);
    } catch (error) {
      console.log("[INTERNAL_SERVER_ERROR_post_workout]", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// alterar ou atualiza o treino
routeWorkout.patch(
  "/workout/:studentId/:exerciseId",
  authLogin,
  async (req: Request, res: Response) => {
    const authToken = req.cookies.authToken;
    const user: DeserializerUser = JSON.parse(authToken);

    const paramsSchema = z.object({
      studentId: z.string().uuid(),
      exerciseId: z.string().uuid(),
    });

    const bodySchema = z.object({
      type: z.string().optional(),
      weekDay: z.number().optional(),
      dayMonth: z.date().optional().default(new Date()),
      exerciseName: z.string().optional(),
      repetitions: z.string().optional(),
      interval: z.string().optional(),
      method: z.string().optional(),
      load: z.string().optional(),
      cadence: z.string().optional(),
      observation: z.string().optional(),
    });

    const { studentId, exerciseId } = paramsSchema.parse(req.params);
    const body = bodySchema.parse(req.body);
    const data = verificationProperty(body);

    const student = await prisma.student.findUnique({
      where: {
        id: studentId,
      },
      include: {
        workouts: true,
      },
    });
    const teacher = await prisma.professor.findUnique({
      where: {
        id: user.id,
      },
    });

    const exercise = await prisma.exercise.findUnique({
      where: {
        id: exerciseId,
      },
    });

    try {
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      if (!teacher || student.professorId !== user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      if (!exercise) {
        return res.status(404).json({ message: "Exercise not found" });
      }

      const workdout = await prisma.workout.update({
        where: {
          id: exercise.id,
        },
        data: {
          ...data.workout,
        },
      });

      await prisma.exercise.update({
        where: {
          id: workdout.id,
        },
        data: {
          ...data.exercise,
        },
      });

      return res.status(200).json({ message: "Workout and Exercise updated" });
    } catch (error) {
      console.log("[INTERNAL_SERVER_ERROR_patch_workout]", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

routeWorkout.delete(
  "/workouts/:studentId/:workoutId",
  authLogin,
  async (req: Request, res: Response) => {
    const authToken = req.cookies.authToken;
    const user: DeserializerUser = JSON.parse(authToken);

    const paramsSchema = z.object({
      studentId: z.string().uuid(),
      workoutId: z.string().uuid(),
    });

    const { studentId, workoutId } = paramsSchema.parse(req.params);

    const teacher = await prisma.professor.findUnique({
      where: {
        id: user.id,
      },
    });

    const student = await prisma.student.findUnique({
      where: {
        id: studentId,
      },
    });

    try {
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      if (!teacher || student.professorId !== user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const workout = await prisma.workout.findUnique({
        where: {
          id: workoutId,
        },
        include: {
          exercises: true,
        },
      });

      if (!workout)
        return res.status(400).json({ message: "Workout not found" });

      await prisma.exercise.deleteMany({
        where: {
          workoutId: workoutId,
        },
      });

      await prisma.workout.delete({
        where: {
          id: workoutId,
        },
      });

      return res.status(200).json({ message: "Workout deleted" });
    } catch (error) {
      console.log(`[INTERNAL_SERVER_ERROR_del_workout]`);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
);
