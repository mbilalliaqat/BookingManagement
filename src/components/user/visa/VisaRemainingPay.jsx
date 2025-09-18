import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ButtonSpinner from '../../ui/ButtonSpinner';

const VisaRemainingPay = ({ visaId, onPaymentSuccess }) => {
    const [payments, setPayments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newPayment, setNewPayment] = useState({
        payment_date: new Date().toISOString().slice(0, 10),
        payed_cash: '',
        paid_bank: '',
        bank_title: '',
        recorded_by: ''
    });

    const BANK_OPTIONS = [
        { value: "UBL M.A.R", label: "UBL M.A.R" },
        { value: "UBL F.Z", label: "UBL F.Z" },
        { value: "HBL M.A.R", label: "HBL M.A.R" },
        { value: "HBL F.Z", label: "HBL F.Z" },
        { value: "JAZ C", label: "JAZ C" },
        { value: "MCB FIT", label: "MCB FIT" },
    ];

    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;

    const fetchVisaDetails = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/visa-processing/${visaId}`);
            setPayments(response.data.payments || []);
        } catch (error) {
            console.error('Error fetching visa details:', error);
            setError('Failed to load payment history.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (visaId) {
            fetchVisaDetails();
        }
    }, [visaId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewPayment(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const paymentData = {
                ...newPayment,
                visaId: visaId,
                cash_amount: parseFloat(newPayment.payed_cash) || 0,
                bank_amount: parseFloat(newPayment.paid_bank) || 0,
            };
            await axios.post(`${BASE_URL}/visa-processing/${visaId}/payments`, paymentData);
            onPaymentSuccess(paymentData);
            setShowPaymentForm(false);
            setNewPayment({
                payment_date: new Date().toISOString().slice(0, 10),
                payed_cash: '',
                paid_bank: '',
                bank_title: '',
                recorded_by: ''
            });
        } catch (error) {
            console.error('Error adding payment:', error);
            setError('Failed to add payment.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 bg-gray-900 text-white">
            <h3 className="text-lg font-bold mb-4">Payment History</h3>
            {isLoading ? (
                <p>Loading payments...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : (
                <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3">Date</th>
                            <th scope="col" className="px-6 py-3">Cash</th>
                            <th scope="col" className="px-6 py-3">Bank</th>
                            <th scope="col" className="px-6 py-3">Bank Title</th>
                            <th scope="col" className="px-6 py-3">Recorded By</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.map(payment => (
                            <tr key={payment.id} className="border-b border-gray-700">
                                <td className="px-6 py-4">{new Date(payment.payment_date).toLocaleDateString()}</td>
                                <td className="px-6 py-4">{payment.cash_amount}</td>
                                <td className="px-6 py-4">{payment.bank_amount}</td>
                                <td className="px-6 py-4">{payment.bank_title}</td>
                                <td className="px-6 py-4">{payment.recorded_by}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <div className="mt-4">
                <button
                    onClick={() => setShowPaymentForm(!showPaymentForm)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                >
                    {showPaymentForm ? 'Cancel' : 'Add Payment'}
                </button>
            </div>

            {showPaymentForm && (
                <form onSubmit={handleSubmit} className="mt-4 p-4 rounded-lg bg-gray-800">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="date"
                            name="payment_date"
                            value={newPayment.payment_date}
                            onChange={handleInputChange}
                            className="p-2 rounded bg-gray-700"
                        />
                        <input
                            type="number"
                            name="payed_cash"
                            placeholder="Cash Paid"
                            value={newPayment.payed_cash}
                            onChange={handleInputChange}
                            className="p-2 rounded bg-gray-700"
                        />
                        <input
                            type="number"
                            name="paid_bank"
                            placeholder="Bank Paid"
                            value={newPayment.paid_bank}
                            onChange={handleInputChange}
                            className="p-2 rounded bg-gray-700"
                        />
                        <select
                            name="bank_title"
                            value={newPayment.bank_title}
                            onChange={handleInputChange}
                            className='p-2 rounded bg-gray-700'
                        >
                            <option value="">
                                Select Bank (optional)
                            </option>
                            {BANK_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <input
                            type="text"
                            name="recorded_by"
                            placeholder="Recorded By"
                            value={newPayment.recorded_by}
                            onChange={handleInputChange}
                            className="p-2 rounded bg-gray-700"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`mt-4 w-full font-semibold rounded-md shadow px-4 py-2 transition-colors duration-200 flex items-center justify-center ${
                            isSubmitting ? 'bg-gray-500' : 'bg-green-600 hover:bg-green-700'
                        }`}
                    >
                        {isSubmitting ? <ButtonSpinner /> : 'Submit Payment'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default VisaRemainingPay;