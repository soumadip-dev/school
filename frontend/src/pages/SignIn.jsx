import React from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../api/authApi';
import toast from 'react-hot-toast';
import { FaGoogle, FaEnvelope, FaSpinner, FaEye, FaEyeSlash } from 'react-icons/fa';

const SignIn = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const navigate = useNavigate();

  const handleGoogleSignIn = () => {
    window.location.href = 'register.html';
  };

  const handleEmailSignIn = async () => {
    // Basic validation
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userData = {
        email: email,
        password: password,
      };

      const result = await loginUser(userData);

      if (result.success) {
        // Login successful
        toast.success(result.message);
        navigate('/');
      } else {
        // Login failed
        setError(result.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleForgotPassword = () => {
    navigate('/reset-password');
  };

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

        {/* Headings */}
        <h2 className="text-teal-800 text-xl font-semibold text-center mb-1">
          Jalpaiguri Zilla School 150 Years
        </h2>
        <h2 className="text-teal-800 text-xl font-semibold text-center mb-8">
          Welcome to Celebration Portal
        </h2>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-300 flex items-center justify-center gap-3 mt-8"
        >
          <FaGoogle />
          Sign in with Google
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-600 font-semibold">OR</span>
          </div>
        </div>

        {/* Email Sign In Form */}
        <div className="bg-gray-50 p-5 rounded-lg border border-gray-300">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleEmailSignIn();
            }}
          >
            <input
              type="email"
              placeholder="Email address"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />

            {/* Password Input with Show/Hide Toggle */}
            <div className="relative mb-3">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent pr-10"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-teal-700 transition-colors duration-200"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-800 hover:bg-teal-700 disabled:bg-teal-500 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-300 flex items-center justify-center gap-3 mt-3"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <FaEnvelope />
                  Sign In with E-Mail
                </>
              )}
            </button>

            {/* Forgot Password */}
            <div className="text-center mt-3">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-teal-700 hover:text-teal-800 hover:underline text-sm transition-colors duration-200"
              >
                Forgot Password?
              </button>
            </div>
          </form>
        </div>

        {/* Don't have account signup option */}
        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-teal-700 hover:text-teal-800 hover:underline font-medium transition-colors duration-200"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
