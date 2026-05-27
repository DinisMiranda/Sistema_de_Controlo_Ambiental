import "dotenv/config";
import { app } from "./app.js";
import { createHash } from "crypto";
import {
  authenticateSequelize,
  syncModels,
  models,
} from "./models/sequelize/index.js";

const { Utilizador } = models;

const PORT = process.env.PORT ?? 3001;

async function bootstrap() {
  try {
    await authenticateSequelize();
    console.log("Database connection established.");
    if (process.env.SYNC_MODELS === "true") {
      await syncModels();
      console.log("Sequelize models synchronized.");
    }

    await seedUsers();
    await ensureDefaultAdmin();

    app.listen(PORT, () => {
      console.log(`SCA API listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1);
  }
}

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

async function seedUsers() {
  const count = await Utilizador.count();

  if (count === 0) {
    await Utilizador.bulkCreate([
      {
        nome: "Carlos Pereira",
        email: "admin@edificio.com",
        palavra_passe_hash: hashPassword("admin123"),
        admin: true,
        data_criacao: new Date(),
      },
      {
        nome: "João Silva",
        email: "joao@empresa.com",
        palavra_passe_hash: hashPassword("joao123"),
        admin: false,
        data_criacao: new Date(),
      },
      {
        nome: "Maria Sousa",
        email: "maria@empresa.com",
        palavra_passe_hash: hashPassword("maria123"),
        admin: false,
        data_criacao: new Date(),
      },
    ]);

    console.log("Default users seeded.");
  }
}

/** Garante pelo menos um admin (útil após import CSV sem contas admin). */
async function ensureDefaultAdmin() {
  const adminCount = await Utilizador.count({ where: { admin: true } });
  if (adminCount > 0) return;

  const email = process.env.BOOTSTRAP_ADMIN_EMAIL || "admin@edificio.com";
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || "admin123";
  const nome = process.env.BOOTSTRAP_ADMIN_NAME || "Administrador SCA";

  const existing = await Utilizador.findOne({ where: { email } });
  if (existing) {
    await existing.update({ admin: true });
    console.log(`Conta promovida a admin: ${email}`);
    return;
  }

  await Utilizador.create({
    nome,
    email,
    palavra_passe_hash: hashPassword(password),
    admin: true,
    data_criacao: new Date(),
  });

  console.log(`Conta admin criada: ${email}`);
}

bootstrap();
