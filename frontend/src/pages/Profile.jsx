import React, { useState, useEffect } from 'react';
import { getUserProfile, updateUserProfile } from '../api/authApi';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Form states
  const [studentFormData, setStudentFormData] = useState({
    name: '',
    surname: '',
    mobile: '',
    email: '',
    profilePic: null,
    presentCity: '',
    Matriculationbatch: '',
    Intermediatebatch: '',
    profession: '',
    presentOrganization: '',
    joiningyear: '',
  });

  const [teacherFormData, setTeacherFormData] = useState({
    name: '',
    surname: '',
    mobile: '',
    email: '',
    profilePic: null,
    presentCity: '',
    joiningyear: '',
    presentstatus: '',
    presentSchool: '',
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [years, setYears] = useState([]);
  const [availableFields, setAvailableFields] = useState({});

  // Generate years from 1950 to 2025
  useEffect(() => {
    const yearsArray = [];
    for (let y = 1950; y <= 2025; y++) {
      yearsArray.push(y.toString());
    }
    setYears(yearsArray);
  }, []);

  // Fetch user profile on component mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await getUserProfile();

      if (response.success && response.data.user) {
        const userData = response.data.user;

        setUser(userData);

        // Determine which fields are available
        const fields = {
          name: !!userData.name,
          surname: !!userData.surname,
          mobile: !!userData.mobile,
          email: !!userData.email,
          profilepic: !!userData.profilepic,
          presentcity: !!userData.presentcity,
          Matriculationbatch: !!userData.Matriculationbatch,
          Intermediatebatch: !!userData.Intermediatebatch,
          profession: !!(userData.professions && userData.professions.length > 0),
          presentOrganization: !!userData.presentOrganization,
          joiningyear: !!userData.joiningyear,
          presentstatus: !!(userData.presentStatuses && userData.presentStatuses.length > 0),
        };
        setAvailableFields(fields);

        // Populate form data based on user role
        if (userData.roles && userData.roles.length > 0) {
          const isStudent =
            userData.roles.includes('Alumni Student') || userData.roles.includes('Present Student');
          const isTeacher =
            userData.roles.includes('Alumni Teacher') || userData.roles.includes('Present Teacher');

          if (isStudent) {
            setStudentFormData({
              name: userData.name || '',
              surname: userData.surname || '',
              mobile: userData.mobile || '',
              email: userData.email || '',
              profilePic: null,
              presentCity: userData.presentcity || '',
              Matriculationbatch: userData.Matriculationbatch || '',
              Intermediatebatch: userData.Intermediatebatch || '',
              profession:
                userData.professions && userData.professions.length > 0
                  ? userData.professions[0]
                  : '',
              presentOrganization: userData.presentOrganization || '',
              joiningyear: userData.joiningyear || '',
            });
          } else if (isTeacher) {
            setTeacherFormData({
              name: userData.name || '',
              surname: userData.surname || '',
              mobile: userData.mobile || '',
              email: userData.email || '',
              profilePic: null,
              presentCity: userData.presentcity || '',
              joiningyear: userData.joiningyear || '',
              presentstatus:
                userData.presentStatuses && userData.presentStatuses.length > 0
                  ? userData.presentStatuses[0]
                  : '',
              presentSchool: userData.presentOrganization || '',
            });
          }
        }
      } else {
        setMessage(response.message || 'Failed to fetch profile');
      }
    } catch (error) {
      setMessage('Error fetching profile');
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const professions = [
    'Academician/Professor/Teacher',
    'Administrative Services (IAS/WBCS/Other)',
    'Armed Forces/Defense',
    'Artist/Musician/Performer',
    'Banking/Insurance/Finance',
    'Business Owner/Entrepreneur',
    'Chartered Accountant',
    'Data/Analytics/AI Professional',
    'Engineer (Core-Civil/Mech/Electrical etc.)',
    'Engineer (Software/IT)',
    'Government Employee (Non-Administrative)',
    'Hospitality/Travel/Tourism',
    'Journalist/Media Professional',
    'Legal Professional/Advocate/Judge',
    'Marketing/Advertising/PR',
    'Medical-Doctor',
    'Medical-Healthcare Professional (Non-doctor)',
    'NGO/Social and Development Sector',
    'Pharmaceutical/Biotech Professional',
    'Police/Law Enforcement',
    'Politician/Public Representative',
    'Researcher/Scientist',
    'Retired',
    'Sportsperson/Coach',
    'Student (Higher Studies)',
    'Tech Startup Employee',
    'Writer/Author/Blogger',
    'Other',
  ];

  const presentStatusOptions = [
    'Retired',
    'Working in current organization',
    'Working in other organization',
  ];

  const handleStudentInputChange = e => {
    const { name, value } = e.target;
    setStudentFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTeacherInputChange = e => {
    const { name, value } = e.target;
    setTeacherFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e, formType) => {
    const file = e.target.files[0];
    if (formType === 'student') {
      setStudentFormData(prev => ({
        ...prev,
        profilePic: file,
      }));
    } else {
      setTeacherFormData(prev => ({
        ...prev,
        profilePic: file,
      }));
    }
  };

  const validateStudentForm = () => {
    const newErrors = {};

    // Name validation - only if field is available
    if (availableFields.name && !/^[A-Za-z\s]+$/.test(studentFormData.name.trim())) {
      newErrors.studentName = 'Please enter a valid name (letters only).';
    }

    // Surname validation - only if field is available
    if (availableFields.surname && !/^[A-Za-z\s]+$/.test(studentFormData.surname.trim())) {
      newErrors.studentSurname = 'Please enter a valid surname (letters only).';
    }

    // Mobile validation - only if field is available
    if (
      availableFields.mobile &&
      studentFormData.mobile &&
      !/^\d{10}$/.test(studentFormData.mobile.trim())
    ) {
      newErrors.studentMobile = 'Please enter a valid 10-digit mobile number.';
    }

    // Email validation - only if field is available
    if (
      availableFields.email &&
      !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(studentFormData.email.trim())
    ) {
      newErrors.studentEmail = 'Please enter a valid email address.';
    }

    // Profile picture validation (optional)
    if (
      studentFormData.profilePic &&
      !/\.(jpg|jpeg|png|gif)$/i.test(studentFormData.profilePic.name)
    ) {
      newErrors.studentProfilePic = 'Please upload a valid image file (JPG, JPEG, PNG, GIF).';
    }

    // City validation - only if field is available
    if (
      availableFields.presentcity &&
      studentFormData.presentCity &&
      !/^[A-Za-z\s]+$/.test(studentFormData.presentCity.trim())
    ) {
      newErrors.studentCity = 'Please enter a valid city name.';
    }

    return newErrors;
  };

  const validateTeacherForm = () => {
    const newErrors = {};

    // Name validation - only if field is available
    if (availableFields.name && !/^[A-Za-z\s]+$/.test(teacherFormData.name.trim())) {
      newErrors.teacherName = 'Please enter a valid name (letters only).';
    }

    // Surname validation - only if field is available
    if (availableFields.surname && !/^[A-Za-z\s]+$/.test(teacherFormData.surname.trim())) {
      newErrors.teacherSurname = 'Please enter a valid surname (letters only).';
    }

    // Mobile validation - only if field is available
    if (
      availableFields.mobile &&
      teacherFormData.mobile &&
      !/^\d{10}$/.test(teacherFormData.mobile.trim())
    ) {
      newErrors.teacherMobile = 'Please enter a valid 10-digit mobile number.';
    }

    // Email validation - only if field is available
    if (
      availableFields.email &&
      !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(teacherFormData.email.trim())
    ) {
      newErrors.teacherEmail = 'Please enter a valid email address.';
    }

    // Profile picture validation (optional)
    if (
      teacherFormData.profilePic &&
      !/\.(jpg|jpeg|png|gif)$/i.test(teacherFormData.profilePic.name)
    ) {
      newErrors.teacherProfilePic = 'Please upload a valid image file (JPG, JPEG, PNG, GIF).';
    }

    // City validation - only if field is available
    if (
      availableFields.presentcity &&
      teacherFormData.presentCity &&
      !/^[A-Za-z\s]+$/.test(teacherFormData.presentCity.trim())
    ) {
      newErrors.teacherCity = 'Please enter a valid city name.';
    }

    return newErrors;
  };

  const handleStudentSubmit = async e => {
    e.preventDefault();
    const newErrors = validateStudentForm();

    if (Object.keys(newErrors).length === 0) {
      await updateProfile(studentFormData, 'student');
    } else {
      setErrors(newErrors);
    }
  };

  const handleTeacherSubmit = async e => {
    e.preventDefault();
    const newErrors = validateTeacherForm();

    if (Object.keys(newErrors).length === 0) {
      await updateProfile(teacherFormData, 'teacher');
    } else {
      setErrors(newErrors);
    }
  };

  const updateProfile = async (formData, userType) => {
    try {
      setUpdating(true);
      setMessage('');

      const formDataToSend = new FormData();

      // Add common fields only if they are available
      if (availableFields.name) formDataToSend.append('name', formData.name);
      if (availableFields.surname) formDataToSend.append('surname', formData.surname);
      if (availableFields.mobile) formDataToSend.append('mobile', formData.mobile);
      if (availableFields.presentcity) formDataToSend.append('presentcity', formData.presentCity);

      // Add role-specific fields only if they are available
      if (userType === 'student') {
        if (availableFields.Matriculationbatch && formData.Matriculationbatch)
          formDataToSend.append('Matriculationbatch', formData.Matriculationbatch);
        if (availableFields.Intermediatebatch && formData.Intermediatebatch)
          formDataToSend.append('Intermediatebatch', formData.Intermediatebatch);
        if (availableFields.profession && formData.profession)
          formDataToSend.append('profession', formData.profession);
        if (availableFields.presentOrganization && formData.presentOrganization)
          formDataToSend.append('presentOrganization', formData.presentOrganization);
        if (availableFields.joiningyear && formData.joiningyear)
          formDataToSend.append('joiningyear', formData.joiningyear);
      } else {
        if (availableFields.joiningyear && formData.joiningyear)
          formDataToSend.append('joiningyear', formData.joiningyear);
        if (availableFields.presentstatus && formData.presentstatus)
          formDataToSend.append('presentstatus', formData.presentstatus);
        if (availableFields.presentOrganization && formData.presentSchool)
          formDataToSend.append('presentOrganization', formData.presentSchool);
      }

      // Add profile picture if selected
      if (formData.profilePic) {
        formDataToSend.append('image', formData.profilePic);
      }

      const response = await updateUserProfile(formDataToSend);

      if (response.success) {
        setMessage('Profile updated successfully!');
        // Refresh user data
        await fetchUserProfile();
      } else {
        setMessage(response.message || 'Failed to update profile');
      }
    } catch (error) {
      setMessage('Error updating profile');
      console.error('Error updating profile:', error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-5 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <p>Loading profile...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="max-w-2xl mx-auto px-5 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <p>Failed to load user profile</p>
        </div>
      </main>
    );
  }

  // Fixed role checking logic
  const isStudent =
    user.roles && (user.roles.includes('Alumni Student') || user.roles.includes('Present Student'));

  const isTeacher =
    user.roles && (user.roles.includes('Alumni Teacher') || user.roles.includes('Present Teacher'));

  const displayName = `${user.name || ''} ${user.surname || ''}`.trim();

  return (
    <main className="max-w-2xl mx-auto px-5 py-8">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-[#004d40] text-2xl font-semibold text-center mb-5">
          Edit my profile - {displayName || 'User'}
        </h2>

        {message && (
          <div
            className={`mb-4 p-3 rounded-lg text-center ${
              message.includes('successfully')
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {message}
          </div>
        )}
        {/* Student Form */}
        {isStudent && (
          <form className="flex flex-col gap-4" onSubmit={handleStudentSubmit}>
            {/* Name Field - only show if available */}
            {availableFields.name && (
              <div className="flex flex-col">
                <label htmlFor="studentName" className="font-semibold mb-1 text-gray-800">
                  Name *
                </label>
                <input
                  type="text"
                  id="studentName"
                  name="name"
                  value={studentFormData.name}
                  onChange={handleStudentInputChange}
                  className={`px-3 py-2 border rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:border-[#004d40] ${
                    errors.studentName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.studentName && (
                  <span className="text-red-600 text-sm mt-1">{errors.studentName}</span>
                )}
              </div>
            )}

            {/* Surname Field - only show if available */}
            {availableFields.surname && (
              <div className="flex flex-col">
                <label htmlFor="studentSurname" className="font-semibold mb-1 text-gray-800">
                  Surname *
                </label>
                <input
                  type="text"
                  id="studentSurname"
                  name="surname"
                  value={studentFormData.surname}
                  onChange={handleStudentInputChange}
                  className={`px-3 py-2 border rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:border-[#004d40] ${
                    errors.studentSurname ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.studentSurname && (
                  <span className="text-red-600 text-sm mt-1">{errors.studentSurname}</span>
                )}
              </div>
            )}

            {/* Mobile Field - only show if available */}
            {availableFields.mobile && (
              <div className="flex flex-col">
                <label htmlFor="studentMobile" className="font-semibold mb-1 text-gray-800">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  id="studentMobile"
                  name="mobile"
                  value={studentFormData.mobile}
                  onChange={handleStudentInputChange}
                  className={`px-3 py-2 border rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:border-[#004d40] ${
                    errors.studentMobile ? 'border-red-500' : 'border-gray-300'
                  }`}
                  pattern="[0-9]{10}"
                />
                {errors.studentMobile && (
                  <span className="text-red-600 text-sm mt-1">{errors.studentMobile}</span>
                )}
              </div>
            )}

            {/* Email Field - only show if available */}
            {availableFields.email && (
              <div className="flex flex-col">
                <label htmlFor="studentEmail" className="font-semibold mb-1 text-gray-800">
                  Email ID *
                </label>
                <input
                  type="email"
                  id="studentEmail"
                  name="email"
                  value={studentFormData.email}
                  onChange={handleStudentInputChange}
                  className={`px-3 py-2 border rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:border-[#004d40] ${
                    errors.studentEmail ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                  disabled
                />
                <span className="text-sm text-gray-500 mt-1">Email cannot be changed</span>
                {errors.studentEmail && (
                  <span className="text-red-600 text-sm mt-1">{errors.studentEmail}</span>
                )}
              </div>
            )}

            {/* Profile Picture Field - always available for upload */}
            <div className="flex flex-col">
              <label htmlFor="studentProfilePic" className="font-semibold mb-1 text-gray-800">
                Profile Picture
              </label>
              <input
                type="file"
                id="studentProfilePic"
                name="profilePic"
                onChange={e => handleFileChange(e, 'student')}
                accept="image/*"
                className={`px-1 py-2 border rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:border-[#004d40] ${
                  errors.studentProfilePic ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {user.profilepic && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Current profile picture:</p>
                  <img
                    src={user.profilepic}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover mt-1"
                  />
                </div>
              )}
              {errors.studentProfilePic && (
                <span className="text-red-600 text-sm mt-1">{errors.studentProfilePic}</span>
              )}
            </div>

            {/* Present City Field - only show if available */}
            {availableFields.presentcity && (
              <div className="flex flex-col">
                <label htmlFor="studentCity" className="font-semibold mb-1 text-gray-800">
                  Present City
                </label>
                <input
                  type="text"
                  id="studentCity"
                  name="presentCity"
                  value={studentFormData.presentCity}
                  onChange={handleStudentInputChange}
                  className={`px-3 py-2 border rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:border-[#004d40] ${
                    errors.studentCity ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.studentCity && (
                  <span className="text-red-600 text-sm mt-1">{errors.studentCity}</span>
                )}
              </div>
            )}

            {/* Matriculation Batch Field - only show if available */}
            {availableFields.Matriculationbatch && (
              <div className="flex flex-col">
                <label htmlFor="studentBatch" className="font-semibold mb-1 text-gray-800">
                  Madhyamik/Matriculation Batch
                </label>
                <select
                  id="studentBatch"
                  name="Matriculationbatch"
                  value={studentFormData.Matriculationbatch}
                  onChange={handleStudentInputChange}
                  className={`px-3 py-2 border rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:border-[#004d40] ${
                    errors.studentBatch ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">-- Select Year --</option>
                  {years.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                {errors.studentBatch && (
                  <span className="text-red-600 text-sm mt-1">{errors.studentBatch}</span>
                )}
              </div>
            )}

            {/* Intermediate Batch Field - only show if available */}
            {availableFields.Intermediatebatch && (
              <div className="flex flex-col">
                <label htmlFor="studentInterBatch" className="font-semibold mb-1 text-gray-800">
                  Uccha Madhyamik/Intermediate Batch
                </label>
                <select
                  id="studentInterBatch"
                  name="Intermediatebatch"
                  value={studentFormData.Intermediatebatch}
                  onChange={handleStudentInputChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:border-[#004d40]"
                >
                  <option value="">-- Select --</option>
                  {years.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Profession Field - only show if available */}
            {availableFields.profession && (
              <div className="flex flex-col">
                <label htmlFor="studentProfession" className="font-semibold mb-1 text-gray-800">
                  Profession
                </label>
                <select
                  id="studentProfession"
                  name="profession"
                  value={studentFormData.profession}
                  onChange={handleStudentInputChange}
                  className={`px-3 py-2 border rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:border-[#004d40] ${
                    errors.studentProfession ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">-- Select Profession --</option>
                  {professions.map(profession => (
                    <option key={profession} value={profession}>
                      {profession}
                    </option>
                  ))}
                </select>
                {errors.studentProfession && (
                  <span className="text-red-600 text-sm mt-1">{errors.studentProfession}</span>
                )}
              </div>
            )}

            {/* Organization Field - only show if available */}
            {availableFields.presentOrganization && (
              <div className="flex flex-col">
                <label htmlFor="studentOrg" className="font-semibold mb-1 text-gray-800">
                  Present/Last Organization
                </label>
                <input
                  type="text"
                  id="studentOrg"
                  name="presentOrganization"
                  value={studentFormData.presentOrganization}
                  onChange={handleStudentInputChange}
                  className={`px-3 py-2 border rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:border-[#004d40] ${
                    errors.studentOrg ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.studentOrg && (
                  <span className="text-red-600 text-sm mt-1">{errors.studentOrg}</span>
                )}
              </div>
            )}

            {/* Joining Year Field - only show if available */}
            {availableFields.joiningyear && (
              <div className="flex flex-col">
                <label htmlFor="studentJoiningYear" className="font-semibold mb-1 text-gray-800">
                  Joining Year
                </label>
                <select
                  id="studentJoiningYear"
                  name="joiningyear"
                  value={studentFormData.joiningyear}
                  onChange={handleStudentInputChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:border-[#004d40]"
                >
                  <option value="">-- Select Year --</option>
                  {years.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={updating}
              className="bg-[#004d40] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#00796b] transition-colors duration-300 mt-5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        )}

        {/* Teacher Form */}
        {(isTeacher || (!isStudent && !isTeacher)) && (
          <form className="flex flex-col gap-4" onSubmit={handleTeacherSubmit}>
            {/* Name Field - only show if available */}
            {availableFields.name && (
              <div className="flex flex-col">
                <label htmlFor="teacherName" className="font-semibold mb-1 text-gray-800">
                  Name *
                </label>
                <input
                  type="text"
                  id="teacherName"
                  name="name"
                  value={teacherFormData.name}
                  onChange={handleTeacherInputChange}
                  className={`px-3 py-2 border rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:border-[#004d40] ${
                    errors.teacherName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.teacherName && (
                  <span className="text-red-600 text-sm mt-1">{errors.teacherName}</span>
                )}
              </div>
            )}

            {/* Surname Field - only show if available */}
            {availableFields.surname && (
              <div className="flex flex-col">
                <label htmlFor="teacherSurname" className="font-semibold mb-1 text-gray-800">
                  Surname *
                </label>
                <input
                  type="text"
                  id="teacherSurname"
                  name="surname"
                  value={teacherFormData.surname}
                  onChange={handleTeacherInputChange}
                  className={`px-3 py-2 border rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:border-[#004d40] ${
                    errors.teacherSurname ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.teacherSurname && (
                  <span className="text-red-600 text-sm mt-1">{errors.teacherSurname}</span>
                )}
              </div>
            )}

            {/* Mobile Field - only show if available */}
            {availableFields.mobile && (
              <div className="flex flex-col">
                <label htmlFor="teacherMobile" className="font-semibold mb-1 text-gray-800">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  id="teacherMobile"
                  name="mobile"
                  value={teacherFormData.mobile}
                  onChange={handleTeacherInputChange}
                  className={`px-3 py-2 border rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:border-[#004d40] ${
                    errors.teacherMobile ? 'border-red-500' : 'border-gray-300'
                  }`}
                  pattern="[0-9]{10}"
                />
                {errors.teacherMobile && (
                  <span className="text-red-600 text-sm mt-1">{errors.teacherMobile}</span>
                )}
              </div>
            )}

            {/* Email Field - only show if available */}
            {availableFields.email && (
              <div className="flex flex-col">
                <label htmlFor="teacherEmail" className="font-semibold mb-1 text-gray-800">
                  Email ID *
                </label>
                <input
                  type="email"
                  id="teacherEmail"
                  name="email"
                  value={teacherFormData.email}
                  onChange={handleTeacherInputChange}
                  className={`px-3 py-2 border rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:border-[#004d40] ${
                    errors.teacherEmail ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                  disabled
                />
                <span className="text-sm text-gray-500 mt-1">Email cannot be changed</span>
                {errors.teacherEmail && (
                  <span className="text-red-600 text-sm mt-1">{errors.teacherEmail}</span>
                )}
              </div>
            )}

            {/* Profile Picture Field - always available for upload */}
            <div className="flex flex-col">
              <label htmlFor="teacherProfilePic" className="font-semibold mb-1 text-gray-800">
                Profile Picture
              </label>
              <input
                type="file"
                id="teacherProfilePic"
                name="profilePic"
                onChange={e => handleFileChange(e, 'teacher')}
                accept="image/*"
                className={`px-1 py-2 border rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:border-[#004d40] ${
                  errors.teacherProfilePic ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {user.profilepic && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Current profile picture:</p>
                  <img
                    src={user.profilepic}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover mt-1"
                  />
                </div>
              )}
              {errors.teacherProfilePic && (
                <span className="text-red-600 text-sm mt-1">{errors.teacherProfilePic}</span>
              )}
            </div>

            {/* Present City Field - only show if available */}
            {availableFields.presentcity && (
              <div className="flex flex-col">
                <label htmlFor="teacherCity" className="font-semibold mb-1 text-gray-800">
                  Present City
                </label>
                <input
                  type="text"
                  id="teacherCity"
                  name="presentCity"
                  value={teacherFormData.presentCity}
                  onChange={handleTeacherInputChange}
                  className={`px-3 py-2 border rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:border-[#004d40] ${
                    errors.teacherCity ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.teacherCity && (
                  <span className="text-red-600 text-sm mt-1">{errors.teacherCity}</span>
                )}
              </div>
            )}

            {/* Joining Year Field - only show if available */}
            {availableFields.joiningyear && (
              <div className="flex flex-col">
                <label htmlFor="teacherJoinYear" className="font-semibold mb-1 text-gray-800">
                  Joining Year in JZS
                </label>
                <select
                  id="teacherJoinYear"
                  name="joiningyear"
                  value={teacherFormData.joiningyear}
                  onChange={handleTeacherInputChange}
                  className={`px-3 py-2 border rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:border-[#004d40] ${
                    errors.teacherJoinYear ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">-- Select Year --</option>
                  {years.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                {errors.teacherJoinYear && (
                  <span className="text-red-600 text-sm mt-1">{errors.teacherJoinYear}</span>
                )}
              </div>
            )}

            {/* Present Status Field - only show if available */}
            {availableFields.presentstatus && (
              <div className="flex flex-col">
                <label htmlFor="teacherPresentStatus" className="font-semibold mb-1 text-gray-800">
                  Present Status
                </label>
                <select
                  id="teacherPresentStatus"
                  name="presentstatus"
                  value={teacherFormData.presentstatus}
                  onChange={handleTeacherInputChange}
                  className={`px-3 py-2 border rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:border-[#004d40] ${
                    errors.teacherPresentStatus ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">-- Select Status --</option>
                  {presentStatusOptions.map(status => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                {errors.teacherPresentStatus && (
                  <span className="text-red-600 text-sm mt-1">{errors.teacherPresentStatus}</span>
                )}
              </div>
            )}

            {/* Present School Field - only show if present status is 'Working in other organization' */}
            {teacherFormData.presentstatus === 'Working in other organization' &&
              availableFields.presentOrganization && (
                <div className="flex flex-col">
                  <label htmlFor="teacherSchool" className="font-semibold mb-1 text-gray-800">
                    Present School
                  </label>
                  <input
                    type="text"
                    id="teacherSchool"
                    name="presentSchool"
                    value={teacherFormData.presentSchool}
                    onChange={handleTeacherInputChange}
                    className={`px-3 py-2 border rounded-lg bg-gray-50 text-gray-800 focus:outline-none focus:border-[#004d40] ${
                      errors.teacherSchool ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.teacherSchool && (
                    <span className="text-red-600 text-sm mt-1">{errors.teacherSchool}</span>
                  )}
                </div>
              )}

            <button
              type="submit"
              disabled={updating}
              className="bg-[#004d40] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#00796b] transition-colors duration-300 mt-5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
};

export default Profile;
