import { prisma } from "../config/prisma";
const generateToken = require("../config/jwt.config");
import express, { Router } from "express";
const bcrypt = require("bcrypt");
const isAuthenticated = require("../middlewares/isAuthenticated");
const attachCurrentUser = require("../middlewares/attachCurrentUser");

const saltRounds = 10;

export const routes = express.Router();

routes.post("/newUser", async (req, res) => {
  try {
    const { userName, email, password } = req.body;
    if (
      !password ||
      !password.match(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/)
    ) {
      return res.status(400).json({
        msg: "Password is required and must have at least 6 characters, at least one letter and one number, and no simbols",
      });
    }
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword: string = await bcrypt.hash(password, salt);
    const NewUser = await prisma.user.create({
      data: {
        userName,
        email,
        passwordHash: hashedPassword,
      },
    });

    const response = NewUser;
    response.passwordHash = "";
    console.log(response);
    return res.status(201).json(response);
  } catch (error) {
    let erroDuplicatedUser = JSON.stringify(error);
    erroDuplicatedUser = JSON.parse(erroDuplicatedUser).code;

    if (erroDuplicatedUser == "P2002") {
      return res
        .status(500)
        .json({ erro: "Usuário ou número de telefone duplicado" });
    } else {
      return res.status(500).json(error);
    }
  }
});

routes.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user: any = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ msg: "wrong password or e-mail" });
    }
    if (await bcrypt.compare(password, user.passwordHash)) {
      delete user.passwordHash;
      const token = generateToken(user);
      console.log({ user: user, token: token });
      return res.status(200).json({ user: user, token: token });
    } else {
      return res.status(400).json({ msg: "Wrong password or e-mail" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
});

routes.get(
  "/user",
  isAuthenticated,
  attachCurrentUser,
  async (req: any, res: any) => {
    try {
      const loggedInUser = req.auth;
      if (!loggedInUser) {
        return res.status(404).json({ msg: "usuário não encontrado" });
      }
      console.log(req.auth);
      return res.status(200).json(req.auth);
    } catch (error) {
      console.error(error);
      return res.status(500).json(error);
    }
  }
);

routes.post(
  "/newCategory",
  isAuthenticated,
  attachCurrentUser,
  async (req: any, res: any) => {
    try {
      const loggedInUser = req.auth;
      const userId = loggedInUser.id;
      if (!loggedInUser) {
        return res.status(404).json({ msg: "usuário não encontrado" });
      }
      const { title, description } = req.body;

      const post = await prisma.category.create({
        data: {
          title,
          description,
          user: {
            connect: {
              id: userId,
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
  }
);

routes.post("/newProduct", async (req, res) => {
  try {
    const { title, price, description, image, category } = req.body;
    const newProduct: any = await prisma.product.create({
      data: {
        title,
        price,
        description,
        image,
        category: {
          connect: {
            id: category,
          },
        },
      },
    });
    console.log(newProduct);
    return res.status(201).json(newProduct);
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
});

// routes.patch(
//   "/editUser",
//   isAuthenticated,
//   attachCurrentUser,
//   async (req: any, res: any) => {
//     try {
//       const { userName, email, id } = req.auth;
//       const { password } = req.body;
//       if (
//         !password ||
//         !password.match(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/)
//       ) {
//         return res.status(400).json({
//           msg: "Password is required and must have at least 6 characters, at least one letter and one number, and no simbols",
//         });
//       }
//       const salt = await bcrypt.genSalt(saltRounds);
//       const hashedPassword = await bcrypt.hash(password, salt);
//       const edittedUser = await prisma.user.update({
//         where: { id },
//         data: { userName, email, passwordHash: hashedPassword },
//       });
//       console.log(edittedUser);
//       return res.status(201).json(edittedUser);
//     } catch (error) {
//       let erroDuplicatedUser = JSON.stringify(error);
//       erroDuplicatedUser = JSON.parse(erroDuplicatedUser).code;

//       if (erroDuplicatedUser == "P2002") {
//         return res
//           .status(500)
//           .json({ erro: "Usuário ou número de telefone duplicado" });
//       } else {
//         return res.status(500).json(error);
//       }
//     }
//   }
// );

routes.get("/getCaterogy/:id", async (req, res) => {
  try {
    const userId: any = req.params.id;
    const userCategories = await prisma.category.findMany({
      where: { userId },
    });
    console.log(userCategories);
    return res.status(200).json(userCategories);
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
});

routes.get("/getProducts/:id", async (req, res) => {
  try {
    const categoryId = req.params.id;
    const categoryProducts = await prisma.product.findMany({
      where: { categoryId },
    });
    console.log(categoryProducts);
    return res.status(200).json(categoryProducts);
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
});
