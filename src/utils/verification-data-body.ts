interface BodyProps {
  type?: string;
  weekDay?: number;
  dayMonth?: Date;
  exerciseName?: string;
  interval?: string;
  repetitions?: string;
  method?: string;
  load?: string;
  cadence?: string;
  observation?: string;
}


//Função que verifica se os os campos que existem no "body" da requisição e devolte um Obj esses dados. 
export function verificationProperty(body: BodyProps) {
  const data = {
    workout: {} as {
      type?: string;
      week_day?: number;
      day_month?: Date;
    },
    exercise: {} as {
      name_exercise?: string;
      interval?: string;
      repetitions?: string;
      method?: string;
      load?: number;
      cadence?: string;
      observation?: string;
    },
  };

  if(body.type) data.workout.type = body.type
  if(body.weekDay) data.workout.week_day = body.weekDay
  if(body.dayMonth) data.workout.day_month = body.dayMonth

  if(body.exerciseName) data.exercise.name_exercise = body.exerciseName
  if(body.repetitions) data.exercise.repetitions = body.repetitions
  if(body.interval) data.exercise.interval = body.interval
  if(body.method) data.exercise.method = body.method
  if(body.cadence) data.exercise.cadence = body.cadence
  if(body.observation) data.exercise.observation = body.observation
  if(body.load) data.exercise.load = parseFloat(body.load)

  return data;
};