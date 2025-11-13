import Committee from '../model/Committee.model.js';
import CommitteeIdea from '../model/CommitteeIdea.model.js';
import User from '../model/User.model.js';
import { getUserBatchInfo, getUserWithRoles } from '../utils/userHelpers.js';

//* Get all committees for admin (with all members) or user committees (only their own)
const getAllCommittees = async (req, res) => {
  try {
    const userWithRoles = await getUserWithRoles(req.user.userId);
    const isAdmin = userWithRoles.roles.includes('Admin');

    let committees;

    if (isAdmin) {
      // Admin can see all committees
      committees = await Committee.find({ isActive: true })
        .populate({
          path: 'members.user',
          select: 'name surname profilepic email mobile',
        })
        .populate({
          path: 'createdBy',
          select: 'name surname',
        })
        .sort({ name: 1 })
        .lean();
    } else {
      // Regular users can only see committees they are members of
      committees = await Committee.find({
        isActive: true,
        'members.user': req.user.userId,
      })
        .populate({
          path: 'members.user',
          select: 'name surname profilepic email mobile',
        })
        .populate({
          path: 'createdBy',
          select: 'name surname',
        })
        .sort({ name: 1 })
        .lean();
    }

    // Format committees for frontend
    const formattedCommittees = await Promise.all(
      committees.map(async committee => {
        // Format members with batch info
        const formattedMembers = await Promise.all(
          committee.members.map(async member => {
            if (!member.user) return null;

            const batchInfo = await getUserBatchInfo(member.user._id);
            const user = member.user;

            let displayText = `${user.name} ${user.surname}`;

            // Add role/batch information based on user type
            if (batchInfo.role === 'Alumni Student' || batchInfo.role === 'Present Student') {
              displayText += ` (${batchInfo.role.split(' ')[0]} - ${batchInfo.batch})`;
            } else if (
              batchInfo.role === 'Alumni Teacher' ||
              batchInfo.role === 'Present Teacher'
            ) {
              displayText += ` (${batchInfo.role.split(' ')[0]})`;
            }

            return {
              id: member.user._id.toString(),
              displayText,
              name: `${user.name} ${user.surname}`,
              email: user.email,
              mobile: user.mobile,
              profilepic: user.profilepic,
              batchInfo,
            };
          })
        );

        // Filter out null members
        const validMembers = formattedMembers.filter(member => member !== null);

        return {
          id: committee._id.toString(),
          name: committee.name,
          description: committee.description || '',
          members: validMembers,
          memberCount: validMembers.length,
          createdBy: committee.createdBy
            ? `${committee.createdBy.name} ${committee.createdBy.surname}`
            : 'Unknown',
          createdAt: committee.createdAt,
          isUserMember: validMembers.some(member => member.id === req.user.userId),
        };
      })
    );

    res.status(200).json({
      message: 'Committees fetched successfully',
      success: true,
      data: {
        committees: formattedCommittees,
        userIsAdmin: isAdmin,
      },
    });
  } catch (error) {
    console.error('Error fetching committees:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong while fetching committees',
      success: false,
    });
  }
};

//* Create a new committee (Admin only)
const createCommittee = async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;
    const userId = req.user.userId;

    // Check if user is admin
    const userWithRoles = await getUserWithRoles(userId);
    if (!userWithRoles.roles.includes('Admin')) {
      return res.status(403).json({
        message: 'Only admins can create committees',
        success: false,
      });
    }

    // Check if committee already exists
    const existingCommittee = await Committee.findOne({ name });
    if (existingCommittee) {
      return res.status(400).json({
        message: 'Committee with this name already exists',
        success: false,
      });
    }

    // Validate member IDs
    const validUsers = [];
    if (memberIds && memberIds.length > 0) {
      const users = await User.find({ _id: { $in: memberIds } });
      if (users.length !== memberIds.length) {
        return res.status(400).json({
          message: 'Some user IDs are invalid',
          success: false,
        });
      }
      validUsers.push(...users);
    }

    // Create committee members array (include creator as member)
    const allMemberIds = [...new Set([userId, ...memberIds])];
    const members = allMemberIds.map(userId => ({ user: userId }));

    // Create new committee
    const newCommittee = await Committee.create({
      name,
      description,
      members,
      createdBy: userId,
    });

    // Populate the created committee for response
    const populatedCommittee = await Committee.findById(newCommittee._id)
      .populate({
        path: 'members.user',
        select: 'name surname email profilepic',
      })
      .populate({
        path: 'createdBy',
        select: 'name surname',
      })
      .lean();

    // Format response
    const formattedCommittee = {
      id: populatedCommittee._id.toString(),
      name: populatedCommittee.name,
      description: populatedCommittee.description,
      members: await Promise.all(
        populatedCommittee.members.map(async member => {
          const batchInfo = await getUserBatchInfo(member.user._id);
          let displayText = `${member.user.name} ${member.user.surname}`;

          if (batchInfo.role === 'Alumni Student' || batchInfo.role === 'Present Student') {
            displayText += ` (${batchInfo.role.split(' ')[0]} - ${batchInfo.batch})`;
          } else if (batchInfo.role === 'Alumni Teacher' || batchInfo.role === 'Present Teacher') {
            displayText += ` (${batchInfo.role.split(' ')[0]})`;
          }

          return displayText;
        })
      ),
      createdBy: `${populatedCommittee.createdBy.name} ${populatedCommittee.createdBy.surname}`,
      createdAt: populatedCommittee.createdAt,
    };

    res.status(201).json({
      message: 'Committee created successfully',
      success: true,
      data: {
        committee: formattedCommittee,
      },
    });
  } catch (error) {
    console.error('Error creating committee:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong while creating committee',
      success: false,
    });
  }
};

