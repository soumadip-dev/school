import mongoose from 'mongoose';
import Slider from './src/model/Slider.model.js';
import User from './src/model/User.model.js';
import { ENV } from './src/config/env.config.js';

const defaultSliderImages = [
  {
    image:
      'https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
    title: 'Jalpaiguri Zilla School',
    subtitle: 'Celebrating 150 Years of Excellence',
    order: 0,
    isActive: true,
  },
  {
    image:
      'https://images.unsplash.com/photo-1577896851231-70ef18881754?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
    title: 'Our Heritage',
    subtitle: 'Building Futures Since 1875',
    order: 1,
    isActive: true,
  },
  {
    image:
      'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
    title: 'Academic Excellence',
    subtitle: 'Nurturing Young Minds',
    order: 2,
    isActive: true,
  },
  {
    image:
      'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
    title: 'Dedicated Faculty',
    subtitle: 'Guiding Students to Success',
    order: 3,
    isActive: true,
  },
];

const seedSliderImages = async () => {
  try {
    await mongoose.connect(ENV.MONGO_URI);
    console.log('🔗 Connected to MongoDB\n');

    // Check if slider images already exist
    const existingSliders = await Slider.countDocuments();
    if (existingSliders > 0) {
      console.log('⏭️  Slider images already exist, skipping seeding');
      process.exit(0);
    }

    // Find admin user to set as creator
    const adminUser = await User.findOne({ email: 'admin@school.com' });
    if (!adminUser) {
      console.log('❌ Admin user not found. Please run admin seed first.');
      process.exit(1);
    }

    console.log('Seeding slider images...');

    // Create slider images
    for (const sliderData of defaultSliderImages) {
      await Slider.create({
        ...sliderData,
        createdBy: adminUser._id,
      });
      console.log(`✓ Created slider: ${sliderData.title}`);
    }

    console.log('✅ Slider images seeded successfully');
    console.log(`📊 Created ${defaultSliderImages.length} slider images`);

    process.exit(0);
  } catch (error) {
    console.error('💥 Error seeding slider images:', error);
    process.exit(1);
  }
};

seedSliderImages();
