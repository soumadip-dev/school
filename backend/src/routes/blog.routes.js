import express from 'express';
import {
  getAllPosts,
  createPost,
  toggleLike,
  addComment,
  getComments,
  deletePost,
  deleteComment,
} from '../controller/blog.controller.js';
import { userAuth } from '../middleware/user.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';

const router = express.Router();

// Public routes
router.get('/posts', getAllPosts);
router.get('/posts/:postId/comments', getComments);

// Protected routes (require authentication)
router.post('/posts', userAuth, createPost);
router.post('/posts/:postId/like', userAuth, toggleLike);
router.post('/posts/:postId/comments', userAuth, addComment);

router.delete('/posts/:postId', userAuth, requireAdmin, deletePost);
router.delete('/comments/:commentId', userAuth, requireAdmin, deleteComment);

export default router;
