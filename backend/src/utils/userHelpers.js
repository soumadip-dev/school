import User from '../model/User.model.js';
import UserRole from '../model/UserRole.model.js';
import UserProfession from '../model/UserProfession.model.js';
import UserClass from '../model/UserClass.model.js';
import UserPresentStatus from '../model/UserPresentStatus.model.js';

//* Helper function to get user with all roles and related data
export const getUserWithRoles = async userId => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    throw new Error('User not found');
  }

  const [userRoles, userProfessions, userClasses, userPresentStatuses] = await Promise.all([
    UserRole.find({ userId }).populate('roleId', 'name'),
    UserProfession.find({ userId }).populate('professionId', 'name'),
    UserClass.find({ userId }).populate('classId', 'name'),
    UserPresentStatus.find({ userId }).populate('presentStatusId', 'name'),
  ]);

  return {
    ...user.toObject(),
    roles: userRoles.map(ur => ur.roleId?.name).filter(Boolean), // Safe with optional chaining
    professions: userProfessions.map(up => up.professionId?.name).filter(Boolean),
    classes: userClasses.map(uc => uc.classId?.name).filter(Boolean),
    presentStatuses: userPresentStatuses.map(ups => ups.presentStatusId?.name).filter(Boolean),
  };
};

//* Helper function to get user batch info
export const getUserBatchInfo = async userId => {
  const userWithRoles = await getUserWithRoles(userId);
  const user = await User.findById(userId);

  let batch = '';
  let role = userWithRoles.roles[0] || ''; // Take first role

  if (role === 'Alumni Student') {
    batch = user.Matriculationbatch?.toString() || '';
  } else if (role === 'Present Student') {
    batch = userWithRoles.classes[0] || ''; // Get class from UserClass
  } else if (role === 'Alumni Teacher' || role === 'Present Teacher') {
    batch = user.joiningyear?.toString() || '';
  }

  return { batch, role };
};
