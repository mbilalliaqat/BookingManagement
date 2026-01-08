import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ButtonSpinner from '../../ui/ButtonSpinner';
import { useAppContext } from '../../contexts/AppContext';

const VisaRemainingPay = ({ visaId, onPaymentSuccess }) => {
    const { user } = useAppContext();
    const [payments, setPayments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [visaDetails, setVisaDetails] = useState(null);
    const [editingPayment, setEditingPayment] = useState(null);
    const [isDeleting, setIsDeleting] = useState(null);
    const [newPayment, setNewPayment] = useState({
        payment_date: new Date().toISOString().slice(0, 10),
        payed_cash: '',
        paid_bank: '',
        bank_title: '',
        recorded_by: user?.username || ''
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

    const fetchPayments = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(`${BASE_URL}/visa-processing/${visaId}/payments`);
            setPayments(response.data.payments || []);
        } catch (error) {
            console.error('Error fetching visa payment history:', error);
            setError('Failed to load payment history.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchVisaDetails = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/visa-processing`);
            console.log('Fetch visa processing response:', response.data);
            
            if (response.data && response.data.visa_processing) {
                const specificVisa = response.data.visa_processing.find(visa => visa.id === visaId);
                
                if (specificVisa) {
                    setVisaDetails(specificVisa);
                    console.log('Fetched visaDetails:', specificVisa);
                } else {
                    console.log('Visa not found with ID:', visaId);
                }
            }
        } catch (error) {
            console.error('Error fetching visa details:', error);
        }
    };

    useEffect(() => {
        if (user?.username) {
            setNewPayment(prev => ({ ...prev, recorded_by: user.username }));
        }
    }, [user?.username]);

    useEffect(() => {
        if (visaId) {
            fetchPayments();
            fetchVisaDetails();
        }
    }, [visaId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewPayment(prev => ({ ...prev, [name]: value }));
    };

    const addAgentEntry = async () => {
        try {
            console.log('Adding agent entry for visa remaining payment');
            console.log('VisaDetails:', visaDetails);

            if (!visaDetails) {
                console.error('No visa details available for agent entry');
                return;
            }

            const cashAmount = parseFloat(newPayment.payed_cash) || 0;
            const bankAmount = parseFloat(newPayment.paid_bank) || 0;

            let passengerName = '';
            try {
                let passportDetails = {};
                if (typeof visaDetails.passport_detail === 'string') {
                    passportDetails = JSON.parse(visaDetails.passport_detail);
                } else if (typeof visaDetails.passport_detail === 'object') {
                    passportDetails = visaDetails.passport_detail;
                }
                passengerName = `${passportDetails.firstName || ''} ${passportDetails.lastName || ''}`.trim();
            } catch (e) {
                console.error('Error parsing passport details:', e);
            }

            const detailParts = [];
            if (visaDetails.agent_name) {
                detailParts.push(`(AG,${visaDetails.agent_name})`);
            }
            detailParts.push(`File No ${visaDetails.file_number || ''}`);
            detailParts.push(passengerName);

            if (!visaDetails.agent_name) {
                detailParts.push(visaDetails.reference || '');
            }

            detailParts.push(visaDetails.embassy || '');
            detailParts.push(visaDetails.professional || '');

            let commonDetail = detailParts.filter(part => part).join(' / ');
            commonDetail = `${commonDetail} (RP)`;

            const agentData = {
                agent_name: visaDetails.agent_name,
                employee: newPayment.recorded_by,
                detail: commonDetail,
                receivable_amount: 0,
                paid_cash: cashAmount,
                paid_bank: bankAmount,
                credit: 0,
                debit: cashAmount + bankAmount,
                date: newPayment.payment_date,
                entry: `${visaDetails.entry || ''} (RP)`,
                bank_title: newPayment.bank_title || null
            };

            console.log('Submitting agent data:', agentData);

            const agentResponse = await axios.post(`${BASE_URL}/agent`, agentData);

            if (agentResponse.status === 200 || agentResponse.status === 201) {
                console.log('Agent entry added successfully');
            } else {
                console.error('Agent submission failed:', agentResponse.status);
            }
        } catch (agentError) {
            console.error('Error submitting Agent data:', agentError.response?.data || agentError.message);
            console.error('Payment added successfully, but failed to create agent entry. Please add manually if needed.');
        }
    };

    const addBankAccountEntry = async () => {
        try {
            if (!visaDetails) {
                console.error('No visa details available for bank account entry');
                return;
            }

            let passengerName = '';
            try {
                let passportDetails = {};
                if (typeof visaDetails.passport_detail === 'string') {
                    passportDetails = JSON.parse(visaDetails.passport_detail);
                } else if (typeof visaDetails.passport_detail === 'object') {
                    passportDetails = visaDetails.passport_detail;
                }
                passengerName = `${passportDetails.firstName || ''} ${passportDetails.lastName || ''}`.trim();
            } catch (e) {
                console.error('Error parsing passport details:', e);
            }

            const detailParts = [];
            if (visaDetails.agent_name) {
                detailParts.push(`(AG,${visaDetails.agent_name})`);
            }
            detailParts.push(`File No ${visaDetails.file_number || ''}`);
            detailParts.push(passengerName);

            if (!visaDetails.agent_name) {
                detailParts.push(visaDetails.reference || '');
            }

            detailParts.push(visaDetails.embassy || '');
            detailParts.push(visaDetails.professional || '');

            let detailString = detailParts.filter(part => part).join(' / ');
            detailString = `${detailString} (PR)`;
            
            const officeAccountData = {
                bank_name: newPayment.bank_title,
                entry: visaDetails?.entry || `Visa_Remaining_Payment ${visaId}`,
                date: newPayment.payment_date,
                detail: detailString,
                credit: parseFloat(newPayment.paid_bank) || 0,
                debit: 0,
            };

            const officeAccountResponse = await axios.post(`${BASE_URL}/accounts`, officeAccountData);
            
            if (officeAccountResponse.status !== 200 && officeAccountResponse.status !== 201) {
                console.error('Office Account submission failed:', officeAccountResponse.status);
            } else {
                console.log('Bank account entry added successfully');
            }
        } catch (officeAccountError) {
            console.error('Error submitting Office Account data:', officeAccountError.response?.data || officeAccountError.message);
            alert('Payment added successfully, but failed to create bank account entry. Please add manually if needed.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const cashAmount = parseFloat(newPayment.payed_cash) || 0;
        const bankAmount = parseFloat(newPayment.paid_bank) || 0;

        if (cashAmount === 0 && bankAmount === 0) {
            alert('Please enter either cash paid or paid bank');
            setIsSubmitting(false);
            return;
        }
        
        try {
            const paymentData = {
                payment_date: newPayment.payment_date,
                payed_cash: cashAmount,
                paid_bank: bankAmount,
                bank_title: newPayment.bank_title || null,
                recorded_by: newPayment.recorded_by,
            };

            console.log('Sending payment data:', paymentData);

            const response = await axios.post(`${BASE_URL}/visa-processing/${visaId}/payments`, paymentData);
            
            if (response.status === 201) {
                if (newPayment.bank_title && bankAmount > 0) {
                    await addBankAccountEntry();
                }

                if (visaDetails && visaDetails.agent_name) {
                    await addAgentEntry();
                }

                window.dispatchEvent(new CustomEvent('paymentUpdated', {
                    detail: {
                        visaId: visaId,
                        cash_amount: cashAmount,
                        bank_amount: bankAmount,
                        paymentDate: newPayment.payment_date,
                        recordedBy: newPayment.recorded_by
                    }
                }));

                onPaymentSuccess({
                    visaId: visaId,
                    cash_amount: cashAmount,
                    bank_amount: bankAmount
                });
                
                setShowPaymentForm(false);
                setNewPayment({
                    payment_date: new Date().toISOString().slice(0, 10),
                    payed_cash: '',
                    paid_bank: '',
                    bank_title: '',
                    recorded_by: user?.username || ''
                });
                
                fetchPayments();
            }
            
        } catch (error) {
            console.error('Error adding payment:', error);
            console.error('Error response:', error.response?.data);
            setError(error.response?.data?.message || 'Failed to add payment.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // NEW: Function to delete related agent entries
    const deleteRelatedAgentEntry = async (payment) => {
        try {
            if (!visaDetails) {
                console.log('No visa details available for agent entry deletion');
                return;
            }

            // Construct the entry pattern to search for
            const entryPattern = `${visaDetails.entry || ''} (RP)`;
            
            console.log('Searching for agent entry with pattern:', entryPattern);

            // Fetch all agent entries
            const agentResponse = await axios.get(`${BASE_URL}/agent`);
            const agentEntries = agentResponse.data.agents || [];

            // Find matching agent entry by entry field and date
            const matchingEntry = agentEntries.find(entry => 
                entry.entry === entryPattern &&
                entry.date === payment.payment_date &&
                entry.agent_name === visaDetails.agent_name
            );

            if (matchingEntry) {
                console.log('Found matching agent entry:', matchingEntry);
                await axios.delete(`${BASE_URL}/agent/${matchingEntry.id}`, {
                    data: { user_name: user.name }
                });
                console.log('Related agent entry deleted successfully');
            } else {
                console.log('No matching agent entry found for deletion');
            }
        } catch (error) {
            console.error('Error deleting related agent entry:', error);
            // Don't throw error, just log it
        }
    };

    // NEW: Function to delete related office account entries
    const deleteRelatedOfficeAccountEntry = async (payment) => {
        try {
            if (!visaDetails || !payment.bank_title) {
                console.log('No visa details or bank title available for office account deletion');
                return;
            }

            console.log('Searching for office account entry');

            // Fetch all office account entries for the specific bank
            const accountResponse = await axios.get(`${BASE_URL}/accounts/${payment.bank_title}`);
            const accountEntries = accountResponse.data || [];

            // Find matching office account entry by entry field, date, and bank
            const matchingEntry = accountEntries.find(entry => 
                entry.entry === visaDetails.entry &&
                entry.date === payment.payment_date &&
                entry.bank_name === payment.bank_title &&
                entry.detail && entry.detail.includes('(PR)')
            );

            if (matchingEntry) {
                console.log('Found matching office account entry:', matchingEntry);
                await axios.delete(`${BASE_URL}/accounts/${matchingEntry.id}`, {
                    data: { user_name: user.name }
                });
                console.log('Related office account entry deleted successfully');
            } else {
                console.log('No matching office account entry found for deletion');
            }
        } catch (error) {
            console.error('Error deleting related office account entry:', error);
            // Don't throw error, just log it
        }
    };

    // UPDATED: Delete payment function with cascading deletes
    const deletePayment = async (paymentId) => {
        if (!confirm('Are you sure you want to delete this payment? This will also delete related entries from Agent and Office Accounts tables.')) return;
        
        setIsDeleting(paymentId);
        
        try {
            // Find the payment details before deletion
            const paymentToDelete = payments.find(p => p.id === paymentId);
            
            if (!paymentToDelete) {
                throw new Error('Payment not found');
            }

            console.log('Deleting payment:', paymentToDelete);

            // Step 1: Delete related agent entry (if agent exists)
            if (visaDetails && visaDetails.agent_name) {
                await deleteRelatedAgentEntry(paymentToDelete);
            }

            // Step 2: Delete related office account entry (if bank payment was made)
            if (paymentToDelete.paid_bank && parseFloat(paymentToDelete.paid_bank) > 0) {
                await deleteRelatedOfficeAccountEntry(paymentToDelete);
            }

            // Step 3: Delete the visa payment record
            await axios.delete(`${BASE_URL}/visa-processing/payment/${paymentId}`);

            // Refresh payments and notify dashboard
            await fetchPayments();
            window.dispatchEvent(new CustomEvent('paymentUpdated', { detail: { visaId } }));
            
            alert('Payment and related entries deleted successfully');
        } catch (error) {
            console.error('Error deleting payment:', error);
            alert('Failed to delete payment. Please check the console for details and try again.');
        } finally {
            setIsDeleting(null);
        }
    };

    const updatePayment = async (paymentId) => {
        if (!editingPayment.payment_date || !editingPayment.recorded_by) return;

        const cashAmount = parseFloat(editingPayment.payed_cash) || 0;
        const bankAmount = parseFloat(editingPayment.paid_bank) || 0;

        if (cashAmount === 0 && bankAmount === 0) {
            alert('Please enter either cash paid or paid bank');
            return;
        }

        try {
            await axios.put(`${BASE_URL}/visa-processing/payment/${paymentId}`, {
                payment_date: editingPayment.payment_date,
                payed_cash: cashAmount,
                paid_bank: bankAmount,
                bank_title: editingPayment.bank_title || null,
                recorded_by: editingPayment.recorded_by
            });

            await fetchPayments();
            setEditingPayment(null);
            window.dispatchEvent(new CustomEvent('paymentUpdated', { detail: { visaId } }));
            alert('Payment updated successfully');
        } catch (error) {
            console.error('Error updating payment:', error);
            alert('Failed to update payment. Please try again.');
        }
    };

    const totalCashPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.payed_cash || 0), 0);
    const totalBankPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.paid_bank || 0), 0);

    return (
        <div className="p-4">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Payment History</h3>
            
            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            <div className="mb-4">
                <div className="flex justify-between items-center mb-3">
                    <div className="text-sm text-gray-600">
                        Total Cash Paid: <span className="font-bold text-green-600">{totalCashPaid.toFixed(2)}</span>
                        {' | '}
                        Total Bank Paid: <span className="font-bold text-blue-600">{totalBankPaid.toFixed(2)}</span>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 px-4 py-2 text-left">Payment Date</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Cash Paid</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Bank Paid</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Bank Title</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Recorded By</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Remaining</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="7" className="border border-gray-300 px-4 py-8 text-center">
                                        <div className="flex items-center justify-center">
                                            <ButtonSpinner />
                                            <span className="ml-2">Loading payments...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="border border-gray-300 px-4 py-8 text-center text-gray-500">
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
                                        <td className="border border-gray-300 px-4 py-2">{payment.paid_bank || '0'}</td>
                                        <td className="border border-gray-300 px-4 py-2">{payment.bank_title || 'N/A'}</td>
                                        <td className="border border-gray-300 px-4 py-2">{payment.recorded_by || 'N/A'}</td>
                                        <td className="border border-gray-300 px-4 py-2">{payment.remaining_amount || '0'}</td>
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
                                                type="number"
                                                value={editingPayment.payed_cash}
                                                onChange={(e) => setEditingPayment(prev => ({ ...prev, payed_cash: e.target.value }))}
                                                className="w-full border rounded px-3 py-2"
                                                step="0.01"
                                                min="0"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1">Paid Bank</label>
                                            <input
                                                type="number"
                                                value={editingPayment.paid_bank}
                                                onChange={(e) => setEditingPayment(prev => ({ ...prev, paid_bank: e.target.value }))}
                                                className="w-full border rounded px-3 py-2"
                                                step="0.01"
                                                min="0"
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
            </div>

            <div className="mb-4">
                <button
                    onClick={() => setShowPaymentForm(!showPaymentForm)}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
                >
                    {showPaymentForm ? 'Cancel' : 'Add Payment'}
                </button>
            </div>

            {showPaymentForm && (
                <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Payment Date</label>
                            <input
                                type="date"
                                name="payment_date"
                                value={newPayment.payment_date}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Cash Paid</label>
                            <input
                                type="number"
                                name="payed_cash"
                                placeholder="0.00"
                                value={newPayment.payed_cash}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                min="0"
                                step="0.01"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Bank Paid</label>
                            <input
                                type="number"
                                name="paid_bank"
                                placeholder="0.00"
                                value={newPayment.paid_bank}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                min="0"
                                step="0.01"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Bank Title</label>
                            <select
                                name="bank_title"
                                value={newPayment.bank_title}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Select Bank (optional)</option>
                                {BANK_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1 text-gray-700">Employee Name</label>
                            <input
                                type="text"
                                name="recorded_by"
                                value={newPayment.recorded_by}
                                readOnly
                                className="w-full p-2 border border-gray-300 rounded bg-gray-100"
                            />
                        </div>
                    </div>
                    
                    <button
                        type="submit"
                        disabled={isSubmitting || !newPayment.recorded_by}
                        className={`mt-4 w-full font-semibold rounded-md shadow px-4 py-2 transition-colors duration-200 flex items-center justify-center ${
                            isSubmitting || !newPayment.recorded_by
                                ? 'bg-gray-400 cursor-not-allowed text-white' 
                                : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                    >
                        {isSubmitting ? (
                            <>
                                <ButtonSpinner />
                                <span className="ml-2">Processing...</span>
                            </>
                        ) : (
                            'Submit Payment'
                        )}
                    </button>
                </form>
            )}
        </div>
    );
};

export default VisaRemainingPay;