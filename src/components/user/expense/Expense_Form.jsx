import React, { useState, useEffect } from 'react';

const Expense_Form = ({ onCancel, onSubmitSuccess, editEntry }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState({
        user_name: '',
        entry: '',
        date: '',
        detail: '',
        total_amount: '',
        selection: ''
    });

    const [prevError, setPrevError] = useState({
        user_name: '',
        entry: '',
        date: '',
        detail: '',
        total_amount: '',
        selection: '',
        general: ''
    });

    useEffect(() => {
        if (editEntry) {
            setData({
                user_name: editEntry.user_name || '',
                entry: editEntry.entry || '',
                date: editEntry.date ? new Date(editEntry.date).toISOString().split('T')[0] : '',
                detail: editEntry.detail || '',
                total_amount: editEntry.total_amount || '',
                selection: editEntry.selection || ''
            });
        }
    }, [editEntry]);

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
        if (!data.total_amount) {
            newErrors.total_amount = 'Enter Total Amount';
            isValid = false;
        }
        if (!data.selection) {
            newErrors.selection = 'Select Type';
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
                total_amount: parseInt(data.total_amount),
                selection: data.selection
            };

            try {
                const url = editEntry
                    ? `http://localhost:8787/expenses/${editEntry.id}`
                    : 'http://localhost:8787/expenses';
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
                console.log('Success:', result);

                setData({
                    user_name: '',
                    entry: '',
                    date: '',
                    detail: '',
                    total_amount: '',
                    selection: ''
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
                <div className="text-2xl font-semibold mb-6 relative inline-block">
                    EXPENSE FORM
                    <div className="absolute bottom-0 left-0 w-8 h-1 bg-gradient-to-r from-blue-300 to-purple-500 rounded"></div>
                </div>
                <form onSubmit={handleSubmit} className='flex-1 overflow-y-auto p-6'>
                    <div className="flex flex-wrap justify-between gap-4">
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">User Name</label>
                            <input
                                type="text"
                                name="user_name"
                                value={data.user_name}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.user_name && <span className="text-red-500">{prevError.user_name}</span>}
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
                            <label className="block font-medium mb-1">Entry</label>
                            <input
                                type="text"
                                name="entry"
                                value={data.entry}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.entry && <span className="text-red-500">{prevError.entry}</span>}
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
                            <label className="block font-medium mb-1">Total Amount</label>
                            <input
                                type="number"
                                name="total_amount"
                                value={data.total_amount}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.total_amount && <span className="text-red-500">{prevError.total_amount}</span>}
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