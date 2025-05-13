import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Validation states
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  
  const navigate = useNavigate();

  // Validation functions
  const validateUsername = (value) => {
    if (!value) return 'Username is required';
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (value.length > 20) return 'Username cannot exceed 20 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers and underscores';
    return '';
  };

  const validateEmail = (value) => {
    if (!value) return 'Email is required';
    // RFC 5322 compliant regex
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!emailRegex.test(value)) return 'Please enter a valid email address';
    return '';
  };

  const validatePassword = (value) => {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    return '';
  };

  const validateConfirmPassword = (value) => {
    if (!value) return 'Please confirm your password';
    if (value !== password) return 'Passwords do not match';
    return '';
  };

  // Handle input changes with validation
  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);
    setUsernameError(validateUsername(value));
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(validateEmail(value));
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordError(validatePassword(value));
    
    // Also update confirm password validation if it has a value
    if (confirmPassword) {
      setConfirmPasswordError(confirmPassword !== value ? 'Passwords do not match' : '');
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setConfirmPasswordError(validateConfirmPassword(value));
  };

  // Check overall form validity
  useEffect(() => {
    const isValid = 
      username && email && password && confirmPassword &&
      !usernameError && !emailError && !passwordError && !confirmPasswordError;
    
    setIsFormValid(isValid);
  }, [username, email, password, confirmPassword, usernameError, emailError, passwordError, confirmPasswordError]);

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Final validation before submission
    const usernameValidation = validateUsername(username);
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    const confirmPasswordValidation = validateConfirmPassword(confirmPassword);
    
    setUsernameError(usernameValidation);
    setEmailError(emailValidation);
    setPasswordError(passwordValidation);
    setConfirmPasswordError(confirmPasswordValidation);
    
    if (usernameValidation || emailValidation || passwordValidation || confirmPasswordValidation) {
      return; // Don't proceed if there are validation errors
    }
    
    setError('');
    setSuccess('');
    setIsLoading(true);
    
    // Log the data being sent
    const userData = { username, email, password };
    console.log('Sending registration data:', userData);
    
    try {
      const response = await axios.post('http://localhost:8787/user/signup', userData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('API response:', response.data);
      
      if (response.data.status === 'success') {
        setSuccess('Registration successful! Your account is pending approval by an administrator.');
        // Clear form
        setUsername('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      console.error('Registration error details:', err);
      
      // More detailed error handling
      if (err.response) {
       
        setError(err.response.data?.message || `Error ${err.response.status}: Registration failed`);
      } else if (err.request) {
       
        setError('No response from server. Please check if the server is running.');
      } else {
      
        setError('Request setup error: ' + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderInputField = (type, value, onChange, placeholder, error, minLength = null) => (
    <div className="mb-6">
      <input
        type={type}
        value={value}
        onChange={onChange}
        className={`w-full py-3 px-4 bg-transparent border-b ${error ? 'border-red-400' : 'border-gray-400'} text-white placeholder-gray-300 focus:outline-none focus:border-white transition-all`}
        placeholder={placeholder}
        minLength={minLength}
      />
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
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
        <h2 className="text-3xl font-bold text-center mb-8 text-white">Register</h2>
        <form onSubmit={handleRegister}>
          {renderInputField('text', username, handleUsernameChange, 'Enter your username', usernameError)}
          
          {renderInputField('email', email, handleEmailChange, 'Enter your email', emailError)}
          
          {renderInputField('password', password, handlePasswordChange, 'Enter your password', passwordError, 8)}
          
          {/* {!passwordError && (
            <div className="mb-6">
              <div className="flex flex-wrap mb-2">
                <div className="w-full sm:w-1/2 pr-1 mb-1">
                  <div className={`h-1 rounded-full ${password.length >= 8 ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                  <p className="text-xs text-gray-300">8+ characters</p>
                </div>
                <div className="w-full sm:w-1/2 pl-1 mb-1">
                  <div className={`h-1 rounded-full ${/[A-Z]/.test(password) ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                  <p className="text-xs text-gray-300">Uppercase</p>
                </div>
                <div className="w-full sm:w-1/2 pr-1 mb-1">
                  <div className={`h-1 rounded-full ${/[0-9]/.test(password) ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                  <p className="text-xs text-gray-300">Number</p>
                </div>
                <div className="w-full sm:w-1/2 pl-1 mb-1">
                  <div className={`h-1 rounded-full ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                  <p className="text-xs text-gray-300">Special char</p>
                </div>
              </div>
            </div>
          )} */}
          
          {renderInputField('password', confirmPassword, handleConfirmPasswordChange, 'Confirm your password', confirmPasswordError)}
          
          {error && (
            <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 px-4 py-3 rounded mb-4">
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="bg-green-500 bg-opacity-20 border border-green-500 text-green-300 px-4 py-3 rounded mb-4">
              <p className="text-sm">{success}</p>
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading || !isFormValid}
            className={`w-full py-3 rounded-md font-medium transition-colors ${
              isLoading || !isFormValid
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                : 'bg-white text-gray-900 hover:bg-gray-200'
            }`}
          >
            {isLoading ? 'Registering...' : 'Register'}
          </button>
          
          <p className="text-center text-gray-300 mt-6 text-md">
            Already have an account? <Link to="/login" className="text-blue-300 hover:text-blue-200 transition-colors">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;