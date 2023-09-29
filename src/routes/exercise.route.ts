import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma"

export const routeExercise = Router()

routeExercise.get("/exercises", async (req: Request, res: Response) => {
  const exercises = await prisma.exercise.findMany()
  return res.status(200).json(exercises)
})