//* Get all users for adding to committee (Admin only)
const getAllUsersForCommittee = async (req, res) => {
  try {
    const userWithRoles = await getUserWithRoles(req.user.userId);
    if (!userWithRoles.roles.includes('Admin')) {
      return res.status(403).json({
        message: 'Only admins can access all users',
        success: false,
      });
    }

    const users = await User.find({})
      .select(
        'name surname email mobile profilepic Matriculationbatch Intermediatebatch joiningyear'
      )
      .sort({ name: 1 })
      .lean();

    // Format users with their roles and batch info
    const formattedUsers = await Promise.all(
      users.map(async user => {
        const batchInfo = await getUserBatchInfo(user._id);

        let displayText = `${user.name} ${user.surname}`;
        if (batchInfo.role === 'Alumni Student' || batchInfo.role === 'Present Student') {
          displayText += ` (${batchInfo.role.split(' ')[0]} - ${batchInfo.batch})`;
        } else if (batchInfo.role === 'Alumni Teacher' || batchInfo.role === 'Present Teacher') {
          displayText += ` (${batchInfo.role.split(' ')[0]})`;
        }

        return {
          id: user._id.toString(),
          displayText,
          name: `${user.name} ${user.surname}`,
          email: user.email,
          mobile: user.mobile,
          profilepic: user.profilepic,
          role: batchInfo.role,
          batch: batchInfo.batch,
        };
      })
    );

    res.status(200).json({
      message: 'Users fetched successfully',
      success: true,
      data: {
        users: formattedUsers,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong while fetching users',
      success: false,
    });
  }
};

//* Add users to committee (Admin only)
const addUsersToCommittee = async (req, res) => {
  try {
    const { committeeId } = req.params;
    const { userIds } = req.body;
    const adminId = req.user.userId;

    // Check if user is admin
    const userWithRoles = await getUserWithRoles(adminId);
    if (!userWithRoles.roles.includes('Admin')) {
      return res.status(403).json({
        message: 'Only admins can add users to committees',
        success: false,
      });
    }

    const committee = await Committee.findById(committeeId);
    if (!committee) {
      return res.status(404).json({
        message: 'Committee not found',
        success: false,
      });
    }

    // Validate user IDs
    const validUsers = await User.find({ _id: { $in: userIds } });
    if (validUsers.length !== userIds.length) {
      return res.status(400).json({
        message: 'Some user IDs are invalid',
        success: false,
      });
    }

    // Get existing member IDs to avoid duplicates
    const existingMemberIds = committee.members.map(member => member.user.toString());

    // Add new members (avoid duplicates)
    const newMembers = userIds
      .filter(userId => !existingMemberIds.includes(userId))
      .map(userId => ({ user: userId }));

    if (newMembers.length === 0) {
      return res.status(400).json({
        message: 'All selected users are already members of this committee',
        success: false,
      });
    }

    committee.members.push(...newMembers);
    await committee.save();

    // Populate the updated committee for response
    const populatedCommittee = await Committee.findById(committeeId)
      .populate({
        path: 'members.user',
        select: 'name surname email profilepic',
      })
      .lean();

    // Format new members for response
    const newMemberDetails = await Promise.all(
      newMembers.map(async member => {
        const user = validUsers.find(u => u._id.toString() === member.user.toString());
        const batchInfo = await getUserBatchInfo(member.user);

        let displayText = `${user.name} ${user.surname}`;
        if (batchInfo.role === 'Alumni Student' || batchInfo.role === 'Present Student') {
          displayText += ` (${batchInfo.role.split(' ')[0]} - ${batchInfo.batch})`;
        } else if (batchInfo.role === 'Alumni Teacher' || batchInfo.role === 'Present Teacher') {
          displayText += ` (${batchInfo.role.split(' ')[0]})`;
        }

        return displayText;
      })
    );

    res.status(200).json({
      message: 'Users added to committee successfully',
      success: true,
      data: {
        addedMembers: newMemberDetails,
        totalMembers: populatedCommittee.members.length,
      },
    });
  } catch (error) {
    console.error('Error adding users to committee:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong while adding users to committee',
      success: false,
    });
  }
};

