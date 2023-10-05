import { Professor, Student } from "@prisma/client";
import { prisma } from "../lib/prisma"

interface EmailAlreadyProps {
  isEmailRegistered: boolean;
  user?: Student | Professor
}

//Função que verifica se o email já foi registrado no banco de dados
export async function isEmailAlreadyRegistered(email: string): Promise<EmailAlreadyProps>{
  try {
    const student = await prisma.student.findUnique({
      where: {
        email
      }
    })
    const professor = await prisma.professor.findUnique({
      where: {
        email
      }
    })
  
    const isEmailRegistered = !!student || !!professor
    
    return {
      isEmailRegistered,
      user: student || professor || undefined
    }
  } catch (error) {
    console.log("Error ao verificar email", error)
    throw new Error("Error ao verificar o email")
  }
}