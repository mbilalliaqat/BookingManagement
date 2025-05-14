import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TableSpinner from '../../ui/TableSpinner';

const Employee = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [approvedEmployees, setApprovedEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'approved'

  const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;

  useEffect(() => {
    // Fetch users when component mounts
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You are not authenticated');
        setLoading(false);
        return;
      }

      // Fetch pending users
      const pendingResponse = await axios.get(`${BASE_URL}/admin/pending-users`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setPendingUsers(pendingResponse.data.users || []);
      
      // Fetch all approved employees
      const approvedResponse = await axios.get(`${BASE_URL}/admin/employees`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
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

      // Send approve request with the approved status
      const response = await axios.post(
        `${BASE_URL}/admin/approve-user`,
        { userId, approved },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.status === 'success') {
        // Show success message
        setSuccessMessage(`User ${approved ? 'approved' : 'rejected'} successfully`);
        
        // If approved, move the user to the approved list
        if (approved) {
          const approvedUser = pendingUsers.find(user => user.id === userId);
          if (approvedUser) {
            setApprovedEmployees([...approvedEmployees, {...approvedUser, isApproved: true }]);
          }
        }
        
        // Remove from pending list
        setPendingUsers(pendingUsers.filter(user => user.id !== userId));
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${approved ? 'approve' : 'reject'} user`);
      console.error(`Error ${approved ? 'approving' : 'rejecting'} user:`, err);
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setError('');
      }, 3000);
    }
  };

  // Function to handle rejecting an approved employee
  const handleRejectEmployee = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You are not authenticated');
        return;
      }

      // Call endpoint to set user as inactive
      const response = await axios.post(
        `${BASE_URL}/admin/approve-user`,
        { userId, approved: false },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.status === 'success') {
        // Show success message
        setSuccessMessage('Employee rejected and moved to pending');
        
        // Get the rejected employee data
        const rejectedEmployee = approvedEmployees.find(user => user.id === userId);
        
        // Move the employee to pending list if we have their data
        if (rejectedEmployee) {
          setPendingUsers([...pendingUsers, {...rejectedEmployee, isApproved: false}]);
        }
        
        // Remove the employee from approved list
        setApprovedEmployees(approvedEmployees.filter(user => user.id !== userId));
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject employee');
      console.error('Error rejecting employee:', err);
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setError('');
      }, 3000);
    }
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <div>
          <TableSpinner />
        </div>
      );
    }

    if (activeTab === 'pending') {
      return (
        <>
          <h2 className="text-xl font-semibold mb-4">Pending Approvals</h2>
          {pendingUsers.length === 0 ? (
            <div className="text-gray-500 text-center py-4">
              No pending user approvals
            </div>
          ) : (
            <div className="overflow-x-auto max-h-65 rounded-2xl">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-[#111827] text-gray-400 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left">Username</th>
                    <th className="py-3 px-6 text-left">Email</th>
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
            <div className="text-gray-500 text-center py-4">
              No approved employees found
            </div>
          ) : (
            <div className="overflow-x-auto max-h-65 rounded-2xl">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-[#111827] text-gray-400 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left">Username</th>
                    <th className="py-3 px-6 text-left">Email</th>
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
                      <td className="py-3 px-6 text-left">{user.role}</td>
                      <td className="py-3 px-6 text-center">
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          Active
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center">
                        <button
                          onClick={() => handleRejectEmployee(user.id)}
                          className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-xs"
                        >
                          Reject
                        </button>
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
    </div>
  );
};

export default Employee;