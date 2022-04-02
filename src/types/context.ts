import { Request, Response } from "express";
import { User } from "../schemas/User.schema";

export interface Context {
	req: Request;
	res: Response;
	user: User | null;
}
