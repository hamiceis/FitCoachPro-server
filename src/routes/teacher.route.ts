import { Router, Request, Response } from "express"
import { prisma } from "../lib/prisma";
import { authLogin } from "../middlewares/auth.middleware";

export const routeTeather = Router();

routeTeather.get("/teachers", async (req: Request, res: Response) => {
  const teacher = await prisma.professor.findMany()
  return res.status(200).json(teacher)
})

routeTeather.get("/teachers/students", async (req: Request, res: Response) => {
  const teacher = await prisma.professor.findMany({
    include: {
      students: true,
    }
  })
  return res.status(200).json(teacher)
})