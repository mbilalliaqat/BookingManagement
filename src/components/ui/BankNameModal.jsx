import React, { useState } from 'react';
import Modal from './Modal'; // Assuming your Modal component is in the same directory
import ButtonSpinner from './ButtonSpinner'; // Assuming your ButtonSpinner is here
import axios from 'axios';

const BankNameModal = ({ isOpen, onClose, onBankAdded }) => {
    const [newBankName, setNewBankName] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL; // Ensure you have this environment variable

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (!newBankName.trim()) {
            setError('Bank name cannot be empty.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.post(`${BASE_URL}/bank-names`, { name: newBankName.trim() });
            if (response.data.status === 'success') {
                onBankAdded(newBankName.trim());
                setNewBankName('');
                onClose();
            } else {
                setError(response.data.message || 'Failed to add bank name.');
            }
        } catch (err) {
            console.error('Error adding bank name:', err);
            setError(err.response?.data?.message || 'Error adding bank name. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Bank Name">
            <form onSubmit={handleSubmit} className="p-4">
                <div className="mb-4">
                    <label htmlFor="bankName" className="block text-sm font-medium text-white mb-2">
                        New Bank Name:
                    </label>
                    <input
                        type="text"
                        id="bankName"
                        value={newBankName}
                        onChange={(e) => setNewBankName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 text-black"
                        placeholder="e.g., Meezan Bank"
                        disabled={isLoading}
                    />
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>
                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-black bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none flex items-center justify-center"
                        disabled={isLoading}
                    >
                        {isLoading && <ButtonSpinner />}
                        Add Bank
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default BankNameModal;