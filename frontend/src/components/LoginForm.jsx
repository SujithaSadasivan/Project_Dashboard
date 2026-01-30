import React, { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';

const LoginForm = () => {
  const [formData, setFormData] = useState({ 
    email: 'demo@ghostlamp.io', 
    password: '**********' 
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Accept ANY email and password for dummy login
    const email = formData.email || 'demo@ghostlamp.io';
    const password = formData.password === '**********' ? 'demo123' : formData.password;

    console.log('✅ Dummy Login Successful!');
    console.log('Email:', email);
    console.log('Password:', password);

    // Create dummy user data
    const dummyUser = {
      id: 'user_' + Date.now(),
      email: email,
      name: email.split('@')[0] || 'Demo User',
      role: 'admin',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=dc2626&color=fff`,
      token: 'dummy_token_' + Math.random().toString(36).substr(2, 9),
      isAuthenticated: true
    };

    // Store in localStorage (simulating backend session)
    localStorage.setItem('auth_token', dummyUser.token);
    localStorage.setItem('user_email', dummyUser.email);
    localStorage.setItem('user_name', dummyUser.name);
    localStorage.setItem('user_role', dummyUser.role);
    localStorage.setItem('user_avatar', dummyUser.avatar);
    localStorage.setItem('isAuthenticated', 'true');
    
    if (rememberMe) {
      localStorage.setItem('remember_me', 'true');
    }

    // Set a dummy flag to indicate dummy login
    localStorage.setItem('is_dummy_login', 'true');

    console.log('Stored user data:', dummyUser);
    console.log('Redirecting to dashboard...');

    // Redirect to dashboard
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 500);
    
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleQuickDemo = () => {
    setFormData({
      email: 'demo@ghostlamp.io',
      password: '**********'
    });
  };

  return (
    <div className="w-full">
      {/* Header - Ghostlamp Style */}
      <div className="text-left mb-2">
        <h1 className="text-3xl font-bold text-red-600 mb-1 tracking-tight">HAI</h1>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Welcome Back :)</h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          Frontend-only demo. Any credentials will work!
        </p>
      </div>

      {/* Quick Demo Button */}
      <div className="mb-4">
        <button
          type="button"
          onClick={handleQuickDemo}
          className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-2.5 px-4 rounded-lg hover:from-red-600 hover:to-orange-600 focus:ring-4 focus:ring-red-100 transition-all duration-300 font-medium"
        >
          🚀 Quick Demo Login
        </button>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Click above for demo credentials, or type any email/password
        </p>
      </div>

      {/* Divider Line */}
      <div className="my-4">
        <div className="border-t border-gray-300"></div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1 uppercase tracking-wider">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-gray-800"
            placeholder="Enter any email (e.g., demo@ghostlamp.io)"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1 uppercase tracking-wider">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 tracking-wider pr-10"
              placeholder="Enter any password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-red-600 transition text-xs"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
            />
            <span className="text-sm text-gray-700">Remember Me</span>
          </label>
          <button
            type="button"
            className="text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Forgot Password?
          </button>
        </div>

        {/* Success Message (for demo) */}
        <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs text-green-700 text-center">
            ✅ Demo Mode: Any email/password will work!
          </p>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 text-white py-2.5 px-4 rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-100 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 font-medium mt-2"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Logging in...
            </span>
          ) : (
            'Login Now (Any Credentials)'
          )}
        </button>

        {/* Demo Instructions */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="text-blue-600">💡</div>
            <div>
              <p className="text-xs font-medium text-blue-800 mb-1">How to use:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Click "Quick Demo Login" for prefilled credentials</li>
                <li>• Or type <strong>any email</strong> and <strong>any password</strong></li>
                <li>• All logins will work in demo mode</li>
                <li>• You'll be redirected to dashboard automatically</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Create Account Link */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => alert('Demo mode - Account creation disabled')}
            className="text-red-600 hover:text-red-800 font-medium text-sm"
          >
            Create Account (Demo Disabled)
          </button>
        </div>
      </form>

      {/* Social Login Section */}
      <div className="mt-6 pt-4 border-t border-gray-300">
        <div className="text-center mb-4">
          <span className="text-gray-600 text-sm font-medium">Demo Social Logins</span>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            type="button"
            onClick={() => alert('Google login would connect in production')}
            className="flex items-center justify-center w-10 h-10 border-2 border-gray-300 rounded-full hover:border-red-300 hover:bg-red-50 transition-all duration-200"
          >
            <FcGoogle className="text-xl" />
          </button>
          <button
            type="button"
            onClick={() => alert('GitHub login would connect in production')}
            className="flex items-center justify-center w-10 h-10 border-2 border-gray-300 rounded-full hover:border-red-300 hover:bg-red-50 transition-all duration-200"
          >
            <FaGithub className="text-xl text-gray-800" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;