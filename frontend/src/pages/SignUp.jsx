import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../api/authApi';
import toast from 'react-hot-toast';
import { FaSpinner, FaEye, FaEyeSlash } from 'react-icons/fa';

const SignUp = () => {
  const [currentStep, setCurrentStep] = useState('roleSelect');
  const [formData, setFormData] = useState({
    role: '',
    name: '',
    surname: '',
    email: '',
    mobile: '',
    presentcity: '',
    Matriculationbatch: '',
    Intermediatebatch: '',
    presentOrganization: '',
    profession: '',
    joiningyear: '',
    presentstatus: '',
    class: '',
    password: '',
  });
  const [frontendImage, setFrontendImage] = useState(null);
  const [backendImage, setBackendImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Generate year options
  const generateYearOptions = (start = 1950, end = 2025) => {
    const years = [];
    for (let year = start; year <= end; year++) {
      years.push(year);
    }
    return years;
  };

  const handleRoleSelect = e => {
    const role = e.target.value;
    setFormData(prev => ({ ...prev, role }));
    setFieldErrors(prev => ({ ...prev, role: '' }));

    if (role) {
      setCurrentStep('form');
      setError('');
    }
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = e => {
    const file = e.target.files[0];
    if (file) {
      // Validate image file type
      if (!/\.(jpg|jpeg|png|gif)$/i.test(file.name)) {
        setFieldErrors(prev => ({
          ...prev,
          profilePic: 'Please upload a valid image file (JPG, JPEG, PNG, GIF).',
        }));
        return;
      }
      setBackendImage(file);
      setFrontendImage(URL.createObjectURL(file));
      setFieldErrors(prev => ({ ...prev, profilePic: '' }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Validation functions
  const validateField = (name, value) => {
    const errors = {};

    switch (name) {
      case 'name':
      case 'surname':
        if (!/^[A-Za-z\s]+$/.test(value)) {
          errors[name] = `Please enter a valid ${name} (letters only).`;
        }
        break;
      case 'mobile':
        if (!/^\d{10}$/.test(value)) {
          errors.mobile = 'Please enter a valid 10-digit mobile number.';
        }
        break;
      case 'email':
        if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)) {
          errors.email = 'Please enter a valid email address.';
        }
        break;
      case 'presentcity':
        if (!/^[A-Za-z\s]+$/.test(value)) {
          errors.presentcity = 'Please enter a valid city name.';
        }
        break;
      case 'presentOrganization':
        if (
          formData.role === 'Alumni Student' ||
          formData.presentstatus === 'Working - Other School'
        ) {
          if (!/^[A-Za-z\s]+$/.test(value)) {
            errors.presentOrganization =
              'Please enter a valid organization name (letters and spaces only).';
          }
        }
        break;
      default:
        break;
    }

    return errors;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate all required fields
    const newErrors = {};

    // Common validations
    if (!formData.name || !/^[A-Za-z\s]+$/.test(formData.name)) {
      newErrors.name = 'Please enter a valid name (letters only).';
    }
    if (!formData.surname || !/^[A-Za-z\s]+$/.test(formData.surname)) {
      newErrors.surname = 'Please enter a valid surname (letters only).';
    }
    if (!formData.email || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!backendImage) {
      newErrors.profilePic = 'Please upload a valid image file (JPG, JPEG, PNG, GIF).';
    }
    if (!formData.password) {
      newErrors.password = 'Please enter a password.';
    }

    // Role-specific validations
    if (formData.role === 'Alumni Student') {
      if (!formData.mobile || !/^\d{10}$/.test(formData.mobile)) {
        newErrors.mobile = 'Please enter a valid 10-digit mobile number.';
      }
      if (!formData.presentcity || !/^[A-Za-z\s]+$/.test(formData.presentcity)) {
        newErrors.presentcity = 'Please enter a valid city name.';
      }
      if (!formData.Matriculationbatch) {
        newErrors.Matriculationbatch = 'Please select a batch year.';
      }
      if (!formData.profession) {
        newErrors.profession = 'Please select a profession.';
      }
      if (!formData.presentOrganization || !/^[A-Za-z\s]+$/.test(formData.presentOrganization)) {
        newErrors.presentOrganization =
          'Please enter a valid organization name (letters and spaces only).';
      }
    } else if (formData.role === 'Alumni Teacher' || formData.role === 'Present Teacher') {
      if (!formData.mobile || !/^\d{10}$/.test(formData.mobile)) {
        newErrors.mobile = 'Please enter a valid 10-digit mobile number.';
      }
      if (!formData.presentcity || !/^[A-Za-z\s]+$/.test(formData.presentcity)) {
        newErrors.presentcity = 'Please enter a valid city name.';
      }
      if (!formData.joiningyear) {
        newErrors.joiningyear = 'Please select a joining year.';
      }
      if (!formData.presentstatus) {
        newErrors.presentstatus = 'Please select a present status.';
      }
      if (
        formData.presentstatus === 'Working - Other School' &&
        (!formData.presentOrganization || !/^[A-Za-z\s]+$/.test(formData.presentOrganization))
      ) {
        newErrors.presentOrganization =
          'Please enter a valid school name (letters and spaces only).';
      }
    } else if (formData.role === 'Present Student') {
      if (!formData.class) {
        newErrors.class = 'Please select a class.';
      }
    }

    setFieldErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setLoading(false);
      return;
    }

    try {
      // Create FormData for file upload
      const submitData = new FormData();

      // Add all form fields to FormData
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });

      // Add profile picture if exists
      if (backendImage) {
        submitData.append('image', backendImage);
      }

      console.log('Backend Image:', backendImage);
      console.log('Form Data:', Object.fromEntries(submitData));

      const result = await registerUser(submitData);

      if (result.success) {
        toast.success(result.message);
        // Reset form and go back to role selection
        backToRoleSelect();
      } else {
        setError(result.message || 'Registration failed. Please try again.');
        toast.error(result.message || 'Registration failed');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      toast.error('An unexpected error occurred');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const backToRoleSelect = () => {
    setCurrentStep('roleSelect');
    setFormData({
      role: '',
      name: '',
      surname: '',
      email: '',
      mobile: '',
      presentcity: '',
      Matriculationbatch: '',
      Intermediatebatch: '',
      presentOrganization: '',
      profession: '',
      joiningyear: '',
      presentstatus: '',
      class: '',
      password: '',
    });
    setFrontendImage(null);
    setBackendImage(null);
    setError('');
    setFieldErrors({});
  };

  // Role Selection Step (Dropdown version like HTML)
  if (currentStep === 'roleSelect') {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center font-sans">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full mx-4">
          {/* Logo */}
          <div className="flex justify-center mb-5" onClick={() => navigate('/')}>
            <img
              src="logo.png"
              alt="School Badge"
              className="w-24 h-24 rounded-full object-cover border-4 border-teal-800"
            />
          </div>

          <h2 className="text-teal-800 text-2xl font-semibold text-center mb-6">
            JZS Registration Form
          </h2>

          <form className="space-y-6">
            <div className="form-group">
              <label
                htmlFor="roleSelection"
                className="block text-sm font-medium text-gray-700 mb-2 font-bold"
              >
                Registering as *
              </label>
              <select
                id="roleSelection"
                name="role"
                required
                value={formData.role}
                onChange={handleRoleSelect}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 ${
                  fieldErrors.role ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">-- Select --</option>
                <option value="Alumni Student">Alumni Student</option>
                <option value="Alumni Teacher">Alumni Teacher</option>
                <option value="Present Student">Present Student</option>
                <option value="Present Teacher">Present Teacher</option>
              </select>
              {fieldErrors.role && (
                <span className="text-red-500 text-sm mt-1 block">{fieldErrors.role}</span>
              )}
            </div>
          </form>

          {/* Already have account signin option */}
          <div className="text-center mt-6">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/signin')}
                className="text-teal-700 hover:text-teal-800 hover:underline font-medium transition-colors duration-200"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Form Step
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center font-sans">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full mx-4">
        {/* Logo */}
        <div className="flex justify-center mb-5">
          <img
            src="logo.png"
            alt="School Badge"
            className="w-24 h-24 rounded-full object-cover border-4 border-teal-800"
          />
        </div>

        <div className="flex justify-between items-center mb-6">
          <button
            onClick={backToRoleSelect}
            className="text-teal-800 hover:text-teal-600 font-medium"
          >
            ← Back
          </button>
          <h2 className="text-teal-800 text-xl font-semibold">Register as {formData.role}</h2>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Common Fields for All Roles */}
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1 font-bold">Name *</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 ${
                fieldErrors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {fieldErrors.name && (
              <span className="text-red-500 text-sm mt-1 block">{fieldErrors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1 font-bold">
              Surname *
            </label>
            <input
              type="text"
              name="surname"
              required
              value={formData.surname}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 ${
                fieldErrors.surname ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {fieldErrors.surname && (
              <span className="text-red-500 text-sm mt-1 block">{fieldErrors.surname}</span>
            )}
          </div>

          {/* Email for all roles */}
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1 font-bold">
              Email *
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 ${
                fieldErrors.email ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {fieldErrors.email && (
              <span className="text-red-500 text-sm mt-1 block">{fieldErrors.email}</span>
            )}
          </div>

          {/* Mobile for Alumni and Present Teacher */}
          {(formData.role === 'Alumni Student' ||
            formData.role === 'Alumni Teacher' ||
            formData.role === 'Present Teacher') && (
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1 font-bold">
                Mobile Number *
              </label>
              <input
                type="tel"
                name="mobile"
                required
                pattern="[0-9]{10}"
                value={formData.mobile}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 ${
                  fieldErrors.mobile ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {fieldErrors.mobile && (
                <span className="text-red-500 text-sm mt-1 block">{fieldErrors.mobile}</span>
              )}
            </div>
          )}

          {/* Profile Picture for all */}
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1 font-bold">
              Profile Picture *
            </label>
            <input
              type="file"
              required
              accept="image/*"
              onChange={handleImageChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 ${
                fieldErrors.profilePic ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {fieldErrors.profilePic && (
              <span className="text-red-500 text-sm mt-1 block">{fieldErrors.profilePic}</span>
            )}
            {frontendImage && (
              <div className="mt-3">
                <img
                  src={frontendImage}
                  alt="Profile Preview"
                  className="w-32 h-32 object-cover rounded-full border-2 border-teal-200 shadow-sm"
                />
              </div>
            )}
          </div>

          {/* Present City for Alumni and Teachers */}
          {(formData.role === 'Alumni Student' ||
            formData.role === 'Alumni Teacher' ||
            formData.role === 'Present Teacher') && (
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1 font-bold">
                Present City *
              </label>
              <input
                type="text"
                name="presentcity"
                required
                value={formData.presentcity}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 ${
                  fieldErrors.presentcity ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {fieldErrors.presentcity && (
                <span className="text-red-500 text-sm mt-1 block">{fieldErrors.presentcity}</span>
              )}
            </div>
          )}

          {/* Alumni Student Specific Fields */}
          {formData.role === 'Alumni Student' && (
            <>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1 font-bold">
                  Madhyamik/Matriculation Batch *
                </label>
                <select
                  name="Matriculationbatch"
                  required
                  value={formData.Matriculationbatch}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 ${
                    fieldErrors.Matriculationbatch ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">-- Select Year --</option>
                  {generateYearOptions().map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                {fieldErrors.Matriculationbatch && (
                  <span className="text-red-500 text-sm mt-1 block">
                    {fieldErrors.Matriculationbatch}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Uccha Madhyamik/Intermediate Batch (Optional)
                </label>
                <select
                  name="Intermediatebatch"
                  value={formData.Intermediatebatch}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  <option value="">-- Select --</option>
                  {generateYearOptions().map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1 font-bold">
                  Profession *
                </label>
                <select
                  name="profession"
                  required
                  value={formData.profession}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 ${
                    fieldErrors.profession ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">-- Select Profession --</option>
                  <option value="Academician/Professor/Teacher">
                    Academician/Professor/Teacher
                  </option>
                  <option value="Administrative Services">
                    Administrative Services (IAS/WBCS/Other)
                  </option>
                  <option value="Armed Forces/Defense">Armed Forces/Defense</option>
                  <option value="Artist/Musician/Performer">Artist/Musician/Performer</option>
                  <option value="Banking/Insurance/Finance">Banking/Insurance/Finance</option>
                  <option value="Business Owner/Entrepreneur">Business Owner/Entrepreneur</option>
                  <option value="Chartered Accountant">Chartered Accountant</option>
                  <option value="Data/Analytics/AI Professional">
                    Data/Analytics/AI Professional
                  </option>
                  <option value="Engineer (Core-Civil/Mech/Electrical etc.)">
                    Engineer (Core-Civil/Mech/Electrical etc.)
                  </option>
                  <option value="Engineer (Software/IT)">Engineer (Software/IT)</option>
                  <option value="Government Employee (Non-Administrative)">
                    Government Employee (Non-Administrative)
                  </option>
                  <option value="Hospitality/Travel/Tourism">Hospitality/Travel/Tourism</option>
                  <option value="Journalist/Media Professional">
                    Journalist/Media Professional
                  </option>
                  <option value="Legal Professional/Advocate/Judge">
                    Legal Professional/Advocate/Judge
                  </option>
                  <option value="Marketing/Advertising/PR">Marketing/Advertising/PR</option>
                  <option value="Medical-Doctor">Medical-Doctor</option>
                  <option value="Medical-Healthcare Professional (Non-doctor)">
                    Medical-Healthcare Professional (Non-doctor)
                  </option>
                  <option value="NGO/Social and Development Sector">
                    NGO/Social and Development Sector
                  </option>
                  <option value="Pharmaceutical/Biotech Professional">
                    Pharmaceutical/Biotech Professional
                  </option>
                  <option value="Police/Law Enforcement">Police/Law Enforcement</option>
                  <option value="Politician/Public Representative">
                    Politician/Public Representative
                  </option>
                  <option value="Researcher/Scientist">Researcher/Scientist</option>
                  <option value="retired">Retired</option>
                  <option value="Sportsperson/Coach">Sportsperson/Coach</option>
                  <option value="Student (Higher Studies)">Student (Higher Studies)</option>
                  <option value="Tech Startup Employee">Tech Startup Employee</option>
                  <option value="Writer/Author/Blogger">Writer/Author/Blogger</option>
                  <option value="Other">Other</option>
                </select>
                {fieldErrors.profession && (
                  <span className="text-red-500 text-sm mt-1 block">{fieldErrors.profession}</span>
                )}
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1 font-bold">
                  Present/Last Organization *
                </label>
                <input
                  type="text"
                  name="presentOrganization"
                  required
                  value={formData.presentOrganization}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 ${
                    fieldErrors.presentOrganization ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {fieldErrors.presentOrganization && (
                  <span className="text-red-500 text-sm mt-1 block">
                    {fieldErrors.presentOrganization}
                  </span>
                )}
              </div>
            </>
          )}

          {/* Teacher Specific Fields */}
          {(formData.role === 'Alumni Teacher' || formData.role === 'Present Teacher') && (
            <>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1 font-bold">
                  Joining Year in JZS *
                </label>
                <select
                  name="joiningyear"
                  required
                  value={formData.joiningyear}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 ${
                    fieldErrors.joiningyear ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">-- Select Year --</option>
                  {generateYearOptions().map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                {fieldErrors.joiningyear && (
                  <span className="text-red-500 text-sm mt-1 block">{fieldErrors.joiningyear}</span>
                )}
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1 font-bold">
                  Present Status *
                </label>
                <select
                  name="presentstatus"
                  required
                  value={formData.presentstatus}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 ${
                    fieldErrors.presentstatus ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">-- Select Status --</option>
                  <option value="retired">Retired</option>
                  <option value="Working - JZS">Working - JZS</option>
                  <option value="Working - Other School">Working - Other School</option>
                </select>
                {fieldErrors.presentstatus && (
                  <span className="text-red-500 text-sm mt-1 block">
                    {fieldErrors.presentstatus}
                  </span>
                )}
              </div>

              {formData.presentstatus === 'Working - Other School' && (
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-bold">
                    Present School *
                  </label>
                  <input
                    type="text"
                    name="presentOrganization"
                    required
                    value={formData.presentOrganization}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 ${
                      fieldErrors.presentOrganization ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {fieldErrors.presentOrganization && (
                    <span className="text-red-500 text-sm mt-1 block">
                      {fieldErrors.presentOrganization}
                    </span>
                  )}
                </div>
              )}
            </>
          )}

          {/* Present Student Specific Fields */}
          {formData.role === 'Present Student' && (
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1 font-bold">
                Select Class *
              </label>
              <select
                name="class"
                required
                value={formData.class}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 ${
                  fieldErrors.class ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">-- Select Class --</option>
                <option value="I">Class I</option>
                <option value="II">Class II</option>
                <option value="III">Class III</option>
                <option value="IV">Class IV</option>
                <option value="V">Class V</option>
                <option value="VI">Class VI</option>
                <option value="VII">Class VII</option>
                <option value="VIII">Class VIII</option>
                <option value="IX">Class IX</option>
                <option value="X">Class X</option>
                <option value="XI">Class XI</option>
                <option value="XII">Class XII</option>
              </select>
              {fieldErrors.class && (
                <span className="text-red-500 text-sm mt-1 block">{fieldErrors.class}</span>
              )}
            </div>
          )}

          {/* Password Field with Show/Hide Toggle */}
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-1 font-bold">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 pr-10 ${
                  fieldErrors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter a strong password"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-teal-700 transition-colors duration-200"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {fieldErrors.password && (
              <span className="text-red-500 text-sm mt-1 block">{fieldErrors.password}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-800 hover:bg-teal-700 disabled:bg-teal-500 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-300 flex items-center justify-center gap-3 mt-6"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                Registering...
              </>
            ) : (
              'Register Me'
            )}
          </button>
        </form>

        {/* Already have account signin option */}
        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/signin')}
              className="text-teal-700 hover:text-teal-800 hover:underline font-medium transition-colors duration-200"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
