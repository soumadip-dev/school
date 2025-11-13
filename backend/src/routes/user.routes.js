import { Router } from 'express';
import {
  registerUser,
  loginUser,
  isAuthenticated,
  getUserProfile,
  updateUserProfile,
  logoutUser,
  getAlumniData,
  getFilterOptions,
  sendPasswordResetEmail,
  resetPassword,
} from '../controller/user.controller.js';
import { upload } from '../middleware/multer.middleware.js';
import { userAuth } from '../middleware/user.middleware.js';

//* Create a new Express router
const router = Router();

//* Define routes
router.post('/register', upload.single('image'), registerUser);
router.post('/login', loginUser);
router.get('/is-auth', userAuth, isAuthenticated);
router.post('/logout', userAuth, logoutUser);
router.get('/profile', userAuth, getUserProfile);
router.put('/profile', userAuth, upload.single('image'), updateUserProfile);
router.get('/alumni-data', getAlumniData);
router.get('/filter-options', getFilterOptions);
router.post('/forgot-password', sendPasswordResetEmail);
router.post('/reset-password', resetPassword);

//* Export the router
export default router;
