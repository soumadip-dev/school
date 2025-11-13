// controllers/admin.controller.js
import User from '../model/User.model.js';
import UserRole from '../model/UserRole.model.js';
import Profession from '../model/Profession.model.js';
import Class from '../model/Class.model.js';
import { getUserWithRoles } from '../utils/userHelpers.js';

//* Get all users (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role = 'all' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build base query
    let basePipeline = [
      {
        $lookup: {
          from: 'userroles',
          localField: '_id',
          foreignField: 'userId',
          as: 'userRoles',
        },
      },
      {
        $unwind: '$userRoles',
      },
      {
        $lookup: {
          from: 'roles',
          localField: 'userRoles.roleId',
          foreignField: '_id',
          as: 'role',
        },
      },
      {
        $unwind: '$role',
      },
      {
        $project: {
          name: 1,
          surname: 1,
          email: 1,
          mobile: 1,
          profilepic: 1,
          presentcity: 1,
          Matriculationbatch: 1,
          Intermediatebatch: 1,
          presentOrganization: 1,
          joiningyear: 1,
          role: '$role.name',
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ];

    // Add role filter if specified
    if (role !== 'all') {
      basePipeline.push({
        $match: { role: role },
      });
    }

    // Get total count
    const countPipeline = [...basePipeline, { $count: 'total' }];
    const countResult = await User.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Add pagination
    basePipeline.push({ $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: parseInt(limit) });

    const users = await User.aggregate(basePipeline);

    res.status(200).json({
      message: 'Users fetched successfully',
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Error fetching users',
      success: false,
    });
  }
};

//* Get system statistics (Admin only)
export const getSystemStats = async (req, res) => {
  try {
    const [totalUsers, usersByRole, totalProfessions, totalClasses] = await Promise.all([
      User.countDocuments(),
      UserRole.aggregate([
        {
          $lookup: {
            from: 'roles',
            localField: 'roleId',
            foreignField: '_id',
            as: 'role',
          },
        },
        {
          $unwind: '$role',
        },
        {
          $group: {
            _id: '$role.name',
            count: { $sum: 1 },
          },
        },
      ]),
      Profession.countDocuments(),
      Class.countDocuments(),
    ]);

    res.status(200).json({
      message: 'System statistics fetched successfully',
      success: true,
      data: {
        totalUsers,
        usersByRole,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Error fetching system statistics',
      success: false,
    });
  }
};

//* Controller to chem if user is admin or not
export const isAdmin = async (req, res) => {
  try {
    res.status(200).json({
      message: 'Admin status checked successfully',
      success: true,
      isAdmin: true,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Something went wrong when checking admin status',
      success: false,
    });
  }
};
