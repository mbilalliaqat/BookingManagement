import { useState, useEffect } from 'react';
import axios from 'axios';

const ServiceRemainingPay = ({ serviceId, onClose, onPaymentSuccess }) => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting,setIsSubmitting] = useState(false);
    const [newPayment, setNewPayment] = useState({
        payment_date: new Date().toISOString().split('T')[0],
        remaining_amount: '',
        payed_cash: '',
        paid_bank:'',
        bank_title: '',
        recorded_by: ''
    });
    const [serviceDetails, setServiceDetails] = useState(null);
    const [editingPayment, setEditingPayment] = useState(null);
    const [isDeleting, setIsDeleting] = useState(null);

    const BANK_OPTIONS = [
        { value: "UBL M.A.R", label: "UBL M.A.R" },
        { value: "UBL F.Z", label: "UBL F.Z" },
        { value: "HBL M.A.R", label: "HBL M.A.R" },
        { value: "HBL F.Z", label: "HBL F.Z" },
        { value: "JAZ C", label: "JAZ C" },
        { value: "MCB FIT", label: "MCB FIT" },
    ];

    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;

    useEffect(() => {
        if (serviceId) {
            fetchPayments();
            fetchServiceDetails();
        }
    }, [serviceId]);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${BASE_URL}/services/${serviceId}/payments`);
            setPayments(response.data.payments || []);
        } catch (error) {
            console.error('Error fetching payments:', error);
            setPayments([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchServiceDetails = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/services/${serviceId}`);
            if (response.data) {
                setServiceDetails(response.data.service);
            }
        } catch (error) {
            console.error('Error fetching service details:', error);
        }
    };

    const addPayment = async () => {
        if(isSubmitting) return;
        if (!newPayment.payment_date || !newPayment.recorded_by) return;

        const cashAmount = parseFloat(newPayment.payed_cash) || 0;
        const bankAmount = parseFloat(newPayment.paid_bank) || 0;

        if(cashAmount === 0 && bankAmount === 0){
            alert('Please Enter either cash paid or Paid Bank');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await axios.post(`${BASE_URL}/services/${serviceId}/payments`, {
                service_id: serviceId,
                payment_date: newPayment.payment_date,
                payed_cash: cashAmount,
                paid_bank: bankAmount,
                bank_title: newPayment.bank_title || null,
                recorded_by: newPayment.recorded_by
            });

            if (response.status === 201) {
                if (newPayment.bank_title && bankAmount > 0) {
                    await addBankAccountEntry();
                }

                setPayments([...payments, response.data.payment]);

                const paymentData = {
                    serviceId: serviceId,
                    cashAmount: cashAmount,
                    bankAmount: bankAmount,
                };

                setNewPayment({
                    payment_date: new Date().toISOString().split('T')[0],
                    remaining_amount: '',
                    payed_cash: '',
                    paid_bank:'',
                    bank_title: '',
                    recorded_by: ''
                });
                setShowModal(false);

                onPaymentSuccess?.(paymentData);
            }
        } catch (error) {
            console.error('Error adding payment:', error);
            alert('Failed to add payment. Please try again.');
        } finally{
            setIsSubmitting(false);
        }
    };

    const addBankAccountEntry = async () => {
        try {
            let customerInfo = 'N/A';
            let referenceInfo = 'N/A';

            if (serviceDetails) {
                customerInfo = serviceDetails.customer_add || 'N/A';
                referenceInfo = serviceDetails.reference || 'N/A';
            }
            
            const detailString = `Customer: ${customerInfo}, Ref: ${referenceInfo}, Recorded by: ${newPayment.recorded_by}`;
            
            const officeAccountData = {
                bank_name: newPayment.bank_title,
                entry: `Service Remaining_Payment ${serviceId}`,
                date: newPayment.payment_date,
                detail: detailString,
                credit: parseFloat(newPayment.paid_bank) || 0,
                debit: 0,
            };

            await axios.post(`${BASE_URL}/accounts`, officeAccountData);
        } catch (officeAccountError) {
            console.error('Error submitting Office Account data:', officeAccountError.response?.data || officeAccountError.message);
            alert('Payment added successfully, but failed to create bank account entry. Please add manually if needed.');
        }
    };

    // Function to handle payment deletion
    const deletePayment = async (paymentId) => {
        if (!confirm('Are you sure you want to delete this payment? This will also update the service amounts.')) return;
        setIsDeleting(paymentId);
        try {
            await axios.delete(`${BASE_URL}/services/payment/${paymentId}`);
            // Refresh payments
            await fetchPayments();
            // Notify others to refresh dashboard
            window.dispatchEvent(new CustomEvent('paymentUpdated', { detail: { serviceId } }));
            alert('Payment deleted successfully');
        } catch (error) {
            console.error('Error deleting payment:', error);
            alert('Failed to delete payment. Please try again.');
        } finally {
            setIsDeleting(null);
        }
    };

    // Function to handle payment updates
    const updatePayment = async (paymentId) => {
        if (!editingPayment.payment_date || !editingPayment.recorded_by) return;

        const cashAmount = parseFloat(editingPayment.payed_cash) || 0;
        const bankAmount = parseFloat(editingPayment.paid_bank) || 0;

        if (cashAmount === 0 && bankAmount === 0) {
            alert('Please enter either cash paid or paid bank');
            return;
        }

        try {
            await axios.put(`${BASE_URL}/services/payment/${paymentId}`, {
                payment_date: editingPayment.payment_date,
                payed_cash: cashAmount,
                paid_bank: bankAmount,
                bank_title: editingPayment.bank_title || null,
                recorded_by: editingPayment.recorded_by
            });

            await fetchPayments();
            setEditingPayment(null);
            window.dispatchEvent(new CustomEvent('paymentUpdated', { detail: { serviceId } }));
            alert('Payment updated successfully');
        } catch (error) {
            console.error('Error updating payment:', error);
            alert('Failed to update payment. Please try again.');
        }
    };

    const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.payed_cash || 0), 0);

    if (loading) {
        return <div className="flex justify-center p-4">Loading payments...</div>;
    }

    return (
        <div>
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
                            <th className="border border-gray-300 px-4 py-2 text-left">Cash Paid</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Paid Bank</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Bank Title</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Recorded By</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                                    No payments recorded yet
                                </td>
                            </tr>
                        ) : (
                            payments.map((payment, index) => (
                                <tr key={payment.id || index}>
                                    <td className="border border-gray-300 px-4 py-2">
                                        {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('en-GB') : ''}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">{payment.payed_cash || '0'}</td>
                                    <td className="border border-gray-300 px-4 py-2">{payment.paid_bank || ''}</td>
                                    <td className="border border-gray-300 px-4 py-2">{payment.bank_title || ''}</td>
                                    <td className="border border-gray-300 px-4 py-2">{payment.recorded_by || ''}</td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditingPayment(payment)}
                                                className="px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => deletePayment(payment.id)}
                                                disabled={isDeleting === payment.id}
                                                className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:bg-gray-400"
                                            >
                                                {isDeleting === payment.id ? 'Deleting...' : 'Delete'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>

                    {/* Edit Payment Modal */}
                    {editingPayment && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                            <div className="bg-white rounded-lg p-6 w-96">
                                <h3 className="text-lg font-semibold mb-4">Edit Payment</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Payment Date</label>
                                        <input
                                            type="date"
                                            value={editingPayment.payment_date}
                                            onChange={(e) => setEditingPayment(prev => ({ ...prev, payment_date: e.target.value }))}
                                            className="w-full border rounded px-3 py-2"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Cash Paid</label>
                                        <input
                                            type="text"
                                            value={editingPayment.payed_cash}
                                            onChange={(e) => setEditingPayment(prev => ({ ...prev, payed_cash: e.target.value }))}
                                            className="w-full border rounded px-3 py-2"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Paid Bank</label>
                                        <input
                                            type="text"
                                            value={editingPayment.paid_bank}
                                            onChange={(e) => setEditingPayment(prev => ({ ...prev, paid_bank: e.target.value }))}
                                            className="w-full border rounded px-3 py-2"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Bank Title</label>
                                        <select
                                            value={editingPayment.bank_title || ''}
                                            onChange={(e) => setEditingPayment(prev => ({ ...prev, bank_title: e.target.value }))}
                                            className="w-full border rounded px-3 py-2"
                                        >
                                            <option value="">Select Bank (optional)</option>
                                            {BANK_OPTIONS.map(option => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Recorded By</label>
                                        <input
                                            type="text"
                                            value={editingPayment.recorded_by}
                                            onChange={(e) => setEditingPayment(prev => ({ ...prev, recorded_by: e.target.value }))}
                                            className="w-full border rounded px-3 py-2"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        onClick={() => setEditingPayment(null)}
                                        className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-100"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => updatePayment(editingPayment.id)}
                                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        Update Payment
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </table>
            </div>

            <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Add Payment
            </button>

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
                                <label className="block text-sm font-medium mb-1">Paid Bank</label>
                                <input
                                    type="text"
                                    value={newPayment.paid_bank}
                                    onChange={(e) => setNewPayment(prev => ({...prev, paid_bank: e.target.value}))}
                                    placeholder="Enter paid bank amount"
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Select Bank Method</label>
                                <select
                                    value={newPayment.bank_title}
                                    onChange={(e)=>setNewPayment(prev=>({...prev,bank_title:e.target.value}))}
                                    className='w-full border rounded px-3 py-2'
                                >
                                    <option value="">
                                        Select Bank (optional) 
                                    </option>
                                    {BANK_OPTIONS.map(option =>(
                                        <option key={option.value} value={option.value}>
                                            {option.value}
                                        </option>
                                    ))}
                                </select>
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
                                 className={`px-4 py-2 text-white rounded flex items-center justify-center min-w-[120px] ${
                                    isSubmitting 
                                        ? 'bg-gray-400 cursor-not-allowed' 
                                        : 'bg-blue-500 hover:bg-blue-600'
                                }`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Submitting...
                                    </>
                                ) : (
                                    'Add Payment'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceRemainingPay;