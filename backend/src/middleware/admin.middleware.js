// middleware/admin.middleware.js
import UserRole from '../model/UserRole.model.js';
import Role from '../model/Role.model.js';

export const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Check if user has Admin role
    const adminRole = await Role.findOne({ name: 'Admin' });
    if (!adminRole) {
      return res.status(403).json({
        message: 'Admin role not found in system',
        success: false,
      });
    }

    const userAdminRole = await UserRole.findOne({
      userId: userId,
      roleId: adminRole._id,
    });

    if (!userAdminRole) {
      return res.status(403).json({
        message: 'Access denied. Admin privileges required.',
        success: false,
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Error checking admin privileges',
      success: false,
    });
  }
};
