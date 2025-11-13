import express from 'express';
import {
  getAllLectures,
  createLecture,
  updateLecture,
  deleteLecture,
  markAsCompleted,
} from '../controller/lecture.controller.js';
import { userAuth } from '../middleware/user.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';
import { upload } from '../middleware/multer.middleware.js';

const router = express.Router();

// Public routes
router.get('/lectures', getAllLectures);

// Admin only routes
router.post('/lectures', userAuth, requireAdmin, upload.single('image'), createLecture);
router.put('/lectures/:lectureId', userAuth, requireAdmin, upload.single('image'), updateLecture);
router.delete('/lectures/:lectureId', userAuth, requireAdmin, deleteLecture);
router.patch('/lectures/:lectureId/complete', userAuth, requireAdmin, markAsCompleted);

export default router;
