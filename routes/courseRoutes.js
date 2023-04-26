import express from "express";
import {
  createCourse,
  deleteCourse,
  deleteLecture,
  getAllCourses,
} from "../controllers/courseController.js";
import {
  addLectureToCourse,
  getAllLectures,
} from "../controllers/courseController.js";
import singleUpload from "../middlewares/multer.js";
import { isAdmin, isAuthenticated, isSubscribed } from "../middlewares/auth.js";
const router = express.Router();

router.route("/courses").get(isAuthenticated, getAllCourses);
router
  .route("/createCourse")
  .post(isAuthenticated, isAdmin, singleUpload, createCourse);
router
  .route("/course/:id")
  .get(isAuthenticated, isSubscribed, getAllLectures)
  .post(isAuthenticated, isAdmin, singleUpload, addLectureToCourse)
  .delete(isAuthenticated, isAdmin, deleteCourse);
router
  .route("/lecture")
  .delete(isAuthenticated, isAdmin, singleUpload, deleteLecture);

export default router;
