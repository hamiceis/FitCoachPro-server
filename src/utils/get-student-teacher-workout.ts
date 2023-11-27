import { prisma } from "../lib/prisma";
//Função que busca busca dos dados do professor, um aluno que tem o mesmo studentId
export async function getTeacherStudentWorkouts(teacherId: string, studentId: string) {
  const teacher = await prisma.professor.findUnique({
    where: {
      id: teacherId,
    },
    include: {
      students: {
        include: {
          workouts: {
            include: {
              exercises: true,
            }
          }
        },
      },
    },
  });

  const student = teacher!.students.find(
    (teacherStudent) => teacherStudent.id === studentId
  );

  return student;
}
