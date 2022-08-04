var jwt = require("jsonwebtoken");
function generateToken(user) {
    var id = user.id, userName = user.userName, email = user.email;
    var signature = process.env.TOKEN_SIGN_SECRET;
    var expiration = "48h";
    return jwt.sign({ id: id, userName: userName, email: email }, signature, {
        expiresIn: expiration
    });
}
module.exports = generateToken;
//# sourceMappingURL=jwt.config.js.map