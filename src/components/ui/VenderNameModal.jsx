import React, { useState } from 'react';

const VenderNameModal = ({ isOpen, onClose, onVenderAdded }) => { // Renamed prop from onAgentAdded to onVenderAdded
  const [venderName, setVenderName] = useState(''); // Renamed state from agentName to venderName
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!venderName.trim()) { // Using venderName
      setError('Vendor name is required'); // Updated error message
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Call the parent function to add the vendor name
      await onVenderAdded(venderName.trim()); // Using onVenderAdded and venderName
      setVenderName('');
      onClose();
    } catch (err) {
      setError('Failed to add vendor name'); // Updated error message
      console.error('Error adding vendor name:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setVenderName(''); // Using venderName
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Add New Vendor Name</h3> {/* Updated title */}
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              value={venderName} // Using venderName
              onChange={(e) => setVenderName(e.target.value)} // Using setVenderName
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="Enter vendor name" // Updated placeholder
              disabled={isSubmitting}
              autoFocus
            />
            {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Vendor'} {/* Updated button text */}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VenderNameModal;