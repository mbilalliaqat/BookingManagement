import React, { useState, useEffect } from 'react';
import ButtonSpinner from '../../ui/ButtonSpinner';
import { useAppContext } from '../../contexts/AppContext';
import { fetchEntryCounts } from '../../ui/api';

const Refunded_Form = ({ onCancel, onSubmitSuccess, editEntry }) => {

    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;

    const { user } = useAppContext();
    const [entryNumber, setEntryNumber] = useState(0);
    const [totalEntries, setTotalEntries] = useState(0);

    const [data, setData] = useState({
        employee: user?.username || '',
        entry: '0/0',
        date: '',
        name: '',
        passport: '',
        reference: '',
        paid_fee_date: '',
        paid_refund_date: '',
        total_balance: '',
        withdraw: ''
    });

    const [prevError, setPrevError] = useState({
        employee: '',
        entry: '',
        date: '',
        name: '',
        passport: '',
        reference: '',
        paid_fee_date: '',
        paid_refund_date: '',
        total_balance: '',
        general: ''
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch entry counts on component mount
    useEffect(() => {
        const getCounts = async () => {
            const counts = await fetchEntryCounts();
            if (counts) {
                const refundedCounts = counts.find(c => c.form_type === 'refunded');
                if (refundedCounts) {
                    setEntryNumber(refundedCounts.current_count + 1);
                    setTotalEntries(refundedCounts.global_count + 1);
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
            employee: user?.username || '',
            entry: `${entryNumber}/${totalEntries}`
        }));
    }, [entryNumber, totalEntries, user]);

    useEffect(() => {
        if (editEntry) {
            setData({
                employee: editEntry.employee || user?.username || '',
                entry: editEntry.entry || `${entryNumber}/${totalEntries}`,
                date: editEntry.date ? new Date(editEntry.date).toISOString().split('T')[0] : '',
                name: editEntry.name || '',
                passport: editEntry.passport || '',
                reference: editEntry.reference || '',
                paid_fee_date: editEntry.paid_fee_date ? new Date(editEntry.paid_fee_date).toISOString().split('T')[0] : '',
                paid_refund_date: editEntry.paid_refund_date ? new Date(editEntry.paid_refund_date).toISOString().split('T')[0] : '',
                total_balance: editEntry.total_balance || '',
                withdraw: editEntry.withdraw || ''
            });
        }
    }, [editEntry, entryNumber, totalEntries, user]);

    const handleChange = (e) => {
        setData({ ...data, [e.target.name]: e.target.value });
        setPrevError({ ...prevError, [e.target.name]: '' });
    };

    const validateDate = (dateString, fieldName) => {
        if (!dateString) return '';
        
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateString)) {
            return `Invalid ${fieldName} format (yyyy-MM-dd)`;
        }
        
        const [year, month, day] = dateString.split('-').map(Number);
        if (month < 1 || month > 12 || day < 1 || day > 31) {
            return `Invalid ${fieldName} values`;
        }
        
        return '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let newErrors = {};
        let isValid = true;

        // Required field validations
        if (!data.employee) {
            newErrors.employee = 'Employee is required';
            isValid = false;
        }
        if (!data.entry) {
            newErrors.entry = 'Entry is required';
            isValid = false;
        }
        if (!data.date) {
            newErrors.date = 'Date is required';
            isValid = false;
        }
        if (!data.name) {
            newErrors.name = 'Name is required';
            isValid = false;
        }
        if (!data.passport) {
            newErrors.passport = 'Passport is required';
            isValid = false;
        }
        if (!data.reference) {
            newErrors.reference = 'Reference is required';
            isValid = false;
        }
        if (!data.total_balance) {
            newErrors.total_balance = 'Total balance is required';
            isValid = false;
        }

        // Date validations
        const dateError = validateDate(data.date, 'date');
        if (dateError) {
            newErrors.date = dateError;
            isValid = false;
        }

        const paidFeeDateError = validateDate(data.paid_fee_date, 'paid fee date');
        if (paidFeeDateError) {
            newErrors.paid_fee_date = paidFeeDateError;
            isValid = false;
        }

        const paidRefundDateError = validateDate(data.paid_refund_date, 'paid refund date');
        if (paidRefundDateError) {
            newErrors.paid_refund_date = paidRefundDateError;
            isValid = false;
        }

        // Total balance validation (should be a number)
        if (data.total_balance && isNaN(parseFloat(data.total_balance))) {
            newErrors.total_balance = 'Total balance must be a valid number';
            isValid = false;
        }

        if (isValid) {
            setIsSubmitting(true);
            const requestData = {
                employee: data.employee,
                entry: data.entry,
                date: data.date,
                name: data.name,
                passport: data.passport,
                reference: data.reference,
                paid_fee_date: data.paid_fee_date || null,
                paid_refund_date: data.paid_refund_date || null,
                total_balance: parseFloat(data.total_balance) || 0,
                withdraw: parseFloat(data.withdraw) || 0
            };

            try {
                const url = editEntry
                    ? `${BASE_URL}/refunded/${editEntry.id}`
                    : `${BASE_URL}/refunded`;
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
                    employee: user?.username || '',
                    entry: `${entryNumber}/${totalEntries}`,
                    date: '',
                    name: '',
                    passport: '',
                    reference: '',
                    paid_fee_date: '',
                    paid_refund_date: '',
                    total_balance: '',
                    withdraw: ''
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
                setIsSubmitting(false);
            }
        } else {
            setPrevError(newErrors);
        }
    };

    return (
        <div className="flex items-center justify-center bg-white p-4">
            <div className="w-full max-w-4xl p-8 rounded-md">
                <div className="text-2xl font-semibold mb-6 relative inline-block">
                    REFUNDED FORM
                    <div className="absolute bottom-0 left-0 w-8 h-1 bg-gradient-to-r from-blue-300 to-purple-500 rounded"></div>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-wrap justify-between gap-4">
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Employee </label>
                            <input
                                type="text"
                                name="employee"
                                value={data.employee}
                                onChange={handleChange}
                                readOnly
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-100"
                            />
                            {prevError.employee && <span className="text-red-500 text-sm">{prevError.employee}</span>}
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
                            {prevError.entry && <span className="text-red-500 text-sm">{prevError.entry}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Date </label>
                            <input
                                type="date"
                                name="date"
                                value={data.date}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.date && <span className="text-red-500 text-sm">{prevError.date}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Name </label>
                            <input
                                type="text"
                                name="name"
                                value={data.name}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.name && <span className="text-red-500 text-sm">{prevError.name}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Passport </label>
                            <input
                                type="text"
                                name="passport"
                                value={data.passport}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.passport && <span className="text-red-500 text-sm">{prevError.passport}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Reference </label>
                            <input
                                type="text"
                                name="reference"
                                value={data.reference}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.reference && <span className="text-red-500 text-sm">{prevError.reference}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Paid Fee Date</label>
                            <input
                                type="date"
                                name="paid_fee_date"
                                value={data.paid_fee_date}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.paid_fee_date && <span className="text-red-500 text-sm">{prevError.paid_fee_date}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Paid Refund Date</label>
                            <input
                                type="date"
                                name="paid_refund_date"
                                value={data.paid_refund_date}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.paid_refund_date && <span className="text-red-500 text-sm">{prevError.paid_refund_date}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">WITHDRAW </label>
                            <input
                                type="number"
                                name="withdraw"
                                value={data.withdraw}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Total Balance </label>
                            <input
                                type="number"
                                step="0.01"
                                name="total_balance"
                                value={data.total_balance}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                placeholder="0.00"
                            />
                            {prevError.total_balance && <span className="text-red-500 text-sm">{prevError.total_balance}</span>}
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
                                    <span>{editEntry ? 'Updating...' : 'Submitting...'}</span>
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

export default Refunded_Form;