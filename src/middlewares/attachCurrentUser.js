const { prisma } = require("../config/prisma");

module.exports = async (req, res, next) => {
  try {
    const loggedInUser = req.auth;

    const user = await prisma.user.findUnique({
      where: { id: loggedInUser.id },
    });
    if (!user) {
      return res.status(400).json({ msg: "User does not exist" });
    }
  
    next();
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: JSON.stringify(error) });
  }
};