//* Remove user from committee (Admin only)
const removeUserFromCommittee = async (req, res) => {
  try {
    const { committeeId, userId } = req.params;
    const adminId = req.user.userId;

    // Check if user is admin
    const userWithRoles = await getUserWithRoles(adminId);
    if (!userWithRoles.roles.includes('Admin')) {
      return res.status(403).json({
        message: 'Only admins can remove users from committees',
        success: false,
      });
    }

    const committee = await Committee.findById(committeeId);
    if (!committee) {
      return res.status(404).json({
        message: 'Committee not found',
        success: false,
      });
    }

    // Check if user is a member
    const memberIndex = committee.members.findIndex(member => member.user.toString() === userId);

    if (memberIndex === -1) {
      return res.status(404).json({
        message: 'User is not a member of this committee',
        success: false,
      });
    }

    // Remove the member
    committee.members.splice(memberIndex, 1);
    await committee.save();

    // Also remove user's ideas from this committee
    await CommitteeIdea.updateMany(
      {
        committee: committeeId,
        author: userId,
      },
      { isActive: false }
    );

    res.status(200).json({
      message: 'User removed from committee successfully',
      success: true,
      data: {
        remainingMembers: committee.members.length,
      },
    });
  } catch (error) {
    console.error('Error removing user from committee:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong while removing user from committee',
      success: false,
    });
  }
};

//* Update a committee (Admin only)
const updateCommittee = async (req, res) => {
  try {
    const { committeeId } = req.params;
    const { name, description } = req.body;
    const userId = req.user.userId;

    // Check if user is admin
    const userWithRoles = await getUserWithRoles(userId);
    if (!userWithRoles.roles.includes('Admin')) {
      return res.status(403).json({
        message: 'Only admins can update committees',
        success: false,
      });
    }

    const committee = await Committee.findById(committeeId);
    if (!committee) {
      return res.status(404).json({
        message: 'Committee not found',
        success: false,
      });
    }

    // Check if name is being changed and if it conflicts
    if (name && name !== committee.name) {
      const existingCommittee = await Committee.findOne({ name });
      if (existingCommittee) {
        return res.status(400).json({
          message: 'Committee with this name already exists',
          success: false,
        });
      }
      committee.name = name;
    }

    if (description !== undefined) committee.description = description;

    await committee.save();

    // Populate the updated committee for response
    const populatedCommittee = await Committee.findById(committeeId)
      .populate({
        path: 'members.user',
        select: 'name surname',
      })
      .populate({
        path: 'createdBy',
        select: 'name surname',
      })
      .lean();

    res.status(200).json({
      message: 'Committee updated successfully',
      success: true,
      data: {
        committee: {
          id: populatedCommittee._id.toString(),
          name: populatedCommittee.name,
          description: populatedCommittee.description,
          members: populatedCommittee.members.map(
            member => `${member.user.name} ${member.user.surname}`
          ),
          createdBy: `${populatedCommittee.createdBy.name} ${populatedCommittee.createdBy.surname}`,
        },
      },
    });
  } catch (error) {
    console.error('Error updating committee:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong while updating committee',
      success: false,
    });
  }
};

//* Delete a committee (Admin only)
const deleteCommittee = async (req, res) => {
  try {
    const { committeeId } = req.params;
    const userId = req.user.userId;

    // Check if user is admin
    const userWithRoles = await getUserWithRoles(userId);
    if (!userWithRoles.roles.includes('Admin')) {
      return res.status(403).json({
        message: 'Only admins can delete committees',
        success: false,
      });
    }

    // Soft delete the committee
    const committee = await Committee.findByIdAndUpdate(
      committeeId,
      { isActive: false },
      { new: true }
    );

    if (!committee) {
      return res.status(404).json({
        message: 'Committee not found',
        success: false,
      });
    }

    // Also soft delete all ideas associated with this committee
    await CommitteeIdea.updateMany({ committee: committeeId }, { isActive: false });

    res.status(200).json({
      message: 'Committee and associated ideas deleted successfully',
      success: true,
    });
  } catch (error) {
    console.error('Error deleting committee:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong while deleting committee',
      success: false,
    });
  }
};

