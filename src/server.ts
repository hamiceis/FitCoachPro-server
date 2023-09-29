import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";

import { route } from "./routes/auth.route";
import { routeStudent } from "./routes/student.route";
import { routeTeather } from "./routes/teacher.route";
import { routeWorkout } from "./routes/workout.route";
import { routeExercise } from "./routes/exercise.route";


const app = express();

app.use(express.json())
app.use(cors())

app.use(cookieParser())

app.use(route)
app.use(routeStudent)
app.use(routeTeather)
app.use(routeWorkout)
app.use(routeExercise)

app.get("/", (req, res) => {
  res.send("Hello")
})

app.listen(3000, () => {
  console.log("HTTP SERVER RUNNING")
})