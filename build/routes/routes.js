"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.routes = void 0;
var prisma_1 = require("../config/prisma");
var generateToken = require("../config/jwt.config");
var express_1 = __importDefault(require("express"));
var bcrypt = require("bcrypt");
var isAuthenticated = require("../middlewares/isAuthenticated");
var attachCurrentUser = require("../middlewares/attachCurrentUser");
var saltRounds = 10;
exports.routes = express_1["default"].Router();
exports.routes.post("/newUser", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userName, email, password, salt, hashedPassword, paymentMethod, NewUser, response, error_1, erroDuplicatedUser;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 4, , 5]);
                _a = req.body, userName = _a.userName, email = _a.email, password = _a.password;
                if (!password ||
                    !password.match(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/)) {
                    return [2 /*return*/, res.status(400).json({
                            msg: "Password is required and must have at least 6 characters, at least one letter and one number, and no simbols"
                        })];
                }
                return [4 /*yield*/, bcrypt.genSalt(saltRounds)];
            case 1:
                salt = _b.sent();
                return [4 /*yield*/, bcrypt.hash(password, salt)];
            case 2:
                hashedPassword = _b.sent();
                paymentMethod = {
                    pix: true,
                    cartao: true,
                    dinheiro: true
                };
                return [4 /*yield*/, prisma_1.prisma.user.create({
                        data: {
                            userName: userName,
                            email: email,
                            passwordHash: hashedPassword,
                            paymentMethod: paymentMethod
                        }
                    })];
            case 3:
                NewUser = _b.sent();
                response = NewUser;
                response.passwordHash = "";
                console.log(response);
                return [2 /*return*/, res.status(201).json(response)];
            case 4:
                error_1 = _b.sent();
                erroDuplicatedUser = JSON.stringify(error_1);
                erroDuplicatedUser = JSON.parse(erroDuplicatedUser).code;
                if (erroDuplicatedUser == "P2002") {
                    return [2 /*return*/, res
                            .status(500)
                            .json({ erro: "Usuário ou número de telefone duplicado" })];
                }
                else {
                    return [2 /*return*/, res.status(500).json(error_1)];
                }
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
exports.routes.post("/login", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, email, password, user, token, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                _a = req.body, email = _a.email, password = _a.password;
                return [4 /*yield*/, prisma_1.prisma.user.findUnique({ where: { email: email } })];
            case 1:
                user = _b.sent();
                if (!user) {
                    return [2 /*return*/, res.status(400).json({ msg: "wrong password or e-mail" })];
                }
                return [4 /*yield*/, bcrypt.compare(password, user.passwordHash)];
            case 2:
                if (_b.sent()) {
                    delete user.passwordHash;
                    token = generateToken(user);
                    console.log({ user: user, token: token });
                    return [2 /*return*/, res.status(200).json({ user: user, token: token })];
                }
                else {
                    return [2 /*return*/, res.status(400).json({ msg: "Wrong password or e-mail" })];
                }
                return [3 /*break*/, 4];
            case 3:
                error_2 = _b.sent();
                console.error(error_2);
                return [2 /*return*/, res.status(500).json(error_2)];
            case 4: return [2 /*return*/];
        }
    });
}); });
exports.routes.get("/user", isAuthenticated, attachCurrentUser, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var loggedInUser, user, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                loggedInUser = req.auth;
                if (!loggedInUser) {
                    return [2 /*return*/, res.status(404).json({ msg: "usuário não encontrado" })];
                }
                console.log(loggedInUser);
                return [4 /*yield*/, prisma_1.prisma.user.findUnique({
                        where: { id: loggedInUser.id }
                    })];
            case 1:
                user = _a.sent();
                user.passwordHash = "";
                console.log(user);
                return [2 /*return*/, res.status(200).json(user)];
            case 2:
                error_3 = _a.sent();
                console.error(error_3);
                return [2 /*return*/, res.status(500).json(error_3)];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.routes.post("/newCategory", isAuthenticated, attachCurrentUser, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var loggedInUser, userId, _a, title, description, post, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                loggedInUser = req.auth;
                userId = loggedInUser.id;
                if (!loggedInUser) {
                    return [2 /*return*/, res.status(404).json({ msg: "usuário não encontrado" })];
                }
                _a = req.body, title = _a.title, description = _a.description;
                return [4 /*yield*/, prisma_1.prisma.category.create({
                        data: {
                            title: title,
                            description: description,
                            user: {
                                connect: {
                                    id: userId
                                }
                            }
                        }
                    })];
            case 1:
                post = _b.sent();
                console.log(post);
                return [2 /*return*/, res.status(201).json(post)];
            case 2:
                error_4 = _b.sent();
                console.error(error_4);
                return [2 /*return*/, res.status(500).json(error_4)];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.routes.post("/newProduct", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, title, price, description, image, category, data, newProduct, error_5;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, title = _a.title, price = _a.price, description = _a.description, image = _a.image, category = _a.category;
                data = {
                    title: title,
                    price: price,
                    description: description,
                    image: image,
                    category: {
                        connect: {
                            id: category
                        }
                    }
                };
                return [4 /*yield*/, prisma_1.prisma.product.create({
                        data: data
                    })];
            case 1:
                newProduct = _b.sent();
                console.log(newProduct);
                return [2 /*return*/, res.status(201).json(newProduct)];
            case 2:
                error_5 = _b.sent();
                console.error(error_5);
                return [2 /*return*/, res.status(500).json(error_5)];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.routes.patch("/togglePaymentMethod", isAuthenticated, attachCurrentUser, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, payment, user, edittedUser, edittedUser, edittedUser, edittedUser, edittedUser, edittedUser, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 14, , 15]);
                id = req.auth.id;
                payment = req.body.payment;
                return [4 /*yield*/, prisma_1.prisma.user.findUnique({
                        where: { id: id }
                    })];
            case 1:
                user = _a.sent();
                if (!(payment === "pix")) return [3 /*break*/, 5];
                console.log("entrei no if do pix");
                if (!user.paymentMethod.pix) return [3 /*break*/, 3];
                return [4 /*yield*/, prisma_1.prisma.user.update({
                        where: { id: id },
                        data: {
                            paymentMethod: __assign(__assign({}, user.paymentMethod), { pix: false })
                        }
                    })];
            case 2:
                edittedUser = _a.sent();
                console.log(edittedUser);
                return [2 /*return*/, res.status(200).json(edittedUser)];
            case 3: return [4 /*yield*/, prisma_1.prisma.user.update({
                    where: { id: id },
                    data: {
                        paymentMethod: __assign(__assign({}, user.paymentMethod), { pix: true })
                    }
                })];
            case 4:
                edittedUser = _a.sent();
                console.log(edittedUser);
                return [2 /*return*/, res.status(200).json(edittedUser)];
            case 5:
                if (!(payment === "cartao")) return [3 /*break*/, 9];
                if (!user.paymentMethod.cartao) return [3 /*break*/, 7];
                return [4 /*yield*/, prisma_1.prisma.user.update({
                        where: { id: id },
                        data: {
                            paymentMethod: __assign(__assign({}, user.paymentMethod), { cartao: false })
                        }
                    })];
            case 6:
                edittedUser = _a.sent();
                console.log(edittedUser);
                return [2 /*return*/, res.status(200).json(edittedUser)];
            case 7: return [4 /*yield*/, prisma_1.prisma.user.update({
                    where: { id: id },
                    data: {
                        paymentMethod: __assign(__assign({}, user.paymentMethod), { cartao: true })
                    }
                })];
            case 8:
                edittedUser = _a.sent();
                console.log(edittedUser);
                return [2 /*return*/, res.status(200).json(edittedUser)];
            case 9:
                if (!(payment === "dinheiro")) return [3 /*break*/, 13];
                if (!user.paymentMethod.dinheiro) return [3 /*break*/, 11];
                return [4 /*yield*/, prisma_1.prisma.user.update({
                        where: { id: id },
                        data: {
                            paymentMethod: __assign(__assign({}, user.paymentMethod), { dinheiro: false })
                        }
                    })];
            case 10:
                edittedUser = _a.sent();
                console.log(edittedUser);
                return [2 /*return*/, res.status(200).json(edittedUser)];
            case 11: return [4 /*yield*/, prisma_1.prisma.user.update({
                    where: { id: id },
                    data: {
                        paymentMethod: __assign(__assign({}, user.paymentMethod), { dinheiro: true })
                    }
                })];
            case 12:
                edittedUser = _a.sent();
                console.log(edittedUser);
                return [2 /*return*/, res.status(200).json(edittedUser)];
            case 13: return [3 /*break*/, 15];
            case 14:
                error_6 = _a.sent();
                return [2 /*return*/, res.status(500).json(error_6)];
            case 15: return [2 /*return*/];
        }
    });
}); });
exports.routes.get("/getCategory", isAuthenticated, attachCurrentUser, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var loggedInUser, userId, userCategories, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                loggedInUser = req.auth;
                userId = loggedInUser.id;
                if (!loggedInUser) {
                    return [2 /*return*/, res.status(404).json({ msg: "usuário não encontrado" })];
                }
                return [4 /*yield*/, prisma_1.prisma.category.findMany({
                        where: { userId: userId }
                    })];
            case 1:
                userCategories = _a.sent();
                console.log(userCategories);
                return [2 /*return*/, res.status(200).json(userCategories)];
            case 2:
                error_7 = _a.sent();
                console.error(error_7);
                return [2 /*return*/, res.status(500).json(error_7)];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.routes.get("/getProducts/:category", isAuthenticated, attachCurrentUser, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var category, loggedInUser, userId, categoryForId, categoryId, categoryProducts, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                category = req.params.category;
                loggedInUser = req.auth;
                userId = loggedInUser.id;
                // testa se o loggedInUser foi encontrado
                if (!loggedInUser) {
                    return [2 /*return*/, res.status(404).json({ msg: "usuário não encontrado" })];
                }
                return [4 /*yield*/, prisma_1.prisma.category.findFirst({
                        where: { userId: userId, title: category }
                    })];
            case 1:
                categoryForId = _a.sent();
                categoryId = categoryForId === null || categoryForId === void 0 ? void 0 : categoryForId.id;
                return [4 /*yield*/, prisma_1.prisma.product.findMany({
                        where: { categoryId: categoryId }
                    })];
            case 2:
                categoryProducts = _a.sent();
                console.log(categoryProducts);
                return [2 /*return*/, res.status(200).json(categoryProducts)];
            case 3:
                error_8 = _a.sent();
                console.error(error_8);
                return [2 /*return*/, res.status(500).json(error_8)];
            case 4: return [2 /*return*/];
        }
    });
}); });
exports.routes["delete"]("/deleteProduct", isAuthenticated, attachCurrentUser, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var loggedInUser, userId, _a, prodId, catId, categoryForId, deletedProduct, error_9;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 4, , 5]);
                loggedInUser = req.auth;
                userId = loggedInUser.id;
                // testa se o loggedInUser foi encontrado
                if (!loggedInUser) {
                    return [2 /*return*/, res.status(404).json({ msg: "usuário não encontrado" })];
                }
                _a = req.body, prodId = _a.prodId, catId = _a.catId;
                return [4 /*yield*/, prisma_1.prisma.category.findFirst({
                        where: { id: catId }
                    })];
            case 1:
                categoryForId = _b.sent();
                if (!(categoryForId.userId === userId)) return [3 /*break*/, 3];
                return [4 /*yield*/, prisma_1.prisma.product["delete"]({
                        where: { id: prodId }
                    })];
            case 2:
                deletedProduct = _b.sent();
                console.log(deletedProduct);
                return [2 /*return*/, res.status(200).json(deletedProduct)];
            case 3: return [3 /*break*/, 5];
            case 4:
                error_9 = _b.sent();
                console.error(error_9);
                return [2 /*return*/, res.status(500).json(error_9)];
            case 5: return [2 /*return*/];
        }
    });
}); });
exports.routes.patch("/editProduct", isAuthenticated, attachCurrentUser, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var loggedInUser, userId, _a, prodId, catId, title, price, image, description, categoryForId, editedProduct, error_10;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 4, , 5]);
                loggedInUser = req.auth;
                userId = loggedInUser.id;
                // testa se o loggedInUser foi encontrado
                if (!loggedInUser) {
                    return [2 /*return*/, res.status(404).json({ msg: "usuário não encontrado" })];
                }
                _a = req.body, prodId = _a.prodId, catId = _a.catId, title = _a.title, price = _a.price, image = _a.image, description = _a.description;
                // busca no banco de dados a categoria passada pela requisição
                console.log(req.body);
                return [4 /*yield*/, prisma_1.prisma.category.findFirst({
                        where: { id: catId }
                    })];
            case 1:
                categoryForId = _b.sent();
                // caso o ID do usuário da categoria passada seja igual ao id do login, edita o produto
                console.log("cheguei aqui");
                if (!(categoryForId.userId === userId)) return [3 /*break*/, 3];
                return [4 /*yield*/, prisma_1.prisma.product.update({
                        where: {
                            id: prodId
                        },
                        data: {
                            title: title,
                            price: price,
                            image: image,
                            description: description
                        }
                    })];
            case 2:
                editedProduct = _b.sent();
                console.log(editedProduct);
                return [2 /*return*/, res.status(200).json(editedProduct)];
            case 3: return [3 /*break*/, 5];
            case 4:
                error_10 = _b.sent();
                console.error(error_10);
                return [2 /*return*/, res.status(500).json(error_10)];
            case 5: return [2 /*return*/];
        }
    });
}); });
exports.routes.patch("/toggleProduct", isAuthenticated, attachCurrentUser, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var loggedInUser, userId, _a, prodId, catId, categoryForId, toggleProductInfo, toggleProduct, toggleProduct, error_11;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 7, , 8]);
                loggedInUser = req.auth;
                userId = loggedInUser.id;
                // testa se o loggedInUser foi encontrado
                if (!loggedInUser) {
                    return [2 /*return*/, res.status(404).json({ msg: "usuário não encontrado" })];
                }
                _a = req.body.data, prodId = _a.prodId, catId = _a.catId;
                return [4 /*yield*/, prisma_1.prisma.category.findFirst({
                        where: { id: catId }
                    })];
            case 1:
                categoryForId = _b.sent();
                if (!(categoryForId.userId === userId)) return [3 /*break*/, 6];
                console.log("entrei no primeiro if");
                return [4 /*yield*/, prisma_1.prisma.product.findUnique({
                        where: { id: prodId }
                    })];
            case 2:
                toggleProductInfo = _b.sent();
                if (!(toggleProductInfo === null || toggleProductInfo === void 0 ? void 0 : toggleProductInfo.active)) return [3 /*break*/, 4];
                return [4 /*yield*/, prisma_1.prisma.product.update({
                        where: { id: prodId },
                        data: { active: false }
                    })];
            case 3:
                toggleProduct = _b.sent();
                console.log(toggleProduct);
                return [2 /*return*/, res.status(200).json(toggleProduct)];
            case 4: return [4 /*yield*/, prisma_1.prisma.product.update({
                    where: { id: prodId },
                    data: { active: true }
                })];
            case 5:
                toggleProduct = _b.sent();
                console.log(toggleProduct);
                return [2 /*return*/, res.status(200).json(toggleProduct)];
            case 6: return [3 /*break*/, 8];
            case 7:
                error_11 = _b.sent();
                console.error(error_11);
                return [2 /*return*/, res.status(500).json(error_11)];
            case 8: return [2 /*return*/];
        }
    });
}); });
exports.routes.post("/newOrder", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, title, info, quantity, date, data, createdOrder, error_12;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body.data, title = _a.title, info = _a.info, quantity = _a.quantity, date = _a.date;
                data = {
                    title: title,
                    info: info,
                    quantity: quantity,
                    date: date
                };
                return [4 /*yield*/, prisma_1.prisma.orders.create({ data: data })];
            case 1:
                createdOrder = _b.sent();
                console.log(createdOrder);
                return [2 /*return*/, res.status(200).json(createdOrder)];
            case 2:
                error_12 = _b.sent();
                console.error(error_12);
                return [2 /*return*/, res.status(500).json(error_12)];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.routes.get("/getOrders", 
// isAuthenticated,
// attachCurrentUser,
function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var orders, error_13;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, prisma_1.prisma.orders.findMany({
                        where: {}
                    })];
            case 1:
                orders = _a.sent();
                console.log(orders);
                return [2 /*return*/, res.status(200).json(orders)];
            case 2:
                error_13 = _a.sent();
                console.error(error_13);
                return [2 /*return*/, res.status(500).json(error_13)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// routes.post(
//   "/newTable",
//   isAuthenticated,
//   attachCurrentUser,
//   async (req:any, res) => {
//     try {
//       // retira o loggedinuser da requisição pelo middleware attachCurrentUser
//       const loggedInUser = req.auth;
//       // retira o userId do loggedInUser
//       const userId = loggedInUser.id;
//       // testa se o loggedInUser foi encontrado
//       if (!loggedInUser) {
//         return res.status(404).json({ msg: "usuário não encontrado" });
//       }
// 	  const tables = await prisma.table.findMany({
// 		where:{userId}
// 	  })
//     } catch (error) {
//       console.error(error);
//       return res.status(500).json(error);
//     }
//   }
// );
//# sourceMappingURL=routes.js.map