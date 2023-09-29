import { prisma } from "../lib/prisma"

export async function isEmailAlreadyRegistered(email: string): Promise<boolean>{
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
    
    return isEmailRegistered 
  } catch (error) {
    console.log("Error ao verificar email", error)
    throw new Error("Error ao verificar o email")
  }
}