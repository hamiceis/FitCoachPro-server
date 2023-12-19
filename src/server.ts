import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";

import { route } from "./routes/auth.route";
import { routeStudent } from "./routes/student.route";
import { routeTeacher } from "./routes/teacher.route";
import { routeWorkout } from "./routes/workout.route";
import { routeExercise } from "./routes/exercise.route";


const app = express();

app.use(express.json())
app.use(cors({
  //Credentials como true, permite que as requisições sejá compartilhado cookies entre outras informações
  credentials: true,
}))

app.use(cookieParser())

app.use(route)
app.use(routeStudent)
app.use(routeTeacher)
app.use(routeWorkout)
app.use(routeExercise)

app.get("/", (req, res) => {
  res.send("Hello")
})

app.listen(3000, () => {
  console.log("HTTP SERVER RUNNING")
})