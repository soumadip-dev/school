import { ENV } from '../config/env.config.js';
import User from '../model/User.model.js';
import Role from '../model/Role.model.js';
import Profession from '../model/Profession.model.js';
import Class from '../model/Class.model.js';
import PresentStatus from '../model/PresentStatus.model.js';
import UserRole from '../model/UserRole.model.js';
import UserProfession from '../model/UserProfession.model.js';
import UserClass from '../model/UserClass.model.js';
import UserPresentStatus from '../model/UserPresentStatus.model.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { isValidEmail, isStrongPassword } from '../utils/validation.util.js';
import uploadOnCloudinary from '../config/cloudinary.config.js';
import { getUserWithRoles } from '../utils/userHelpers.js';
import generateMailOptions from '../utils/mailTemplates..js';
import transporter from '../config/nodemailer.config.js';

//* Controller for registering a user
const registerUser = async (req, res) => {
  try {
    // Get fields from request body
    const {
      role,
      name,
      surname,
      email,
      mobile,
      presentcity,
      Matriculationbatch,
      Intermediatebatch,
      presentOrganization,
      profession,
      joiningyear,
      presentstatus,
      class: studentClass,
      password,
    } = req.body;

    console.log(req.body);

    // Get profile picture from request file
    let image;
    if (req.file) {
      image = await uploadOnCloudinary(req.file.path);
    }

    // Check if email is valid
    if (!isValidEmail(email)) {
      throw new Error('Email is not valid');
    }

    // Check if password is strong enough
    if (!isStrongPassword(password)) {
      throw new Error('Password is not strong enough');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Validate role exists
    const roleDoc = await Role.findOne({ name: role });
    if (!roleDoc) {
      throw new Error('Invalid role specified');
    }

    // Create new user
    const newUser = await User.create({
      name,
      surname,
      email,
      password,
      profilepic: image || '',
      ...(mobile && { mobile }),
      ...(presentcity && { presentcity }),
      ...(Matriculationbatch && { Matriculationbatch }),
      ...(Intermediatebatch && { Intermediatebatch }),
      ...(presentOrganization && { presentOrganization }),
      ...(joiningyear && { joiningyear }),
    });

    // If any error occurs to create new user, throw an error
    if (!newUser) {
      throw new Error('User not registered');
    }

    // Assign role to user
    await UserRole.create({
      userId: newUser._id,
      roleId: roleDoc._id,
    });

    // Assign profession if provided and exists
    if (profession) {
      const professionDoc = await Profession.findOne({ name: profession });
      if (professionDoc) {
        await UserProfession.create({
          userId: newUser._id,
          professionId: professionDoc._id,
        });
      }
    }

    // Assign class if provided and exists
    if (studentClass) {
      const classDoc = await Class.findOne({ name: studentClass });
      if (classDoc) {
        await UserClass.create({
          userId: newUser._id,
          classId: classDoc._id,
        });
      }
    }

    // Assign present status if provided and exists
    if (presentstatus) {
      const presentStatusDoc = await PresentStatus.findOne({ name: presentstatus });
      if (presentStatusDoc) {
        await UserPresentStatus.create({
          userId: newUser._id,
          presentStatusId: presentStatusDoc._id,
        });
      }
    }

    // Generate JWT token with user ID
    const token = jwt.sign({ id: newUser._id }, ENV.JWT_SECRET, {
      expiresIn: '7d',
    });

    // Store JWT token in cookie
    const cookieOptions = {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    res.cookie('authToken', token, cookieOptions);

    // Get complete user data with roles for response
    const userWithRoles = await getUserWithRoles(newUser._id);

    // Send welcome email (non-blocking)
    try {
      const mailOptions = generateMailOptions({
        user: {
          name: `${name} ${surname}`.trim(),
          email: email,
        },
        type: 'welcome',
      });

      await transporter.sendMail(mailOptions);
      console.log('Welcome email sent successfully to:', email);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't throw error - registration should still succeed even if email fails
    }

    // Send success response
    res.status(201).json({
      message: 'User registered successfully',
      success: true,
      data: {
        user: userWithRoles,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Something went wrong when registering user',
      success: false,
    });
  }
};

//* Controller for logging in a user
const loginUser = async (req, res) => {
  try {
    // Get fields from request body
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Find the user based on email
    const user = await User.findOne({ email });

    // Check if user exists or not
    if (!user) {
      throw new Error('Invalid Credentials');
    }

    // Check if password is correct
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      throw new Error('Invalid Credentials');
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, ENV.JWT_SECRET, { expiresIn: '7d' });

    // Store JWT token in cookie
    const cookieOptions = {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
    res.cookie('authToken', token, cookieOptions);

    // Get complete user data with roles for response
    const userWithRoles = await getUserWithRoles(user._id);

    // Send success response
    res.status(200).json({
      message: 'User logged in successfully',
      success: true,
      data: {
        user: userWithRoles,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Something went wrong', success: false });
  }
};

//* Controller to log out user
const logoutUser = (req, res) => {
  try {
    res.clearCookie('authToken');
    res.status(200).json({ message: 'User logged out successfully', success: true });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Something went wrong', success: false });
  }
};

//* Controller to check if user is authenticated
const isAuthenticated = async (req, res) => {
  try {
    // Get complete user data with roles for response
    const userWithRoles = await getUserWithRoles(req.user.userId);

    // Send success response
    return res.status(200).json({
      message: 'User is authenticated',
      success: true,
      data: {
        user: userWithRoles,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Something went wrong when checking authentication',
      success: false,
    });
  }
};

//* Controller to get user profile
const getUserProfile = async (req, res) => {
  try {
    const userWithRoles = await getUserWithRoles(req.user.userId);

    res.status(200).json({
      message: 'User profile fetched successfully',
      success: true,
      data: {
        user: userWithRoles,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Something went wrong when fetching profile',
      success: false,
    });
  }
};

//* Controller to update user profile
const updateUserProfile = async (req, res) => {
  try {
    const {
      name,
      surname,
      mobile,
      presentcity,
      Matriculationbatch,
      Intermediatebatch,
      presentOrganization,
      profession,
      joiningyear,
      presentstatus,
      class: studentClass,
    } = req.body;

    const userId = req.user.userId;

    // Update basic user info
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...(name && { name }),
        ...(surname && { surname }),
        ...(mobile && { mobile }),
        ...(presentcity && { presentcity }),
        ...(Matriculationbatch && { Matriculationbatch }),
        ...(Intermediatebatch && { Intermediatebatch }),
        ...(presentOrganization && { presentOrganization }),
        ...(joiningyear && { joiningyear }),
      },
      { new: true }
    ).select('-password');

    // Update profile picture if provided
    if (req.file) {
      const image = await uploadOnCloudinary(req.file.path);
      updatedUser.profilepic = image;
      await updatedUser.save();
    }

    // Update profession if provided
    if (profession) {
      // Remove existing professions
      await UserProfession.deleteMany({ userId });

      const professionDoc = await Profession.findOne({ name: profession });
      if (professionDoc) {
        await UserProfession.create({
          userId,
          professionId: professionDoc._id,
        });
      }
    }

    // Update class if provided
    if (studentClass) {
      // Remove existing classes
      await UserClass.deleteMany({ userId });

      const classDoc = await Class.findOne({ name: studentClass });
      if (classDoc) {
        await UserClass.create({
          userId,
          classId: classDoc._id,
        });
      }
    }

    // Update present status if provided
    if (presentstatus) {
      // Remove existing present statuses
      await UserPresentStatus.deleteMany({ userId });

      const presentStatusDoc = await PresentStatus.findOne({ name: presentstatus });
      if (presentStatusDoc) {
        await UserPresentStatus.create({
          userId,
          presentStatusId: presentStatusDoc._id,
        });
      }
    }

    // Get complete updated user data
    const userWithRoles = await getUserWithRoles(userId);

    res.status(200).json({
      message: 'User profile updated successfully',
      success: true,
      data: {
        user: userWithRoles,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Something went wrong when updating profile',
      success: false,
    });
  }
};

//* Controller for getting alumni data with filters
const getAlumniData = async (req, res) => {
  try {
    const {
      role = 'Alumni Student',
      batch = 'all',
      city = 'all',
      profession = 'all',
      class: studentClass = 'all',
      page = 1,
      limit = 10,
    } = req.query;

    // Build the base query
    let basePipeline = [
      // Lookup user roles
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
      // Lookup professions
      {
        $lookup: {
          from: 'userprofessions',
          localField: '_id',
          foreignField: 'userId',
          as: 'userProfessions',
        },
      },
      {
        $unwind: {
          path: '$userProfessions',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'professions',
          localField: 'userProfessions.professionId',
          foreignField: '_id',
          as: 'profession',
        },
      },
      {
        $unwind: {
          path: '$profession',
          preserveNullAndEmptyArrays: true,
        },
      },
      // Lookup classes
      {
        $lookup: {
          from: 'userclasses',
          localField: '_id',
          foreignField: 'userId',
          as: 'userClasses',
        },
      },
      {
        $unwind: {
          path: '$userClasses',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'classes',
          localField: 'userClasses.classId',
          foreignField: '_id',
          as: 'class',
        },
      },
      {
        $unwind: {
          path: '$class',
          preserveNullAndEmptyArrays: true,
        },
      },
      // Project the fields
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
          profession: '$profession.name',
          class: '$class.name',
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ];

    // Add role filter
    const matchStage = { $match: { role: role } };

    // Add additional filters based on role
    if (role === 'Alumni Student') {
      if (batch !== 'all') {
        matchStage.$match.Matriculationbatch = parseInt(batch);
      }
      if (city !== 'all') {
        matchStage.$match.presentcity = city;
      }
      if (profession !== 'all') {
        matchStage.$match.profession = profession;
      }
    } else if (role === 'Present Student') {
      if (studentClass !== 'all') {
        matchStage.$match.class = studentClass;
      }
    }

    basePipeline.push(matchStage);

    // Get total count for pagination
    const countPipeline = [...basePipeline, { $count: 'total' }];
    const countResult = await User.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Add pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    basePipeline.push({ $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: parseInt(limit) });

    // Execute the query
    const alumniData = await User.aggregate(basePipeline);

    // Transform data to match frontend structure
    const transformedData = alumniData.map(user => {
      // Generate ID similar to frontend
      const generateId = (name, mobile) => {
        return name.slice(-2).toUpperCase() + (mobile ? mobile.slice(-3) : '000');
      };

      return {
        id: user._id.toString(),
        name: user.name,
        surname: user.surname,
        role: user.role,
        batch: user.Matriculationbatch ? user.Matriculationbatch.toString() : null,
        city: user.presentcity || '',
        profession: user.profession || null,
        organization: user.presentOrganization || null,
        img: user.profilepic || 'https://randomuser.me/api/portraits/men/1.jpg', // Default image
        mobile: user.mobile || '0000000000',
        class: user.class || null,
      };
    });

    res.status(200).json({
      message: 'Alumni data fetched successfully',
      success: true,
      data: {
        alumni: transformedData,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching alumni data:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong when fetching alumni data',
      success: false,
    });
  }
};

//* Controller for getting filter options
const getFilterOptions = async (req, res) => {
  try {
    // Get unique batches
    const batches = await User.distinct('Matriculationbatch', {
      Matriculationbatch: { $ne: null },
    });

    // Get unique cities
    const cities = await User.distinct('presentcity', {
      presentcity: { $ne: null, $ne: '' },
    });

    // Get all professions
    const professions = await Profession.find({}).select('name -_id');

    // Get all classes
    const classes = await Class.find({}).select('name -_id');

    res.status(200).json({
      message: 'Filter options fetched successfully',
      success: true,
      data: {
        batches: batches.sort().map(batch => batch.toString()),
        cities: cities.sort(),
        professions: professions.map(prof => prof.name),
        classes: classes.map(cls => cls.name),
      },
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong when fetching filter options',
      success: false,
    });
  }
};

// Add these controllers to your existing auth controller file

//* Controller for sending password reset email
const sendPasswordResetEmail = async (req, res) => {
  try {
    // Get the email from body
    const { email } = req.body;

    // Check if email is provided
    if (!email) {
      return res.status(400).json({
        message: 'Email is required',
        success: false,
      });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // For security reasons, don't reveal if user exists or not
      return res.status(200).json({
        message: 'If the email exists, a password reset OTP has been sent',
        success: true,
      });
    }

    // Generate OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // Set OTP expiry (10 minutes from now)
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Update user resetPasswordOtp and resetPasswordOtpExpiry
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpiry = otpExpiry;

    // Save the updated user
    await user.save();

    // Send password reset email to user
    const mailOptions = generateMailOptions({
      user,
      otp,
      type: 'forgetPassword',
      companyName: 'Auth System',
    });

    try {
      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return res.status(500).json({
        message: emailError.message || 'Email sending failed',
        success: false,
      });
    }

    // Send success response
    res.status(200).json({
      message: 'If the email exists, a password reset OTP has been sent',
      success: true,
    });
  } catch (error) {
    console.error('Send password reset error:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong when sending reset email',
      success: false,
    });
  }
};

//* Controller for resetting password with OTP
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Check if email, OTP, and new password are provided
    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        message: 'Email, OTP, and new password are required',
        success: false,
      });
    }

    // Find user based on email
    const user = await User.findOne({ email: email.toLowerCase() });

    // Check if the user exists or not
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        success: false,
      });
    }

    // Check if provided OTP is valid or not
    if (user.resetPasswordOtp !== otp) {
      return res.status(400).json({
        message: 'Invalid OTP',
        success: false,
      });
    }

    // Check if OTP has expired or not
    if (!user.resetPasswordOtpExpiry || user.resetPasswordOtpExpiry < new Date()) {
      return res.status(400).json({
        message: 'OTP has expired',
        success: false,
      });
    }

    // Check if password is strong enough or not
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        message: 'Password is not strong enough',
        success: false,
      });
    }

    // Check if password is same as previous
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        message: 'New password cannot be the same as the old password',
        success: false,
      });
    }

    // Change the password
    user.password = newPassword;

    // Clear the reset OTP fields
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpiry = undefined;

    // Save the user
    await user.save();

    // Send success response
    res.status(200).json({
      message: 'Password reset successfully',
      success: true,
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong when resetting password',
      success: false,
    });
  }
};

//* Export the new controllers along with existing ones
export {
  registerUser,
  loginUser,
  isAuthenticated,
  getUserProfile,
  updateUserProfile,
  logoutUser,
  getAlumniData,
  getFilterOptions,
  sendPasswordResetEmail,
  resetPassword,
};
