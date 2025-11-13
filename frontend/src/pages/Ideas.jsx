import React, { useState, useEffect } from 'react';
import {
  getAllCommittees,
  submitIdea,
  deleteIdea,
  getCommitteeIdeas,
  createCommittee,
  updateCommittee,
  deleteCommittee,
  getAllUsersForCommittee,
  addUsersToCommittee,
  removeUserFromCommittee,
} from '../api/committeeApi';
import { checkAdminStatus } from '../api/eventsAPI';
import { toast } from 'react-hot-toast';
import Modal from '../components/Modal';
import {
  FaLightbulb,
  FaTrash,
  FaEdit,
  FaPlus,
  FaChevronDown,
  FaChevronUp,
  FaUser,
  FaCalendar,
  FaTimes,
  FaSpinner,
  FaPaperPlane,
  FaUsers,
  FaUserPlus,
  FaUserMinus,
  FaSearch,
} from 'react-icons/fa';

const Ideas = () => {
  const [committees, setCommittees] = useState([]);
  const [ideas, setIdeas] = useState({});
  const [committeeIdeas, setCommitteeIdeas] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [expandedCommittees, setExpandedCommittees] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showManageUsersModal, setShowManageUsersModal] = useState(false);
  const [editingCommittee, setEditingCommittee] = useState(null);
  const [managingCommittee, setManagingCommittee] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [addingUsers, setAddingUsers] = useState(false);
  const [removingUser, setRemovingUser] = useState(null);

  const [newCommittee, setNewCommittee] = useState({
    name: '',
    description: '',
    members: [],
  });
  const [creatingCommittee, setCreatingCommittee] = useState(false);
  const [updatingCommittee, setUpdatingCommittee] = useState(false);

  // Modal states
  const [deleteIdeaModal, setDeleteIdeaModal] = useState({
    isOpen: false,
    ideaId: null,
    committeeId: null,
    committeeName: '',
  });
  const [deleteCommitteeModal, setDeleteCommitteeModal] = useState({
    isOpen: false,
    committeeId: null,
    committeeName: '',
  });
  const [removeUserModal, setRemoveUserModal] = useState({
    isOpen: false,
    committeeId: null,
    userId: null,
    userName: '',
    committeeName: '',
  });

  // Check admin status and load committees
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Check admin status
        const adminResponse = await checkAdminStatus();
        if (adminResponse.success) {
          setIsAdmin(adminResponse.isAdmin);
        }

        // Load committees
        await loadCommittees();
      } catch (error) {
        console.error('Error initializing data:', error);
        toast.error('Error loading committees');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Filter users based on search
  useEffect(() => {
    if (userSearch.trim()) {
      const filtered = allUsers.filter(
        user =>
          user.displayText.toLowerCase().includes(userSearch.toLowerCase()) ||
          user.email.toLowerCase().includes(userSearch.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(allUsers);
    }
  }, [userSearch, allUsers]);

  const loadCommittees = async () => {
    try {
      const committeesResponse = await getAllCommittees();
      if (committeesResponse.success) {
        setCommittees(committeesResponse.data.committees);
      } else {
        toast.error('Failed to load committees');
      }
    } catch (error) {
      console.error('Error loading committees:', error);
      throw error;
    }
  };

  const loadAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const usersResponse = await getAllUsersForCommittee();
      if (usersResponse.success) {
        setAllUsers(usersResponse.data.users);
        setFilteredUsers(usersResponse.data.users);
      } else {
        toast.error('Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Error loading users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleManageUsers = async (committee, e) => {
    e.stopPropagation();
    setManagingCommittee(committee);
    setSelectedUsers([]);
    setUserSearch('');
    await loadAllUsers();
    setShowManageUsersModal(true);
  };

  const handleAddUsers = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    setAddingUsers(true);
    try {
      const result = await addUsersToCommittee(
        managingCommittee.id,
        selectedUsers.map(user => user.id)
      );

      if (result.success) {
        toast.success(`Added ${selectedUsers.length} user(s) to committee`);
        setSelectedUsers([]);
        setUserSearch('');

        // Reload committees to reflect changes
        await loadCommittees();

        // Refresh the current committee in managing state
        const updatedCommittees = await getAllCommittees();
        if (updatedCommittees.success) {
          const updatedCommittee = updatedCommittees.data.committees.find(
            c => c.id === managingCommittee.id
          );
          if (updatedCommittee) {
            setManagingCommittee(updatedCommittee);
          }
        }
      } else {
        toast.error(result.message || 'Failed to add users');
      }
    } catch (error) {
      console.error('Error adding users:', error);
      toast.error('Error adding users');
    } finally {
      setAddingUsers(false);
    }
  };

  const handleRemoveUser = async (committeeId, userId, userName, e) => {
    e.stopPropagation();
    setRemoveUserModal({
      isOpen: true,
      committeeId,
      userId,
      userName,
      committeeName: committees.find(c => c.id === committeeId)?.name || '',
    });
  };

  const confirmRemoveUser = async () => {
    const { committeeId, userId } = removeUserModal;

    setRemovingUser(userId);
    try {
      const result = await removeUserFromCommittee(committeeId, userId);
      if (result.success) {
        toast.success('User removed from committee successfully');

        // Reload committees to reflect changes
        await loadCommittees();

        // Update managing committee if it's the same
        if (managingCommittee && managingCommittee.id === committeeId) {
          const updatedCommittees = await getAllCommittees();
          if (updatedCommittees.success) {
            const updatedCommittee = updatedCommittees.data.committees.find(
              c => c.id === committeeId
            );
            if (updatedCommittee) {
              setManagingCommittee(updatedCommittee);
            }
          }
        }
      } else {
        toast.error(result.message || 'Failed to remove user');
      }
    } catch (error) {
      console.error('Error removing user:', error);
      toast.error('Error removing user');
    } finally {
      setRemovingUser(null);
      setRemoveUserModal({
        isOpen: false,
        committeeId: null,
        userId: null,
        userName: '',
        committeeName: '',
      });
    }
  };

  const toggleUserSelection = user => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const isUserInCommittee = userId => {
    return managingCommittee?.members?.some(member => member.id === userId);
  };

  // ... (keep all the existing functions like handleIdeaChange, submitIdeaToCommittee, etc.)

  const handleIdeaChange = (committeeId, value) => {
    setIdeas(prev => ({
      ...prev,
      [committeeId]: value,
    }));

    // Clear error when user starts typing
    if (errors[committeeId]) {
      setErrors(prev => ({
        ...prev,
        [committeeId]: '',
      }));
    }
  };

  const submitIdeaToCommittee = async (committeeId, committeeName) => {
    const content = ideas[committeeId]?.trim() || '';
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;

    if (!content) {
      setErrors(prev => ({
        ...prev,
        [committeeId]: 'Please enter your idea.',
      }));
      return;
    }

    if (wordCount > 200) {
      setErrors(prev => ({
        ...prev,
        [committeeId]: 'Idea must be 200 words or less.',
      }));
      return;
    }

    setSubmitting(prev => ({ ...prev, [committeeId]: true }));
    setErrors(prev => ({ ...prev, [committeeId]: '' }));

    try {
      const result = await submitIdea(committeeId, content);
      if (result.success) {
        toast.success(`Idea submitted successfully to ${committeeName} Committee!`);

        // Clear the textarea
        setIdeas(prev => ({
          ...prev,
          [committeeId]: '',
        }));

        // Refresh ideas for this committee
        await loadCommitteeIdeas(committeeId);
      } else {
        toast.error(result.message || 'Failed to submit idea');
      }
    } catch (error) {
      console.error('Error submitting idea:', error);
      toast.error('Error submitting idea. Please try again.');
    } finally {
      setSubmitting(prev => ({ ...prev, [committeeId]: false }));
    }
  };

  const loadCommitteeIdeas = async committeeId => {
    try {
      const result = await getCommitteeIdeas(committeeId, 1, 10);
      if (result.success) {
        setCommitteeIdeas(prev => ({
          ...prev,
          [committeeId]: result.data.ideas,
        }));
      }
    } catch (error) {
      console.error('Error loading committee ideas:', error);
    }
  };

  const toggleCommitteeExpansion = async committeeId => {
    setExpandedCommittees(prev => ({
      ...prev,
      [committeeId]: !prev[committeeId],
    }));

    // Load ideas if expanding and not already loaded
    if (!expandedCommittees[committeeId] && !committeeIdeas[committeeId]) {
      await loadCommitteeIdeas(committeeId);
    }
  };

  const handleDeleteIdea = async (committeeId, ideaId, e) => {
    e.stopPropagation();

    setDeleteIdeaModal({
      isOpen: true,
      ideaId,
      committeeId,
      committeeName: committees.find(c => c.id === committeeId)?.name || '',
    });
  };

  const confirmDeleteIdea = async () => {
    const { committeeId, ideaId } = deleteIdeaModal;

    setActionLoading(prev => ({ ...prev, [`delete-idea-${ideaId}`]: true }));

    try {
      const result = await deleteIdea(ideaId);
      if (result.success) {
        toast.success('Idea deleted successfully');

        // Remove idea from state
        setCommitteeIdeas(prev => ({
          ...prev,
          [committeeId]: prev[committeeId].filter(idea => idea.id !== ideaId),
        }));
      } else {
        toast.error(result.message || 'Failed to delete idea');
      }
    } catch (error) {
      console.error('Error deleting idea:', error);
      toast.error('Error deleting idea. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`delete-idea-${ideaId}`]: false }));
      setDeleteIdeaModal({ isOpen: false, ideaId: null, committeeId: null, committeeName: '' });
    }
  };

  const handleDeleteCommittee = async (committeeId, committeeName, e) => {
    e.stopPropagation();

    setDeleteCommitteeModal({
      isOpen: true,
      committeeId,
      committeeName,
    });
  };

  const confirmDeleteCommittee = async () => {
    const { committeeId, committeeName } = deleteCommitteeModal;

    setActionLoading(prev => ({ ...prev, [`delete-committee-${committeeId}`]: true }));

    try {
      const result = await deleteCommittee(committeeId);
      if (result.success) {
        toast.success('Committee deleted successfully');

        // Remove committee from state
        setCommittees(prev => prev.filter(committee => committee.id !== committeeId));

        // Clear related state
        setIdeas(prev => {
          const newIdeas = { ...prev };
          delete newIdeas[committeeId];
          return newIdeas;
        });

        setCommitteeIdeas(prev => {
          const newCommitteeIdeas = { ...prev };
          delete newCommitteeIdeas[committeeId];
          return newCommitteeIdeas;
        });

        setExpandedCommittees(prev => {
          const newExpanded = { ...prev };
          delete newExpanded[committeeId];
          return newExpanded;
        });
      } else {
        toast.error(result.message || 'Failed to delete committee');
      }
    } catch (error) {
      console.error('Error deleting committee:', error);
      toast.error('Error deleting committee. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`delete-committee-${committeeId}`]: false }));
      setDeleteCommitteeModal({ isOpen: false, committeeId: null, committeeName: '' });
    }
  };

  const handleEditCommittee = (committee, e) => {
    e.stopPropagation();
    setEditingCommittee(committee);
    setNewCommittee({
      name: committee.name,
      description: committee.description || '',
      members: [],
    });
    setShowEditModal(true);
  };

  const handleCreateCommittee = async e => {
    e.preventDefault();

    if (!newCommittee.name.trim()) {
      toast.error('Please enter a committee name');
      return;
    }

    setCreatingCommittee(true);

    try {
      const result = await createCommittee({
        name: newCommittee.name.trim(),
        description: newCommittee.description.trim(),
        memberIds: [],
      });

      if (result.success) {
        toast.success('Committee created successfully!');
        setShowCreateModal(false);
        setNewCommittee({ name: '', description: '', members: [] });

        // Reload committees to show the new one
        await loadCommittees();
      } else {
        toast.error(result.message || 'Failed to create committee');
      }
    } catch (error) {
      console.error('Error creating committee:', error);
      toast.error('Error creating committee. Please try again.');
    } finally {
      setCreatingCommittee(false);
    }
  };

  const handleUpdateCommittee = async e => {
    e.preventDefault();

    if (!newCommittee.name.trim()) {
      toast.error('Please enter a committee name');
      return;
    }

    setUpdatingCommittee(true);

    try {
      const result = await updateCommittee(editingCommittee.id, {
        name: newCommittee.name.trim(),
        description: newCommittee.description.trim(),
        memberIds: [],
      });

      if (result.success) {
        toast.success('Committee updated successfully!');
        setShowEditModal(false);
        setEditingCommittee(null);
        setNewCommittee({ name: '', description: '', members: [] });

        // Reload committees to show the updated one
        await loadCommittees();
      } else {
        toast.error(result.message || 'Failed to update committee');
      }
    } catch (error) {
      console.error('Error updating committee:', error);
      toast.error('Error updating committee. Please try again.');
    } finally {
      setUpdatingCommittee(false);
    }
  };

  const handleKeyPress = (committeeId, committeeName, e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      submitIdeaToCommittee(committeeId, committeeName);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-xl text-[#004d40]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004d40] mr-4"></div>
        Loading committees...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] font-sans">
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">
        <section className="bg-white rounded-xl shadow-sm p-6 sm:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-[#004D40] p-3 rounded-lg">
                <FaLightbulb className="text-white text-2xl" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#004D40]">Share Your Ideas</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Contribute to celebration committees with your innovative ideas
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
              {isAdmin && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                  Admin Mode
                </div>
              )}
              {isAdmin && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  <FaPlus className="text-sm" />
                  Create Committee
                </button>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {committees.length > 0 ? (
              committees.map(committee => (
                <div
                  key={committee.id}
                  className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-[#004D40] cursor-pointer transition-all duration-200 hover:shadow-md relative"
                  onClick={() => toggleCommitteeExpansion(committee.id)}
                >
                  {/* Admin Actions */}
                  {isAdmin && (
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button
                        onClick={e => handleManageUsers(committee, e)}
                        className="bg-purple-500 text-white p-2 rounded-lg hover:bg-purple-600 transition-colors duration-200 transform hover:scale-105"
                        title="Manage Members"
                      >
                        <FaUsers className="text-sm" />
                      </button>
                      <button
                        onClick={e => handleEditCommittee(committee, e)}
                        className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 transform hover:scale-105"
                        title="Edit Committee"
                      >
                        <FaEdit className="text-sm" />
                      </button>
                      <button
                        onClick={e => handleDeleteCommittee(committee.id, committee.name, e)}
                        disabled={actionLoading[`delete-committee-${committee.id}`]}
                        className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        title="Delete Committee"
                      >
                        {actionLoading[`delete-committee-${committee.id}`] ? (
                          <FaSpinner className="text-sm animate-spin" />
                        ) : (
                          <FaTrash className="text-sm" />
                        )}
                      </button>
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-200 pr-16">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-[#004D40] mb-1">
                        {committee.name} Committee
                      </h3>
                      {committee.description && (
                        <p className="text-gray-600 text-sm">{committee.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <FaUsers className="text-xs" />
                          {committee.memberCount || committee.members?.length || 0} members
                        </span>
                        {committee.isUserMember && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                            Member
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      className="text-[#004D40] hover:text-[#00796B] transition-colors duration-200 p-1"
                      onClick={e => {
                        e.stopPropagation();
                        toggleCommitteeExpansion(committee.id);
                      }}
                    >
                      {expandedCommittees[committee.id] ? (
                        <FaChevronUp className="text-lg" />
                      ) : (
                        <FaChevronDown className="text-lg" />
                      )}
                    </button>
                  </div>

                  {expandedCommittees[committee.id] && (
                    <div className="mt-4 pt-4 border-t border-gray-200 animate-fadeIn">
                      {/* Committee Members Section (Admin only) */}
                      {isAdmin && committee.members && committee.members.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-semibold text-[#004D40] mb-3 flex items-center gap-2">
                            <FaUsers className="text-purple-500" />
                            Committee Members:
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                            {committee.members.map((member, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200"
                              >
                                <div className="flex items-center gap-3">
                                  {member.profilepic ? (
                                    <img
                                      src={member.profilepic}
                                      alt={member.name}
                                      className="w-8 h-8 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                      <FaUser className="text-gray-600 text-sm" />
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-sm font-medium text-gray-700">
                                      {member.displayText || member.name}
                                    </p>
                                    {member.email && (
                                      <p className="text-xs text-gray-500">{member.email}</p>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={e =>
                                    handleRemoveUser(committee.id, member.id, member.name, e)
                                  }
                                  disabled={removingUser === member.id}
                                  className="text-red-500 hover:text-red-700 p-1 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Remove from committee"
                                >
                                  {removingUser === member.id ? (
                                    <FaSpinner className="animate-spin text-xs" />
                                  ) : (
                                    <FaUserMinus className="text-xs" />
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Idea Submission */}
                      {committee.isUserMember && (
                        <div className="mb-6">
                          <h4 className="font-semibold text-[#004D40] mb-3 flex items-center gap-2">
                            <FaLightbulb className="text-yellow-500" />
                            Share Your Idea:
                          </h4>
                          <textarea
                            value={ideas[committee.id] || ''}
                            onChange={e => handleIdeaChange(committee.id, e.target.value)}
                            onKeyPress={e => handleKeyPress(committee.id, committee.name, e)}
                            maxLength="1200"
                            placeholder="Share your idea (max 200 words)... Press Ctrl+Enter to submit"
                            className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-vertical focus:outline-none focus:border-[#004D40] focus:ring-2 focus:ring-[#004D40] focus:ring-opacity-20 transition-colors text-gray-700 placeholder-gray-400"
                            onClick={e => e.stopPropagation()}
                          />

                          <div
                            className={`mb-3 transition-all duration-200 ${
                              errors[committee.id]
                                ? 'opacity-100 max-h-20'
                                : 'opacity-0 max-h-0 overflow-hidden'
                            }`}
                          >
                            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border-l-3 border-red-600">
                              {errors[committee.id]}
                            </div>
                          </div>

                          <button
                            onClick={e => {
                              e.stopPropagation();
                              submitIdeaToCommittee(committee.id, committee.name);
                            }}
                            disabled={submitting[committee.id]}
                            className="bg-[#004D40] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#00796B] transform hover:-translate-y-0.5 transition-all duration-200 active:translate-y-0 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                          >
                            {submitting[committee.id] ? (
                              <>
                                <FaSpinner className="animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              <>
                                <FaPaperPlane />
                                Submit to {committee.name} Committee
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Previous Ideas */}
                      <div>
                        <h4 className="font-semibold text-[#004D40] mb-3 flex items-center gap-2">
                          <FaUser className="text-blue-500" />
                          Previous Ideas ({committeeIdeas[committee.id]?.length || 0}):
                        </h4>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                          {committeeIdeas[committee.id] &&
                          committeeIdeas[committee.id].length > 0 ? (
                            committeeIdeas[committee.id].map(idea => (
                              <div
                                key={idea.id}
                                className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative group hover:bg-gray-100 transition-colors duration-200"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-2">
                                    <FaUser className="text-gray-400 text-sm" />
                                    <span className="text-sm text-[#004D40] font-medium">
                                      {idea.author}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <FaCalendar className="text-gray-400 text-xs" />
                                    <span className="text-xs text-gray-500">
                                      {new Date(idea.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                                  {idea.content}
                                </p>

                                {/* Admin Delete Button */}
                                {isAdmin && (
                                  <button
                                    onClick={e => handleDeleteIdea(committee.id, idea.id, e)}
                                    disabled={actionLoading[`delete-idea-${idea.id}`]}
                                    className="absolute top-3 right-3 bg-red-500 text-white p-1.5 rounded-md hover:bg-red-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100 transform hover:scale-110"
                                    title="Delete Idea"
                                  >
                                    {actionLoading[`delete-idea-${idea.id}`] ? (
                                      <FaSpinner className="text-xs animate-spin" />
                                    ) : (
                                      <FaTimes className="text-xs" />
                                    )}
                                  </button>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                              <FaLightbulb className="text-4xl text-gray-300 mx-auto mb-3" />
                              <p className="text-lg font-medium mb-1">No ideas submitted yet</p>
                              <p className="text-sm">Be the first to share your thoughts!</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
                <FaLightbulb className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-700 mb-2">No Committees Available</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  {isAdmin
                    ? 'Get started by creating the first committee to collect ideas!'
                    : 'There are no committees to display yet. Please check back later.'}
                </p>
                {isAdmin && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 mx-auto"
                  >
                    <FaPlus />
                    Create First Committee
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Create Committee Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <FaPlus className="text-green-600 text-lg" />
              </div>
              <h3 className="text-2xl font-bold text-[#004D40]">Create New Committee</h3>
            </div>

            <form onSubmit={handleCreateCommittee}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Committee Name *
                  </label>
                  <input
                    type="text"
                    value={newCommittee.name}
                    onChange={e => setNewCommittee(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Finance Committee"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#004D40] focus:ring-2 focus:ring-[#004D40] focus:ring-opacity-20 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newCommittee.description}
                    onChange={e =>
                      setNewCommittee(prev => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Brief description of the committee's purpose..."
                    rows="3"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#004D40] focus:ring-2 focus:ring-[#004D40] focus:ring-opacity-20 resize-vertical transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors duration-200 flex items-center justify-center gap-2"
                  disabled={creatingCommittee}
                >
                  <FaTimes />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCommittee || !newCommittee.name.trim()}
                  className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creatingCommittee ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FaPlus />
                      Create Committee
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Committee Modal */}
      {showEditModal && editingCommittee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FaEdit className="text-blue-600 text-lg" />
              </div>
              <h3 className="text-2xl font-bold text-[#004D40]">Edit Committee</h3>
            </div>

            <form onSubmit={handleUpdateCommittee}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Committee Name *
                  </label>
                  <input
                    type="text"
                    value={newCommittee.name}
                    onChange={e => setNewCommittee(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Finance Committee"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#004D40] focus:ring-2 focus:ring-[#004D40] focus:ring-opacity-20 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newCommittee.description}
                    onChange={e =>
                      setNewCommittee(prev => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Brief description of the committee's purpose..."
                    rows="3"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#004D40] focus:ring-2 focus:ring-[#004D40] focus:ring-opacity-20 resize-vertical transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCommittee(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors duration-200 flex items-center justify-center gap-2"
                  disabled={updatingCommittee}
                >
                  <FaTimes />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingCommittee || !newCommittee.name.trim()}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {updatingCommittee ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <FaEdit />
                      Update Committee
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Users Modal */}
      {showManageUsersModal && managingCommittee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 p-6 border-b border-gray-200">
              <div className="bg-purple-100 p-2 rounded-lg">
                <FaUsers className="text-purple-600 text-lg" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#004D40]">Manage Committee Members</h3>
                <p className="text-gray-600 text-sm">
                  {managingCommittee.name} Committee - {managingCommittee.members?.length || 0}{' '}
                  current members
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Search and Selection */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex gap-3 mb-4">
                  <div className="flex-1 relative">
                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      placeholder="Search users by name or email..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#004D40] focus:ring-2 focus:ring-[#004D40] focus:ring-opacity-20 transition-colors"
                    />
                  </div>
                  <button
                    onClick={handleAddUsers}
                    disabled={selectedUsers.length === 0 || addingUsers}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {addingUsers ? <FaSpinner className="animate-spin" /> : <FaUserPlus />}
                    Add Selected ({selectedUsers.length})
                  </button>
                </div>

                {selectedUsers.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-blue-800 text-sm font-medium mb-2">Selected users to add:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedUsers.map(user => (
                        <span
                          key={user.id}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                        >
                          {user.displayText}
                          <button
                            onClick={() => toggleUserSelection(user)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FaTimes className="text-xs" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Users List */}
              <div className="flex-1 overflow-y-auto p-6">
                {loadingUsers ? (
                  <div className="flex justify-center items-center py-8">
                    <FaSpinner className="animate-spin text-2xl text-[#004D40] mr-3" />
                    <span className="text-gray-600">Loading users...</span>
                  </div>
                ) : filteredUsers.length > 0 ? (
                  <div className="grid gap-3">
                    {filteredUsers.map(user => (
                      <div
                        key={user.id}
                        className={`flex items-center justify-between p-4 border rounded-lg transition-colors duration-200 ${
                          isUserInCommittee(user.id)
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          {user.profilepic ? (
                            <img
                              src={user.profilepic}
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                              <FaUser className="text-gray-600" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{user.displayText}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <div className="flex gap-2 mt-1">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                {user.role}
                              </span>
                              {user.batch && (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                  {user.batch}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {isUserInCommittee(user.id) ? (
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                              Member
                            </span>
                          ) : (
                            <button
                              onClick={() => toggleUserSelection(user)}
                              className={`p-2 rounded-lg transition-colors duration-200 ${
                                selectedUsers.some(u => u.id === user.id)
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                              title={
                                selectedUsers.some(u => u.id === user.id)
                                  ? 'Deselect user'
                                  : 'Select user to add'
                              }
                            >
                              {selectedUsers.some(u => u.id === user.id) ? (
                                <FaTimes className="text-sm" />
                              ) : (
                                <FaUserPlus className="text-sm" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FaUser className="text-4xl text-gray-300 mx-auto mb-3" />
                    <p className="text-lg font-medium mb-1">No users found</p>
                    <p className="text-sm">
                      {userSearch ? 'Try a different search term' : 'No users available to add'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowManageUsersModal(false);
                  setManagingCommittee(null);
                  setSelectedUsers([]);
                  setUserSearch('');
                }}
                className="w-full bg-gray-300 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <FaTimes />
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Idea Modal */}
      <Modal
        isOpen={deleteIdeaModal.isOpen}
        onClose={() =>
          setDeleteIdeaModal({ isOpen: false, ideaId: null, committeeId: null, committeeName: '' })
        }
        onConfirm={confirmDeleteIdea}
        title="Delete Idea"
        message="Are you sure you want to delete this idea? This action cannot be undone."
        confirmText="Delete Idea"
        cancelText="Cancel"
        type="danger"
        isLoading={actionLoading[`delete-idea-${deleteIdeaModal.ideaId}`]}
      />

      {/* Delete Committee Modal */}
      <Modal
        isOpen={deleteCommitteeModal.isOpen}
        onClose={() =>
          setDeleteCommitteeModal({ isOpen: false, committeeId: null, committeeName: '' })
        }
        onConfirm={confirmDeleteCommittee}
        title="Delete Committee"
        message={`Are you sure you want to delete the "${deleteCommitteeModal.committeeName}" committee? This will also delete all associated ideas and cannot be undone.`}
        confirmText="Delete Committee"
        cancelText="Cancel"
        type="danger"
        isLoading={actionLoading[`delete-committee-${deleteCommitteeModal.committeeId}`]}
      />

      {/* Remove User Modal */}
      <Modal
        isOpen={removeUserModal.isOpen}
        onClose={() =>
          setRemoveUserModal({
            isOpen: false,
            committeeId: null,
            userId: null,
            userName: '',
            committeeName: '',
          })
        }
        onConfirm={confirmRemoveUser}
        title="Remove User from Committee"
        message={`Are you sure you want to remove "${removeUserModal.userName}" from the "${removeUserModal.committeeName}" committee?`}
        confirmText="Remove User"
        cancelText="Cancel"
        type="danger"
        isLoading={removingUser === removeUserModal.userId}
      />

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Ideas;
