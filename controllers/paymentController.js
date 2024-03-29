import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { User } from "../models/User.js";
import ErrorHandler from "../utils/errorHandler.js";
import { instance } from "../server.js";
import crypto from "crypto";
import { Payment } from "../models/Payment.js";

export const buySubscription = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (user.role == "admin")
    return next(new ErrorHandler("No need for admin to buy subscription", 403));

  const plan_id = process.env.PLAN_ID;

  const subscription = await instance.subscriptions.create({
    plan_id,
    customer_notify: 1,
    total_count: 12,
  });

  user.subscription.id = subscription.id;
  user.subscription.status = subscription.status;

  await user.save();

  res.status(201).json({
    success: true,
    subscription: subscription.id,
  });
});

export const paymentVerfication = catchAsyncError(async (req, res, next) => {
  const { razorpay_signature, razorpay_payment_id, razorpay_subscription_id } =
    req.body;

  const user = await User.findById(req.user._id);

  const subscription_id = user.subscription.id;
  const generated_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
    .update(razorpay_payment_id + "|" + subscription_id, "utf-8")
    .digest("hex");

  const isAuthentic = generated_signature === razorpay_signature;

  if (!isAuthentic)
    return res.redirect(`${process.env.FRONTEND_URL}/paymentfail`);

  user.subscription.status = "active";

  await Payment.create({
    razorpay_signature,
    razorpay_payment_id,
    razorpay_subscription_id,
  });

  await user.save();

  return res.redirect(
    `${process.env.FRONTEND_URL}/paymentsuccess?reference=${razorpay_payment_id}`
  );
});

export const getKey = catchAsyncError(async (req, res, next) => {
  res.status(200).json({
    success: true,
    key: process.env.RAZORPAY_API_KEY,
  });
});

export const cancelSubscription = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  const subscription_id = user.subscription.id;

  let refund = false;
  await instance.subscriptions.cancel(subscription_id);

  const payment = await Payment.findOne({
    razorpay_subscription_id: subscription_id,
  });

  const gap = Date.now() - payment.createdAt;

  if (gap < process.env.REFUND_DAYS * 1000 * 60 * 60 * 24) {
    await instance.payments.refund(payment.razorpay_payment_id);
    refund = true;
  }
  await Payment.findOneAndDelete({
    razorpay_subscription_id: subscription_id,
  });

  user.subscription_id = undefined;
  user.subscription.status = undefined;

  await user.save();
  console.log(user);

  res.status(200).json({
    success: true,
    message: refund
      ? "Your Subscription is cancelled . Your amount will be credited to your payment src within 7 days"
      : "Your Subscription is cancelled , No Refund will be provided as you crosses 7 days time limit",
  });
});
