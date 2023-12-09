import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authLogin } from "../middlewares/auth.middleware";
import { z } from "zod";
import { DeserializerUser } from "../@types/types";
import { Exercise } from "@prisma/client";

export const routeExercise = Router();

//Lista todos os exercicios de todos os alunos
routeExercise.get("/exercises", async (req: Request, res: Response) => {
  const exercises = await prisma.exercise.findMany();
  return res.status(200).json(exercises);
});

//Student lista todos os seus exercicios
routeExercise.get(
  "/student/exercises",
  authLogin,
  async (req: Request, res: Response) => {
    try {
      const authToken = req.cookies.authToken;
      const user: DeserializerUser = JSON.parse(authToken);

      const student = await prisma.student.findUnique({
        where: {
          id: user.id,
        },
        include: {
          workouts: {
            include: {
              exercises: true,
            },
          },
        },
      });

      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      const exercises = student.workouts.flatMap(
        (workout) => workout.exercises
      );

      if (exercises.length === 0) {
        return res
          .status(401)
          .json({ message: "Student does not have exercises" });
      }

      return res.status(200).json(exercises);
    } catch (error) {
      console.error("[INTERNAL_SERVER_ERROR_get_exercises]", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

//Teacher lista execicios de aluno
routeExercise.get(
  "/exercises/:studentId",
  authLogin,
  async (req: Request, res: Response) => {
    const authToken = req.cookies.authToken;
    const user: DeserializerUser = JSON.parse(authToken);

    const paramsSchema = z.object({
      studentId: z.string(),
    });

    try {
      const { studentId } = paramsSchema.parse(req.params);

      const student = await prisma.student.findUnique({
        where: {
          id: studentId,
        },
        include: {
          workouts: {
            include: {
              exercises: true,
            },
          },
        },
      });

      const teacher = await prisma.professor.findUnique({
        where: {
          id: user.id,
        },
      });

      if (!student || !teacher) {
        return res
          .status(404)
          .json({ message: "Teacher or Student not found" });
      }

      if (student.professorId !== teacher.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      if (student.workouts.length === 0) {
        return res
          .status(401)
          .json({ message: "Student does not have exercises" });
      }

      const exercises = student.workouts.flatMap(
        (workout) => workout.exercises
      );

      return res.status(200).json(exercises);
    } catch (error) {
      console.log("INTERNAL_SERVER_ERROR", error);
      return res.status(500).json("Internal server error_get_exercises");
    }
  }
);

//Criar um novo exercício para um aluno, passando o WorkoutId pelos params
routeExercise.post(
  "/exercise/:workoutId",
  async (req: Request, res: Response) => {
    //implementar lógica authToken, para ver se o aluno pertence ao mesmo professor

    const paramsSchema = z.object({
      workoutId: z.string().uuid(),
    });

    const bodySchema = z.object({
      exerciseName: z.string().min(1, "campo obrigátorio"),
      repetitions: z.string().min(1, "Campo obrigátorio"),
      interval: z.string().min(1, {
        message: "Campo obrigátorio",
      }),
      method: z.string().optional(),
      load: z.number().min(1, "Campo obrigatório"),
      cadence: z.string().min(1),
      observation: z.string().optional(),
    });

    const data = bodySchema.parse(req.body);

    const { workoutId } = paramsSchema.parse(req.params);

    try {
      const workouts = await prisma.workout.findFirst({
        where: {
          id: workoutId,
        },
      });

      if (!workouts) {
        return res.status(201).json({ message: "Não foram encontrados treinos" });
      }

      if (!data) {
        return res
          .status(401)
          .json({ message: "Você precisa enviar os dados do exercise" });
      }

      await prisma.exercise.create({
        data: {
          name_exercise: data.exerciseName,
          repetitions: data.repetitions,
          load: data.load,
          method: data.method,
          cadence: data.cadence,
          interval: data.interval,
          observation: data.observation,
          workout: {
            connect: {
              id: workoutId,
            },
          },
        },
      });

      return res.status(200).json({ message: "Exercício criado com sucesso" });
    } catch (error) {
      console.log("INTERNAL_SERVER_ERROR", error);
      return res.status(500).json("INTERNAL_SERVER_ERROR");
    }
  }
);

//Atualizar/Alterar exercícios já cadastrados
routeExercise.patch("/exercise/:workoutId/:exerciseId", async (req: Request, res: Response) => {
  //implementar lógica, se o professor tem permissão de atualizar exercicio 


  const paramsSchema = z.object({
    workoutId: z.string().uuid(),
    exerciseId: z.string().uuid()
  })

  const bodySchema = z.object({
      exerciseName: z.string().optional(),
      repetitions: z.string().optional(),
      interval: z.string().optional(),
      method: z.string().optional(),
      load: z.string().optional(),
      cadence: z.string().optional(),
      observation: z.string().optional(),
  })

  const { workoutId, exerciseId } = paramsSchema.parse(req.params)
  const body = bodySchema.parse(req.body)

  try {
    const workout = await prisma.workout.findUnique({
      where: {
        id: workoutId
      }
    })
    const exercise = await prisma.exercise.findFirst({
      where: {
        id: exerciseId,
        workoutId
      }
    })

    if(!workout || !exercise) {
      return res.status(404).json({ message: "Workout or exercise not found"})
    }

    const data = {} as {
      name_exercise?: string;
      repetitions?: string;
      interval?: string;
      method?: string;
      cadence?: string;
      observation?: string;
      load?: number
    }

    if(body.exerciseName) data.name_exercise = body.exerciseName
    if(body.repetitions) data.repetitions = body.repetitions
    if(body.interval) data.interval = body.interval
    if(body.method) data.method = body.method
    if(body.cadence) data.cadence = body.cadence
    if(body.observation) data.observation = body.observation
    if(body.load) data.load = parseFloat(body.load)

    if(!data) {
      return res.status(403).json({ message: "Dados ausente"})
    }

    const exercisesUpdated = await prisma.exercise.update({
      where: {
        id: exerciseId,
        workoutId
      },
      data
    })

    return res.status(200).json({ message: "Exercício atualizado"})

  }catch(error) {
    console.log("INTERNAL_SERVER_ERROR", error)
    return res.status(500).json({ message: error})
  }
})


//removendo exercício passando wokroutId e ExerciseId pelos params
routeExercise.delete("/exercise/:workoutId/:exerciseId", async (req: Request, res: Response) => {
    //implementar lógica com middleware authToken, para saber se o aluno pertence ao mesmo professor

    const paramsSchema = z.object({
        workoutId: z.string().uuid(),
        exerciseId: z.string().uuid()
    })

    const { workoutId , exerciseId } = paramsSchema.parse(req.params)

    try {
        // Verifique se o exercício pertence ao treino
        const exercise = await prisma.exercise.findFirst({
            where: {
                id: exerciseId,
                 workoutId: workoutId
            }
        })

        if(!exercise) {
            return res.status(404).json({ message: "Exercício não encontrado"})
        }

        await prisma.exercise.delete({
            where: {
                id: exerciseId
            }
        })

        return res.status(200).json({ message: "Exercício removido com sucesso"})

    } catch (error) {
        console.log("INTERNAL_SERVER_ERROR", error);
        return res.status(500).json("INTERNAL_SERVER_ERROR");
    }
})


//buscar todos os exercício de um Workout 
routeExercise.get("/exercise/:workoutId", async (req: Request, res: Response) => {
  //implementar a lógica se a pessoa tem permissão com o middleware authLogin

  const paramsSchema = z.object({
    workoutId: z.string().uuid()
  })

  const { workoutId } = paramsSchema.parse(req.params)
  try {

    const workouts = await prisma.workout.findUnique({
      where: {
        id: workoutId
      }, 
      include: {
        exercises: true
      }
    })

    if(!workouts) {
    return res.status(404).json({ message: "Treino não cadastrado"})
    }

    return res.status(200).json(workouts.exercises)

  }catch(error){
    console.log("[INTERNAL_SERVER_ERROR_GET_EXERCISE_Workouts]", error)
    return res.status(500).send("INTERNAL_SERVER_ERROR")
  }
})