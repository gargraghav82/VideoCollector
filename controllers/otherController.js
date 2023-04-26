import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { Stats } from "../models/Stats.js";
import ErrorHandler from "../utils/errorHandler.js";
import { sendEmail } from "../utils/sendEmail.js";

export const contact = catchAsyncError(async (req, res, next) => {
  const { email, name, message } = req.body;

  console.log(email, name, message);

  if (!email || !name || !message) {
    return next(new ErrorHandler("Please Fill all fields", 400));
  }

  const to = process.env.MY_MAIL;
  const subject = "Contact From User";
  const text = `My name is ${name} , email is ${email} \n ${message}`;

  await sendEmail(to, subject, text);

  res.status(200).json({
    success: true,
    message: "Your message Sent successfully",
  });
});

export const requestCourse = catchAsyncError(async (req, res, next) => {
  const { email, name, course } = req.body;

  if (!email || !name || !course) {
    return next(new ErrorHandler("Please Fill all fields", 400));
  }

  const to = process.env.MY_MAIL;
  const subject = "Contact From User";
  const text = `My name is ${name} , email is ${email} \n I want to request for ${course} course`;

  await sendEmail(to, subject, text);

  res.status(200).json({
    success: true,
    message: "Your request Sent successfully",
  });
});

export const adminStats = catchAsyncError(async (req, res, next) => {
  const stats = await Stats.find({}).sort({ createdAt: "desc" }).limit(12);

  const statsData = [];
  const requiredData = 12 - stats.length;

  for (let i = 0; i < stats.length; i++) {
    statsData.unshift(stats[i]);
  }

  for (let i = 0; i < requiredData; i++) {
    statsData.unshift({
      users: 0,
      subscription: 0,
      views: 0,
    });
  }

  console.log(statsData);

  const usersCount = statsData[11].users;
  const subscriptionCount = statsData[11].subscription;
  const viewsCount = statsData[11].views;

  let usersPercentage = 0,
    subscriptionPercentage = 0,
    viewsPercentage = 0;
  let usersProfit = true,
    subscriptionProfit = true,
    viewsProfit = true;

  if (statsData[10].users == 0) usersPercentage = usersCount * 100;
  else {
    usersPercentage =
      ((usersCount - statsData[10].users) * 100) / statsData[10].users;
    if (usersPercentage < 0) usersProfit = false;
  }

  if (statsData[10].views == 0) viewsPercentage = viewsCount * 100;
  else {
    viewsPercentage =
      ((viewsCount - statsData[10].views) * 100) / statsData[10].views;
    if (viewsPercentage < 0) viewsProfit = false;
  }

  if (statsData[10].subscription == 0)
    subscriptionPercentage = subscriptionCount * 100;
  else {
    subscriptionPercentage =
      ((subscriptionCount - statsData[10].subscription) * 100) /
      statsData[10].subscription;
    if (subscriptionPercentage < 0) subscriptionProfit = false;
  }

  res.status(200).json({
    success: true,
    stats: statsData,
    usersCount,
    subscriptionCount,
    viewsCount,
    usersPercentage,
    subscriptionPercentage,
    viewsPercentage,
    viewsProfit,
    usersProfit,
    subscriptionProfit,
  });
});
