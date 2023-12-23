import { NextFunction, Request, Response } from "express"
import { DeserializerUser } from "../@types/types"

//Middleware que verifica se usuário está autenticado na aplicação;
export function authLogin(req: Request, res: Response, next: NextFunction) {
  const authToken = req.cookies.authToken

  if(!authToken) {
    // return res.redirect("/login")
    return res.status(401).json({ message: "Not authenticated "})
  }
  //pode usar esses cookies para fazer algum tipo de lógica
  const deserializedUser: DeserializerUser = JSON.parse(authToken);
  next()
}

//Middleware que verifica se o usuário logado é um "admin"
export function authRoleAdmin(req: Request, res: Response, next: NextFunction) {
  const authToken = req.cookies.authToken
  const deserializedUser: DeserializerUser = JSON.parse(authToken);

  if(deserializedUser.role !== 'admin') {
    return res.status(401).json({ message: "Você não tem autoriação"})
  }
  next()
}
