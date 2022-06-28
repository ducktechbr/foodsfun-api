import express from "express";
import { routes } from "./routes";
import cors from "cors";

const app = express();
app.use(express.json()); // get - buscar informaçoes , post - cadastrar informaçoes, put - atualizar informaçoes, delete - deletar informaçoes, patch - atualizar parcialmente
app.use(routes);

app.listen(3333, () => console.log("Server is running on port 3333"));
