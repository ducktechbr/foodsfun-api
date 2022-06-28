import { prisma } from "./prisma";
import express, { Router } from "express";
const bcrypt = require("bcrypt");

export const routes = express.Router();

const saltRounds = 10;

routes.post("/newCategory", async (req, res) => {
  try {
    const { title, products, user } = req.body;
    const post = await prisma.Category.create({
      data: {
        title: title,
        products: products,
        user: {
          connect: {
            id: user,
          },
        },
      },
    });
    console.log(post);
    return res.status(201).json(post);
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
});

routes.post("/newUser", async (req, res) => {
  try {
    const { userName, phone, password } = req.body;
    if (
      !password ||
      !password.match(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/)
    ) {
      return res.status(400).json({
        msg: "Password is required and must have at least 6 characters, at least one letter and one number.",
      });
    }
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    const NewUser = await prisma.User.create({
      data: {
        userName: userName,
        phone: phone,
        passwordHash: hashedPassword,
      },
    });
    console.log(NewUser);
    const response = NewUser;
    response.passwordHash = "";
    return res.status(201).json(response);
  } catch (error) {
    let response = "";
    let erroDuplicatedUser = JSON.stringify(error);
    erroDuplicatedUser = JSON.parse(erroDuplicatedUser).code;

    if (erroDuplicatedUser == "P2002") {
      return res.status(500).json({ erro: "Usuário ou número de telefone duplicado" });
    } else {
      return res.status(500).json(error);
    }
  }
});

// routes.patch("/editCategory/:id", async (req, res) => {
//   const id = req.params.id;
//   const edittedUser = await prisma.User.update({
//     where: { id: id },
//     data: { userName: "NomeDaLoja", phone: "1222" },
//   });
//   console.log(edittedUser);
// });
