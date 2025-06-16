import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAppContext } from '../../contexts/AppContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [accountStatus, setAccountStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAppContext();
  const navigate = useNavigate();
  
  const BASE_URL = 'https://bookingsms.mbilalliaqat01.workers.dev';
  console.log('BASE_URL:', BASE_URL);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setAccountStatus('');
    setIsLoading(true);
    
    try {
      console.log('Sending POST to:', `${BASE_URL}/user/login`);
      const response = await axios.post(`${BASE_URL}/user/login`, {
        email,
        password,
      });
      console.log('API response:', response.data);

      const { token, role, status } = response.data;

      if(status === 'pending'){
        setAccountStatus('pending');
        setIsLoading(false);
        return;
      }

      // Validate role
      if (!role || !['admin', 'employee'].includes(role)) {
        throw new Error('Invalid or missing role in API response');
      }

      // Decode JWT to extract username (if needed)
      let username = email; // Fallback to email
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        username = payload.username || email;
      } catch (err) {
        console.warn('Could not decode JWT:', err);
      }

      // Create user object
      const user = {
        email,
        username,
        role,
      };

      // Store token and user in localStorage
      localStorage.setItem('token', token);
      console.log('Storing user in localStorage:', user);
      localStorage.setItem('user', JSON.stringify(user));

      // Update context
      setUser(user);

      // Redirect based on role
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // Check if it's a 404 (user not found) error
      if (err.response?.status === 404) {
        setAccountStatus('not-found');
      } else {
        setError(err.response?.data?.message || 'Invalid email or password');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderStatusMessage = () => {
    switch (accountStatus) {
      case 'pending':
        return (
          <div className="p-4 mb-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
            <p className="font-medium">Your account is pending approval</p>
            <p className="text-sm">Please wait for an administrator to approve your account.</p>
          </div>
        );
      case 'not-found':
        return (
          <div className="p-4 mb-4 bg-red-100 border-l-4 border-red-500 text-red-700">
            <p className="font-medium">Account not found</p>
            <p className="text-sm">This email is not registered in our system. <Link to="/register" className="underline">Create an account</Link>.</p>
          </div>
        );
      default:
        return null;
    }
  };

  // Loading Spinner component
  const LoadingSpinner = () => (
    <svg 
      className="animate-spin h-5 w-5 text-gray-900" 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      ></circle>
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
  
  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80')",
      }}
    >
      {/* Glass overlay container */}
      <div className="w-full max-w-md p-8 rounded-lg" style={{
        backgroundColor: 'rgba(13, 17, 23, 0.7)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 className="text-3xl font-bold text-center mb-8 text-white">Login</h2>

        {renderStatusMessage()}
        <form onSubmit={handleLogin}>
          <div className="mb-6">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full py-3 px-4 bg-transparent border-b border-gray-400 text-white placeholder-gray-300 focus:outline-none focus:border-white transition-all"
              placeholder="Enter your email"
              required
              disabled={isLoading}
            />
          </div>
          <div className="mb-6">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full py-3 px-4 bg-transparent border-b border-gray-400 text-white placeholder-gray-300 focus:outline-none focus:border-white transition-all"
              placeholder="Enter your password"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember-me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="mr-2"
                disabled={isLoading}
              />
              <label htmlFor="remember-me" className="text-sm text-gray-300">Remember me</label>
            </div>
            <a href="#" className="text-sm text-gray-300 hover:text-white">Forgot password?</a>
          </div>
          
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-white text-gray-900 py-3 rounded-md hover:bg-gray-200 transition-colors font-medium flex justify-center items-center ${
              isLoading ? 'opacity-80 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <>
                <LoadingSpinner />
                <span className="ml-2">Logging in...</span>
              </>
            ) : (
              'Login'
            )}
          </button>
          
          <p className="text-center text-gray-300 mt-6 text-md">
            Don't have an account? <Link to="/register" className={`text-blue-300 hover:text-blue-200 ${isLoading ? 'pointer-events-none' : ''}`}>Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;