"use strict";
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
    var _a, userName, email, password, salt, hashedPassword, NewUser, response, error_1, erroDuplicatedUser;
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
                return [4 /*yield*/, prisma_1.prisma.user.create({
                        data: {
                            userName: userName,
                            email: email,
                            passwordHash: hashedPassword
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
    var loggedInUser;
    return __generator(this, function (_a) {
        try {
            loggedInUser = req.auth;
            if (!loggedInUser) {
                return [2 /*return*/, res.status(404).json({ msg: "usuário não encontrado" })];
            }
            console.log(req.auth);
            return [2 /*return*/, res.status(200).json(req.auth)];
        }
        catch (error) {
            console.error(error);
            return [2 /*return*/, res.status(500).json(error)];
        }
        return [2 /*return*/];
    });
}); });
exports.routes.post("/newCategory", isAuthenticated, attachCurrentUser, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var loggedInUser, userId, _a, title, description, post, error_3;
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
                error_3 = _b.sent();
                console.error(error_3);
                return [2 /*return*/, res.status(500).json(error_3)];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.routes.post("/newProduct", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, title, price, description, image, category, data, newProduct, error_4;
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
                error_4 = _b.sent();
                console.error(error_4);
                return [2 /*return*/, res.status(500).json(error_4)];
            case 3: return [2 /*return*/];
        }
    });
}); });
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
exports.routes.get("/getCaterogy/", isAuthenticated, attachCurrentUser, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var loggedInUser, userId, userCategories, error_5;
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
                error_5 = _a.sent();
                console.error(error_5);
                return [2 /*return*/, res.status(500).json(error_5)];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.routes.get("/getProducts/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var categoryId, categoryProducts, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                categoryId = req.params.id;
                return [4 /*yield*/, prisma_1.prisma.product.findMany({
                        where: { categoryId: categoryId }
                    })];
            case 1:
                categoryProducts = _a.sent();
                console.log(categoryProducts);
                return [2 /*return*/, res.status(200).json(categoryProducts)];
            case 2:
                error_6 = _a.sent();
                console.error(error_6);
                return [2 /*return*/, res.status(500).json(error_6)];
            case 3: return [2 /*return*/];
        }
    });
}); });
//# sourceMappingURL=routes.js.map