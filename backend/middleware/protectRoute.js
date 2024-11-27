import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const protectRoute = async (req, res, next) => {
  try {
    // ambil token dari cookies
    const token = req.cookies.jwt;
    if (!token) {
      return res.status(401).json({ error: "Unauthorize: No token provided" });
    }

    // verifikasi token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ error: "Unauthorize: Invalid token" });
    }

    // cari data user sesuai dengan token kecuali password
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({ error: "Unauthorize: User not found" });
    }

    // simpan data user untuk ditampilkan di client
    req.user = user;
    next();
  } catch (error) {
    console.error("Error in protectRoute middleware", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
