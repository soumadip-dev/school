import express from 'express';
import {
  getAllPhotos,
  uploadPhotos,
  toggleLike,
  addComment,
  getComments,
  deletePhoto,
  deleteComment,
} from '../controller/Album.controller.js';
import { userAuth } from '../middleware/user.middleware.js';
import { upload } from '../middleware/multer.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';

const router = express.Router();

//* Get all photos with pagination and filtering
router.get('/photos', getAllPhotos);

//* Upload new photos (multiple files)
router.post('/photos', userAuth, upload.array('images', 5), uploadPhotos);

//* Like/Unlike a photo
router.post('/photos/:photoId/like', userAuth, toggleLike);

//* Add comment to photo
router.post('/photos/:photoId/comments', userAuth, addComment);

//* Get comments for a photo
router.get('/photos/:photoId/comments', getComments);

//* Delete a photo (Admin only)
router.delete('/photos/:photoId', userAuth, requireAdmin, deletePhoto);

//* Delete a comment (Admin only)
router.delete('/comments/:commentId', userAuth, requireAdmin, deleteComment);

export default router;
