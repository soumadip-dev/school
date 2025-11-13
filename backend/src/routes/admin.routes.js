import express from 'express';
import { getAllUsers, getSystemStats, isAdmin } from '../controller/admin.controller.js';

import { userAuth } from '../middleware/user.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(userAuth);
router.use(requireAdmin);

// User management
router.get('/users', getAllUsers);
router.get('/stats', getSystemStats);
router.get('/', isAdmin);

export default router;
