import {
  buySubscription,
  cancelSubscription,
  getKey,
  paymentVerfication,
} from "../controllers/paymentController.js";
import express from "express";
import { emailVerfication, isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.route("/subscribe").get(isAuthenticated, buySubscription);
router.route("/paymentVerfication").post(isAuthenticated, paymentVerfication);
router.route("/getKey").get(isAuthenticated, getKey);
router.route("/subscribe/cancel").delete(isAuthenticated, cancelSubscription);

export default router;
