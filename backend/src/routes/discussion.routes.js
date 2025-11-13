import express from 'express';
import {
  getDiscussionPosts,
  createDiscussionPost,
  addReplyToPost,
  addReactionToPost,
  removeReactionFromPost,
} from '../controller/discussion.controller.js';
import { userAuth } from '../middleware/user.middleware.js';

const router = express.Router();

router.get('/posts', userAuth, getDiscussionPosts);
router.post('/posts', userAuth, createDiscussionPost);
router.post('/posts/:postId/replies', userAuth, addReplyToPost);
router.post('/posts/:postId/reactions', userAuth, addReactionToPost);
router.delete('/posts/:postId/reactions', userAuth, removeReactionFromPost);

export default router;
