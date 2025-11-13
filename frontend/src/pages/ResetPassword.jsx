import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resetPassword, sendPasswordResetEmail } from '../api/authApi';
import toast from 'react-hot-toast';
import { FaEye, FaEyeSlash, FaSpinner, FaEnvelope, FaLock } from 'react-icons/fa';

const ResetPassword = () => {
  const navigate = useNavigate();
  const inputRefs = useRef([]);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [isOtpSubmited, setIsOtpSubmited] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [error, setError] = useState('');

  // Focus first input when OTP section becomes visible
  useEffect(() => {
    if (isEmailSent && !isOtpSubmited && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [isEmailSent, isOtpSubmited]);

  const handleInput = (e, index) => {
    const value = e.currentTarget.value;

    // Only allow numbers
    if (!/^\d*$/.test(value)) {
      e.currentTarget.value = '';
      return;
    }

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Update OTP state
    const otpArray = inputRefs.current.map(input => input?.value || '');
    setOtp(otpArray.join(''));
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !e.currentTarget.value && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = e => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').trim();
    const pasteArr = paste.split('').slice(0, 6); // Only take first 6 characters

    pasteArr.forEach((char, i) => {
      if (inputRefs.current[i] && /^\d$/.test(char)) {
        inputRefs.current[i].value = char;
      }
    });

    // Update OTP state
    const otpArray = inputRefs.current.map(input => input?.value || '');
    setOtp(otpArray.join(''));

    // Focus last filled box
    const lastIndex = Math.min(pasteArr.length, inputRefs.current.length) - 1;
    if (lastIndex >= 0) {
      inputRefs.current[lastIndex]?.focus();
    }
  };

  const onSubmitEmail = async e => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsEmailLoading(true);
    try {
      const response = await sendPasswordResetEmail(email);
      if (response.success) {
        toast.success(response.message);
        setIsEmailSent(true);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to send reset email. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsEmailLoading(false);
    }
  };

  const onSubmitOtp = async e => {
    e.preventDefault();
    setError('');

    const otpArray = inputRefs.current.map(input => input?.value || '');
    const enteredOtp = otpArray.join('');

    if (enteredOtp.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setIsOtpLoading(true);
    try {
      setOtp(enteredOtp);
      setIsOtpSubmited(true);
      toast.success('OTP verified successfully');
    } catch (error) {
      const errorMessage = 'Failed to verify OTP. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsOtpLoading(false);
    }
  };

  const onSubmitNewPassword = async e => {
    e.preventDefault();
    setError('');

    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsPasswordLoading(true);
    try {
      const response = await resetPassword(email, otp, newPassword);
      if (response.success) {
        toast.success(response.message);
        navigate('/signin');
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to reset password. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleBackToLogin = () => {
    navigate('/signin');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center font-sans">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full mx-4">
        {/* Logo */}
        <div className="flex justify-center mb-5" onClick={() => navigate('/')}>
          <img
            src="logo.png"
            alt="School Badge"
            className="w-24 h-24 rounded-full object-cover border-4 border-teal-800 cursor-pointer hover:scale-105 transition-transform"
          />
        </div>

        {/* Headings */}
        <h2 className="text-teal-800 text-xl font-semibold text-center mb-1">
          Jalpaiguri Zilla School 150 Years
        </h2>
        <h2 className="text-teal-800 text-xl font-semibold text-center mb-8">
          Reset Your Password
        </h2>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Email Input Section */}
        {!isEmailSent && (
          <div className="bg-gray-50 p-5 rounded-lg border border-gray-300">
            <form onSubmit={onSubmitEmail}>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="text-gray-400" />
                  </div>
                  <input
                    id="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    type="email"
                    name="email"
                    placeholder="Enter your email address"
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isEmailLoading}
                className="w-full bg-teal-800 hover:bg-teal-700 disabled:bg-teal-500 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-300 flex items-center justify-center gap-3"
              >
                {isEmailLoading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  'Send Reset OTP'
                )}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="text-teal-700 hover:text-teal-800 hover:underline text-sm transition-colors duration-200"
                >
                  Back to Login
                </button>
              </div>
            </form>
          </div>
        )}

        {/* OTP Input Section */}
        {isEmailSent && !isOtpSubmited && (
          <div className="bg-gray-50 p-5 rounded-lg border border-gray-300">
            <div className="text-center mb-4">
              <p className="text-gray-600 text-sm">
                Enter the 6-digit code sent to <span className="font-medium">{email}</span>
              </p>
            </div>

            <form onSubmit={onSubmitOtp}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">OTP Code</label>
                <div className="flex justify-between gap-2" onPaste={handlePaste}>
                  {Array(6)
                    .fill(0)
                    .map((_, index) => (
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        key={index}
                        required
                        className="w-12 h-12 border border-gray-300 text-gray-900 text-xl text-center rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                        ref={el => {
                          if (el) inputRefs.current[index] = el;
                        }}
                        onInput={e => handleInput(e, index)}
                        onKeyDown={e => handleKeyDown(e, index)}
                      />
                    ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isOtpLoading || otp.length !== 6}
                className="w-full bg-teal-800 hover:bg-teal-700 disabled:bg-teal-500 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-300 flex items-center justify-center gap-3"
              >
                {isOtpLoading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEmailSent(false);
                    setOtp('');
                    inputRefs.current.forEach(input => {
                      if (input) input.value = '';
                    });
                  }}
                  className="text-teal-700 hover:text-teal-800 hover:underline text-sm transition-colors duration-200"
                >
                  Use different email
                </button>
              </div>
            </form>
          </div>
        )}

        {/* New Password Section */}
        {isOtpSubmited && isEmailSent && (
          <div className="bg-gray-50 p-5 rounded-lg border border-gray-300">
            <form onSubmit={onSubmitNewPassword}>
              <div className="mb-4">
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-gray-400" />
                  </div>
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    name="newPassword"
                    placeholder="Enter your new password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-teal-700 transition-colors duration-200"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Password must be at least 6 characters long
                </p>
              </div>

              <button
                type="submit"
                disabled={isPasswordLoading}
                className="w-full bg-teal-800 hover:bg-teal-700 disabled:bg-teal-500 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-300 flex items-center justify-center gap-3"
              >
                {isPasswordLoading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
