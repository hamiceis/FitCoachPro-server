import { Router, Request, Response } from "express"
import { prisma } from "../lib/prisma";
import { authLogin } from "../middlewares/auth.middleware";
import { DeserializerUser } from "../@types/types";

export const routeTeather = Router();

routeTeather.get("/teachers", async (req: Request, res: Response) => {
  const teacher = await prisma.professor.findMany()
  return res.status(200).json(teacher)
})

routeTeather.get("/teachers/students",  async (req: Request, res: Response) => {
  const teacher = await prisma.professor.findMany({
    include: {
      students: true,
    }
  })
  return res.status(200).json(teacher)
})

routeTeather.get("/teacher/students", authLogin, async (req: Request, res: Response) => {
  const authToken = req.cookies.authToken
  const user: DeserializerUser = JSON.parse(authToken)

  try {
    if(!user.id) {
      return res.status(401).json({ message: "professor não encontrado, ou não informado"})
    }

    const students = await prisma.student.findMany({
      where: {
        professorId: user.id
      }
    })

    return res.status(200).json(students)
  } catch (error) {
    console.log("error", error)
    return res.status(500).json({ message: 'INTERNAL_SERVER_ERRO [GET_professorId_students]'})
  }
})