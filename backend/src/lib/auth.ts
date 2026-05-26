export interface AuthPayload {
  email: string;
  name: string;
  role: string;
  department: string;
  exp: number;
}

export function createToken(user: {
  email: string;
  name: string;
  role: string;
  department: string;
}) {
  const payload: AuthPayload = {
    email: user.email,
    name: user.name,
    role: user.role,
    department: user.department,
    exp: Date.now() + 1000 * 60 * 60 * 8,
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const payload = JSON.parse(decoded) as AuthPayload;
    if (!payload || typeof payload.exp !== "number") return null;
    return payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}
