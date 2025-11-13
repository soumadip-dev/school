import express from 'express';
import {
  createEvent,
  getAllEvents,
  getEventsByMonth,
  updateEvent,
  deleteEvent,
  getEventById,
} from '../controller/event.controller.js';
import { userAuth } from '../middleware/user.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllEvents);
router.get('/calendar', getEventsByMonth);
router.get('/:eventId', getEventById);

// Admin only routes
router.post('/', userAuth, requireAdmin, createEvent);
router.put('/:eventId', userAuth, requireAdmin, updateEvent);
router.delete('/:eventId', userAuth, requireAdmin, deleteEvent);

export default router;
