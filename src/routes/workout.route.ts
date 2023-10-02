import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma"
import { z } from "zod"
import { authLogin } from "../middlewares/auth.middleware"
import { DeserializerUser } from "../@types/types";
import { Workout } from "@prisma/client";
import { getStudentWorkouts } from "../utils/get-student-workout";
import { getTeacherStudentWorkouts } from "../utils/get-student-teacher-workdout";

export const routeWorkout = Router()

routeWorkout.get("/workouts", async (req: Request, res: Response) => {
  const workouts = await prisma.workout.findMany()
  res.status(200)
  return res.json(workouts)
})

routeWorkout.get("/workdouts/:studentId", authLogin, async (req: Request, res: Response) => {
  const authToken = req.cookies.authToken
  const user: DeserializerUser = JSON.parse(authToken)
  const paramsSchema = z.object({
    studentId: z.string().uuid()
  })

  try {
    const { studentId } = paramsSchema.parse(req.params)
    let result: Workout[]

    if(user.role === 'user'){
      const student = await getStudentWorkouts(studentId)
      
      if(!student || student.id !== user.id) {
        return res.status(401).json({ message: "Aluno não encontrado ou não se correspondem"})
      }
      result = student.workouts
      if(result.length === 0){
        return res.status(201).json({ message: "Não foram encontrados treinos"})
      }
    } else {
      const student = await getTeacherStudentWorkouts(user.id, studentId)

      if(!student) {
        return res.status(400).json({message: "Esse aluno não está associado ao seu perfil de professor"})
      }

      if(student.workouts.length === 0){
        return res.status(201).json({ message: "Não foram encontrados treinos para esse aluno"})
      }

      result = student.workouts
    }

    return res.status(200).json(result)
  } catch (error) {
    console.log("[ERROR_ROUTE_workouts_student]", error)
    return res.status(500).json({ message: "INTERNAL SERVER ERROR"})
  } 

})

// Rota para recuperar treinos de aluno
routeWorkout.get("/workouts/student/:studentId", authLogin, async (req: Request, res: Response) => {
  const authToken = req.cookies.authToken;
  const user: DeserializerUser = JSON.parse(authToken);

  const paramsSchema = z.object({
    studentId: z.string().uuid(),
  });

  try {
    const { studentId } = paramsSchema.parse(req.params);

    if (user.role !== 'user') {
      return res.status(401).json({ message: "Você não tem permissão para acessar os treinos de alunos." });
    }

    const student = await getStudentWorkouts(studentId);

    if(!student) return res.status(400).json({ message: "Aluno não encontrado"})

    if (student.id !== user.id) {
      return res.status(401).json({ message: "Você não tem permissão para acessar os treinos de alunos." });
    }

    const result = student.workouts;

    if (result.length === 0) {
      return res.status(201).json({ message: "Não foram encontrados treinos" });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.log("[ERROR_ROUTE_workouts_student]", error);
    return res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
});

// Rota para recuperar treinos dos aluno do professor
routeWorkout.get("/workouts/teacher/:studentId", authLogin, async (req: Request, res: Response) => {
  const authToken = req.cookies.authToken;
  const user: DeserializerUser = JSON.parse(authToken);

  const paramsSchema = z.object({
    studentId: z.string().uuid(),
  });

  try {
    const { studentId } = paramsSchema.parse(req.params);

    if (user.role !== 'admin') {
      return res.status(401).json({ message: "Você não tem permissão para acessar os treinos de alunos." });
    }

    const student = await getTeacherStudentWorkouts(user.id, studentId);

    if (!student) {
      return res.status(400).json({ message: "Estudante não cadastrado na lista de alunos do professor" });
    }

    const result = student.workouts;

    if (result.length === 0) {
      return res.status(201).json({ message: "Não foram encontrados treinos para esse aluno" });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.log("[ERROR_ROUTE_workouts_teacher]", error);
    return res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
});
