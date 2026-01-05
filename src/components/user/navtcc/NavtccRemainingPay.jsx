import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAppContext } from '../../contexts/AppContext';

const NavtccRemainingPay = ({ navtccId, onClose, onPaymentSuccess }) => {
    const { user } = useAppContext();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingPayment, setEditingPayment] = useState(null);
    const [isDeleting, setIsDeleting] = useState(null);
    const [newPayment, setNewPayment] = useState({
        payment_date: new Date().toISOString().split('T')[0],
        payed_cash: '',
        paid_bank: '',
        bank_title: '',
        recorded_by: user?.username || ''
    });
    const [navtccDetails, setNavtccDetails] = useState(null);

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
        fetchPayments();
        fetchNavtccDetails();
    }, [navtccId]);

    useEffect(() => {
        if (user?.username) {
            setNewPayment(prev => ({ ...prev, recorded_by: user.username }));
        }
    }, [user?.username]);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${BASE_URL}/navtcc/${navtccId}/payments`);
            setPayments(response.data.payments || []);
        } catch (error) {
            console.error('Error fetching payments:', error);
            setPayments([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchNavtccDetails = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/navtcc`);
            console.log('Fetch navtcc response:', response.data);

            if (response.data && response.data.navtcc) {
                const specificEntry = response.data.navtcc.find(entry => entry.id === navtccId);

                if (specificEntry) {
                    setNavtccDetails(specificEntry);
                    console.log('Fetched navtccDetails:', specificEntry);
                } else {
                    console.log('NAVTCC entry not found with ID:', navtccId);
                }
            }
        } catch (error) {
            console.error('Error fetching navtcc details:', error);
        }
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditingPayment(prev => ({ ...prev, [name]: value }));
    };

    const addPayment = async () => {
        if (isSubmitting) return;
        if (!newPayment.payment_date || !newPayment.recorded_by) return;

        const cashAmount = parseFloat(newPayment.payed_cash) || 0;
        const bankAmount = parseFloat(newPayment.paid_bank) || 0;

        if (cashAmount === 0 && bankAmount === 0) {
            alert('Please enter either cash paid or paid bank');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await axios.post(`${BASE_URL}/navtcc/${navtccId}/payments`, {
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

                if (navtccDetails && navtccDetails.agent_name) {
                    await addAgentEntry();
                }

                setPayments([...payments, response.data.payment]);

                const paymentData = {
                    navtccId: navtccId,
                    cashAmount: cashAmount,
                    bankAmount: bankAmount,
                    paymentDate: newPayment.payment_date,
                    recordedBy: newPayment.recorded_by
                };

                window.dispatchEvent(new CustomEvent('paymentUpdated', {
                    detail: paymentData
                }));

                setNewPayment({
                    payment_date: new Date().toISOString().split('T')[0],
                    payed_cash: '',
                    paid_bank: '',
                    bank_title: '',
                    recorded_by: user?.username || ''
                });
                setShowModal(false);

                onPaymentSuccess?.(paymentData);
            }
        } catch (error) {
            console.error('Error adding payment:', error);
            alert('Failed to add payment. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const addAgentEntry = async () => {
        try {
            console.log('Adding agent entry for remaining payment');
            console.log('NavtccDetails:', navtccDetails);

            if (!navtccDetails) {
                console.error('No navtcc details available for agent entry');
                return;
            }

            const cashAmount = parseFloat(newPayment.payed_cash) || 0;
            const bankAmount = parseFloat(newPayment.paid_bank) || 0;

            const formatDate = (dateStr) => {
                if (!dateStr) return '';
                const date = new Date(dateStr);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = String(date.getFullYear()).slice(-2);
                return `${day}-${month}-${year}`;
            };

            // Parse passport details to get passenger name
            let passportDetails = {};
            try {
                if (typeof navtccDetails.passport_detail === 'string') {
                    passportDetails = JSON.parse(navtccDetails.passport_detail);
                } else if (typeof navtccDetails.passport_detail === 'object' && navtccDetails.passport_detail !== null) {
                    passportDetails = navtccDetails.passport_detail;
                }
            } catch (e) {
                console.error("Error parsing passport details:", e);
            }

            const passengerName = [
                passportDetails.firstName || '',
                passportDetails.lastName || ''
            ].filter(Boolean).join(' ') || 'N/A';

            const commonDetail = [
                passengerName,
                formatDate(navtccDetails.booking_date),
                '(Remaining Payment)'
            ].filter(Boolean).join(',');

            const agentData = {
                agent_name: navtccDetails.agent_name,
                employee: newPayment.recorded_by,
                detail: commonDetail,
                receivable_amount: 0,
                paid_cash: cashAmount,
                paid_bank: bankAmount,
                credit: 0,
                debit: cashAmount + bankAmount,
                date: newPayment.payment_date,
                entry: `${navtccDetails.entry || ''} (RP)`,
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
            console.log('NavtccDetails in addBankAccountEntry:', navtccDetails);
            console.log('NavtccId:', navtccId);

            let detailInfo = 'N/A';
            let entryInfo = 'N/A';

            if (!navtccDetails) {
                try {
                    const response = await axios.get(`${BASE_URL}/navtcc`);
                    console.log('All navtcc response:', response.data);

                    if (response.data && response.data.navtcc) {
                        const specificEntry = response.data.navtcc.find(entry => entry.id === navtccId);
                        console.log('Found specific entry:', specificEntry);

                        if (specificEntry) {
                            // Parse passport details
                            let passportDetails = {};
                            try {
                                if (typeof specificEntry.passport_detail === 'string') {
                                    passportDetails = JSON.parse(specificEntry.passport_detail);
                                } else if (typeof specificEntry.passport_detail === 'object') {
                                    passportDetails = specificEntry.passport_detail;
                                }
                            } catch (e) {
                                console.error("Error parsing passport details:", e);
                            }

                            const passengerName = [
                                passportDetails.firstName || '',
                                passportDetails.lastName || ''
                            ].filter(Boolean).join(' ') || 'N/A';

                            detailInfo = passengerName;
                            entryInfo = specificEntry.entry || 'N/A';
                        }
                    }
                } catch (error) {
                    console.error('Error fetching navtcc for bank entry:', error);
                }
            } else {
                // Parse passport details
                let passportDetails = {};
                try {
                    if (typeof navtccDetails.passport_detail === 'string') {
                        passportDetails = JSON.parse(navtccDetails.passport_detail);
                    } else if (typeof navtccDetails.passport_detail === 'object') {
                        passportDetails = navtccDetails.passport_detail;
                    }
                } catch (e) {
                    console.error("Error parsing passport details:", e);
                }

                const passengerName = [
                    passportDetails.firstName || '',
                    passportDetails.lastName || ''
                ].filter(Boolean).join(' ') || 'N/A';

                detailInfo = passengerName;
                entryInfo = navtccDetails.entry || 'N/A';
            }

            const detailString = `Detail: ${detailInfo}, Entry: ${entryInfo}, Recorded by: ${newPayment.recorded_by}`;

            const officeAccountData = {
                bank_name: newPayment.bank_title,
                entry: navtccDetails?.entry || `NAVTCC Remaining_Payment ${navtccId}`,
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

    const deletePayment = async (paymentId) => {
        if (!confirm('Are you sure you want to delete this payment? This will also update the NAVTCC amounts.')) {
            return;
        }

        setIsDeleting(paymentId);
        try {
            await axios.delete(`${BASE_URL}/navtcc/payments/${paymentId}`);

            await fetchPayments();

            window.dispatchEvent(new CustomEvent('paymentUpdated', {
                detail: { navtccId }
            }));

            alert('Payment deleted successfully');
        } catch (error) {
            console.error('Error deleting payment:', error);
            alert('Failed to delete payment. Please try again.');
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
            await axios.put(`${BASE_URL}/navtcc/payments/${paymentId}`, {
                payment_date: editingPayment.payment_date,
                payed_cash: cashAmount,
                paid_bank: bankAmount,
                bank_title: editingPayment.bank_title || null,
                recorded_by: editingPayment.recorded_by
            });

            await fetchPayments();
            setEditingPayment(null);

            window.dispatchEvent(new CustomEvent('paymentUpdated', {
                detail: { navtccId }
            }));

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
                        <tr className="bg-indigo-600 text-white">
                            <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Entry</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Receivable Amount</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Paid Cash</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Bank Title</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Paid in Bank</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Remaining Amount</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Recorded By</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                                    No payments recorded yet
                                </td>
                            </tr>
                        ) : (
                            payments.map((payment) => (
                                editingPayment && editingPayment.id === payment.id ? (
                                    <tr key={payment.id}>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <input
                                                type="date"
                                                name="payment_date"
                                                value={editingPayment.payment_date || ''}
                                                onChange={handleEditChange}
                                                className="w-full border rounded px-2 py-1"
                                            />
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">{navtccDetails?.entry || payment.entry || ''}</td>
                                        <td className="border border-gray-300 px-4 py-2">{navtccDetails?.receivable_amount ?? payment.receivable_amount ?? '0'}</td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <input
                                                type="text"
                                                name="payed_cash"
                                                value={editingPayment.payed_cash || ''}
                                                onChange={handleEditChange}
                                                className="w-full border rounded px-2 py-1"
                                            />
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <select
                                                name="bank_title"
                                                value={editingPayment.bank_title || ''}
                                                onChange={handleEditChange}
                                                className='w-full border rounded px-2 py-1'
                                            >
                                                <option value="">Select Bank</option>
                                                {BANK_OPTIONS.map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <input
                                                type="text"
                                                name="paid_bank"
                                                value={editingPayment.paid_bank || ''}
                                                onChange={handleEditChange}
                                                className="w-full border rounded px-2 py-1"
                                            />
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">{payment.remaining_amount || '0'}</td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <input
                                                type="text"
                                                name="recorded_by"
                                                value={editingPayment.recorded_by || ''}
                                                readOnly
                                                className="w-full border rounded px-2 py-1 bg-gray-100"
                                            />
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <div className="flex gap-2">
                                                <button onClick={() => updatePayment(payment.id)} className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600">Save</button>
                                                <button onClick={() => setEditingPayment(null)} className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600">Cancel</button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    <tr key={payment.id}>
                                        <td className="border border-gray-300 px-4 py-2">
                                            {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('en-GB') : ''}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">{navtccDetails?.entry || payment.entry || ''}</td>
                                        <td className="border border-gray-300 px-4 py-2">{navtccDetails?.receivable_amount ?? payment.receivable_amount ?? '0'}</td>
                                        <td className="border border-gray-300 px-4 py-2">{payment.payed_cash || '0'}</td>
                                        <td className="border border-gray-300 px-4 py-2">{payment.bank_title || ''}</td>
                                        <td className="border border-gray-300 px-4 py-2">{payment.paid_bank || '0'}</td>
                                        <td className="border border-gray-300 px-4 py-2">{payment.remaining_amount || '0'}</td>
                                        <td className="border border-gray-300 px-4 py-2">{payment.recorded_by || ''}</td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEditingPayment({
                                                        ...payment,
                                                        payment_date: payment.payment_date ? payment.payment_date.split('T')[0] : ''
                                                    })}
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
                                )
                            ))
                        )}
                    </tbody>
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
                                    onChange={(e) => setNewPayment(prev => ({ ...prev, payment_date: e.target.value }))}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Cash Paid</label>
                                <input
                                    type="text"
                                    value={newPayment.payed_cash}
                                    onChange={(e) => setNewPayment(prev => ({ ...prev, payed_cash: e.target.value }))}
                                    placeholder="Enter cash amount paid"
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Paid Bank</label>
                                <input
                                    type="text"
                                    value={newPayment.paid_bank}
                                    onChange={(e) => setNewPayment(prev => ({ ...prev, paid_bank: e.target.value }))}
                                    placeholder="Enter paid bank amount"
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Select Bank Method</label>
                                <select
                                    value={newPayment.bank_title}
                                    onChange={(e) => setNewPayment(prev => ({ ...prev, bank_title: e.target.value }))}
                                    className='w-full border rounded px-3 py-2'
                                >
                                    <option value="">Select Bank (optional)</option>
                                    {BANK_OPTIONS.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Recorded By *</label>
                                <input
                                    type="text"
                                    value={newPayment.recorded_by}
                                    readOnly
                                    className="w-full border rounded px-3 py-2 bg-gray-100"
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
                                disabled={!newPayment.payment_date || !newPayment.recorded_by || isSubmitting}
                                className={`px-4 py-2 text-white rounded flex items-center justify-center min-w-[120px] ${isSubmitting || !newPayment.payment_date || !newPayment.recorded_by
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

export default NavtccRemainingPay;