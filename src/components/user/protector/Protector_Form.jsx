import React, { useState, useEffect } from 'react';
import ButtonSpinner from '../../ui/ButtonSpinner';
import { useAppContext } from '../../contexts/AppContext';
import { fetchEntryCounts } from '../../ui/api';

const Protector_Form = ({ onCancel, onSubmitSuccess, editEntry }) => {
    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;
    const { user } = useAppContext();

    const [entryNumber, setEntryNumber] = useState(0);
    const [totalEntries, setTotalEntries] = useState(0);

    const [data, setData] = useState({
        name: '',
        passport: '',
        reference: '',
        file_no: '',
        withdraw: '',
        employee: user?.username || '',
        mcb_fee_6000_date: '',
        ncb_fee_6700_date: '',
        ncb_fee_500_date: '',
        protector_date: '',
        additional_charges: '',
        entry: '0/0'
    });

    const [prevError, setPrevError] = useState({
        name: '',
        passport: '',
        reference: '',
        file_no: '',
        withdraw: '',
        employee: '',
        mcb_fee_6000_date: '',
        ncb_fee_6700_date: '',
        ncb_fee_500_date: '',
        protector_date: '',
        additional_charges: '',
        general: ''
    });

    const [isLoading, setIsLoading] = useState(false);

    // Calculate withdraw when additional_charges changes
    useEffect(() => {
        const additionalCharges = parseInt(data.additional_charges) || 0;
        const calculatedWithdraw = 13200 + additionalCharges;
        setData(prev => ({
            ...prev,
            withdraw: calculatedWithdraw.toString()
        }));
    }, [data.additional_charges]);

    // Fetch entry counts on component mount
    useEffect(() => {
        const getCounts = async () => {
            const counts = await fetchEntryCounts();
            if (counts) {
                const protectorCounts = counts.find(c => c.form_type === 'protector');
                if (protectorCounts) {
                    setEntryNumber(protectorCounts.current_count + 1);
                    setTotalEntries(protectorCounts.global_count + 1);
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
        if (!editEntry) {
            setData(prev => ({
                ...prev,
                employee: user?.username || '',
                entry: `${entryNumber}/${totalEntries}`
            }));
        }
    }, [entryNumber, totalEntries, user, editEntry]);

    useEffect(() => {
        if (editEntry) {
            const formatDateForInput = (dateStr) => {
                if (!dateStr) return '';
                const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
                if (!dateRegex.test(dateStr)) {
                    console.warn(`Invalid date format: ${dateStr}`);
                    return '';
                }
                const [month, day, year] = dateStr.split('/');
                if (parseInt(month) < 1 || parseInt(month) > 12 || parseInt(day) < 1 || parseInt(day) > 31) {
                    console.warn(`Invalid date values: ${dateStr}`);
                    return '';
                }
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            };

            setData({
                name: editEntry.name || '',
                passport: editEntry.passport || '',
                reference: editEntry.reference || '',
                file_no: editEntry.file_no || '',
                withdraw: editEntry.withdraw || '',
                employee: editEntry.employee || user?.username || '',
                mcb_fee_6000_date: formatDateForInput(editEntry.mcb_fee_6000_date),
                ncb_fee_6700_date: formatDateForInput(editEntry.ncb_fee_6700_date),
                ncb_fee_500_date: formatDateForInput(editEntry.ncb_fee_500_date),
                protector_date: formatDateForInput(editEntry.protector_date),
                additional_charges: editEntry.additional_charges || '',
                entry: editEntry.entry || `${entryNumber}/${totalEntries}`
            });
            
            if (editEntry.entry) {
                const [current, total] = editEntry.entry.split('/').map(Number);
                setEntryNumber(current);
                setTotalEntries(total);
            }
        }
    }, [editEntry, user?.username, entryNumber, totalEntries]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setData(prev => ({ ...prev, [name]: value }));
        setPrevError(prev => ({ ...prev, [name]: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let newErrors = {};
        let isValid = true;

        if (!data.name) {
            newErrors.name = 'Enter Name';
            isValid = false;
        }
        if (!data.passport) {
            newErrors.passport = 'Enter Passport';
            isValid = false;
        }
        if (!data.reference) {
            newErrors.reference = 'Enter Reference';
            isValid = false;
        }
        if (!data.file_no) {
            newErrors.file_no = 'Enter File No';
            isValid = false;
        }
        if (!data.employee) {
            newErrors.employee = 'Enter Employee';
            isValid = false;
        }
        if (!data.mcb_fee_6000_date) {
            newErrors.mcb_fee_6000_date = 'Enter Date';
            isValid = false;
        }
        if (!data.ncb_fee_6700_date) {
            newErrors.ncb_fee_6700_date = 'Enter Date';
            isValid = false;
        }
        if (!data.ncb_fee_500_date) {
            newErrors.ncb_fee_500_date = 'Enter Date';
            isValid = false;
        }
        if (!data.protector_date) {
            newErrors.protector_date = 'Enter Protector Date';
            isValid = false;
        }
        if (!data.additional_charges) {
            newErrors.additional_charges = 'Enter Additional Charges';
            isValid = false;
        }

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const validateDate = (dateStr, field) => {
            if (!dateStr || !dateRegex.test(dateStr)) {
                newErrors[field] = 'Invalid date format (yyyy-MM-dd)';
                return false;
            }
            const [year, month, day] = dateStr.split('-').map(Number);
            if (month < 1 || month > 12 || day < 1 || day > 31) {
                newErrors[field] = 'Invalid date values';
                return false;
            }
            return true;
        };

        if (data.mcb_fee_6000_date && !validateDate(data.mcb_fee_6000_date, 'mcb_fee_6000_date')) {
            isValid = false;
        }
        if (data.ncb_fee_6700_date && !validateDate(data.ncb_fee_6700_date, 'ncb_fee_6700_date')) {
            isValid = false;
        }
        if (data.ncb_fee_500_date && !validateDate(data.ncb_fee_500_date, 'ncb_fee_500_date')) {
            isValid = false;
        }
        if (data.protector_date && !validateDate(data.protector_date, 'protector_date')) {
            isValid = false;
        }

        if (isValid) {
            setIsLoading(true);
            const requestData = {
                name: data.name,
                passport: data.passport,
                reference: data.reference,
                file_no: data.file_no,
                withdraw: data.withdraw,
                employee: data.employee,
                mcb_fee_6000_date: data.mcb_fee_6000_date,
                ncb_fee_6700_date: data.ncb_fee_6700_date,
                ncb_fee_500_date: data.ncb_fee_500_date,
                protector_date: data.protector_date,
                additional_charges: parseInt(data.additional_charges),
                entry: data.entry
            };

            console.log('Request Data:', requestData);

            try {
                const url = editEntry
                    ? `${BASE_URL}/protector/${editEntry.id}`
                    : `${BASE_URL}/protector`;
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
                    name: '',
                    passport: '',
                    reference: '',
                    file_no: '',
                    withdraw: '',
                    employee: user?.username || '',
                    mcb_fee_6000_date: '',
                    ncb_fee_6700_date: '',
                    ncb_fee_500_date: '',
                    protector_date: '',
                    additional_charges: '',
                    entry: `${entryNumber}/${totalEntries}`
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

    return (
        <div className="overflow-y-auto flex items-center justify-center bg-white p-4">
            <div className="h-[70vh] w-full max-w-3xl p-8 rounded-md">
                <div className="flex items-center justify-between mb-6">
                    <div className="text-2xl font-semibold relative inline-block">
                        PROTECTOR FORM
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
                            <label className="block font-medium mb-1">Employee</label>
                            <input
                                type="text"
                                name="employee"
                                value={data.employee}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-100"
                                readOnly
                            />
                            {prevError.employee && <span className="text-red-500">{prevError.employee}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Entry</label>
                            <input
                                type="text"
                                name="entry"
                                value={data.entry}
                                readOnly
                                className="w-full border border-gray-300 rounded-md px-3 py-1 bg-gray-100 cursor-not-allowed"
                            />
                        </div>
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
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">File No</label>
                            <input
                                type="text"
                                name="file_no"
                                value={data.file_no}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.file_no && <span className="text-red-500">{prevError.file_no}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Withdraw</label>
                            <input
                                type="text"
                                name="withdraw"
                                value={data.withdraw}
                                readOnly
                                className="w-full border border-gray-300 rounded-md px-3 py-1 bg-gray-100 cursor-not-allowed"
                            />
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">MCB FEE / 6000 DATE</label>
                            <input
                                type="date"
                                name="mcb_fee_6000_date"
                                value={data.mcb_fee_6000_date}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.mcb_fee_6000_date && <span className="text-red-500">{prevError.mcb_fee_6000_date}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">NCB FEE / 6700 DATE</label>
                            <input
                                type="date"
                                name="ncb_fee_6700_date"
                                value={data.ncb_fee_6700_date}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.ncb_fee_6700_date && <span className="text-red-500">{prevError.ncb_fee_6700_date}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">NCB FEE / 500 DATE</label>
                            <input
                                type="date"
                                name="ncb_fee_500_date"
                                value={data.ncb_fee_500_date}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.ncb_fee_500_date && <span className="text-red-500">{prevError.ncb_fee_500_date}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Protector Date</label>
                            <input
                                type="date"
                                name="protector_date"
                                value={data.protector_date}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.protector_date && <span className="text-red-500">{prevError.protector_date}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Additional Charges</label>
                            <input
                                type="number"
                                name="additional_charges"
                                value={data.additional_charges}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                            {prevError.additional_charges && <span className="text-red-500">{prevError.additional_charges}</span>}
                        </div>
                    </div>
                    {prevError.general && <div className="text-red-500 mt-4">{prevError.general}</div>}
                    <div className="mt-10 flex justify-center">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-70 bg-gray-300 text-black font-medium py-3 rounded-md hover:bg-gray-400 transition-all cursor-pointer flex items-center justify-center"
                        >
                            {isLoading && <ButtonSpinner />}
                            {editEntry ? 'Update' : 'Submit'}
                        </button>
                        <button
                            type="button"
                            className="ml-4 w-70 bg-gray-300 text-black font-medium py-3 rounded-md hover:bg-gray-400 transition-all cursor-pointer"
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

export default Protector_Form;