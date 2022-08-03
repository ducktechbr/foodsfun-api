import { prisma } from "../config/prisma";
const generateToken = require("../config/jwt.config");
import express, { Router } from "express";
import { Prisma } from "@prisma/client";
const bcrypt = require("bcrypt");
const isAuthenticated = require("../middlewares/isAuthenticated");
const attachCurrentUser = require("../middlewares/attachCurrentUser");

const saltRounds = 10;

export const routes = express.Router();

// rotas de usuário
routes.get("/healthcheck", async (req, res) => {
  if (req.method === "GET") {
    res.status(200).json({ message: "Healthy" });
  } else {
    res.status(400).json({ message: "Method not allowed" });
  }
});

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
    var paymentMethod = {
      pix: true,
      cartao: true,
      dinheiro: true,
    } as Prisma.JsonObject;

    const NewUser = await prisma.user.create({
      data: {
        userName,
        email,
        passwordHash: hashedPassword,
        paymentMethod,
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
      console.log(loggedInUser);
      var user: any = await prisma.user.findUnique({
        where: { id: loggedInUser.id },
      });
      user.passwordHash = "";
      console.log(user);
      return res.status(200).json(user);
    } catch (error) {
      console.error(error);
      return res.status(500).json(error);
    }
  }
);

routes.patch(
  "/togglePaymentMethod",
  isAuthenticated,
  attachCurrentUser,
  async (req: any, res: any) => {
    try {
      const { id } = req.auth;

      const { payment } = req.body;

      const user: any = await prisma.user.findUnique({
        where: { id },
      });

      if (payment === "pix") {
        console.log("entrei no if do pix");
        if (user.paymentMethod.pix) {
          const edittedUser = await prisma.user.update({
            where: { id },
            data: {
              paymentMethod: {
                ...user.paymentMethod,
                pix: false,
              },
            },
          });
          console.log(edittedUser);
          return res.status(200).json(edittedUser);
        } else {
          const edittedUser = await prisma.user.update({
            where: { id },
            data: {
              paymentMethod: { ...user.paymentMethod, pix: true },
            },
          });
          console.log(edittedUser);
          return res.status(200).json(edittedUser);
        }
      }

      if (payment === "cartao") {
        if (user.paymentMethod.cartao) {
          const edittedUser = await prisma.user.update({
            where: { id },
            data: {
              paymentMethod: {
                ...user.paymentMethod,
                cartao: false,
              },
            },
          });
          console.log(edittedUser);
          return res.status(200).json(edittedUser);
        } else {
          const edittedUser = await prisma.user.update({
            where: { id },
            data: {
              paymentMethod: {
                ...user.paymentMethod,
                cartao: true,
              },
            },
          });
          console.log(edittedUser);
          return res.status(200).json(edittedUser);
        }
      }

      if (payment === "dinheiro") {
        if (user.paymentMethod.dinheiro) {
          const edittedUser = await prisma.user.update({
            where: { id },
            data: {
              paymentMethod: {
                ...user.paymentMethod,
                dinheiro: false,
              },
            },
          });
          console.log(edittedUser);
          return res.status(200).json(edittedUser);
        } else {
          const edittedUser = await prisma.user.update({
            where: { id },
            data: {
              paymentMethod: {
                ...user.paymentMethod,
                dinheiro: true,
              },
            },
          });
          console.log(edittedUser);
          return res.status(200).json(edittedUser);
        }
      }
    } catch (error) {
      return res.status(500).json(error);
    }
  }
);

// rotas de categorias

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

routes.delete(
  "/deleteCategory",
  isAuthenticated,
  attachCurrentUser,
  async (req: any, res: any) => {
    try {
      const loggedInUser = req.auth;
      const userId = loggedInUser.id;

      const { categoryId } = req.body;

      if (!loggedInUser) {
        return res.status(404).json({ msg: "usuário não encontrado" });
      }

      const categoryForId = await prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (categoryForId.userId === userId) {
        const category = await prisma.category.delete({
          where: { id: categoryId },
        });
        console.log(category);
        return res.status(200).json(category);
      }
      console.log("user não é dono da categoria");
      return res.status(500).json({ msg: "user não é dono da categoria" });
    } catch (error) {
      console.error(error);
      return res.status(500).json(error);
    }
  }
);

// rotas de produto

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

      if (categoryId === undefined) {
        return res.status(404).json({ msg: "categoria não encontrada" });
      }

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

      console.log(req.body);
      const categoryForId: any = await prisma.category.findFirst({
        where: { id: catId },
      });

      // caso o ID do usuário da categoria passada seja igual ao id do login, edita o produto
      console.log("cheguei aqui");
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
    } catch (error) {
      console.error(error);
      return res.status(500).json(error);
    }
  }
);

