import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { z } from "zod";
import { authLogin } from "../middlewares/auth.middleware";
import { DeserializerUser } from "../@types/types";


export const routeStudent = Router();

routeStudent.get("/students", async (req: Request, res: Response) => {
  const students = await prisma.student.findMany();
  return res.status(200).json(students);
});

routeStudent.patch("/student/connect", authLogin, async (req: Request, res: Response) => {
    const authToken = req.cookies.authToken
    const deserializedUser: DeserializerUser = JSON.parse(authToken);

    const connectSchema = z.object({
      email: z.string().email(),
    });

    try {
      const professor = connectSchema.parse(req.body);

      if (!professor) {
        return res.status(400).send("Email invalído");
      }

      const teacher = await prisma.professor.findUnique({
        where: {
          email: professor.email,
        },
      });

      if (!teacher) {
        return res.status(404).send("Professor não encontrado");
      }

      const student = await prisma.student.findUnique({
        where: {
          email: deserializedUser.email,
        },
      });

      if (!student) {
        return res.status(404).send("Aluno não encontrado");
      }

      await prisma.student.update({
        where: {
          id: student.id,
        },
        data: {
          professor: {
            connect: {
              id: teacher.id,
            },
          },
        },
      });

      return res.status(200).json({ message: "Aluno associado ao professor com sucesso" })
    } catch (error) {
      console.error("Erro ao associar aluno ao professor:", error);
      return res.status(500).send("Erro interno do servidor");
    }
  }
);