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
app.use(cookieParser())

//origin determina qual dominio pode ter acesso as requisições http
//Credentials como true, permite que as requisições sejá compartilhado cookies entre outras informações no headers
app.use(cors({
  origin: "http://localhost:5173", 
  credentials: true,
}))

app.use(route)
app.use(routeStudent)
app.use(routeTeacher)
app.use(routeWorkout)
app.use(routeExercise)

app.get("/", (req, res) => {
  res.status(200).send("Aplicação rodando com sucesso")
})

app.listen(3000, () => {
  console.log("HTTP SERVER RUNNING")
})