routes.patch(
  "/toggleProduct",
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

      const { prodId, catId } = req.body.data;

      // busca no banco de dados a categoria passada pela requisição

      const categoryForId: any = await prisma.category.findFirst({
        where: { id: catId },
      });

      // caso o ID do usuário da categoria passada seja igual ao id do login, faz um toggle no active do produto

      if (categoryForId.userId === userId) {
        console.log("entrei no primeiro if");
        const toggleProductInfo = await prisma.product.findUnique({
          where: { id: prodId },
        });

        //check se o active está como true, se estiver seta pra false, se estiver como false seta pra true

        if (toggleProductInfo?.active) {
          const toggleProduct = await prisma.product.update({
            where: { id: prodId },
            data: { active: false },
          });
          console.log(toggleProduct);
          return res.status(200).json(toggleProduct);
        } else {
          const toggleProduct = await prisma.product.update({
            where: { id: prodId },
            data: { active: true },
          });
          console.log(toggleProduct);
          return res.status(200).json(toggleProduct);
        }
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json(error);
    }
  }
);

// rotas de pedidos

routes.post("/newOrder", async (req, res) => {
  try {
    const { title, info, quantity, tableId, clientId, productId } =
      req.body.data;

    if (clientId === undefined) {
      console.log("CLIENT ID UNDEFINED");
      return res.status(500).json({ msg: "CLIENT ID UNDEFINED" });
    }

    const orderTable = await prisma.table.findFirst({
      where: { id: tableId },
    });

    const userId = orderTable.userId;

    const tables = await prisma.table.findMany({ where: { userId } });

    var orders = [];

    var map = tables.map(async (current) => {
      var newOrders = await prisma.orders.findMany({
        where: { tableId: current.id },
      });
      return newOrders;
    });

    Promise.allSettled(map).then((results) => {
      results.forEach((result: any) => {
        result.value.map((current) => {
          orders.push(current);
        });
      });
      const number = orders.length + 1;
      const date = new Date(Date.now());
      const data: any = {
        title,
        info,
        quantity,
        date,
        tableId,
        number,
        clientId,
        productId,
      };
      const createdOrder = prisma.check
        .create({ data: { orders: { create: [data] } } })
        .then((result) => {
          console.log(result);
          return res.status(200).json(result);
        });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
});

routes.get(
  "/getOrders",
  isAuthenticated,
  attachCurrentUser,
  async (req: any, res) => {
    try {
      // retira o loggedinuser da requisição pelo middleware attachCurrentUser

      const loggedInUser = req.auth;

      // retira o userId do loggedInUser

      const userId = loggedInUser.id;

      const tables = await prisma.table.findMany({ where: { userId } });

      var orders = [];
      var map = tables.map(async (current) => {
        var newOrders = await prisma.orders.findMany({
          where: { tableId: current.id },
        });
        return newOrders;
      });

      Promise.allSettled(map).then((results) => {
        results.forEach((result: any) => {
          result.value.map((current) => {
            orders.push(current);
          });
        });

        if (orders.length === 0) {
          return res
            .status(200)
            .json({ msg: "Usuário não tem pedidos ativos." });
        }
        console.log(orders);
        return res.status(200).json(orders);
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json(error);
    }
  }
);

routes.patch(
  "/toggleOrder",

  async (req: any, res) => {
    try {
      // retira o loggedinuser da requisição pelo middleware attachCurrentUser

      const { id } = req.body;
    } catch (error) {
      console.error(error);
      return res.status(500).json(error);
    }
  }
);

// rotas de mesa

routes.post(
  "/newTable",
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

      const tables = await prisma.table.findMany({
        where: { userId },
      });
      const number = tables.length + 1;

      const qrcode = "1231231231233333";

      const data = {
        userId,
        number,
        qrcode,
      };
      const newTable = await prisma.table.create({ data });
      return res.status(200).json(newTable);
    } catch (error) {
      console.error(error);
      return res.status(500).json(error);
    }
  }
);

routes.patch(
  "/changeTableNumber",
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

      const { id, number } = req.body;

      const currentTable = await prisma.table.findUnique({
        where: { id },
      });

      if (currentTable.userId !== userId) {
        console.log("usuário não é dono da mesa para edita-la");
        return res.status(400).json({ msg: "usuário não é dono da mesa" });
      }

      const editedTable = await prisma.table.update({
        where: { id },
        data: { number },
      });
      console.log(editedTable);
      return res.status(200).json(editedTable);
    } catch (error) {
      console.error(error);
      return res.status(500).json(error);
    }
  }
);

routes.delete(
  "/deleteTable",
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

      const { id } = req.body;

      const currentTable = await prisma.table.findUnique({
        where: { id },
      });

      if (currentTable.userId !== userId) {
        console.log("usuário não é dono da mesa para edita-la");
        return res.status(400).json({ msg: "usuário não é dono da mesa" });
      }

      const deletedTable = await prisma.table.delete({
        where: { id },
      });

      console.log(deletedTable);
      return res.status(200).json({ msg: "mesa deletada", deletedTable });
    } catch (error) {
      console.error(error);
      return res.status(500).json(error);
    }
  }
);

