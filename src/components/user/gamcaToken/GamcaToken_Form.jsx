import React, { useState, useEffect } from 'react';
import ButtonSpinner from '../../ui/ButtonSpinner';

const GamcaToken_Form = ({ onCancel, onSubmitSuccess, editEntry }) => {

    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;
    const [data, setData] = useState({
        employee_name: '',
        entry: '',
        customer_add: '',
        reference: '',
        country: '',
        passport_detail: '',
        receivable_amount: '',
        paid_cash: '',
        paid_in_bank: '',
        profit: '',
        remaining_amount: ''
    });

    const [prevError, setPrevError] = useState({
        employee_name: '',
        entry: '',
        customer_add: '',
        reference: '',
        country: '',
        passport_detail: '',
        receivable_amount: '',
        paid_cash: '',
        paid_in_bank: '',
        profit: '',
        remaining_amount: ''
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (editEntry) {
            setData({
                employee_name: editEntry.employee_name || '',
                entry: editEntry.entry || '',
                customer_add: editEntry.customer_add || '',
                reference: editEntry.reference || '',
                country: editEntry.country || '',
                passport_detail: editEntry.passport_detail || '',
                receivable_amount: editEntry.receivable_amount || '',
                paid_cash: editEntry.paid_cash || '',
                paid_in_bank: editEntry.paid_in_bank || '',
                profit: editEntry.profit || '',
                remaining_amount: editEntry.remaining_amount || ''
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

        if (data.employee_name === '') {
            setPrevError({ ...prevError, employee_name: 'Enter Your User Name' });
            setIsSubmitting(false);
        } else if (data.entry === '') {
            setPrevError({ ...prevError, entry: 'Enter Your Entry' });
            setIsSubmitting(false);
        } else if (data.customer_add === '') {
            setPrevError({ ...prevError, customer_add: 'Enter Your Customer Add' });
            setIsSubmitting(false);
        } else if (data.reference === '') {
            setPrevError({ ...prevError, reference: 'Enter Your Reference' });
            setIsSubmitting(false);
        } else if (data.country === '') {
            setPrevError({ ...prevError, country: 'Enter Your Country' });
            setIsSubmitting(false);
        } else if (data.passport_detail === '') {
            setPrevError({ ...prevError, passport_detail: 'Enter Your Passport Detail' });
            setIsSubmitting(false);
        } else if (data.receivable_amount === '') {
            setPrevError({ ...prevError, receivable_amount: 'Enter Your Receivable Amount' });
            setIsSubmitting(false);
        } else if (data.paid_cash === '') {
            setPrevError({ ...prevError, paid_cash: 'Enter Your Paid Cash' });
            setIsSubmitting(false);
        } else if (data.paid_in_bank === '') {
            setPrevError({ ...prevError, paid_in_bank: 'Enter Your Paid In Bank' });
            setIsSubmitting(false);
        } else if (data.profit === '') {
            setPrevError({ ...prevError, profit: 'Enter Your Profit' });
            setIsSubmitting(false);
        } else if (data.remaining_amount === '') {
            setPrevError({ ...prevError, remaining_amount: 'Enter Your Remaining Amount' });
            setIsSubmitting(false);
        } else {
            const requestData = {
                employee_name: data.employee_name,
                entry: parseInt(data.entry),
                customer_add: data.customer_add,
                reference: data.reference,
                country: data.country,
                passport_detail: data.passport_detail,
                receivable_amount: parseInt(data.receivable_amount),
                paid_cash: parseInt(data.paid_cash),
                paid_in_bank: data.paid_in_bank,
                profit: parseInt(data.profit),
                remaining_amount: parseInt(data.remaining_amount)
            };

            try {
                const url = editEntry
                    ? `${BASE_URL}/gamca-token/${editEntry.id}`
                    : `${BASE_URL}/gamca-token`;
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
                    employee_name: '',
                    entry: '',
                    customer_add: '',
                    reference: '',
                    country: '',
                    passport_detail: '',
                    receivable_amount: '',
                    paid_cash: '',
                    paid_in_bank: '',
                    profit: '',
                    remaining_amount: ''
                });

                if (onSubmitSuccess) {
                    onSubmitSuccess();
                } else {
                    onCancel();
                }
            } catch (error) {
                console.error('Error:', error);
                setPrevError({ ...prevError, general: 'Failed to submit form. Please try again later.' });
                setIsSubmitting(false);
            }
        }
    };

    return (
        <div className="overflow-y-auto flex items-center justify-center bg-white p-4">
            <div className="h-[70vh] w-full max-w-3xl p-8 rounded-md">
                <div className="text-2xl font-semibold mb-6 relative inline-block">
                    GAMCA TOKEN
                    <div className="absolute bottom-0 left-0 w-8 h-1 bg-gradient-to-r from-blue-300 to-purple-500 rounded"></div>
                </div>
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                    <div className="flex flex-wrap justify-between gap-4">
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Employee Name</label>
                            <input
                                type="text"
                                placeholder="Enter User Name"
                                value={data.employee_name}
                                name="employee_name"
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.employee_name && <span className="text-red-500">{prevError.employee_name}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Entry</label>
                            <input
                                type="number"
                                placeholder="Enter Entry"
                                value={data.entry}
                                name="entry"
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.entry && <span className="text-red-500">{prevError.entry}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Customer Add</label>
                            <input
                                type="text"
                                placeholder="Enter Customer Add"
                                value={data.customer_add}
                                name="customer_add"
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.customer_add && <span className="text-red-500">{prevError.customer_add}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Reference</label>
                            <input
                                type="text"
                                placeholder="Enter Reference"
                                value={data.reference}
                                name="reference"
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.reference && <span className="text-red-500">{prevError.reference}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Country</label>
                            <input
                                type="text"
                                placeholder="Enter Country"
                                value={data.country}
                                name="country"
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.country && <span className="text-red-500">{prevError.country}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Passport Detail</label>
                            <input
                                type="text"
                                placeholder="Enter Passport Detail"
                                value={data.passport_detail}
                                name="passport_detail"
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.passport_detail && <span className="text-red-500">{prevError.passport_detail}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Receivable Amount</label>
                            <input
                                type="number"
                                placeholder="Enter Receivable Amount"
                                value={data.receivable_amount}
                                name="receivable_amount"
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.receivable_amount && <span className="text-red-500">{prevError.receivable_amount}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Paid Cash</label>
                            <input
                                type="number"
                                placeholder="Enter Paid Cash"
                                value={data.paid_cash}
                                name="paid_cash"
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.paid_cash && <span className="text-red-500">{prevError.paid_cash}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Paid In Bank</label>
                            <input
                                type="text"
                                placeholder="Enter Paid In Bank"
                                value={data.paid_in_bank}
                                name="paid_in_bank"
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.paid_in_bank && <span className="text-red-500">{prevError.paid_in_bank}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Profit</label>
                            <input
                                type="number"
                                placeholder="Enter Profit"
                                value={data.profit}
                                name="profit"
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.profit && <span className="text-red-500">{prevError.profit}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Remaining Amount</label>
                            <input
                                type="number"
                                placeholder="Enter Remaining Amount"
                                value={data.remaining_amount}
                                name="remaining_amount"
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.remaining_amount && <span className="text-red-500">{prevError.remaining_amount}</span>}
                        </div>
                    </div>
                    {prevError.general && <div className="text-red-500 mt-4">{prevError.general}</div>}
                    <div className="mt-10 flex justify-center">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-70 bg-gray-300 text-black font-medium py-3 px-8 rounded-md hover:bg-gray-400 transition-all cursor-pointer flex items-center justify-center"
                        >
                            {isSubmitting && <ButtonSpinner />}
                            {editEntry ? 'Update' : 'Submit'}
                        </button>
                        <button
                            type="button"
                            className="ml-4 w-70 bg-gray-300 text-black font-medium py-3 px-8 rounded-md hover:bg-gray-400 transition-all cursor-pointer"
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

export default GamcaToken_Form;