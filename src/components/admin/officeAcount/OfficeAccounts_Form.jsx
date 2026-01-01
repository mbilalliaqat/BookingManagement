import React, { useState, useEffect } from 'react';
import ButtonSpinner from '../../ui/ButtonSpinner'; // Import the spinner component
import { useAppContext } from '../../contexts/AppContext';
import { fetchEntryCounts } from '../../ui/api'; // Import the fetchEntryCounts function
import axios from 'axios';

const OfficeAccounts_Form = ({ onCancel, onSubmitSuccess, editingEntry,bankBalances =[] }) => {
    const { user } = useAppContext();
    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;
    
    const [vendorNames, setVendorNames] =useState([]);
    const [entryNumber, setEntryNumber] = useState(0);
    const [totalEntries, setTotalEntries] = useState(0);
    const [bankDetailEntryNumber, setBankDetailEntryNumber] = useState(0);
    const [bankDetailTotalEntries, setBankDetailTotalEntries] = useState(0);
    

    const [data, setData] = useState({
        bank_name: '',
        employee_name: user?.username || '',
        entry: '0/0', // Add entry field
        date: '',
        vendor_name:'',
        detail: '',
        credit: '',
        debit: '',
        balance: '',
        payment_method: 'Cash',
    });

    const [prevError, setPrevError] = useState({
        detail: '',
        credit: '',
        debit: '',
        bank_name: '',
        balance: '',
    });

    const [hideFields, setHideFields] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); // Added loading state
    const isEditing = !!editingEntry;

    // Fetch entry counts on component mount
    useEffect(() => {
        const getCounts = async () => {
            const counts = await fetchEntryCounts(); // Assume this function is available
            if (counts) {
                const officeAccountCounts = counts.find(c => c.form_type === 'account');
                if (officeAccountCounts) {
                    setEntryNumber(officeAccountCounts.current_count + 1);
                    setTotalEntries(officeAccountCounts.global_count + 1);
                } else {
                    setEntryNumber(1);
                    setTotalEntries(1);
                }
                const bankCounts = counts.find(c => c.form_type === 'bank-detail');
                if (bankCounts) {
                    setBankDetailEntryNumber(bankCounts.current_count + 1);
                    setBankDetailTotalEntries(bankCounts.global_count + 1);
                } else {
                    setBankDetailEntryNumber(1);
                    setBankDetailTotalEntries(1);
                }
            } else {
                setEntryNumber(1);
                setTotalEntries(1);
                setBankDetailEntryNumber(1);
                setBankDetailTotalEntries(1);
            }
        };
        getCounts();
    }, []);

    // Update entry field when entry numbers change
    useEffect(() => {
        setData(prev => ({
            ...prev,
            employee_name: user?.username || '',
            entry: `AC ${entryNumber}/${totalEntries}`
        }));
    }, [entryNumber, totalEntries, user]);

    // Set today's date on mount or populate form with editing entry data
    useEffect(() => {
        if (editingEntry) {
            setData({
                id: editingEntry.id,
                employee_name: editingEntry.employee_name || '',
                entry: editingEntry.entry || `AC ${entryNumber}/${totalEntries}`, // Update entry field
                bank_name: editingEntry.bank_name || '',
                date: editingEntry.date || '',
                detail: editingEntry.detail || '',
                credit: editingEntry.credit > 0 ? editingEntry.credit.toString() : '',
                debit: editingEntry.debit > 0 ? editingEntry.debit.toString() : '',
                balance: '',  // Balance is calculated on the server
                payment_method: editingEntry.payment_method || 'Cash',
            });
        } else {
            const today = new Date();
            const formattedDate = today.toISOString().split('T')[0];
            setData((prevData) => ({
                ...prevData,
                date: formattedDate,
            }));
        }
    }, [editingEntry, entryNumber, totalEntries]);

     useEffect(() => {
        const fetchVendorNames = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/vender-names/existing`);
                if (response.data.status === 'success') {
                    setVendorNames(response.data.vendorNames || []);
                }
            } catch (error) {
                console.error('Error fetching vendor names:', error);
            }
        };

        fetchVendorNames();
    }, []);

    // Calculate balance for each bank
    
    const getBankBalance = (bankName)=>{
        const bankEntries = bankBalances.filter(item=>item.bank_name===bankName)
        if(bankEntries.length > 0){
            return parseFloat(bankEntries[0].balance) || 0;
        }
        return 0;
    }

    const banks = [
        { value: "UBL M.A.R", label: "UBL M.A.R" },
        { value: "UBL F.Z", label: "UBL F.Z" },
        { value: "HBL M.A.R", label: "HBL M.A.R" },
        { value: "HBL F.Z", label: "HBL F.Z" },
        { value: "JAZ C", label: "JAZ C" },
        { value: "MCB FIT", label: "MCB FIT" }
    ];

    const handleCheckboxChange = (e) => {
        // Don't allow changing to "Opening Balance" mode when editing
        if (isEditing) return;
        
        setHideFields(e.target.checked);
        if (e.target.checked) {
            setData({
                ...data,
                credit: '',
                debit: '',
            });
        }
    };

    const handleChange = (e) => {
        setData({ ...data, [e.target.name]: e.target.value });
        setPrevError({ ...prevError, [e.target.name]: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let newErrors = {};
        let isValid = true;

       

        if (!data.detail) {
            newErrors.detail = 'Enter Detail';
            isValid = false;
        }

        if (!hideFields) {
            if (!data.credit && !data.debit) {
                newErrors.credit = 'Enter amount in either Credit or Debit';
                newErrors.debit = 'Enter amount in either Credit or Debit';
                isValid = false;
            }
        } else if (!isEditing) {
            // Only check balance for new entries with "Opening Balance" checked
            if (!data.balance) {
                newErrors.balance = 'Enter Opening Balance';
                isValid = false;
            }
        }

        if (!isValid) {
            setPrevError(newErrors);
            return;
        }

        setIsSubmitting(true); // Set loading state to true before submitting

        try {
            const submitData = {
                bank_name: data.bank_name,
                employee_name: data.employee_name,
                vendor_name:data.vendor_name,
                payment_method: data.payment_method,
                entry: data.entry,
                date: data.date || new Date().toISOString().split('T')[0],
                detail: data.detail,
            };

            if (hideFields && !isEditing) {
                const balanceValue = parseFloat(data.balance) || 0;
                if (balanceValue >= 0) {
                    submitData.credit = balanceValue;
                    submitData.debit = 0;
                } else {
                    submitData.credit = 0;
                    submitData.debit = Math.abs(balanceValue);
                }
            } else {
                submitData.credit = parseFloat(data.credit) || 0;
                submitData.debit = parseFloat(data.debit) || 0;
            }

            let response;
            if (isEditing) {
                // Update existing entry
                response = await fetch(`${BASE_URL}/accounts/${data.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(submitData),
                });
            } else {
                // Create new entry
                response = await fetch(`${BASE_URL}/accounts`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(submitData),
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to ${isEditing ? 'update' : 'save'} entry`);
            }

            if (!isEditing && data.payment_method === 'Card Payment') {
                const credit = submitData.credit;
                const debit = submitData.debit;
            
                const bankDetailData = {
                    bank_name: data.bank_name,
                    date: data.date,
                    entry: `BD ${bankDetailEntryNumber}/${bankDetailTotalEntries}`,
                    employee: data.employee_name,
                    detail: `Recieve By ${data.bank_name}`,
                    credit: debit,
                    debit: credit,
                    balance: credit - debit,
                };
            
                try {
                    const bankResponse = await fetch(`${BASE_URL}/bank-details`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(bankDetailData),
                    });
            
                    if (!bankResponse.ok) {
                        const errorData = await bankResponse.json();
                        throw new Error(errorData.message || 'Failed to save card payment to bank details');
                    }
                } catch (error) {
                    console.error('Error saving to bank details:', error);
                    alert(`Failed to save card payment to bank details: ${error.message}`);
                }
            }

            // Reset form
            setData({
                bank_name: '',
                employee_name: user?.username || '',
                entry: '0/0',
                date: new Date().toISOString().split('T')[0],
                detail: '',
                credit: '',
                debit: '',
                balance: '',
                vendor_name: '',
                payment_method: 'Cash',
            });

if (data.vendor_name) {
    const vendorData = {
        vender_name: data.vendor_name,  
        detail: data.detail,
        debit: parseFloat(data.debit) || 0,
        credit: 0,
        date: new Date().toISOString().split('T')[0],
        entry: data.entry,
        bank_title: data.bank_name,
    };
    try {
        const response = await axios.post(`${BASE_URL}/vender`, vendorData);
        if (response.data.status !== 'success') {
            console.error('Failed to store vendor debit:', response.data.message);
        }
    } catch (error) {
        console.error('Error storing vendor debit:', error);
    }
}
            setHideFields(false);
            onSubmitSuccess();
        } catch (error) {
            console.error(`Error ${isEditing ? 'updating' : 'submitting'} form:`, error);
            alert(`Failed to ${isEditing ? 'update' : 'save'} entry: ${error.message}`);
        } finally {
            setIsSubmitting(false); // Reset loading state regardless of outcome
        }
    };

    return (
        <div className="flex items-center justify-center bg-white p-4">
            <div className="w-full max-w-3xl p-8 rounded-md">
                <div className="text-2xl font-semibold mb-6 relative inline-block">
                    {isEditing ? 'UPDATE ENTRY' : 'OFFICE ACCOUNTS'}
                    <div className="absolute bottom-0 left-0 w-8 h-1 bg-gradient-to-r from-blue-300 to-purple-500 rounded"></div>
                </div>
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                    <div className="flex flex-wrap justify-between gap-4">
                        <div className="w-full flex justify-between items-center">
                            
                            {!isEditing && (
                                <div className="w-full sm:w-[calc(50%-10px)]">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={hideFields}
                                            onChange={handleCheckboxChange}
                                            className="mr-2"
                                        />
                                        Opening Balance
                                    </label>
                                </div>
                            )}
                        </div>

                        <div className="w-full sm:w-[calc(50%-10px)]">
    <label className="block font-medium mb-1">Bank Name</label>
    <select
        name="bank_name"
        value={data.bank_name}
        onChange={handleChange}
        className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
    >
        <option value="">Select a Bank</option>
        {banks.map(bank => {
            const balance = getBankBalance(bank.value);
            return (
                <option key={bank.value} value={bank.value}>
                    {bank.label} ({balance.toFixed(0)})
                </option>
            );
        })}
    </select>
    {prevError.bank_name && <span className="text-red-500">{prevError.bank_name}</span>}
</div>

    <div className="w-full sm:w-[calc(50%-10px)]">
        <label className="block font-medium mb-1">Vendor Name</label>
        <select
            name="vendor_name"
            value={data.vendor_name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
            <option value="">Select a Vendor</option>
            {vendorNames.map(vendor => (
                <option key={vendor} value={vendor}>{vendor}</option>
            ))}
        </select>
        {prevError.vendor_name && <span className="text-red-500">{prevError.vendor_name}</span>}
    </div>

    <div className="w-full sm:w-[calc(50%-10px)]">
        <label className="block font-medium mb-1">Payment Method</label>
        <select
            name="payment_method"
            value={data.payment_method}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
            disabled={isEditing}
        >
            <option value="Cash">Cash</option>
            <option value="Card Payment">Card Payment</option>
        </select>
    </div>


                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Employee</label>
                            <input
                                type="text"
                                name="employee_name"
                                value={data.employee_name}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                            />
                        </div>

                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Entry</label>
                            <input
                                type="text"
                                name="entry"
                                value={data.entry}
                                readOnly
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-100"
                            />
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

                        {!hideFields ? (
                            <>
                                <div className="w-full sm:w-[calc(50%-10px)]">
                                    <label className="block font-medium mb-1">Receive</label>
                                    <input
                                        type="number"
                                        name="credit"
                                        value={data.credit}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    />
                                    {prevError.credit && <span className="text-red-500">{prevError.credit}</span>}
                                </div>
                                <div className="w-full sm:w-[calc(50%-10px)]">
                                    <label className="block font-medium mb-1">Send</label>
                                    <input
                                        type="number"
                                        name="debit"
                                        value={data.debit}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                    />
                                    {prevError.debit && <span className="text-red-500">{prevError.debit}</span>}
                                </div>
                            </>
                        ) : (
                            <div className="w-full sm:w-[calc(50%-10px)]">
                                <label className="block font-medium mb-1">Balance</label>
                                <input
                                    type="number"
                                    name="balance"
                                    value={data.balance}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                />
                                {prevError.balance && <span className="text-red-500">{prevError.balance}</span>}
                            </div>
                        )}
                    </div>

                    <div className="mt-10 flex justify-center">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-70 bg-gray-300 text-black font-medium py-3 rounded-md hover:bg-gray-400 transition-all cursor-pointer flex items-center justify-center"
                        >
                            {isSubmitting && <ButtonSpinner />}
                            {isEditing ? "Update" : "Submit"}
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

export default OfficeAccounts_Form;