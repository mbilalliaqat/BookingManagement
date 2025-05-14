import React, { useState, useEffect } from 'react';
import ButtonSpinner from '../../ui/ButtonSpinner';

const Refunded_Form = ({ onCancel, onSubmitSuccess, editEntry }) => {

    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;
    const [data, setData] = useState({
        date: '',
        name: '',
        passport: '',
        reference: ''
    });

    const [prevError, setPrevError] = useState({
        date: '',
        name: '',
        passport: '',
        reference: '',
        general: ''
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (editEntry) {
            setData({
                date: editEntry.date ? new Date(editEntry.date).toISOString().split('T')[0] : '',
                name: editEntry.name || '',
                passport: editEntry.passport || '',
                reference: editEntry.reference || ''
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
            setIsSubmitting(true);
            const requestData = {
                date: data.date,
                name: data.name,
                passport: data.passport,
                reference: data.reference
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
                    date: '',
                    name: '',
                    passport: '',
                    reference: ''
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
            <div className="w-full max-w-3xl p-8 rounded-md">
                <div className="text-2xl font-semibold mb-6 relative inline-block">
                    REFUNDED FORM
                    <div className="absolute bottom-0 left-0 w-8 h-1 bg-gradient-to-r from-blue-300 to-purple-500 rounded"></div>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-wrap justify-between gap-4">
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Name</label>
                            <input
                                type="text"
                                name="name"
                                value={data.name}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.name && <span className="text-red-500">{prevError.name}</span>}
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
                            <label className="block font-medium mb-1">Passport</label>
                            <input
                                type="text"
                                name="passport"
                                value={data.passport}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.passport && <span className="text-red-500">{prevError.passport}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Reference</label>
                            <input
                                type="text"
                                name="reference"
                                value={data.reference}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.reference && <span className="text-red-500">{prevError.reference}</span>}
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