import "dotenv/config";
import { app } from "./app.js";
import { authenticateSequelize } from "./lib/sequelize.js";

const PORT = process.env.PORT ?? 3001;

async function bootstrap() {
  try {
    await authenticateSequelize();
    console.log("Database connection established.");
    app.listen(PORT, () => {
      console.log(`SCA API listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1);
  }
}

bootstrap();
