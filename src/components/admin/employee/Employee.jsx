import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TableSpinner from '../../ui/TableSpinner';

const Employee = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [approvedEmployees, setApprovedEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState({});

  const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You are not authenticated');
        setLoading(false);
        return;
      }

      const pendingResponse = await axios.get(`${BASE_URL}/admin/pending-users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingUsers(pendingResponse.data.users || []);
      
      const approvedResponse = await axios.get(`${BASE_URL}/admin/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApprovedEmployees(approvedResponse.data.users || []);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
      setLoading(false);
      console.error('Error fetching users:', err);
    }
  };

  const handleApproval = async (userId, approved) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You are not authenticated');
        return;
      }

      const response = await axios.post(
        `${BASE_URL}/admin/approve-user`,
        { userId, approved },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.status === 'success') {
        setSuccessMessage(`User ${approved ? 'approved' : 'rejected'} successfully`);
        
        if (approved) {
          const approvedUser = pendingUsers.find(user => user.id === userId);
          if (approvedUser) {
            setApprovedEmployees([...approvedEmployees, {...approvedUser, isApproved: true }]);
          }
        }
        
        setPendingUsers(pendingUsers.filter(user => user.id !== userId));
        
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${approved ? 'approve' : 'reject'} user`);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleRejectEmployee = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You are not authenticated');
        return;
      }

      const response = await axios.post(
        `${BASE_URL}/admin/approve-user`,
        { userId, approved: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.status === 'success') {
        setSuccessMessage('Employee rejected and moved to pending');
        
        const rejectedEmployee = approvedEmployees.find(user => user.id === userId);
        if (rejectedEmployee) {
          setPendingUsers([...pendingUsers, {...rejectedEmployee, isApproved: false}]);
        }
        
        setApprovedEmployees(approvedEmployees.filter(user => user.id !== userId));
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject employee');
      setTimeout(() => setError(''), 3000);
    }
  };

  const openPasswordModal = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setSelectedUser(null);
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Please enter both password fields');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You are not authenticated');
        return;
      }

      const response = await axios.put(
        `${BASE_URL}/admin/update-password`,
        { userId: selectedUser.id, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.status === 'success') {
        setSuccessMessage('Password updated successfully');
        closePasswordModal();
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
      setTimeout(() => setError(''), 3000);
    }
  };

  const togglePasswordVisibility = (userId) => {
    setShowPassword(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const renderTabContent = () => {
    if (loading) {
      return <div><TableSpinner /></div>;
    }

    if (activeTab === 'pending') {
      return (
        <>
          <h2 className="text-xl font-semibold mb-4">Pending Approvals</h2>
          {pendingUsers.length === 0 ? (
            <div className="text-gray-500 text-center py-4">No pending user approvals</div>
          ) : (
            <div className="overflow-x-auto max-h-65 rounded-2xl">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-[#111827] text-gray-400 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left">Username</th>
                    <th className="py-3 px-6 text-left">Email</th>
                    <th className="py-3 px-6 text-left">Password</th>
                    <th className="py-3 px-6 text-left">Role</th>
                    <th className="py-3 px-6 text-center">Status</th>
                    <th className="py-3 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 text-sm">
                  {pendingUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-6 text-left">{user.username}</td>
                      <td className="py-3 px-6 text-left">{user.email}</td>
                      <td className="py-3 px-6 text-left">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono">
                            {showPassword[user.id] ? user.password_hash : '••••••••'}
                          </span>
                          <button
                            onClick={() => togglePasswordVisibility(user.id)}
                            className="text-blue-500 hover:text-blue-700 text-xs"
                          >
                            {showPassword[user.id] ? '👁️' : '👁️‍🗨️'}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-6 text-left">{user.role}</td>
                      <td className="py-3 px-6 text-center">
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          Pending
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleApproval(user.id, true)}
                            className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded text-xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openPasswordModal(user)}
                            className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-xs"
                          >
                            Edit Password
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      );
    } else {
      return (
        <>
          <h2 className="text-xl font-semibold mb-4">Approved Employees</h2>
          {approvedEmployees.length === 0 ? (
            <div className="text-gray-500 text-center py-4">No approved employees found</div>
          ) : (
            <div className="overflow-x-auto max-h-65 rounded-2xl">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-[#111827] text-gray-400 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left">Username</th>
                    <th className="py-3 px-6 text-left">Email</th>
                    <th className="py-3 px-6 text-left">Password</th>
                    <th className="py-3 px-6 text-left">Role</th>
                    <th className="py-3 px-6 text-center">Status</th>
                    <th className="py-3 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 text-sm">
                  {approvedEmployees.map((user) => (
                    <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-6 text-left">{user.username}</td>
                      <td className="py-3 px-6 text-left">{user.email}</td>
                      <td className="py-3 px-6 text-left">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono">
                            {showPassword[user.id] ? user.password_hash : '••••••••'}
                          </span>
                          <button
                            onClick={() => togglePasswordVisibility(user.id)}
                            className="text-blue-500 hover:text-blue-700 text-xs"
                          >
                            {showPassword[user.id] ? '👁️' : '👁️‍🗨️'}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-6 text-left">{user.role}</td>
                      <td className="py-3 px-6 text-center">
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          Active
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => openPasswordModal(user)}
                            className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-xs"
                          >
                            Edit Password
                          </button>
                          <button
                            onClick={() => handleRejectEmployee(user.id)}
                            className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-xs"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      );
    }
  };

  return (
    <div className='bg-white shadow-md rounded p-6'>
      <h1 className='text-2xl font-bold mb-6'>Employee Management</h1>

      {error && (
        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      <div className='border-b border-gray-200 mb-4'>
        <nav>
          <button
            onClick={() => setActiveTab('pending')}
            className={`mr-2 px-2 py-4 text-center border-b-2 font-medium text-sm
              ${activeTab === 'pending' ?
                'border-indigo-500 text-indigo-600' :
                'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Pending Approvals
          </button>

          <button
            onClick={() => setActiveTab('approved')}
            className={`mr-2 px-2 py-4 text-center border-b-2 font-medium text-sm ${
              activeTab === 'approved'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Approved Employees
          </button>
        </nav>
      </div>

      {renderTabContent()}

      {/* Password Update Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-xl font-semibold mb-4">Update Password</h3>
            <p className="text-gray-600 mb-4">
              Updating password for: <strong>{selectedUser?.username}</strong>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter new password"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirm new password"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={closePasswordModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePassword}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employee;