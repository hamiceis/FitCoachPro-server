import { NextFunction, Request, Response } from "express"
import { DeserializerUser } from "../@types/types"

export function authLogin(req: Request, res: Response, next: NextFunction) {
  const authToken = req.cookies.authToken

  if(!authToken) {
    // return res.redirect("/login")
    return res.status(401).json({ message: "Not authenticated "})
  }

  const deserializedUser: DeserializerUser = JSON.parse(authToken);
  next()
}


export function authRoleAdmin(req: Request, res: Response, next: NextFunction) {
  const authToken = req.cookies.authToken
  const deserializedUser: DeserializerUser = JSON.parse(authToken);

  if(deserializedUser.role !== 'admin') {
    return res.status(401).json({ message: "Você não tem autoriação"})
  }
  next()
}