import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { Course } from "../models/Course.js";
import ErrorHandler from "../utils/errorHandler.js";
import getDataUri from "../utils/dataUri.js";
import cloudinary from "cloudinary";
import { User } from "../models/User.js";
import { Stats } from "../models/Stats.js";

export const getAllCourses = catchAsyncError(async (req, res, next) => {
  const keyword = req.query.keyword || "";
  const category = req.query.category || "";

  const courses = await Course.find({
    title: {
      $regex: keyword,
      $options: "i",
    },
    category: {
      $regex: category,
      $options: "i",
    },
  })
    .select("-Lectures")
    .populate("createdBy");
  res.status(200).json({
    success: true,
    courses,
  });
});

export const createCourse = catchAsyncError(async (req, res, next) => {
  const { title, description, category, createdBy } = req.body;
  const file = req.file;

  if (!title || !description || !category || !file) {
    return next(new ErrorHandler("Please add all fields", 400));
  }

  const fileUri = getDataUri(file);
  const myCloud = await cloudinary.v2.uploader.upload(fileUri.content);

  await Course.create({
    title,
    description,
    category,
    createdBy: req.user._id,
    poster: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    },
  });

  res.status(201).json({
    success: true,
    message: "Course created successfully",
  });
});

export const addLectureToCourse = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { title, description } = req.body;
  const file = req.file;

  if (!title || !description || !file)
    return next(new ErrorHandler("Please Fill Out All Fields", 400));

  const course = await Course.findById(id);

  if (!course) return next(new ErrorHandler("Course Not Found", 400));

  const isExist = course.Lectures.find((item) => {
    if (
      item.title.toString().toUpperCase() === title.toString().toUpperCase()
    ) {
      return true;
    }
  });

  if (isExist)
    return next(new ErrorHandler("Video already exist with same title", 400));

  const uri = getDataUri(file);

  const myCloud = await cloudinary.v2.uploader.upload(uri.content, {
    resource_type: "video",
  });

  course.Lectures.push({
    title,
    description,
    video: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    },
  });

  course.numOfVideos = course.Lectures.length;

  console.log(course.numOfVideos);

  await course.save();

  res.status(200).json({
    success: true,
    message: "Lecture Uploaded Successfully",
  });
});

export const getAllLectures = catchAsyncError(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) return next(new ErrorHandler("Course Not Found", 404));

  course.views += 1;
  await course.save();
  const lectures = course.Lectures;

  res.status(200).json({
    success: true,
    lectures,
  });
});

export const deleteCourse = catchAsyncError(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) return next(new ErrorHandler("Course Not Found", 404));

  await cloudinary.v2.uploader.destroy(course.poster.public_id);

  for (let index = 0; index < course.Lectures.length; index++) {
    const sL = course.Lectures[index];
    await cloudinary.v2.uploader.destroy(sL.video.public_id, {
      resource_type: "video",
    });
  }

  await Course.deleteMany({ _id: course._id });

  res.status(200).json({
    success: true,
    message: "Course Deleted Successfully",
  });
});

export const deleteLecture = catchAsyncError(async (req, res, next) => {
  const { lectureId, courseId } = req.query;

  const course = await Course.findById(courseId);

  if (!course) return next(new ErrorHandler("Invalid Course id", 404));

  const item = course.Lectures.find((item) => {
    if (item._id.toString() === lectureId.toString()) {
      return item.video.public_id;
    }
  });

  await cloudinary.v2.uploader.destroy(item.video.public_id, {
    resource_type: "video",
  });

  course.Lectures = course.Lectures.filter((item) => {
    if (item._id.toString() !== lectureId.toString()) {
      return item;
    }
  });

  course.numOfVideos = course.Lectures.length;

  await course.save();

  res.status(200).json({
    success: true,
    message: "Lecture Deleted Successfully",
  });
});

Course.watch().on("change", async () => {
  const stats = await Stats.find({}).sort({ createdAt: "desc" }).limit(1);

  const course = await Course.find({});

  let viewCount = 0;
  for (let i = 0; i < course.length; i++) {
    viewCount += course[i].views;
  }

  console.log(viewCount);

  stats[0].views = parseInt(viewCount);
  stats[0].createdAt = new Date(Date.now());
  await stats[0].save();
});
