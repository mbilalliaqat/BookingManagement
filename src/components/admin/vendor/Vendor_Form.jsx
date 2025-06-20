import React, { useState, useEffect } from 'react';
import ButtonSpinner from '../../ui/ButtonSpinner';

const Vendor_Form = ({ onCancel, onSubmitSuccess, editEntry }) => {

     const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;
    const [data, setData] = useState({
        user_name: '',
        entry: '',
        date: '',
        amount: '',
        bank_title: '',
        debit: '',       
        credit: '',      
        file: null,
        withdraw:''
    });

    const [prevError, setPrevError] = useState({
        user_name: '',
        entry: '',
        date: '',
        amount: '',
        bank_title: '',
        debit: '',        
        credit: '',       
        general: ''
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (editEntry) {
            setData({
                user_name: editEntry.user_name || '',
                entry: editEntry.entry || '',
                date: editEntry.date ? new Date(editEntry.date).toISOString().split('T')[0] : '',
                amount: editEntry.amount || '',
                bank_title: editEntry.bank_title || '',
                debit: editEntry.debit || '',      
                credit: editEntry.credit || '',    
                file: null,
                withdraw: editEntry.withdraw || ''
            });
        }
    }, [editEntry]);

    const handleChange = (e) => {
         if (e.target.type === 'file') {
        setData({ ...data, file: e.target.files[0] });  
    } else {
        setData({ ...data, [e.target.name]: e.target.value });
    }
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
        if (!data.amount) {
            newErrors.amount = 'Enter Amount';
            isValid = false;
        }
        if (!data.bank_title) {
            newErrors.bank_title = 'Enter Bank Title';
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
            const formData = new FormData();
            formData.append('user_name', data.user_name);
            formData.append('entry', data.entry);
            formData.append('date', data.date);
            formData.append('amount', data.amount);
            formData.append('bank_title', data.bank_title);
            formData.append('debit', data.debit || '0');
            formData.append('credit', data.credit || '0');
            formData.append('withdraw', data.withdraw || '0'); // ✅ FIXED: Added withdraw field
            
            // Only append file if it exists
            if (data.file) {
                formData.append('file', data.file);
            }

            try {
                   const url = editEntry
                    ? `${BASE_URL}/vender/${editEntry.id}`
                    : `${BASE_URL}/vender`;
                const method = editEntry ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method,
                    body: formData, 
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
                    amount: '',
                    bank_title: '',
                    debit: '',
                    credit: '',
                    file: null,
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
            <div className="w-full max-w-3xl p-8 rounded-md">
                <div className="text-2xl font-semibold mb-6 relative inline-block">
                    VENDOR FORM
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
                                disabled={isSubmitting}
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
                                disabled={isSubmitting}
                            />
                            {prevError.date && <span className="text-red-500">{prevError.date}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Detail</label>
                            <input
                                type="text"
                                name="entry"
                                value={data.entry}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                disabled={isSubmitting}
                            />
                            {prevError.entry && <span className="text-red-500">{prevError.entry}</span>}
                        </div>
                      
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Bank Title</label>
                            <input
                                type="text"
                                name="bank_title"
                                value={data.bank_title}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                disabled={isSubmitting}
                            />
                            {prevError.bank_title && <span className="text-red-500">{prevError.bank_title}</span>}
                        </div>
                          <div className="w-full sm:w-[calc(50%-10px)]">
                              <label className="block font-medium mb-1">Debit</label>
                               <input
                               type="number"
                               name="debit"
                               value={data.debit}
                               onChange={handleChange}
                               className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                               disabled={isSubmitting}
                           />
                              {prevError.debit && <span className="text-red-500">{prevError.debit}</span>}
                        </div>
                          <div className="w-full sm:w-[calc(50%-10px)]">
                              <label className="block font-medium mb-1">Credit</label>
                                <input
                                type="number"
                                name="credit"
                                value={data.credit}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                disabled={isSubmitting}
                           />
                                 {prevError.credit && <span className="text-red-500">{prevError.credit}</span>}
                            </div>
                              <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Withdraw</label>
                            <input
                                type="number"
                                name="withdraw"
                                value={data.withdraw}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                disabled={isSubmitting}
                            />
                        </div>
                              <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Amount</label>
                            <input
                                type="number"
                                name="amount"
                                value={data.amount}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                disabled={isSubmitting}
                            />
                            {prevError.amount && <span className="text-red-500">{prevError.amount}</span>}
                        </div>
                         <div className="w-full sm:w-[calc(50%-10px)]">
                             <label className="block font-medium mb-1">Attachment</label>
                             <input
                            type="file"
                            name="file"
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                             disabled={isSubmitting}
                             accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            />
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

export default Vendor_Form;