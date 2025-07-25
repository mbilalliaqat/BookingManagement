import { useState, useEffect } from 'react';
import axios from 'axios';

const RemainingPay = ({ ticketId, onClose, onPaymentSuccess }) => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newPayment, setNewPayment] = useState({
        payment_date: new Date().toISOString().split('T')[0],
        remaining_amount: '',
        payed_cash: '',
        bank_title: '',
        recorded_by: ''
    });

    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;

    useEffect(() => {
        fetchPayments();
    }, [ticketId]);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            // Updated endpoint to match your API structure
            const response = await axios.get(`${BASE_URL}/ticket_payments/${ticketId}`);
            setPayments(response.data.payments || []);
        } catch (error) {
            console.error('Error fetching payments:', error);
            setPayments([]);
        } finally {
            setLoading(false);
        }
    };

   // In your RemainingPay.jsx, update the addPayment function:

const addPayment = async () => {
    if (!newPayment.payment_date || !newPayment.recorded_by) return;

    try {
        // Updated payload to match your backend schema
        const response = await axios.post(`${BASE_URL}/ticket_payments`, {
            ticket_id: ticketId,
            payment_date: newPayment.payment_date,
            payment_amount: newPayment.payed_cash, // This should be the amount being paid
            bank_title: newPayment.bank_title || null,
            recorded_by: newPayment.recorded_by
        });

        if (response.status === 201) {
            setPayments([...payments, response.data.payment]);
            setNewPayment({
                payment_date: new Date().toISOString().split('T')[0],
                remaining_amount: '',
                payed_cash: '',
                bank_title: '',
                recorded_by: ''
            });
            setShowModal(false);
            onPaymentSuccess?.();
        }
    } catch (error) {
        console.error('Error adding payment:', error);
        alert('Failed to add payment. Please try again.');
    }
};

    const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.payed_cash || 0), 0);

    if (loading) {
        return <div className="flex justify-center p-4">Loading payments...</div>;
    }

    return (
        <div>
            {/* Payments Table */}
            <div className="mb-4">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold">Payment Records</h3>
                    <div className="text-sm text-gray-600">
                        Total Cash Paid: <span className="font-bold text-green-600">{totalPaid.toFixed(2)}</span>
                    </div>
                </div>
                
                <table className="w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2 text-left">Payment Date</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Remaining Amount</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Cash Paid</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Bank</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Recorded By</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                                    No payments recorded yet
                                </td>
                            </tr>
                        ) : (
                            payments.map((payment, index) => (
                                <tr key={payment.id || index}>
                                    <td className="border border-gray-300 px-4 py-2">
                                        {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('en-GB') : ''}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">{payment.remaining_amount || '0'}</td>
                                    <td className="border border-gray-300 px-4 py-2">{payment.payed_cash || '0'}</td>
                                    <td className="border border-gray-300 px-4 py-2">{payment.bank_title || ''}</td>
                                    <td className="border border-gray-300 px-4 py-2">{payment.recorded_by || ''}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Payment Button */}
            <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Add Payment
            </button>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-6 w-96">
                        <h3 className="text-lg font-semibold mb-4">Add New Payment</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Payment Date</label>
                                <input
                                    type="date"
                                    value={newPayment.payment_date}
                                    onChange={(e) => setNewPayment(prev => ({...prev, payment_date: e.target.value}))}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">Remaining Amount</label>
                                <input
                                    type="number"
                                    value={newPayment.remaining_amount}
                                    onChange={(e) => setNewPayment(prev => ({...prev, remaining_amount: e.target.value}))}
                                    placeholder="Enter remaining amount"
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">Cash Paid</label>
                                <input
                                    type="text"
                                    value={newPayment.payed_cash}
                                    onChange={(e) => setNewPayment(prev => ({...prev, payed_cash: e.target.value}))}
                                    placeholder="Enter cash amount paid"
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Bank Title</label>
                                <input
                                    type="text"
                                    value={newPayment.bank_title}
                                    onChange={(e) => setNewPayment(prev => ({...prev, bank_title: e.target.value}))}
                                    placeholder="Enter bank name (optional)"
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Recorded By *</label>
                                <input
                                    type="text"
                                    value={newPayment.recorded_by}
                                    onChange={(e) => setNewPayment(prev => ({...prev, recorded_by: e.target.value}))}
                                    placeholder="Enter your name"
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addPayment}
                                disabled={!newPayment.payment_date || !newPayment.recorded_by}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                            >
                                Add Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RemainingPay;