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

bootstrap();
