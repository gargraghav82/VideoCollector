import express from "express";
const router = express.Router();
import {
  addToPlaylist,
  changePassword,
  changeRole,
  deleteMyProfile,
  deleteUser,
  forgotPassword,
  getAllUsers,
  getMyProfile,
  login,
  logout,
  register,
  removeFromPlaylist,
  resetPassword,
  updateProfile,
  updateProfilePic,
} from "../controllers/userController.js";
import { isAdmin, isAuthenticated } from "../middlewares/auth.js";
import singleUpload from "../middlewares/multer.js";

router.route("/register").post(singleUpload, register);
router.route("/login").post(login);
router.route("/logout").post(isAuthenticated, logout);
router
  .route("/me")
  .get(isAuthenticated, getMyProfile)
  .delete(isAuthenticated, deleteMyProfile);
router.route("/changePassword").put(isAuthenticated, changePassword);
router.route("/updateProfile").put(isAuthenticated, updateProfile);
router
  .route("/updateProfilePic")
  .put(isAuthenticated, singleUpload, updateProfilePic);
router.route("/forgotPassword").post(isAuthenticated, forgotPassword);
router.route("/resetPassword/:token").put(isAuthenticated, resetPassword);
router.route("/addToPlaylist").post(isAuthenticated, addToPlaylist);
router.route("/removeFromPlaylist").delete(isAuthenticated, removeFromPlaylist);

router.route("/admin/users").get(isAuthenticated, isAdmin, getAllUsers);
router
  .route("/admin/changeRole/:id")
  .put(isAuthenticated, isAdmin, changeRole)
  .delete(isAuthenticated, isAdmin, deleteUser);

export default router;