routes.patch(
  "/toggleTable",
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

      const { id } = req.body;

      const currentTable = await prisma.table.findUnique({
        where: { id },
      });
      const currentState = currentTable.active;
      if (currentTable.userId !== userId) {
        console.log("usuário não é dono da mesa para edita-la");
        return res.status(400).json({ msg: "usuário não é dono da mesa" });
      }

      const deletedTable = await prisma.table.update({
        where: { id },
        data: {
          active: !currentState,
        },
      });

      console.log(deletedTable);
      return res.status(200).json(deletedTable);
    } catch (error) {
      console.error(error);
      return res.status(500).json(error);
    }
  }
);

routes.get(
  "/getTables",
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

      const userTables = await prisma.table.findMany({
        where: { userId },
      });

      console.log(userTables);
      return res.status(200).json(userTables);
    } catch (error) {
      console.error(error);
      return res.status(500).json(error);
    }
  }
);

// routes de cliente

routes.post("/loginClient", async (req, res) => {
  try {
    const { name, number } = req.body;

    const user = await prisma.client.findUnique({ where: { number } });

    if (user !== null) {
      if (user.name === name) {
        return res.status(200).json({ msg: "usuário logado" });
      } else {
        return res.status(500).json({ msg: "nome de usuário incorreto" });
      }
    } else {
      const newClient = await prisma.client.create({
        data: { name, number },
      });

      return res.status(200).json(newClient);
    }
  } catch (error) {
    console.error(error.code);
    return res.status(500).json(error);
  }
});

// get produtos e categorias pelo cliente

routes.patch("/categoriesClient", async (req, res) => {
  try {
    const { id } = req.body;
    const table = await prisma.table.findUnique({
      where: { id },
    });
    const userId = table.userId;
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

routes.patch("/getProductsClient/:category", async (req: any, res) => {
  try {
    // retira a categoria dos parametros da url
    const category: any = req.params.category;

    const { id } = req.body;
    const table = await prisma.table.findUnique({
      where: { id },
    });

    const userId = table.userId;

    const categoryForId = await prisma.category.findFirst({
      where: { userId, title: category },
    });

    // retira o id da categoria carregada e pesquisa todos os produtos dessa categoria

    const categoryId = categoryForId?.id;

    if (categoryId === undefined) {
      return res.status(404).json({ msg: "categoria não encontrada" });
    }

    const categoryProducts = await prisma.product.findMany({
      where: { categoryId: categoryId },
    });

    console.log(categoryProducts);
    return res.status(200).json(categoryProducts);
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
});

routes.patch("/getCheck", async (req, res) => {
  try {
    const { id } = req.body;
    const check = await prisma.check.findUnique({
      where: { id },
      include: { orders: true },
    });
    return res.status(200).json(check);
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
});

routes.post("/newOrderOnExistingCheck", async (req, res) => {
  try {
    const { title, info, quantity, tableId, checkId, clientId, productId } =
      req.body.data;

    if (clientId === undefined) {
      console.log("CLIENT ID UNDEFINED");
      return res.status(500).json({ msg: "CLIENT ID UNDEFINED" });
    }

    const orderTable = await prisma.table.findFirst({
      where: { id: tableId },
    });

    const userId = orderTable.userId;

    const tables = await prisma.table.findMany({ where: { userId } });

    var orders = [];

    var map = tables.map(async (current) => {
      var newOrders = await prisma.orders.findMany({
        where: { tableId: current.id },
      });
      return newOrders;
    });

    Promise.allSettled(map).then((results) => {
      results.forEach((result: any) => {
        result.value.map((current) => {
          orders.push(current);
        });
      });
      const number = orders.length + 1;
      const date = new Date(Date.now());
      const data: any = {
        title,
        info,
        quantity,
        date,
        tableId,
        number,
        clientId,
        productId,
      };
      const createdOrder = prisma.check
        .update({
          where: { id: checkId },
          data: { orders: { create: [data] } },
        })
        .then((result) => {
          console.log(result);
          return res.status(200).json(result);
        });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
});
