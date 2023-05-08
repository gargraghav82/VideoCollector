import mongoose, { Schema } from "mongoose";
import validator from "validator";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";

const schema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please Enter Your Name"],
  },

  email: {
    type: String,
    required: [true, "Please Enter Your Email"],
    unique: true,
    validate: validator.isEmail,
  },
  password: {
    type: String,
    required: [true, "Please Enter Your Password"],
    minLength: [6, "Password Must Be Of At Least 6 Char"],
    maxLength: [16, "Password Can Be Of Max 20 Char"],
    select: false,
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  subscription: {
    id: String,
    status: String,
  },
  avatar: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  playlist: [
    {
      course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
      poster: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetPasswordToken: String,
  resetPasswordExpire: String,
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerifyToken: String,
  emailVerifyExpire: String,
});

schema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

schema.methods.getJWTToken = function () {
  return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "15d",
  });
};

schema.methods.comparePassword = async function (password) {
  const isMatch = await bcrypt.compare(password, this.password);
  return isMatch;
};

schema.methods.getResetToken = async function () {
  const resetToken = crypto.randomBytes(20).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  return resetToken;
};

schema.methods.getEmailToken = async function () {
  const EmailToken = crypto.randomBytes(20).toString("hex");

  this.emailVerifyToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.emailVerifyExpire = Date.now() + 15 * 60 * 1000;
  return EmailToken;
};

export const User = mongoose.model("User", schema);
