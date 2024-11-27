import express from "express";
import {
  signup,
  login,
  logout,
  checkMe as check,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/check", protectRoute, check);
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

export default router;
