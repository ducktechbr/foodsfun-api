import express from "express";
import { routes } from "./routes/routes";
import { config } from "./config/config";
import cors from "cors";

const app = express();
app.use(express.json()); // get - buscar informaçoes , post - cadastrar informaçoes, put - atualizar informaçoes, delete - deletar informaçoes, patch - atualizar parcialmente
app.use(routes);

app.listen(config.server.port, () =>
  console.log(
    `Server is running on ${config.server.port}!`)
);
