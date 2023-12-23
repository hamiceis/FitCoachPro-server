import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { z } from "zod";
import bcrypt from "bcrypt";

import { isEmailAlreadyRegistered } from "../utils/email-validation";

export const route = Router();

//Fazer login 
route.post("/login", async (req: Request, res: Response) => {
  const bodySchema = z.object({
    email: z.string().email(),
    password: z.string(),
  });
  try {
    const { email, password } = bodySchema.parse(req.body);

    if (!email || !password) {
      return res.status(401).json({ message: "Os campos precisam ser todos preenchidos" });
    }

    const isExistEmail = await isEmailAlreadyRegistered(email)
   
    if (!isExistEmail.isEmailRegistered) {
      return res.status(401).json({ message: "Usuário não encontrado" });
    }

    const user = isExistEmail.user
  
    const verifyPass = await bcrypt.compare(password, user!.password);

    if (!verifyPass) {
      return res.status(401).json({ message: "Password incorrect" });
    }

    const userCookie = {
      id: user!.id,
      email: user!.email,
      role: user!.role
    };

    const cookieOptions = {
   // httpOnly: true, // Isso impede que o cookie seja acessível via JavaScript
      maxAge: 3600000, // Tempo de vida do cookie em milissegundos (1 hora neste exemplo)
   // secure: "/"      //indica que todas as todas tem acesso
    };

    const serializedUser = JSON.stringify(userCookie); // Converta os dados do usuário em uma string

    res.cookie("authToken", serializedUser, cookieOptions);
    return res.status(200).json({ 
      message: "Login success"
    });
  } catch (error) {
    res.status(500).send("Internal Server Error");
    throw new Error("Internal Server Error[/login]");
  }
});

//Criar conta com student
route.post("/register/student", async (req: Request, res: Response) => {
  const bodySchema = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string(),
    age: z.number(),
    tel: z.string().optional(),
    gender: z.string().optional(),
    height: z.number(),
    professorEmail: z.string().email().optional(),
  });
  try {
    const user = bodySchema.parse(req.body);

    const existEmail = await isEmailAlreadyRegistered(user.email);

    if (existEmail.isEmailRegistered) {
      return res.status(401).send("Email já cadastrado");
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);

    const professor = user.professorEmail
      ? await prisma.professor.findUnique({
          where: {
            email: user.professorEmail,
          },
        })
      : null;

    const data = await prisma.student.create({
      data: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
        age: user.age,
        height: user.height,
        gender: user?.gender,
        tel: user?.tel,
        professorId: professor?.id,
      },
    });

    return res.json(data);
  } catch (error) {
    return res.status(500).send("Internal Server Error [/register/student]");
  }
});

//Criar conta como teacher
route.post("/register/teacher", async (req: Request, res: Response) => {
  const bodySchema = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string(),
    cref: z.string(),
  });

  try {
    const user = bodySchema.parse(req.body);

    const existEmail = await isEmailAlreadyRegistered(user.email);
  
    if (existEmail.isEmailRegistered) {
      return res.status(401).json({ message: "Email já cadastrado"});
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);

    const data = await prisma.professor.create({
      data: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
        cref: user.cref,
      },
    });

    return res.json(data);
  } catch (error) {
    return res.status(500).send("Internal Server Error [/register/teacher]");
  }
});

//Deslogar 
route.get("/logout", (req: Request, res:Response) => {
  res.cookie('authToken', null, { maxAge: 0})
  res.clearCookie("authToken")
  return res.status(200).json({ message: "logout success"})
})