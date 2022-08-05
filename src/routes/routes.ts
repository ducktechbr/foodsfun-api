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

// Route de novo usuário, caminho "/newUser" recebe req com body em json como o seguinte:
//
// {
// 	"userName":"higao@reidelas.co123123m",
// 	"email": "higao@reidelas.co123m",
// 	"password":"694111h123123"
// }
//
// password precisa ter no mínimo 6 caracteres, pelo menos 1 letra e 1 numero
//
// requisição retorna usuário criado
//
// casos de erro : password nao bate o regex, retorna 400 e uma mensagem
//
// usuário duplicado, retorna status 500 e uma msg

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

// rota de login, caminho "/login" recebe como body um json como o seguinte:
//
// {"email":"podres@123ss.com","password":"xeisssssas1"}
//
// caso tenha algum erro no login retorna um erro 400 e uma mensagem de password ou email errado
//
// caso o login de certo, retorna um usuário e a token jwt

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

// rota de get usuário, caminho "/user", recebe uma requisição get com bearer token o JWT do usuário logado e devolve o usuário, caso o usuário não esteja logado, ou a requisição nao mande um JWT como bearer token, a rota devolve erro 404 e uma mensagem

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

// requisição de toggle de método de pagamento, caminho "/togglePaymentMethod" recebe uma requisição com bearer token do usuário logado, caso o usuário não esteja logado, ou a requisição nao mande um JWT como bearer token, a rota devolve erro 404 e uma mensagem.
// A requisição deve ter um body em JSON como o seguinte:
// {
// 	"payment":"pix"
// }
//
// caso o "payment" da requisição seja "pix" a requisição faz toggle no método de pagamento pix, caso seja "cartao", faz toggle no metodo de pagamento cartão, caso seja "dinheiro" faz o toggle no método de pagamento dinheiro

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

// rota de nova categoria, caminho "/newCategory", recebe uma requisição com bearer token do usuário logado, e um body em json como o seguinte:
// {
// 	"title": "carnes",
// 	"description": "burgues de carne de todos os jeitos, feitos da forma que voce achar melhor"
// }
// retorna a categoria criada

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

// rota de get de caregoria, caminho "/getCategory", recebe uma requisição com bearer token do usuário logado e retorna todas as categorias do usuário logado

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

// rota de delete de categoria, caminho "/deleteCategory", recebe uma requisição com bearer token do usuário logado e um body em json como o seguinte:
// {
// 	"categoryId":"7123t12hgyd192t312"
// }
// retorna a caregoria deletada com o ID passado na requisição dentro do body

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

// rota de criação de novo produto, caminho "/newProduct", recebe um body como o seguinter:
// {
// 	"title": "GROSSAO e finim",
// 	"price": "12,10" ,
// 	"category": "62cf1e5c12305134efaab4a7" ,
// 	"description": "pizza com queijo e queijo e queijo e queijo",
// 	"image":"IMAGEM EM BASE64"
// }
// category é o id da categoria mae do produto a ser adicionado
// cria um novo produto filho da categoria passada na requisição

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

// rota de get de produtos por categoria, caminho "/getProducts/:category", a parte do caminho ":category" é variável, e leva o nome da categoria a qual voce quer pesquisar, a requisição recebe a token do usuário logado como bearer token.
// caso exista uma categoria com o nome passado na requisição atrelada ao usuário logado, a requisição retorna todos os produtos atrelado a essa categoria.

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

// rota de delete product, caminho "/deleteProduct", recebe a token do usuário logado como bearer token, rota recebe body em json como o seguinte:
// {
// 	"prodId": "62d059c186184a52f6169a78",
// 	"catId":"62cf1e5c12305134efaab4a7"
// }
// a rota deleta o produto com id prodId e com categoria de id catId.

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

