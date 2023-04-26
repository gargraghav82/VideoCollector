import app from "./app.js";
import { connectdb } from "./config/database.js";
import cloudinary from "cloudinary";
import RazorPay from "razorpay";
import nodeCron from "node-cron";
import { Stats } from "./models/Stats.js";

connectdb();

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_API_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const instance = new RazorPay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_API_SECRET,
});

nodeCron.schedule("0 0 0 1 * *", async () => {
  try {
    await Stats.create({});
  } catch (err) {
    console.log(err);
  }
});

// const temp = async () => {
//   await Stats.create({});
// };

// temp();

app.listen(process.env.PORT, () => {
  console.log(`listening on PORT ${process.env.PORT}`);
});
