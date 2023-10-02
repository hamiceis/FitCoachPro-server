import { prisma } from "../lib/prisma";

export async function getStudentWorkouts(studentId: string) {
  const student = await prisma.student.findUnique({
    where: {
      id: studentId,
    },
    include: {
      workouts: true,
    },
  });

  return student;
}

