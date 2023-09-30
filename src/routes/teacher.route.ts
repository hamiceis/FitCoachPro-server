import { Router, Request, Response } from "express"
import { prisma } from "../lib/prisma";
import { z } from "zod"
import bcrypt from "bcrypt"
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

    if(students.length === 0) return res.status(401).json({ message: "Não foram encontrados registros"})

    return res.status(200).json(students)
  } catch (error) {
    console.log("error", error)
    return res.status(500).json({ message: 'INTERNAL_SERVER_ERRO [GET_professorId_students]'})
  }
})

routeTeather.delete("/teacher/students/:studentId", authLogin, async (req: Request, res: Response) => {
  const authToken = req.cookies.authToken
  const user: DeserializerUser = JSON.parse(authToken)
  const studentId = req.params.studentId

  try {
    const teacher = await prisma.professor.findUnique({
      where: {
        id: user.id
      }
    })

    if(teacher?.id !== user.id) {
      return res.status(402).json({ message: "Professor não encontrado ou não autorizado"})
    }

    const student = await prisma.student.findUnique({
      where: {
        id:  studentId
      }
    })

    if(!student) {
      return res.status(401).json({ message: "Aluno não encontrado"})
    }

    // Removendo aluno da lista de students
    await prisma.professor.update({
      where: {
        id: user.id
      },
      data: {
        students: {
          disconnect: {
            id: studentId
          }
        }
      }
    })

    res.status(200).json({ message: "Aluno removido com sucesso!"})
  } catch (error) {
    console.log("[INTERNAL_SERVER_ERROR - [DEL - /teacher/student]]", error)
    return res.status(500).json({ message: 'Internal server error'})
  }
})

routeTeather.put("/teacher", authLogin, async (req: Request, res: Response) => {
  const authToken = req.cookies.authToken;
  const user: DeserializerUser = JSON.parse(authToken);
  const bodySchema = z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    password: z.string().optional(),
    cref: z.string().optional()
  });

  try {
    const body = bodySchema.parse(req.body);

    const teacher = await prisma.professor.findUnique({
      where: {
        id: user.id
      }
    });

    if (!teacher) {
      return res.status(404).json({ message: "Professor não encontrado" });
    }

    if (teacher.id !== user.id) {
      return res.status(403).json({ message: "Você não tem permissão para atualizar" });
    }

    const hashedPassword = body.password ? await bcrypt.hash(body.password, 10) : null;

    const data: any = {};

    if (body.name) data.name = body.name;
    if (body.email) data.email = body.email;
    if (hashedPassword) data.password = hashedPassword;
    if (body.cref) data.cref = body.cref;

    const updatedTeacher = await prisma.professor.update({
      where: {
        id: user.id
      },
      data: data
    });

    return res.status(200).json(updatedTeacher);
  } catch (error) {
    console.error("[INTERNAL_SERVER_ERROR]", error);
    res.status(500).json({ message: "INTERNAL_SERVER_ERROR_PUT_TEACHER" });
  }
});