// rota de edit product, caminho "/editProduct"  recebe a token do usuário logado como bearer token, e um body em json como o seguinte:
// {
// "prodId":"g76d12d77w8d9178te",
//  "catId":"g76d12d77w8d9178te",
//   "title":"novo nome",
//    "price":"novo preço",
//     "image":"nova imagem em base64",
// 	 "description":"nova descrição do produto"
// 	}
//
// pesquisa o produto pelo prodId da requisição, atualiza o protudo com as informações da requisicao, e retorna o produto editado com as novas informações de produto

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

// rota de toggle de produto, caminho "/toggleProduct", recebe o token do usuáro logado no bearer, e um body em json como o seguinte:
// {
// 	"prodId": "62d076ba4c40d273dca14585", "catId": "62c7413dd8323d84766373c2"
// }
// caso exista um produto com esse id e uma categoria com o id passado na requisição, a rota muda o active de true para false ou de false para true

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

// rota de criação de pedido, caminho "/newOrder", recebe um body em json como o seguinte:
// {"data":{
	// "title":"titulo do produto",
	// "info":"informação para a cozinha sobre o pedido", 
	// "quantity":5,
	// "tableId":"62eac0ae5ab1639a6ef43af9", 
	// "clientId":"62e7e26463c62b9524330eea", 
	// "productId":"62e836d3edb8cb79de964df8"
