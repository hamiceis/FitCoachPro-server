import { prisma } from "../lib/prisma";

//função para buscar os treinos de aluno passando seu Id
export async function getStudentWorkouts(studentId: string) {
  const student = await prisma.student.findUnique({
    where: {
      id: studentId
    },
    include: {
      workouts: {
        include: {
          exercises: true
        }
      }
    }
  })
  return student;
}

