import React, { useState, useEffect } from 'react';
import ButtonSpinner from '../../ui/ButtonSpinner';

const Services_Form = ({ onCancel, onSubmitSuccess, editEntry }) => {

    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;
    const [data, setData] = useState({
        user_name: '',
        entry: '',
        customer_add: '',
        booking_date: '',
        specific_detail: '',
        receivable_amount: '',
        paid_cash: '',
        paid_in_bank: '',
        profit: '',
        remaining_amount: '',
        visa_type: ''
    });

    

    const [prevError, setPrevError] = useState({
        user_name: '',
        entry: '',
        customer_add: '',
        booking_date: '',
        specific_detail: '',
        receivable_amount: '',
        paid_cash: '',
        paid_in_bank: '',
        profit: '',
        remaining_amount: '',
        visa_type: ''
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (editEntry) {
            setData({
                user_name: editEntry.user_name || '',
                entry: editEntry.entry || '',
                customer_add: editEntry.customer_add || '',
                booking_date: editEntry.booking_date ? editEntry.booking_date.split('/').reverse().join('-') : '',
                specific_detail: editEntry.specific_detail || '',
                receivable_amount: editEntry.receivable_amount || '',
                paid_cash: editEntry.paid_cash || '',
                paid_in_bank: editEntry.paid_in_bank || '',
                profit: editEntry.profit || '',
                remaining_amount: editEntry.remaining_amount || '',
                visa_type: editEntry.visa_type || ''
            });
        }
    }, [editEntry]);

    const handleChange = (e) => {
        setData({ ...data, [e.target.name]: e.target.value });
        setPrevError({ ...prevError, [e.target.name]: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        let newErrors = {};
        let isValid = true;

        if (!data.user_name) {
            newErrors.user_name = 'Enter User Name';
            isValid = false;
        }
        if (!data.entry) {
            newErrors.entry = 'Enter Entry';
            isValid = false;
        }
        if (!data.customer_add) {
            newErrors.customer_add = 'Enter Customer Address';
            isValid = false;
        }
        if (!data.booking_date) {
            newErrors.booking_date = 'Enter Booking Date';
            isValid = false;
        }
        if (!data.specific_detail) {
            newErrors.specific_detail = 'Enter Specific Detail';
            isValid = false;
        }
        if (!data.receivable_amount) {
            newErrors.receivable_amount = 'Enter Receivable Amount';
            isValid = false;
        }
        if (!data.paid_cash) {
            newErrors.paid_cash = 'Enter Paid Cash';
            isValid = false;
        }
        if (!data.paid_in_bank) {
            newErrors.paid_in_bank = 'Enter Bank Name';
            isValid = false;
        }
        if (!data.profit) {
            newErrors.profit = 'Enter Profit';
            isValid = false;
        }
        if (!data.remaining_amount) {
            newErrors.remaining_amount = 'Enter Remaining Amount';
            isValid = false;
        }
        if (!data.visa_type) {
            newErrors.visa_type = 'Select Visa Type';
            isValid = false;
        }

        if (!isValid) {
            setPrevError(newErrors);
            setIsSubmitting(false);
            return;
        }

        const requestData = {
            user_name: data.user_name,
            entry: parseInt(data.entry),
            customer_add: data.customer_add,
            booking_date: data.booking_date,
            specific_detail: data.specific_detail,
            receivable_amount: parseInt(data.receivable_amount),
            paid_cash: parseInt(data.paid_cash),
            paid_in_bank: data.paid_in_bank,
            profit: parseInt(data.profit),
            remaining_amount: parseInt(data.remaining_amount),
            visa_type: data.visa_type
        };

        try {
            const url = editEntry
                ? `${BASE_URL}/services/${editEntry.id}`
                : `${BASE_URL}/services`;
            const method = editEntry ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Success:', result);

            setData({
                user_name: '',
                entry: '',
                customer_add: '',
                booking_date: '',
                specific_detail: '',
                receivable_amount: '',
                paid_cash: '',
                paid_in_bank: '',
                profit: '',
                remaining_amount: '',
                visa_type: ''
            });

            if (onSubmitSuccess) {
                onSubmitSuccess();
            } else {
                onCancel();
            }
        } catch (error) {
            console.error('Error:', error);
            setPrevError({ ...prevError, general: 'Failed to submit form. Please try again later.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="overflow-y-auto flex items-center justify-center bg-white p-4">
            <div className="h-[70vh] w-full max-w-3xl p-8 rounded-md">
                <div className="text-2xl font-semibold mb-6 relative inline-block">
                    SERVICES FORM
                    <div className="absolute bottom-0 left-0 w-8 h-1 bg-gradient-to-r from-blue-300 to-purple-500 rounded"></div>
                </div>
                <form onSubmit={handleSubmit} className='flex-1 overflow-y-auto p-6'>
                    <div className="flex flex-wrap justify-between gap-4">
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">User Name</label>
                            <input
                                type="text"
                                placeholder='Enter User Name'
                                value={data.user_name}
                                name='user_name'
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                disabled={isSubmitting}
                            />
                            {prevError.user_name && <span className="text-red-500">{prevError.user_name}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Entry</label>
                            <input
                                type="number"
                                placeholder='Enter Entry'
                                value={data.entry}
                                name='entry'
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                disabled={isSubmitting}
                            />
                            {prevError.entry && <span className="text-red-500">{prevError.entry}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Customer Add</label>
                            <input
                                type="text"
                                placeholder='Enter Customer Add'
                                value={data.customer_add}
                                name='customer_add'
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                disabled={isSubmitting}
                            />
                            {prevError.customer_add && <span className='text-red-500'>{prevError.customer_add}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Booking Date</label>
                            <input
                                type="date"
                                placeholder='Enter Booking Date'
                                value={data.booking_date}
                                name='booking_date'
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                disabled={isSubmitting}
                            />
                            {prevError.booking_date && <span className='text-red-500'>{prevError.booking_date}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Specific Detail</label>
                            <input
                                type="text"
                                placeholder='Enter Specific Detail'
                                value={data.specific_detail}
                                name='specific_detail'
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                disabled={isSubmitting}
                            />
                            {prevError.specific_detail && <span className='text-red-500'>{prevError.specific_detail}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Receivable Amount</label>
                            <input
                                type="number"
                                placeholder='Enter Receivable Amount'
                                value={data.receivable_amount}
                                name='receivable_amount'
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                disabled={isSubmitting}
                            />
                            {prevError.receivable_amount && <span className='text-red-500'>{prevError.receivable_amount}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Paid Cash</label>
                            <input
                                type="number"
                                placeholder='Enter Paid Cash'
                                value={data.paid_cash}
                                name='paid_cash'
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                disabled={isSubmitting}
                            />
                            {prevError.paid_cash && <span className='text-red-500'>{prevError.paid_cash}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Paid In Bank</label>
                            <input
                                type="text"
                                placeholder='Enter Paid In Bank'
                                value={data.paid_in_bank}
                                name='paid_in_bank'
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                disabled={isSubmitting}
                            />
                            {prevError.paid_in_bank && <span className='text-red-500'>{prevError.paid_in_bank}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Profit</label>
                            <input
                                type="number"
                                placeholder='Enter Profit'
                                value={data.profit}
                                name='profit'
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                disabled={isSubmitting}
                            />
                            {prevError.profit && <span className='text-red-500'>{prevError.profit}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Remaining Amount</label>
                            <input
                                type="number"
                                placeholder='Enter Remaining Amount'
                                value={data.remaining_amount}
                                name='remaining_amount'
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                disabled={isSubmitting}
                            />
                            {prevError.remaining_amount && <span className='text-red-500'>{prevError.remaining_amount}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Visa Type</label>
                            <select
                                value={data.visa_type}
                                onChange={handleChange}
                                name="visa_type"
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                disabled={isSubmitting}
                            >
                                <option value="">Select Visa Type</option>
                                <option value="NAVTTC">NAVTTC</option>
                                <option value="VISIT VISA">VISIT VISA</option>
                                <option value="WORK VISA">WORK VISA</option>
                                <option value="E-PROTECTOR">E-PROTECTOR</option>
                                <option value="OTHERS">OTHERS</option>
                            </select>
                            {prevError.visa_type && <span className='text-red-500'>{prevError.visa_type}</span>}
                        </div>
                    </div>
                    {prevError.general && <div className="text-red-500 mt-4">{prevError.general}</div>}
                    <div className="mt-10 flex justify-center">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-70 bg-gray-300 text-black font-medium py-3 rounded-md hover:bg-gray-400 transition-all cursor-pointer flex items-center justify-center"
                        >
                            {isSubmitting ? (
                                <>
                                    <ButtonSpinner />
                                    {editEntry ? 'Updating...' : 'Submitting...'}
                                </>
                            ) : (
                                editEntry ? 'Update' : 'Submit'
                            )}
                        </button>
                        <button
                            type="button"
                            className="ml-4 w-70 bg-gray-300 text-black font-medium py-3 rounded-md hover:bg-gray-400 transition-all cursor-pointer"
                            onClick={onCancel}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Services_Form;