// }}
// 
// a requisição cria uma nova comanda com o pedidos descrito no body da requisição

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
        .create({
          data: {
            client: {
              connect: {
                id: clientId,
              },
            },
            orders: { create: [data] },
          },
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

// rota de get de pedidos, caminho "/getOrders", recebe a token do usuário logado como bearer token, e retorna todos os pedidos atrelados ao usuário logado.

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

// 
// 
// 

// routes.patch(
//   "/toggleOrder",

//   async (req: any, res) => {
//     try {
//       // retira o loggedinuser da requisição pelo middleware attachCurrentUser

//       const { id } = req.body;
//     } catch (error) {
//       console.error(error);
//       return res.status(500).json(error);
//     }
//   }
// );

// rotas de mesa

// route de post de nova mesa, caminho "/newTable", recebe o usuário logado pelo token no bearer, e cria uma nova mesa, retorna as informações da mesa criada.

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

// route de editar o numero da mesa, caminho "/changeTableNumber" recebe o token do usuario logado no bearer, e um body em json coomo o seguinte:
// { "id" : "id da mesa", "number" : 321 } 
// edita a mesa com o id passado no body da requisição e edita com o numero passado na requisição

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

// route de deletar mesa, caminho "/deleteTable", recebe o token do usuario logado no bearer, e um body em json como o seguinte:
// {"id":"id da table para ser deletada"}
// deleta a mesa com o id passado na requisição caso ela seja do usuário logado

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

// route de toggle de mesa no caminho  "/toggleTable", recebe o usuario pelo token,  e um body em json como o seguinte:
// {"id":"id da table para sofrer o toggle"}
// verifica se o usuario é dono da mesa, e caso seja, muda o active de true para false ou de false para true

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

// route de get tables, caminho "/getTables", rota recebe o token do usuario pelo bearer e retorna todas as mesas atreladas ao usuário

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


// route de login do cliente, caminho "/loginClient" recebe um body em json como o seguinte:
// { 
// 	"name":"nome de usuário", 
// "number": "número de celular do usuário" 
// }
// caso o numero nao esteja guardado no banco de dados, a rota salva os dados do usuário na base e retorna o usuário criado.
// caso o número já esteja guardado, a rota verifica se o nome de usuário bate com o nome de usuário guardado na base, caso o nome bata com o nome da base a rota retorna status 200 e uma mensagem de usuário logado, caso o nome não bata ela retorna um status 500 e uma mensagem de nome de usuário incorreto.

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

// get categorias pelo cliente, caminho "/categoriesClient", rota recebe um body em json como o seguinte:
// {
// "id": "id da mesa na qual o cliente fez login"
// }
// com o id da mesa da requisição a rota retorna todas das categorias do usuário dono da mesa.

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

// rota de get produtos dependendo da categoria, caminho "/getProductsClient/:category", onde a parte ":category" é variável. a requisição recebe um body em json com o id da table que o usuário logou como essa:
//  {
// "id": "id da mesa na qual o cliente fez login"
// }
// a rota pesquisa pela categoria descrita no caminho da rota dentro do usuário dono da mesa, e caso ela ache a categoria, ela retorna todos os produtos dessa categoria.


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

// rota de get de check, caminho "/getCheck" recebe o id do check a ser pesquisado na DB no body da requisição em um json como o seguinte:
// {
// 	"id" : "id do check a ser encontrado"
// }
// pesquisa pelo check na DB e caso encontre retorna o check com todas as ordens atreladas a ele


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


// criação de nova ordem em um check já existente, caminho "/newOrderOnExistingCheck", recebe um body como o seguinte : 
// 
// {"data":
// 		{
// 			"title":"xelada",
// 			"info":"NOSSA", 
// 			"quantity":5,
// 			"tableId":"62e974bdc7b686586fbb7064", 
// 			"checkId":"62ea6f8f349c09ebd5e11f68"
// 		}
// }
// cria uma nova ordem com as informações passadas no body dentro do check passado no body

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

// rota de toggle de check, caminho "/toggleCheck", recebe um body em json como o seguinte:
// {
// 	"id":"id do check a sofrer o toggle"
// }
// muda a propriedade active do objeto check do checkId passado na requisição de false para true, e muda também a propriedade active de todas as ordens atreladas a essa comanda de false para true
 
routes.patch("/toggleCheck", async (req, res) => {
  try {
    const { id } = req.body;

    const check = await prisma.check.update({
      where: { id },
      data: { active: true },
    });

    const orders = await prisma.orders.updateMany({
      where: { checkId: id },
      data: { active: true },
    });

    console.log(check, orders);
    return res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
});

// rota para pegar todos os checks de um usuário, recebe o clientId no body da requisição em json como a seguinte:
// {
// 	"clientId" = "id do cliente"
// }
// pesquisa por todas as comandas atreladas ao cliente da requisição e retorna as comandas com todas as ordens atreladas a aquele usuário

routes.patch("/getChecksByClientId", async (req, res) => {
  try {
    const { clientId } = req.body;
    const checks = await prisma.check.findMany({
      where: { clientId },
      include: { orders: true },
    });
    console.log(checks);
    return res.status(200).json(checks);
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
});

// rota de get de produtos pelo Id, caminho "/getProductsById/:id" com a parte de ":id" variável, retorna o produto com o id passado no caminho.

routes.get("/getProductsById/:id", async (req, res) => {
  try {
    const id: any = req.params.id;
    const product = await prisma.product.findFirst({ where: { id } });
    console.log(product);
    return res.status(200).json(product);
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
});

// rota para pegar todas as informações necessárias para a página de comandaApp do aplicativo, com o clientId, retorna todos os pedidos, a quantidade de cada produto, a imagem dos produtos, e o preço de cada um, caminho "/comanda/:clientId" onde ":clientId" deve ser trocado pelo ID do cliente que busca a comanda.

routes.get("/comanda/:clientId", async (req, res) => {
  try {
    const id: any = req.params.clientId;
    const checks = await prisma.check.findMany({
      where: { clientId: id },
      include: { orders: true },
    });
    var orders = [];
    var productsIds = [];
    var products = [];
    for (let i = 0; i < checks.length; i++) {
      checks[i].active ? orders.push(checks[i].orders) : null;
    }
    for (let i = 0; i < orders.length; i++) {
      productsIds.push(orders[i][0].productId);
    }
    for (let i = 0; i < productsIds.length; i++) {
      products.push(
        await prisma.product.findUnique({
          where: { id: productsIds[i] },
        })
      );
    }
    for (let i = 0; i < products.length; i++) {
      products[i].quantity = orders[i][0].quantity;
    }

    return res.status(200).json(products);
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
});

