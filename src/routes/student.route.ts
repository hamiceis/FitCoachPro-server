import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { z } from "zod";
import bcrypt from "bcrypt";
import { authLogin } from "../middlewares/auth.middleware";
import { DeserializerUser } from "../@types/types";

export const routeStudent = Router();

//Listar todos os alunos
routeStudent.get("/students", async (req: Request, res: Response) => {
  const students = await prisma.student.findMany();
  return res.status(200).json(students);
});

//Buscar os dados de um único student pelo Id
routeStudent.get("/student/:studentId", async (req: Request, res: Response) => {
  const paramsSchema = z.object({
    studentId: z.string().uuid(),
  });

  const { studentId } = paramsSchema.parse(req.params);
  try {
    const student = await prisma.student.findUnique({
      where: {
        id: studentId,
      },
    });

    if (!student) {
      return res
        .status(401)
        .json({ message: "Aluno não encontrado ou não existe" });
    }

    const { password, ...rest } = student;

    return res.status(200).json(rest);
  } catch (error) {
    console.log("[INTERNAL_SERVER_ERROR_GET_STUDENT]", error);
    return res.status(500).json({ message: "INTERNAL SERVER ERROR" });
  }
});

//Buscar dados de um unico aluno que esteja na lista do professor
routeStudent.get(
  "/students/:studentId",
  authLogin,
  async (req: Request, res: Response) => {
    try {
      const { cookies, params } = req;
      const authToken = cookies.authToken;
      const deserializedUser: DeserializerUser = JSON.parse(authToken);
      const paramsSchema = z.object({
        studentId: z.string().uuid(),
      });

      const { studentId } = paramsSchema.parse(params.studentId);

      const teacher = await prisma.professor.findUnique({
        where: {
          id: deserializedUser.id,
        },
        include: {
          students: true,
        },
      });

      if (!teacher) {
        return res.status(404).json({ message: "Professor não encontrado" });
      }

      const user = teacher.students.find((user) => user.id === studentId);

      if (!user) {
        return res
          .status(404)
          .send("Usuário não encontrado na lista do professor");
      }

      if (user.professorId !== deserializedUser.id) {
        return res
          .status(403)
          .send("Professor não tem permissão para consultar usuário");
      }

      return res.status(200).json(user);
    } catch (error) {
      console.error("[INTERNAL_SERVER_ERROR_GET_STUDENT]", error);
      return res.status(500).send("Internal server error");
    }
  }
);

//Aluno se associar a um teacher informando o email do teacher
routeStudent.post(
  "/student/connect",
  authLogin,
  async (req: Request, res: Response) => {
    const authToken = req.cookies.authToken;
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
        return res.status(404).json({ message: "Professor não encontrado" });
      }

      const student = await prisma.student.findUnique({
        where: {
          email: deserializedUser.email,
        },
        include: {
          professor: true,
        },
      });

      if (!student) {
        return res.status(404).json({ message: "Aluno não encontrado" });
      }

      if (student.professor) {
        return res
          .status(400)
          .json({ message: "O aluno já está associado a um professor" });
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

      return res
        .status(200)
        .json({ message: "Aluno associado ao professor com sucesso" });
    } catch (error) {
      console.error("Erro ao associar aluno ao professor:", error);
      return res.status(500).send("Erro interno do servidor");
    }
  }
);

//Atualizar dados de student
routeStudent.put("/student", authLogin, async (req: Request, res: Response) => {
  const authToken = req.cookies.authToken;
  const user: DeserializerUser = JSON.parse(authToken);
  const bodySchema = z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    password: z.string().optional(),
    age: z.number().optional(),
    gender: z.string().optional(),
    height: z.number().optional(),
  });

  try {
    const body = bodySchema.parse(req.body);

    const student = await prisma.student.findUnique({
      where: {
        id: user.id,
      },
    });

    if (!student) {
      return res.status(404).json({ message: "Estudante não encontrado" });
    }

    if (student.id !== user.id) {
      return res
        .status(403)
        .json({ message: "Você não tem autorização para atualizar" });
    }

    const hashedPassword = body.password
      ? await bcrypt.hash(body.password, 10)
      : null;

    const data: any = {};

    if (body.name) data.name = body.name;
    if (body.email) data.email = body.email;
    if (body.gender) data.gender = body.gender;
    if (body.height) data.height = body.height;
    if (body.age) data.age = body.age;
    if (hashedPassword) data.password = hashedPassword;

    const updatedStudent = await prisma.student.update({
      where: {
        id: user.id,
      },
      data: data,
    });

    return res.status(200).json({ updatedStudent });
  } catch (error) {
    console.error("[INTERNAL_SERVER_ERROR] - [PUT - /student]", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
});

