import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { fetchEntryCounts } from '../../ui/api';

const Expense_Form = ({ onCancel, onSubmitSuccess, editEntry }) => {
    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;
    const { user } = useAppContext();
    const [isLoading, setIsLoading] = useState(false);
    const [entryNumber, setEntryNumber] = useState(0);
    const [totalEntries, setTotalEntries] = useState(0);
    const [vendors, setVendors] = useState([]);
    
    const [data, setData] = useState({
        user_name: user?.username || '',
        entry: '0/0',
        date: new Date().toISOString().split('T')[0],
        detail: '',
        total_amount: '',
        selection: '',
        withdraw: '',
        vendor_id: ''
    });

    const [prevError, setPrevError] = useState({
        user_name: '',
        entry: '',
        date: '',
        detail: '',
        total_amount: '',
        selection: '',
        vendor_id: '',
        general: ''
    });

    // Fetch vendors on component mount
    useEffect(() => {
        const fetchVendors = async () => {
            try {
                const response = await fetch(`${BASE_URL}/vender-names/existing`);
                if (response.ok) {
                    const result = await response.json();
                    if (result.status === 'success' && result.vendorNames) {
                        setVendors(result.vendorNames);
                    }
                }
            } catch (error) {
                console.error('Error fetching vendors:', error);
            }
        };
        fetchVendors();
    }, [BASE_URL]);

    // Fetch entry counts on component mount
    useEffect(() => {
        const getCounts = async () => {
            const counts = await fetchEntryCounts();
            if (counts) {
                const expenseCounts = counts.find(c => c.form_type === 'expense');
                if (expenseCounts) {
                    setEntryNumber(expenseCounts.current_count + 1);
                    setTotalEntries(expenseCounts.global_count + 1);
                } else {
                    setEntryNumber(1);
                    setTotalEntries(1);
                }
            } else {
                setEntryNumber(1);
                setTotalEntries(1);
            }
        };
        getCounts();
    }, []);

    // Update entry field when entry numbers change
    useEffect(() => {
        setData(prev => ({
            ...prev,
            user_name: user?.username || '',
            entry: `${entryNumber}/${totalEntries}`
        }));
    }, [entryNumber, totalEntries, user]);

    useEffect(() => {
        if (editEntry) {
            setData({
                user_name: editEntry.user_name || user?.username || '',
                entry: editEntry.entry || `${entryNumber}/${totalEntries}`,
                date: editEntry.date ? new Date(editEntry.date).toISOString().split('T')[0] : '',
                detail: editEntry.detail || '',
                total_amount: editEntry.total_amount || '',
                selection: editEntry.selection || '',
                withdraw: editEntry.withdraw || '',
                vendor_id: editEntry.vendor_id || ''
            });
        }
    }, [editEntry, entryNumber, totalEntries, user]);

    const handleChange = (e) => {
        setData({ ...data, [e.target.name]: e.target.value });
        setPrevError({ ...prevError, [e.target.name]: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let newErrors = {};
        let isValid = true;

        if (!data.user_name) {
            newErrors.user_name = 'Enter Name';
            isValid = false;
        }
        if (!data.date) {
            newErrors.date = 'Enter Date';
            isValid = false;
        }
        if (!data.entry) {
            newErrors.entry = 'Enter Entry';
            isValid = false;
        }
        if (!data.detail) {
            newErrors.detail = 'Enter Detail';
            isValid = false;
        }
        
        
        // Validate vendor_id if withdraw value is provided
        if (data.withdraw && !data.vendor_id) {
            newErrors.vendor_id = 'Select Vendor for withdraw';
            isValid = false;
        }

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (data.date && !dateRegex.test(data.date)) {
            newErrors.date = 'Invalid date format (yyyy-MM-dd)';
            isValid = false;
        } else if (data.date) {
            const [year, month, day] = data.date.split('-').map(Number);
            if (month < 1 || month > 12 || day < 1 || day > 31) {
                newErrors.date = 'Invalid date values';
                isValid = false;
            }
        }

        if (isValid) {
            setIsLoading(true);
            
            const requestData = {
                user_name: data.user_name,
                entry: data.entry,
                date: data.date,
                detail: data.detail,
                total_amount: parseInt(data.total_amount) || 0,
                selection: data.selection,
                withdraw: data.withdraw ? parseInt(data.withdraw) : null,
                vendor_name: data.vendor_id || null
            };

            console.log('Submitting expense data:', requestData);

            try {
                const url = editEntry
                    ? `${BASE_URL}/expenses/${editEntry.id}`
                    : `${BASE_URL}/expenses`;
                const method = editEntry ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestData),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                }

                const result = await response.json();
                console.log('Success response:', result);

                setData({
                    user_name: user?.username || '',
                    entry: `${entryNumber}/${totalEntries}`,
                    date: '',
                    detail: '',
                    total_amount: '',
                    selection: '',
                    withdraw: '',
                    vendor_id: ''
                });

                if (onSubmitSuccess) {
                    onSubmitSuccess();
                } else {
                    onCancel();
                }
            } catch (error) {
                console.error('Error:', error);
                setPrevError({ ...prevError, general: `Failed to submit form: ${error.message}` });
            } finally {
                setIsLoading(false);
            }
        } else {
            setPrevError(newErrors);
        }
    };

    // Spinner component for the loader
    const LoadingSpinner = () => (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    );

    return (
        <div className="flex items-center justify-center bg-white p-4">
            <div className="w-full max-w-3xl p-8 rounded-md">
                <div className="flex items-center justify-between mb-6">
                    <div className="text-2xl font-semibold relative inline-block">
                        EXPENSE FORM
                        <div className="absolute bottom-0 left-0 w-8 h-1 bg-gradient-to-r from-blue-300 to-purple-500 rounded"></div>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-gray-700 hover:text-gray-900 transition-colors"
                    >
                        <i className="fas fa-arrow-left text-xl"></i>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className='flex-1 overflow-y-auto p-6'>
                    <div className="flex flex-wrap justify-between gap-4">
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">EMPLOYEE NAME</label>
                            <input
                                type="text"
                                name="user_name"
                                value={data.user_name}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-100"
                                readOnly
                            />
                            {prevError.user_name && <span className="text-red-500">{prevError.user_name}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Entry</label>
                            <input
                                type="text"
                                name="entry"
                                value={data.entry}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-100"
                                readOnly
                            />
                            {prevError.entry && <span className="text-red-500">{prevError.entry}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Date</label>
                            <input
                                type="date"
                                name="date"
                                value={data.date}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.date && <span className="text-red-500">{prevError.date}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Detail</label>
                            <input
                                type="text"
                                name="detail"
                                value={data.detail}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.detail && <span className="text-red-500">{prevError.detail}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Select Vendor</label>
                            <select
                                value={data.vendor_id}
                                name="vendor_id"
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            >
                                <option value="">SELECT VENDOR</option>
                                {vendors.map((vendorName, index) => (
                                    <option key={index} value={vendorName}>
                                        {vendorName}
                                    </option>
                                ))}
                            </select>
                            {prevError.vendor_id && <span className="text-red-500">{prevError.vendor_id}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Withdraw</label>
                            <input
                                type="number"
                                name="withdraw"
                                value={data.withdraw}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Select Type</label>
                            <select
                                value={data.selection}
                                name="selection"
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            >
                                <option value="">SELECT TYPE</option>
                                <option value="UTILITY BILL">UTILITY BILL</option>
                                <option value="EMPLOYEE">EMPLOYEE</option>
                                <option value="REFUND TO CUSTOMER">REFUND TO CUSTOMER</option>
                                <option value="OFFICE EXPENSE">OFFICE EXPENSE</option>
                                <option value="OWNER RECEIVING">OWNER RECEIVING</option>
                                <option value="OFFICE BANK">OFFICE BANK</option>
                                <option value="VENDER SEND">VENDER SEND</option>
                                <option value="OTHER">OTHER</option>
                            </select>
                            {prevError.selection && <span className="text-red-500">{prevError.selection}</span>}
                        </div>
                    </div>
                    {prevError.general && <div className="text-red-500 mt-4">{prevError.general}</div>}
                    <div className="mt-10 flex justify-center">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-70 bg-gray-300 text-black font-medium py-3 px-6 rounded-md hover:bg-gray-400 transition-all flex items-center justify-center ${isLoading ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            {isLoading && <LoadingSpinner />}
                            {editEntry ? 'Update' : 'Submit'}
                        </button>
                        <button
                            type="button"
                            className="ml-4 w-70 bg-gray-300 text-black font-medium py-3 px-6 rounded-md hover:bg-gray-400 transition-all cursor-pointer"
                            onClick={onCancel}
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Expense_Form;