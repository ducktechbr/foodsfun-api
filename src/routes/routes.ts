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
    const data: any = {
      title,
      price,
      description,
      image,
      category: {
        connect: {
          id: category,
        },
      },
    };
    const newProduct = await prisma.product.create({
      data,
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

routes.get(
  "/getCategory",
  isAuthenticated,
  attachCurrentUser,
  async (req: any, res: any) => {
    try {
      const loggedInUser = req.auth;
      const userId = loggedInUser.id;
      if (!loggedInUser) {
        return res.status(404).json({ msg: "usuário não encontrado" });
      }
      const userCategories = await prisma.category.findMany({
        where: { userId },
      });
      console.log(userCategories);
      return res.status(200).json(userCategories);
    } catch (error) {
      console.error(error);
      return res.status(500).json(error);
    }
  }
);

routes.get(
  "/getProducts/:category",
  isAuthenticated,
  attachCurrentUser,
  async (req: any, res) => {
    try {
      // retira a categoria dos parametros da url
      const category: any = req.params.category;

      // retira o loggedinuser da requisição pelo middleware attachCurrentUser

      const loggedInUser = req.auth;

      // retira o userId do loggedInUser

      const userId = loggedInUser.id;

      // testa se o loggedInUser foi encontrado

      if (!loggedInUser) {
        return res.status(404).json({ msg: "usuário não encontrado" });
      }

      // caso o loggedinuser exista, carrega a primeira categoria onde o userId é igual o id do usuário logado, e o título da categoria é igual o título passado como params

      const categoryForId = await prisma.category.findFirst({
        where: { userId, title: category },
      });

      // retira o id da categoria carregada e pesquisa todos os produtos dessa categoria

      const categoryId = categoryForId?.id;

      const categoryProducts = await prisma.product.findMany({
        where: { categoryId: categoryId },
      });

      console.log(categoryProducts);
      return res.status(200).json(categoryProducts);
    } catch (error) {
      console.error(error);
      return res.status(500).json(error);
    }
  }
);

routes.delete(
  "/deleteProduct",
  isAuthenticated,
  attachCurrentUser,
  async (req: any, res) => {
    try {
      // retira o loggedinuser da requisição pelo middleware attachCurrentUser

      const loggedInUser = req.auth;

      // retira o userId do loggedInUser

      const userId = loggedInUser.id;

      // testa se o loggedInUser foi encontrado

      if (!loggedInUser) {
        return res.status(404).json({ msg: "usuário não encontrado" });
      }

      // criada variável com id do produto e da categoria que vem no body da requisição para delete

      const { prodId, catId } = req.body;

      // busca no banco de dados a categoria passada pela requisição

      const categoryForId: any = await prisma.category.findFirst({
        where: { id: catId },
      });

      // caso o ID do usuário da categoria passada seja igual ao id do login, deleta o produto

      if (categoryForId.userId === userId) {
        const deletedProduct = await prisma.product.delete({
          where: { id: prodId },
        });
        console.log(deletedProduct);
        return res.status(200).json(deletedProduct);
      }

      // tratamento de erros
    } catch (error) {
      console.error(error);
      return res.status(500).json(error);
    }
  }
);

routes.patch(
  "/editProduct",
  isAuthenticated,
  attachCurrentUser,
  async (req: any, res) => {
    try {
      // retira o loggedinuser da requisição pelo middleware attachCurrentUser

      const loggedInUser = req.auth;

      // retira o userId do loggedInUser

      const userId = loggedInUser.id;

      // testa se o loggedInUser foi encontrado

      if (!loggedInUser) {
        return res.status(404).json({ msg: "usuário não encontrado" });
      }

      // criada variável com id do produto e da categoria que vem no body da requisição para delete

      const { prodId, catId, title, price, image, description } = req.body;

      // busca no banco de dados a categoria passada pela requisição

      const categoryForId: any = await prisma.category.findFirst({
        where: { id: catId },
      });

      // caso o ID do usuário da categoria passada seja igual ao id do login, edita o produto

      if (categoryForId.userId === userId) {
        const editedProduct = await prisma.product.update({
          where: {
            id: prodId,
          },
          data: {
            title,
            price,
            image,
            description,
          },
        });

        console.log(editedProduct);
        return res.status(200).json(editedProduct);
      }
    } catch (error) {}
  }
);
