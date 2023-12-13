import { Router, Request, Response } from "express"
import { prisma } from "../lib/prisma";
import dayjs from "dayjs"
import { z } from "zod"
import bcrypt from "bcrypt"
import { authLogin } from "../middlewares/auth.middleware";
import { DeserializerUser } from "../@types/types";

export const routeTeather = Router();

//Listar todos os teachers
routeTeather.get("/teachers", async (req: Request, res: Response) => {
  const teacher = await prisma.professor.findMany()
  return res.status(200).json(teacher)
})

//Consultar dados de um unico aluno pelo Id
routeTeather.get("/teacher/:teacherId", async (req: Request, res: Response) => {
  const paramsSchema = z.object({
    teacherId: z.string().uuid()
  })

  const { teacherId } = paramsSchema.parse(req.params)
  try {

    const teacher = await prisma.professor.findUnique({
      where: {
        id: teacherId
      }
    })

    if(!teacher) {
      return res.status(401).json({ message: "Professor não encontrado"})
    }

    const { password, ...rest } = teacher

    return res.status(200).json(rest)

  } catch(error) {
    console.log("INTERNAL_SERVER_ERROR_GET_TEACHER", error)
    return res.status(500).json({ message: "INTERNAL SERVER ERROR"})
  }
})

//Listar todos os teachers e students
routeTeather.get("/teachers/students",  async (req: Request, res: Response) => {
  const teacher = await prisma.professor.findMany({
    include: {
      students: true,
    }
  })
  return res.status(200).json(teacher)
})

//Listar todos os alunos de apenas um único teacher
routeTeather.get("/teacher/students", authLogin, async (req: Request, res: Response) => {
  const authToken = req.cookies.authToken
  const user: DeserializerUser = JSON.parse(authToken)

  const teacher = await prisma.professor.findUnique({
    where: {
      id: user.id
    }
  })

  try {

    if(user.role !== "admin"){
      return res.status(400).json({ message: "You are not authorized"})
    }

    if(!teacher) {
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

//Remove um aluno da lista do teacher
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

//Atualizar seus dados de teacher
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

//Teacher adiciona aluno a sua lista de students
routeTeather.post("/teacher/students", authLogin, async (req: Request, res: Response) => {
  const authToken = req.cookies.authToken
  const user: DeserializerUser = JSON.parse(authToken)

  const bodySchema = z.object({
    email: z.string().email()
  })
  const { email } = bodySchema.parse(req.body)

  const teacher = await prisma.professor.findUnique({
    where: {
      id: user.id
    },
    include: {
      students: true,
    }
  })

  const student = await prisma.student.findUnique({
    where: {
      email
    },
    include: {
      professor: true,
    }
  })

  try {
    if(!teacher) {
      return res.status(400).json({ message: "Teacher not found"})
    }

    if(!student) {
      return res.status(400).json({ message: "Student not exist"})
    }

    if(student.professor) {
      return res.status(400).json({ message: "Aluno já associado a um professor"})
    }

    const filterStudent = teacher.students.filter(student => student.email === email)
    

    if(filterStudent.length > 0) {
      return res.status(400).json({ message: "Student already singup"})
    }


    const newStudent = await prisma.professor.update({
      where: {
        id: user.id
      },
      data: {
        students: {
          connect: {
            id: student.id
          }
        }
      },
      include: {
        students: true,
      }
    })

    const dataNewStudent = newStudent.students[newStudent.students.length -1]

    return res.status(200).json({ message: `Aluno ${dataNewStudent.name} cadastrado com sucesso a sua lista`})

  } catch (error) {
    console.log("[INTERNAL_SERVER_ERROR_teacher_post]", error)
    return res.status(500).json({ message: "Internal Server Error"})
  }
})

//Teacher adiciona informações adicionais aos dados do student
routeTeather.patch("/teacher/student/:studentId", authLogin, async (req: Request, res: Response) => {
  const authToken = req.cookies.authToken
  const user: DeserializerUser = JSON.parse(authToken)
  const studentId = req.params.studentId

  const bodySchema = z.object({
    weight: z.string().optional(),
    imc: z.string().optional(),
    training_level: z.number().optional(),
    conditioning_level: z.number().optional(),
    weekly_Frequency: z.number().optional(),
    goal: z.string().optional(),
    protocol_start_date: z.string().optional(),
    protocol_end_date: z.string().optional(),
    observations: z.string().optional()
  })

  try {
    const body = bodySchema.parse(req.body)

    const teacher = await prisma.professor.findUnique({
      where: {
        id: user.id
      },
      include: {
        students: true,
      }
    })

    if (!teacher) {
      return res.status(404).json({ message: "Professor não encontrado" });
    }

    if (teacher.id !== user.id) {
      return res.status(403).json({ message: "Você não tem permissão para atualizar dados desse aluno" });
    }

    const student = teacher.students.find(student => student.id === studentId)

    if(!student) {
      return res.status(401).json({ message: "Student não está na sua lista"})
    }
    
    const data: any = {}
    
    if(body.weight) data.weight = parseFloat(body.weight)
    if(body.imc) data.imc = parseFloat(body.imc)
    if(body.training_level)  data.training_level = body.training_level
    if(body.conditioning_level) data.conditioning_level = body.conditioning_level
    if(body.weekly_Frequency) data.weekly_Frequency = body.weekly_Frequency
    if(body.goal) data.goal = body.goal
    if(body.protocol_start_date) data.protocol_start_date = dayjs(body.protocol_start_date).toISOString()
    if(body.protocol_end_date) data.protocol_end_date = dayjs(body.protocol_end_date).toISOString()
    if(body.observations) data.observations = body.observations

    const studentUpdated = await prisma.student.update({
      where: {
        id: student.id
      }, 
      data
    })

    return res.status(200).json(studentUpdated)

  } catch(error) {
    console.error("[INTERNAL_SERVER_ERROR]", error);
    res.status(500).json({ message: "INTERNAL_SERVER_ERROR_PUT_TEACHER_Student" });
  }
})

//Atualizar dados pessoais de teacher sem autenticação
routeTeather.put("/teacher/:teacherId", async (req: Request, res: Response) => {
  const paramsSchema = z.object({
    teacherId: z.string().uuid()
  })

  //implementar a lógica pegando a senha antiga e confirmando antes de fazer alteração para nova
  const bodySchema = z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    password: z.string().optional(),
    cref: z.string().optional()
  });

  try {
    const { teacherId } = paramsSchema.parse(req.params)
    const body = bodySchema.parse(req.body);

    const teacher = await prisma.professor.findUnique({
      where: {
        id: teacherId
      }
    });

    if (!teacher) {
      return res.status(404).json({ message: "Professor não encontrado" });
    }

    const hashedPassword = body.password ? await bcrypt.hash(body.password, 10) : null;

    const data: any = {};

    if (body.name) data.name = body.name;
    if (body.email) data.email = body.email;
    if (hashedPassword) data.password = hashedPassword;
    if (body.cref) data.cref = body.cref;

    const updatedTeacher = await prisma.professor.update({
      where: {
        id: teacherId
      },
      data: data
    });

    return res.status(200).json(updatedTeacher);
  } catch (error) {
    console.error("[INTERNAL_SERVER_ERROR]", error);
    res.status(500).json({ message: "INTERNAL_SERVER_ERROR_PUT_TEACHER" });
  }
});