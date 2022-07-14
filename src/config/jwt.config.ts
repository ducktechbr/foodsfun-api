const jwt = require("jsonwebtoken");
function generateToken(user: any) {
  const { id, userName, email } = user;
  const signature = process.env.TOKEN_SIGN_SECRET;
  const expiration = "48h";
  return jwt.sign({ id, userName, email }, signature, {
    expiresIn: expiration,
  });
}
module.exports = generateToken;
