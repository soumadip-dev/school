import express from 'express';
import {
  getSliderImages,
  addSliderImage,
  addMultipleSliderImages,
  updateSliderImage,
  deleteSliderImage,
  getAllSliderImages,
  reorderSliderImages,
} from '../controller/slider.controller.js';
import { userAuth } from '../middleware/user.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';
import { upload } from '../middleware/multer.middleware.js';

const router = express.Router();

// Public route - get active slider images
router.get('/', getSliderImages);

// Admin routes
router.get('/admin/all', userAuth, requireAdmin, getAllSliderImages);
router.post('/', userAuth, requireAdmin, upload.single('image'), addSliderImage);
router.post(
  '/multiple',
  userAuth,
  requireAdmin,
  upload.array('images', 10),
  addMultipleSliderImages
);
router.put('/:sliderId', userAuth, requireAdmin, upload.single('image'), updateSliderImage);
router.delete('/:sliderId', userAuth, requireAdmin, deleteSliderImage);
router.put('/reorder/all', userAuth, requireAdmin, reorderSliderImages);

export default router;
