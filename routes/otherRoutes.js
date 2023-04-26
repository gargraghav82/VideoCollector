import express from "express";
import { isAdmin, isAuthenticated } from "../middlewares/auth.js";
import {
  adminStats,
  contact,
  requestCourse,
} from "../controllers/otherController.js";

const router = express.Router();

router.route("/contact").post(isAuthenticated, contact);
router.route("/requestCourse").post(isAuthenticated, requestCourse);
router.route("/admin/stats").get(isAuthenticated, isAdmin, adminStats);

export default router;
