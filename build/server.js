"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var express_1 = __importDefault(require("express"));
var cors_1 = __importDefault(require("cors"));
var routes_1 = require("./routes/routes");
var config_1 = require("./config/config");
var app = (0, express_1["default"])();
app.use(express_1["default"].json()); // get - buscar informaçoes , post - cadastrar informaçoes, put - atualizar informaçoes, delete - deletar informaçoes, patch - atualizar parcialmente
app.ise((0, cors_1["default"])({ origin: process.env.NEXT_APP_URL }));
app.use(routes_1.routes);
app.listen(config_1.config.server.port, function () {
    return console.log("Server is running on ".concat(config_1.config.server.port, "!"));
});
//# sourceMappingURL=server.js.map