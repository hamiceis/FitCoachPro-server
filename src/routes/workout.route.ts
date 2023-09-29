import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma"

export const routeWorkout = Router()

routeWorkout.get("/workouts", async (req: Request, res: Response) => {
  const workouts = await prisma.workout.findMany()
  res.status(200)
  return res.json(workouts)
})