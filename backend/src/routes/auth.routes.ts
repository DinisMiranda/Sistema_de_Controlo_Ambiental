import { Router } from "express";
import { login, me, register } from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validateRequiredBody } from "../middlewares/validate-body.middleware.js";

export const authRouter = Router();

authRouter.post("/register", validateRequiredBody(["nome", "email", "password"]), register);
authRouter.post("/login", validateRequiredBody(["email", "password"]), login);
authRouter.get("/me", requireAuth, me);
