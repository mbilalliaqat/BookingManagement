import React, { useState, useEffect } from 'react';
import ButtonSpinner from '../../ui/ButtonSpinner';

const Umrah_Form = ({ onCancel, onSubmitSuccess, editEntry }) => {
    const [data, setData] = useState({
        userName: '',
        entry: '',
        customerAdd: '',
        reference: '',
        packageDetail: '',
        travelDate: '',
        sector: '',
        airline: '',
        passportDetail: '',
        receivableAmount: '',
        paidCash: '',
        paidInBank: '',
        payableToVendor: '',
        vendorName: '',
        profit: '',
        remainingAmount: ''
    });

    const [prevError, setPrevError] = useState({
        userName: '',
        entry: '',
        customerAdd: '',
        reference: '',
        packageDetail: '',
        travelDate: '',
        sector: '',
        airline: '',
        passportDetail: '',
        receivableAmount: '',
        paidCash: '',
        paidInBank: '',
        payableToVendor: '',
        vendorName: '',
        profit: '',
        remainingAmount: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Pre-populate form if editing
    useEffect(() => {
        if (editEntry) {
            setData({
                userName: editEntry.userName || '',
                entry: editEntry.entry || '',
                customerAdd: editEntry.customerAdd || '',
                reference: editEntry.reference || '',
                packageDetail: editEntry.packageDetail || '',
                travelDate: editEntry.travelDate ? new Date(editEntry.travelDate).toISOString().split('T')[0] : '',
                sector: editEntry.sector || '',
                airline: editEntry.airline || '',
                passportDetail: editEntry.passportDetail || '',
                receivableAmount: editEntry.receivableAmount || '',
                paidCash: editEntry.paidCash || '',
                paidInBank: editEntry.paidInBank || '',
                payableToVendor: editEntry.payableToVendor || '',
                vendorName: editEntry.vendorName || '',
                profit: editEntry.profit || '',
                remainingAmount: editEntry.remainingAmount || ''
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

        // Validation
        if (data.userName === '') {
            setPrevError({ ...prevError, userName: 'User Name is required' });
            setIsSubmitting(false);
        } else if (data.entry === '') {
            setPrevError({ ...prevError, entry: 'Enter Your Entry' });
            setIsSubmitting(false);
        } else if (data.customerAdd === '') {
            setPrevError({ ...prevError, customerAdd: 'Enter Your Customer Address' });
            setIsSubmitting(false);
        } else if (data.reference === '') {
            setPrevError({ ...prevError, reference: 'Enter Your Reference' });
            setIsSubmitting(false);
        } else if (data.packageDetail === '') {
            setPrevError({ ...prevError, packageDetail: 'Enter Your Package Detail' });
            setIsSubmitting(false);
        } else if (data.travelDate === '') {
            setPrevError({ ...prevError, travelDate: 'Enter Your Travel Date' });
            setIsSubmitting(false);
        } else if (data.sector === '') {
            setPrevError({ ...prevError, sector: 'Enter Your Sector' });
            setIsSubmitting(false);
        } else if (data.airline === '') {
            setPrevError({ ...prevError, airline: 'Enter Your Airline' });
            setIsSubmitting(false);
        } else if (data.passportDetail === '') {
            setPrevError({ ...prevError, passportDetail: 'Enter Your Passport Detail' });
            setIsSubmitting(false);
        } else if (data.receivableAmount === '') {
            setPrevError({ ...prevError, receivableAmount: 'Enter Your Receivable Amount' });
            setIsSubmitting(false);
        } else if (data.paidCash === '') {
            setPrevError({ ...prevError, paidCash: 'Enter Your Paid Cash' });
            setIsSubmitting(false);
        } else if (data.paidInBank === '') {
            setPrevError({ ...prevError, paidInBank: 'Enter Your Paid In Bank' });
            setIsSubmitting(false);
        } else if (data.payableToVendor === '') {
            setPrevError({ ...prevError, payableToVendor: 'Enter Your Payable To Vendor' });
            setIsSubmitting(false);
        } else if (data.vendorName === '') {
            setPrevError({ ...prevError, vendorName: 'Enter Your Vendor Name' });
            setIsSubmitting(false);
        } else if (data.profit === '') {
            setPrevError({ ...prevError, profit: 'Enter Your Profit' });
            setIsSubmitting(false);
        } else if (data.remainingAmount === '') {
            setPrevError({ ...prevError, remainingAmount: 'Enter Your Remaining Amount' });
            setIsSubmitting(false);
        } else {
            const requestData = {
                userName: data.userName,
                entry: parseInt(data.entry),
                customerAdd: data.customerAdd,
                reference: data.reference,
                packageDetail: data.packageDetail || null,
                travelDate: new Date(data.travelDate),
                sector: data.sector,
                airline: data.airline,
                passportDetail: data.passportDetail,
                receivableAmount: parseInt(data.receivableAmount),
                paidCash: parseInt(data.paidCash),
                paidInBank: data.paidInBank,
                payableToVendor: parseInt(data.payableToVendor),
                vendorName: data.vendorName,
                profit: parseInt(data.profit),
                remainingAmount: parseInt(data.remainingAmount)
            };

            try {
                const url = editEntry
                    ? `http://localhost:8787/umrah/${editEntry.id}`
                    : 'http://localhost:8787/umrah';
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

                // Reset form data
                setData({
                    userName: '',
                    entry: '',
                    customerAdd: '',
                    reference: '',
                    packageDetail: '',
                    travelDate: '',
                    sector: '',
                    airline: '',
                    passportDetail: '',
                    receivableAmount: '',
                    paidCash: '',
                    paidInBank: '',
                    payableToVendor: '',
                    vendorName: '',
                    profit: '',
                    remainingAmount: ''
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
        }
    };

    return (
        <div className="overflow-y-auto flex items-center justify-center bg-white p-4">
            <div className="h-[70vh] w-full max-w-3xl p-8 rounded-md">
                <div className="text-2xl font-semibold mb-6 p-5 relative inline-block">
                    UMRAH
                    <div className="absolute bottom-0 left-0 w-8 h-1 bg-gradient-to-r from-blue-300 to-purple-500 rounded"></div>
                </div>
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                    <div className="flex flex-wrap justify-between gap-4">
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">User Name</label>
                            <input
                                type="text"
                                placeholder="Enter User Name"
                                value={data.userName}
                                name="userName"
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                disabled={isSubmitting}
                            />
                            {prevError.userName && <span className="text-red-500">{prevError.userName}</span>}
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
                                disabled={isSubmitting}
                            />
                            {prevError.entry && <span className="text-red-500">{prevError.entry}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Customer Add</label>
                            <input
                                type="text"
                                placeholder="Enter Customer Add"
                                value={data.customerAdd}
                                name="customerAdd"
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                disabled={isSubmitting}
                            />
                            {prevError.customerAdd && <span className="text-red-500">{prevError.customerAdd}</span>}
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
                                disabled={isSubmitting}
                            />
                            {prevError.reference && <span className="text-red-500">{prevError.reference}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Package Detail</label>
                            <input
                                type="text"
                                placeholder="Enter Package Detail"
                                value={data.packageDetail}
                                name="packageDetail"
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                disabled={isSubmitting}
                            />
                            {prevError.packageDetail && <span className="text-red-500">{prevError.packageDetail}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Travel Date</label>
                            <input
                                type="date"
                                placeholder="Enter Travel Date"
                                value={data.travelDate}
                                name="travelDate"
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                disabled={isSubmitting}
                            />
                            {prevError.travelDate && <span className="text-red-500">{prevError.travelDate}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Sector</label>
                            <input
                                type="text"
                                placeholder="Enter Sector"
                                value={data.sector}
                                name="sector"
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                disabled={isSubmitting}
                            />
                            {prevError.sector && <span className="text-red-500">{prevError.sector}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Airline</label>
                            <input
                                type="text"
                                placeholder="Enter Airline"
                                value={data.airline}
                                name="airline"
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                disabled={isSubmitting}
                            />
                            {prevError.airline && <span className="text-red-500">{prevError.airline}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Passport Detail</label>
                            <input
                                type="text"
                                placeholder="Enter Passport Detail"
                                value={data.passportDetail}
                                name="passportDetail"
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                disabled={isSubmitting}
                            />
                            {prevError.passportDetail && <span className="text-red-500">{prevError.passportDetail}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Receivable Amount</label>
                            <input
                                type="number"
                                placeholder="Enter Receivable Amount"
                                value={data.receivableAmount}
                                name="receivableAmount"
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                disabled={isSubmitting}
                            />
                            {prevError.receivableAmount && <span className="text-red-500">{prevError.receivableAmount}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Paid Cash</label>
                            <input
                                type="number"
                                placeholder="Enter Paid Cash"
                                value={data.paidCash}
                                name="paidCash"
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                disabled={isSubmitting}
                            />
                            {prevError.paidCash && <span className="text-red-500">{prevError.paidCash}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Paid In Bank</label>
                            <input
                                type="text"
                                placeholder="Enter Paid In Bank"
                                value={data.paidInBank}
                                name="paidInBank"
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                disabled={isSubmitting}
                            />
                            {prevError.paidInBank && <span className="text-red-500">{prevError.paidInBank}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Payable To Vendor</label>
                            <input
                                type="number"
                                placeholder="Enter Payable To Vendor"
                                value={data.payableToVendor}
                                name="payableToVendor"
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                disabled={isSubmitting}
                            />
                            {prevError.payableToVendor && <span className="text-red-500">{prevError.payableToVendor}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Vendor Name</label>
                            <input
                                type="text"
                                placeholder="Enter Vendor Name"
                                value={data.vendorName}
                                name="vendorName"
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                disabled={isSubmitting}
                            />
                            {prevError.vendorName && <span className="text-red-500">{prevError.vendorName}</span>}
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
                                disabled={isSubmitting}
                            />
                            {prevError.profit && <span className="text-red-500">{prevError.profit}</span>}
                        </div>
                        <div className="w-full sm:w-[calc(50%-10px)]">
                            <label className="block font-medium mb-1">Remaining Amount</label>
                            <input
                                type="number"
                                placeholder="Enter Remaining Amount"
                                value={data.remainingAmount}
                                name="remainingAmount"
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                disabled={isSubmitting}
                            />
                            {prevError.remainingAmount && <span className="text-red-500">{prevError.remainingAmount}</span>}
                        </div>
                    </div>
                    {prevError.general && <div className="text-red-500 mt-4">{prevError.general}</div>}
                    <div className="mt-10 flex justify-center">
                        <button
                            type="submit"
                            className="w-70 bg-gray-300 text-black font-medium py-3 rounded-md hover:bg-gray-400 transition-all cursor-pointer flex items-center justify-center"
                            disabled={isSubmitting}
                        >
                            {isSubmitting && <ButtonSpinner />}
                            {editEntry ? 'Update' : 'Submit'}
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

export default Umrah_Form;