import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";
import { User } from "../models/User.js";
import { sendToken } from "../utils/sendToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";
import { Course } from "../models/Course.js";
import getDataUri from "../utils/dataUri.js";
import cloudinary from "cloudinary";
import { Stats } from "../models/Stats.js";

export const register = catchAsyncError(async (req, res, next) => {
  const { email, name, password } = req.body;
  const file = req.file;
  if (!email || !name || !password || !file) {
    return next(new ErrorHandler("Please Enter all fields", 400));
  }

  const uri = getDataUri(file);
  const myCloud = await cloudinary.v2.uploader.upload(uri.content);
  const result = await User.findOne({ email });
  if (result) {
    return next(new ErrorHandler("Email already in use", 400));
  }

  const user = await User.create({
    email,
    name,
    password,
    avatar: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    },
  });

  sendToken(res, user, "User created Succesfully", 201);
});

export const login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorHandler("Please Enter all fields", 401));
  }

  const result = await User.findOne({ email }).select("+password");
  if (!result) {
    return next(new ErrorHandler("User doesn't exist", 400));
  }

  const isMatch = await result.comparePassword(password);

  if (!isMatch) {
    return next(new ErrorHandler("Incorrect email or password", 401));
  }

  sendToken(res, result, `Welcome Back , ${result.name}`, 200);
});

export const logout = catchAsyncError(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
      sameSite: "none",
      httpOnly: true,
      secure: true,
    })
    .json({
      success: true,
      message: "Logged Out successfully",
    });
});

export const getMyProfile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    user,
  });
});

export const changePassword = catchAsyncError(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return next(new ErrorHandler("Please Enter all Fields", 401));
  }

  const user = await User.findById(req.user._id).select("+password");

  const isMatch = await user.comparePassword(oldPassword);

  if (!isMatch) {
    return next(new ErrorHandler("Please Enter Correct Old Password", 400));
  }

  user.password = newPassword;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password Updated Succesfully",
  });
});

export const updateProfile = catchAsyncError(async (req, res, next) => {
  const { email, name } = req.body;

  const user = await User.findById(req.user._id);

  if (email) user.email = email;
  if (name) user.name = name;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile updated Successfully",
  });
});

export const updateProfilePic = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  const file = req.file;
  const uri = getDataUri(file);
  await cloudinary.v2.uploader.destroy(user.avatar.public_id);

  const myCloud = await cloudinary.v2.uploader.upload(uri.content);

  user.avatar = {
    public_id: myCloud.public_id,
    url: myCloud.secure_url,
  };

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile Picture updated Successfully",
  });
});

export const forgotPassword = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) return next(new ErrorHandler("No user found"));
  const token = await user.getResetToken();
  await user.save();

  const url = `${process.env.FRONTEND_URL}/resetPassword/${token}`;

  const message = `Click on reset password link ${url} , If You haven't requested please ignore`;

  await sendEmail(user.email, "Reset Password Link", message);

  res.status(200).json({
    success: true,
    message: `Reset Token has been sent succesfully to ${user.email}`,
  });
});

export const resetPassword = catchAsyncError(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: {
      $gt: Date.now(),
    },
  });

  if (!user) return next(new ErrorHandler("Invalid Token or Expired", 400));
  if (!password) return next(new ErrorHandler("Please Enter all Fields", 400));

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password is updated succesfully",
  });
});

export const addToPlaylist = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  const course = await Course.findById(req.body.id);

  if (!course) return next(new ErrorHandler("Invalid Course id", 404));

  const isExist = user.playlist.find((item) => {
    if (item.course.toString() === course._id.toString()) {
      return true;
    }
  });

  if (isExist) return next(new ErrorHandler("Already in Playlist", 201));

  user.playlist.push({
    course: course._id,
    poster: course.poster.url,
  });

  await user.save();

  res.status(200).json({
    success: true,
    message: "Added To Playlist Succesfully",
  });
});

export const removeFromPlaylist = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  const course = await Course.findById(req.query.id);

  if (!course) return next(new ErrorHandler("Invalid Course id", 404));

  const playlist = user.playlist.find((item) => {
    if (item.course.toString() !== course._id.toString()) {
      return item;
    }
  });

  user.playlist = playlist;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Removed From Playlist Succesfully",
  });
});

export const getAllUsers = catchAsyncError(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    success: true,
    users,
  });
});

export const changeRole = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (user.role === "admin") user.role = "user";
  else user.role = "admin";

  await user.save();

  res.status(200).json({
    success: true,
    message: "Roles updated succesfully",
  });
});

export const deleteUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) return next(new ErrorHandler("User not found", 404));

  await cloudinary.v2.uploader.destroy(user.avatar.public_id);

  await user.remove();

  res.status(200).json({
    success: true,
    message: "User Deleted Succesfully",
  });
});

export const deleteMyProfile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) return next(new ErrorHandler("User not found", 404));

  await cloudinary.v2.uploader.destroy(user.avatar.public_id);

  await user.remove();

  res
    .status(200)
    .clearCookie("token", {
      expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      sameSite: true,
      httpOnly: true,
    })
    .json({
      success: true,
      message: "Profile Deleted Succesfully",
    });
});

User.watch().on("change", async () => {
  const stats = await Stats.find({}).sort({ createdAt: "desc" }).limit(1);
  const subscription = await User.find({
    "subscription.status": "active",
  });
  stats[0].users = await User.countDocuments();
  stats[0].subscription = subscription.length;
  stats[0].createdAt = new Date(Date.now());

  await stats[0].save();
});
