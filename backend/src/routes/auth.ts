import { Router, type Request, type Response } from "express";
import { createToken, verifyToken } from "../lib/auth.js";

export const authRouter = Router();

const TEST_USERS = [
  {
    name: "João Silva",
    email: "joao@empresa.com",
    department: "Auditório",
    role: "User",
    password: "joao123",
  },
  {
    name: "Maria Sousa",
    email: "maria@empresa.com",
    department: "Lab A",
    role: "User",
    password: "maria123",
  },
  {
    name: "Administrador",
    email: "admin@edificio.com",
    department: "Administração",
    role: "Admin",
    password: "admin123",
  },
];

authRouter.post("/login", (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email e senha são obrigatórios." });
  }

  const found = TEST_USERS.find(
    (user) => user.email === email && user.password === password,
  );

  if (!found) {
    return res.status(401).json({ error: "Email ou senha incorretos." });
  }

  const token = createToken(found);
  const user = {
    email: found.email,
    name: found.name,
    role: found.role,
    department: found.department,
  };

  return res.json({ token, user });
});

authRouter.get("/accounts", (_req: Request, res: Response) => {
  return res.json(
    TEST_USERS.map(({ name, email, department, role, password }) => ({
      name,
      email,
      department,
      role,
      password,
    })),
  );
});

authRouter.get("/me", (req: Request, res: Response) => {
  const authorization = req.header("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token ausente ou inválido." });
  }

  const token = authorization.replace("Bearer ", "");
  const data = verifyToken(token);

  if (!data) {
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }

  return res.json({
    user: {
      email: data.email,
      name: data.name,
      role: data.role,
      department: data.department,
    },
  });
});
