import mongoose from 'mongoose';
import Role from './src/model/Role.model.js';
import Profession from './src/model/Profession.model.js';
import Class from './src/model/Class.model.js';
import PresentStatus from './src/model/PresentStatus.model.js';
import { ENV } from './src/config/env.config.js';

// Seed data for all normalized tables
const seedData = {
  roles: ['Admin', 'Alumni Student', 'Alumni Teacher', 'Present Student', 'Present Teacher'],

  professions: [
    { name: 'Academician/Professor/Teacher', category: 'Academic' },
    { name: 'Administrative Services (IAS/WBCS/Other)', category: 'Government' },
    { name: 'Armed Forces/Defense', category: 'Government' },
    { name: 'Artist/Musician/Performer', category: 'Creative' },
    { name: 'Banking/Insurance/Finance', category: 'Corporate' },
    { name: 'Business Owner/Entrepreneur', category: 'Corporate' },
    { name: 'Chartered Accountant', category: 'Corporate' },
    { name: 'Data/Analytics/AI Professional', category: 'Corporate' },
    { name: 'Engineer (Core-Civil/Mech/Electrical etc.)', category: 'Corporate' },
    { name: 'Engineer (Software/IT)', category: 'Corporate' },
    { name: 'Government Employee (Non-Administrative)', category: 'Government' },
    { name: 'Hospitality/Travel/Tourism', category: 'Corporate' },
    { name: 'Journalist/Media Professional', category: 'Creative' },
    { name: 'Legal Professional/Advocate/Judge', category: 'Corporate' },
    { name: 'Marketing/Advertising/PR', category: 'Corporate' },
    { name: 'Medical-Doctor', category: 'Healthcare' },
    { name: 'Medical-Healthcare Professional (Non-doctor)', category: 'Healthcare' },
    { name: 'NGO/Social and Development Sector', category: 'Other' },
    { name: 'Pharmaceutical/Biotech Professional', category: 'Healthcare' },
    { name: 'Police/Law Enforcement', category: 'Government' },
    { name: 'Politician/Public Representative', category: 'Government' },
    { name: 'Researcher/Scientist', category: 'Academic' },
    { name: 'Retired', category: 'Other' },
    { name: 'Sportsperson/Coach', category: 'Creative' },
    { name: 'Student (Higher Studies)', category: 'Academic' },
    { name: 'Tech Startup Employee', category: 'Corporate' },
    { name: 'Writer/Author/Blogger', category: 'Creative' },
    { name: 'Other', category: 'Other' },
  ],

  classes: [
    { name: 'I', level: 'Primary' },
    { name: 'II', level: 'Primary' },
    { name: 'III', level: 'Primary' },
    { name: 'IV', level: 'Primary' },
    { name: 'V', level: 'Primary' },
    { name: 'VI', level: 'Secondary' },
    { name: 'VII', level: 'Secondary' },
    { name: 'VIII', level: 'Secondary' },
    { name: 'IX', level: 'Secondary' },
    { name: 'X', level: 'Secondary' },
    { name: 'XI', level: 'Higher Secondary' },
    { name: 'XII', level: 'Higher Secondary' },
  ],

  presentStatuses: [
    { name: 'retired' },
    { name: 'Working in current organization' },
    { name: 'Working in other organization' },
  ],
};

const checkAndSeedRoles = async () => {
  try {
    const existingRoles = await Role.countDocuments();

    if (existingRoles > 0) {
      console.log('⏭️  Roles already exist, skipping seeding');
      return { seeded: false, count: existingRoles };
    }

    console.log('Seeding roles...');
    for (const roleName of seedData.roles) {
      await Role.create({ name: roleName });
      console.log(`✓ Created role: ${roleName}`);
    }
    console.log('✅ Roles seeded successfully\n');
    return { seeded: true, count: seedData.roles.length };
  } catch (error) {
    console.error('❌ Error seeding roles:', error);
    throw error;
  }
};

const checkAndSeedProfessions = async () => {
  try {
    const existingProfessions = await Profession.countDocuments();

    if (existingProfessions > 0) {
      console.log('⏭️  Professions already exist, skipping seeding');
      return { seeded: false, count: existingProfessions };
    }

    console.log('Seeding professions...');
    for (const profession of seedData.professions) {
      await Profession.create(profession);
      console.log(`✓ Created profession: ${profession.name} (${profession.category})`);
    }
    console.log('✅ Professions seeded successfully\n');
    return { seeded: true, count: seedData.professions.length };
  } catch (error) {
    console.error('❌ Error seeding professions:', error);
    throw error;
  }
};

const checkAndSeedClasses = async () => {
  try {
    const existingClasses = await Class.countDocuments();

    if (existingClasses > 0) {
      console.log('⏭️  Classes already exist, skipping seeding');
      return { seeded: false, count: existingClasses };
    }

    console.log('Seeding classes...');
    for (const classItem of seedData.classes) {
      await Class.create(classItem);
      console.log(`✓ Created class: ${classItem.name} (${classItem.level})`);
    }
    console.log('✅ Classes seeded successfully\n');
    return { seeded: true, count: seedData.classes.length };
  } catch (error) {
    console.error('❌ Error seeding classes:', error);
    throw error;
  }
};

const checkAndSeedPresentStatuses = async () => {
  try {
    const existingStatuses = await PresentStatus.countDocuments();

    if (existingStatuses > 0) {
      console.log('⏭️  Present statuses already exist, skipping seeding');
      return { seeded: false, count: existingStatuses };
    }

    console.log('Seeding present statuses...');
    for (const status of seedData.presentStatuses) {
      await PresentStatus.create(status);
      console.log(`✓ Created present status: ${status.name}`);
    }
    console.log('✅ Present statuses seeded successfully\n');
    return { seeded: true, count: seedData.presentStatuses.length };
  } catch (error) {
    console.error('❌ Error seeding present statuses:', error);
    throw error;
  }
};

const seedAllNormalizedData = async () => {
  try {
    await mongoose.connect(ENV.MONGO_URI);
    console.log('🔗 Connected to MongoDB\n');

    console.log('🚀 Starting normalized data seeding...\n');

    const results = {
      roles: await checkAndSeedRoles(),
      professions: await checkAndSeedProfessions(),
      classes: await checkAndSeedClasses(),
      presentStatuses: await checkAndSeedPresentStatuses(),
    };

    console.log('🎉 All normalized data seeding completed!');
    console.log('\n📊 Summary:');

    Object.entries(results).forEach(([key, value]) => {
      const status = value.seeded ? '✅ Newly seeded' : '⏭️  Already existed';
      console.log(
        `   • ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value.count} items (${status})`
      );
    });

    const newlySeeded = Object.values(results).filter(result => result.seeded).length;
    const skipped = Object.values(results).filter(result => !result.seeded).length;

    console.log(
      `\n📈 Seeding Stats: ${newlySeeded} collections seeded, ${skipped} collections skipped`
    );

    process.exit(0);
  } catch (error) {
    console.error('💥 Error seeding normalized data:', error);
    process.exit(1);
  }
};

// Run the seed function
seedAllNormalizedData();
