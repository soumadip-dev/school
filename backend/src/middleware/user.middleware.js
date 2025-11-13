import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.config.js';
import UserRole from '../model/UserRole.model.js';
import Role from '../model/Role.model.js';

//* Middleware for user authentication
export const userAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.authToken;

    // If no token is present, respond with 401 Unauthorized
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized. Login again', success: false });
    }

    // Verify the token using the secret key from environment variables
    const { id } = jwt.verify(token, ENV.JWT_SECRET);

    // If the token contains a user id, attach it to the request for downstream handlers
    if (id) {
      req.user = { userId: id };
    } else {
      // If no id is found in token payload, respond with 401 Unauthorized
      return res.status(401).json({ message: 'Unauthorized. Login again', success: false });
    }

    // Call next middleware or route handler
    next();
  } catch (error) {
    console.error('Middleware error:', error.message);
    res.status(500).json({ message: error.message, success: false });
  }
};

//* Middleware to check if user has specific role
export const requireRole = allowedRoles => {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId;

      // Get user's roles
      const userRoles = await UserRole.find({ userId }).populate('roleId', 'name');
      const userRoleNames = userRoles.map(ur => ur.roleId.name);

      // Check if user has any of the allowed roles
      const hasRequiredRole = userRoleNames.some(role => allowedRoles.includes(role));

      if (!hasRequiredRole) {
        return res.status(403).json({
          message: 'Access denied. Insufficient permissions.',
          success: false,
        });
      }

      // Attach user roles to request for potential use in controllers
      req.user.roles = userRoleNames;

      next();
    } catch (error) {
      console.error('Role middleware error:', error.message);
      res.status(500).json({ message: error.message, success: false });
    }
  };
};

//* Middleware to check if user has specific permission (based on role)
export const requirePermission = permission => {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId;

      // Get user's roles
      const userRoles = await UserRole.find({ userId }).populate('roleId', 'name permissions');
      const userRoleNames = userRoles.map(ur => ur.roleId.name);

      // Define role-based permissions (you can expand this)
      const rolePermissions = {
        'Alumni Student': ['view_alumni', 'edit_profile', 'view_events'],
        'Alumni Teacher': ['view_alumni', 'edit_profile', 'view_events', 'manage_content'],
        'Present Student': ['view_profile', 'edit_profile', 'view_events'],
        'Present Teacher': ['view_profile', 'edit_profile', 'view_events', 'manage_students'],
      };

      // Check if user has the required permission through any of their roles
      const hasPermission = userRoleNames.some(role => rolePermissions[role]?.includes(permission));

      if (!hasPermission) {
        return res.status(403).json({
          message: 'Access denied. Insufficient permissions.',
          success: false,
        });
      }

      next();
    } catch (error) {
      console.error('Permission middleware error:', error.message);
      res.status(500).json({ message: error.message, success: false });
    }
  };
};

//* Middleware to validate user exists and is active
export const validateUser = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        success: false,
      });
    }

    // You can add more validations here (e.g., check if user is active, not suspended, etc.)

    next();
  } catch (error) {
    console.error('User validation middleware error:', error.message);
    res.status(500).json({ message: error.message, success: false });
  }
};
