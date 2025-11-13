import express from 'express';
import {
  getAllCommittees,
  createCommittee,
  getAllUsersForCommittee,
  addUsersToCommittee,
  removeUserFromCommittee,
  updateCommittee,
  deleteCommittee,
  submitIdea,
  getCommitteeIdeas,
  deleteIdea,
} from '../controller/committee.controller.js';
import { userAuth } from '../middleware/user.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';

const router = express.Router();

// Public routes
router.get('/committees', userAuth, getAllCommittees);

// Protected routes (require authentication)
router.post('/committees/:committeeId/ideas', userAuth, submitIdea);
router.get('/committees/:committeeId/ideas', userAuth, getCommitteeIdeas);

// Admin only routes
router.get('/committees/users/all', userAuth, requireAdmin, getAllUsersForCommittee);
router.post('/committees', userAuth, requireAdmin, createCommittee);
router.put('/committees/:committeeId', userAuth, requireAdmin, updateCommittee);
router.delete('/committees/:committeeId', userAuth, requireAdmin, deleteCommittee);
router.post('/committees/:committeeId/members', userAuth, requireAdmin, addUsersToCommittee);
router.delete(
  '/committees/:committeeId/members/:userId',
  userAuth,
  requireAdmin,
  removeUserFromCommittee
);
router.delete('/ideas/:ideaId', userAuth, deleteIdea);

export default router;
