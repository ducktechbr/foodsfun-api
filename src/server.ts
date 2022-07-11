import express from "express";
import cors from "cors";
import { routes } from "./routes/routes";
import { config } from "./config/config";

const app = express();

app.options("*", cors());

app.use(express.json()); // get - buscar informaçoes , post - cadastrar informaçoes, put - atualizar informaçoes, delete - deletar informaçoes, patch - atualizar parcialmente

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "DELETE, POST, GET, OPTIONS, PATCH, PUT"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  cors();
  next();
});
// process.env.NEXT_APP_URL
app.use(routes);

app.listen(config.server.port, () =>
  console.log(`Server is running on ${config.server.port}!`)
);
