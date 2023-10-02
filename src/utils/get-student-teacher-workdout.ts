import { prisma } from "../lib/prisma";
export async function getTeacherStudentWorkouts(teacherId: string, studentId: string) {
  const teacher = await prisma.professor.findUnique({
    where: {
      id: teacherId,
    },
    include: {
      students: {
        include: {
          workouts: true,
        },
      },
    },
  });

  const student = teacher!.students.find(
    (teacherStudent) => teacherStudent.id === studentId
  );

  return student;
}
