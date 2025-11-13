import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './src/model/User.model.js';
import Role from './src/model/Role.model.js';
import UserRole from './src/model/UserRole.model.js';
import { ENV } from './src/config/env.config.js';

const createAdminUser = async () => {
  try {
    await mongoose.connect(ENV.MONGO_URI);
    console.log('🔗 Connected to MongoDB\n');

    // Check if Admin role exists, create if not
    let adminRole = await Role.findOne({ name: 'Admin' });
    if (!adminRole) {
      adminRole = await Role.create({ name: 'Admin' });
      console.log('✅ Admin role created');
    } else {
      console.log('⏭️ Admin role already exists');
    }

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@school.com' });
    if (existingAdmin) {
      console.log('⏭️ Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const adminUser = await User.create({
      name: 'System',
      surname: 'Admin',
      email: 'admin@school.com',
      password: 'Admin@123', // This will be hashed by the pre-save hook
      profilepic: '',
      mobile: '0000000000',
    });

    // Assign admin role
    await UserRole.create({
      userId: adminUser._id,
      roleId: adminRole._id,
    });

    console.log('✅ Admin user created successfully');
    console.log('📧 Email: admin@school.com');
    console.log('🔑 Password: Admin@123');
    console.log('⚠️  Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('💥 Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser();
