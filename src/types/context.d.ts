import { Request, Response } from "express";
import { User } from "../schemas/user/User.schema";

export interface Context {
  req: Request;
  res: Response;
  user: User | null;
}