//* Submit an idea to a committee
const submitIdea = async (req, res) => {
  try {
    const { committeeId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    // Check if committee exists and is active
    const committee = await Committee.findOne({ _id: committeeId, isActive: true });
    if (!committee) {
      return res.status(404).json({
        message: 'Committee not found',
        success: false,
      });
    }

    // Check if user is a member of the committee
    const isMember = committee.members.some(member => member.user.toString() === userId);

    if (!isMember) {
      return res.status(403).json({
        message: 'You must be a member of this committee to submit ideas',
        success: false,
      });
    }

    // Validate content length (max 200 words)
    const wordCount = content
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length;
    if (wordCount > 200) {
      return res.status(400).json({
        message: 'Idea must be 200 words or less',
        success: false,
      });
    }

    // Create the idea
    const newIdea = await CommitteeIdea.create({
      content,
      author: userId,
      committee: committeeId,
    });

    // Get user info for response
    const user = await User.findById(userId).select('name surname');
    const batchInfo = await getUserBatchInfo(userId);

    res.status(201).json({
      message: 'Idea submitted successfully',
      success: true,
      data: {
        idea: {
          id: newIdea._id.toString(),
          content: newIdea.content,
          author: `${user.name} ${user.surname}`,
          batch: batchInfo.batch,
          role: batchInfo.role,
          createdAt: newIdea.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Error submitting idea:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong while submitting idea',
      success: false,
    });
  }
};

//* Get ideas for a committee
const getCommitteeIdeas = async (req, res) => {
  try {
    const { committeeId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const userId = req.user.userId;

    // Check if committee exists and is active
    const committee = await Committee.findOne({ _id: committeeId, isActive: true });
    if (!committee) {
      return res.status(404).json({
        message: 'Committee not found',
        success: false,
      });
    }

    // Check if user is a member of the committee
    const isMember = committee.members.some(member => member.user.toString() === userId);

    if (!isMember) {
      return res.status(403).json({
        message: 'You must be a member of this committee to view ideas',
        success: false,
      });
    }

    const ideas = await CommitteeIdea.find({ committee: committeeId, isActive: true })
      .populate('author', 'name surname profilepic')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Format ideas with batch info
    const formattedIdeas = await Promise.all(
      ideas.map(async idea => {
        const batchInfo = await getUserBatchInfo(idea.author._id);

        let authorDisplay = `${idea.author.name} ${idea.author.surname}`;
        if (batchInfo.role === 'Alumni Student' || batchInfo.role === 'Present Student') {
          authorDisplay += ` (${batchInfo.role.split(' ')[0]} - ${batchInfo.batch})`;
        } else if (batchInfo.role === 'Alumni Teacher' || batchInfo.role === 'Present Teacher') {
          authorDisplay += ` (${batchInfo.role.split(' ')[0]})`;
        }

        return {
          id: idea._id.toString(),
          content: idea.content,
          author: authorDisplay,
          authorId: idea.author._id.toString(),
          authorProfilePic: idea.author.profilepic,
          createdAt: idea.createdAt,
          isOwnIdea: idea.author._id.toString() === userId,
        };
      })
    );

    const totalIdeas = await CommitteeIdea.countDocuments({
      committee: committeeId,
      isActive: true,
    });

    res.status(200).json({
      message: 'Ideas fetched successfully',
      success: true,
      data: {
        ideas: formattedIdeas,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalIdeas / limit),
          totalIdeas,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching committee ideas:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong while fetching ideas',
      success: false,
    });
  }
};

//* Delete an idea (Admin or idea author)
const deleteIdea = async (req, res) => {
  try {
    const { ideaId } = req.params;
    const userId = req.user.userId;

    const idea = await CommitteeIdea.findById(ideaId);
    if (!idea) {
      return res.status(404).json({
        message: 'Idea not found',
        success: false,
      });
    }

    // Check if user is admin or the idea author
    const userWithRoles = await getUserWithRoles(userId);
    const isAdmin = userWithRoles.roles.includes('Admin');
    const isAuthor = idea.author.toString() === userId;

    if (!isAdmin && !isAuthor) {
      return res.status(403).json({
        message: 'You can only delete your own ideas',
        success: false,
      });
    }

    // Soft delete the idea
    idea.isActive = false;
    await idea.save();

    res.status(200).json({
      message: 'Idea deleted successfully',
      success: true,
    });
  } catch (error) {
    console.error('Error deleting idea:', error);
    res.status(500).json({
      message: error.message || 'Something went wrong while deleting idea',
      success: false,
    });
  }
};

export {
  getAllCommittees,
  createCommittee,
  getAllUsersForCommittee,
  addUsersToCommittee,
  removeUserFromCommittee,
  updateCommittee,
  deleteCommittee,
  submitIdea,
  getCommitteeIdeas,
  deleteIdea,
};