//Atualiza os dados sem autenticação
routeStudent.put("/student/:studentId", async (req: Request, res: Response) => {
  const paramsSchema = z.object({
    studentId: z.string().uuid(),
  });

  const bodySchema = z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    tel: z.string().optional(),
    password: z.string().optional(),
    age: z.number().optional(),
    gender: z.string().optional(),
    height: z.number().optional(),
  });

  try {
    const { studentId } = paramsSchema.parse(req.params);
    const body = bodySchema.parse(req.body);

    const student = await prisma.student.findUnique({
      where: {
        id: studentId,
      },
    });

    if (!student) {
      return res.status(404).json({ message: "Estudante não encontrado" });
    }

    const hashedPassword = body.password ? await bcrypt.hash(body.password, 10): null;

    const data = {} as {
      name?: string;
      email?: string;
      tel?: string;
      gender?: string;
      height?: number;
      age?: number;
      password?: string;
      [key: string]: string | number | undefined;
    };

    if (body.name) data.name = body.name;
    if (body.email) data.email = body.email; 
    if (body.tel) data.tel = body.tel; 
    if (body.gender) data.gender = body.gender;
    if (body.height) data.height = body.height;
    if (body.age) data.age = body.age;
    if (hashedPassword) data.password = hashedPassword;

    const updatedStudent = await prisma.student.update({
      where: {
        id: studentId,
      },
      data: data,
    });

    return res.status(200).json({ updatedStudent });
  } catch (error) {
    console.error("[INTERNAL_SERVER_ERROR] - [PUT - /student]", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Erro de validação", details: error.errors });
    }

    return res.status(500).json({ message: "Erro interno do servidor" });
  }
});

//Atualizar dados de student sem autenticação com a senha anterior
routeStudent.patch(
  "/student/:studentId",
  async (req: Request, res: Response) => {
    const paramsSchema = z.object({
      studentId: z.string().uuid(),
    });

    const bodySchema = z.object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      tel: z.string().optional(),
      oldPassword: z.string().optional(),
      password: z.string().optional(),
      age: z.number().optional(),
      gender: z.string().optional(),
      height: z.number().optional(),
    });

    try {
      const { studentId } = paramsSchema.parse(req.params);
      const body = bodySchema.parse(req.body);

      const student = await prisma.student.findUnique({
        where: {
          id: studentId,
        },
      });

      if (!student) {
        return res.status(404).json({ message: "Estudante não encontrado" });
      }

      if (body.oldPassword) {
        const passwordMatch = await bcrypt.compare(
          body.oldPassword,
          student.password || ""
        );
        if (!passwordMatch) {
          return res.status(400).json({ message: "Senha incorreta" });
        }
      }

      const hashedPassword = body.password
        ? await bcrypt.hash(body.password, 10)
        : null;

      const data: Record<string, any> = {};

      if (body.name) data.name = body.name;
      if (body.email) data.email = body.email;
      if (body.tel) data.tel = body.tel;
      if (body.gender) data.gender = body.gender;
      if (body.height) data.height = body.height;
      if (body.age) data.age = body.age;
      if (hashedPassword) data.password = hashedPassword;

      const updatedStudent = await prisma.student.update({
        where: {
          id: studentId,
        },
        data: data,
      });

      return res.status(200).json({ updatedStudent });
    } catch (error) {
      console.error("[INTERNAL_SERVER_ERROR] - [PUT - /student]", error);

      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Erro de validação", details: error.errors });
      }
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
);


//Aluno se associar a um teacher sem autenticação informando o email do teacher
routeStudent.post(
  "/student/connect/:studentId",
  async (req: Request, res: Response) => {

    const connectSchema = z.object({
      email: z.string().email(),
    });

    const paramsSchema = z.object({
      studentId: z.string().uuid()
    })

    try {
      const professor = connectSchema.parse(req.body);
      const { studentId } = paramsSchema.parse(req.params)

      if (!professor) {
        return res.status(400).send("Email invalído");
      }

      const teacher = await prisma.professor.findUnique({
        where: {
          email: professor.email,
        },
      });

      if (!teacher) {
        return res.status(404).json({ message: "Professor não encontrado" });
      }

      const student = await prisma.student.findUnique({
        where: {
          id: studentId,
        }
      });

      if (!student) {
        return res.status(404).json({ message: "Aluno não encontrado" });
      }

      if (student.professorId) {
        return res
          .status(400)
          .json({ message: "O aluno já está associado a um professor" });
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

      return res
        .status(200)
        .json({ message: "Aluno associado ao professor com sucesso" });
    } catch (error) {
      console.error("Erro ao associar aluno ao professor:", error);
      return res.status(500).send("Erro interno do servidor");
    }
  }
);

