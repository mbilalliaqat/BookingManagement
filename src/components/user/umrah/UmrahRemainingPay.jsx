import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAppContext } from '../../contexts/AppContext';

const UmrahRemainingPay = ({ umrahId, onClose, onPaymentSuccess }) => {
    const { user } = useAppContext();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newPayment, setNewPayment] = useState({
        payment_date: new Date().toISOString().split('T')[0],
        remaining_amount: '',
        payed_cash: '',
        paid_bank: '',
        bank_title: '',
        recorded_by: user?.username || ''
    });
    const [umrahDetails, setUmrahDetails] = useState(null);
    const [editingPayment, setEditingPayment] = useState(null);
    const [isDeleting, setIsDeleting] = useState(null);
    const [currentRemainingAmount, setCurrentRemainingAmount] = useState(0);

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
        if (user?.username) {
            setNewPayment(prev => ({ ...prev, recorded_by: user.username }));
        }
    }, [user?.username]);

    useEffect(() => {
        fetchPayments();
        fetchUmrahDetails();
    }, [umrahId]);

    useEffect(() => {
        if (umrahDetails) {
            const cashAmount = parseFloat(newPayment.payed_cash) || 0;
            const bankAmount = parseFloat(newPayment.paid_bank) || 0;
            const totalPayment = cashAmount + bankAmount;
            
            const originalRemaining = parseFloat(umrahDetails.remainingAmount) || 0;
            const updatedRemaining = originalRemaining - totalPayment;
            
            setCurrentRemainingAmount(updatedRemaining);
        }
    }, [umrahDetails, newPayment.payed_cash, newPayment.paid_bank]);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${BASE_URL}/umrah_payments/${umrahId}`);
            setPayments(response.data.payments || []);
        } catch (error) {
            console.error('Error fetching payments:', error);
            setPayments([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchUmrahDetails = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/umrah`);
            if (response.data && response.data.umrahBookings) {
                const specificUmrah = response.data.umrahBookings.find(umrah => umrah.id === umrahId);
                if (specificUmrah) {
                    setUmrahDetails(specificUmrah);
                    setCurrentRemainingAmount(parseFloat(specificUmrah.remainingAmount) || 0);
                }
            }
        } catch (error) {
            console.error('Error fetching umrah details:', error);
        }
    };

    const addPayment = async () => {
        if (isSubmitting) return;
        if (!newPayment.payment_date || !newPayment.recorded_by) return;

        const cashAmount = parseFloat(newPayment.payed_cash) || 0;
        const bankAmount = parseFloat(newPayment.paid_bank) || 0;

        if (cashAmount === 0 && bankAmount === 0) {
            alert('Please Enter either cash paid or Paid Bank');
            return;
        }

        if (currentRemainingAmount < 0) {
            alert('Payment amount exceeds remaining amount. Please adjust the payment.');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await axios.post(`${BASE_URL}/umrah_payments`, {
                umrah_id: umrahId,
                payment_date: newPayment.payment_date,
                payment_amount: cashAmount,
                paid_bank: bankAmount,
                bank_title: newPayment.bank_title || null,
                recorded_by: newPayment.recorded_by
            });

            if (response.status === 201) {
                if (newPayment.bank_title && bankAmount > 0) {
                    await addBankAccountEntry();
                }

                if (umrahDetails && umrahDetails.agent_name) {
                    await addAgentEntry();
                }

                setPayments([...payments, response.data.payment]);

                const paymentData = {
                    umrahId: umrahId,
                    cashAmount: cashAmount,
                    bankAmount: bankAmount,
                };

                window.dispatchEvent(new CustomEvent('paymentUpdated', {
                    detail: paymentData
                }));

                setNewPayment({
                    payment_date: new Date().toISOString().split('T')[0],
                    remaining_amount: '',
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
            console.log('Adding agent entry for umrah remaining payment');
            console.log('UmrahDetails:', umrahDetails);

            if (!umrahDetails) {
                console.error('No umrah details available for agent entry');
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

            let passengerDetails = [];
            try {
                if (typeof umrahDetails.passportDetail === 'string') {
                    passengerDetails = JSON.parse(umrahDetails.passportDetail);
                } else if (Array.isArray(umrahDetails.passportDetail)) {
                    passengerDetails = umrahDetails.passportDetail;
                }
            } catch (e) {
                console.error('Error parsing passenger details:', e);
            }

            const passengerCount = passengerDetails.length;
            const passengerCountDisplay = passengerCount > 0 ? `(${passengerCount})` : null;
            const firstPassengerName = passengerDetails.length > 0 ? `${passengerDetails[0]?.firstName || ''} ${passengerDetails[0]?.lastName || ''}`.trim() : '';

            const commonDetailParts = [
                umrahDetails.agent_name ? `(AG,${umrahDetails.agent_name})` : '',
                passengerCountDisplay,
                firstPassengerName,
                umrahDetails.packageDetail || '',
                `ad: ${umrahDetails.customerAdd || ''}`,
                umrahDetails.sector || '',
                umrahDetails.airline || umrahDetails.airline_select || '',
                formatDate(umrahDetails.depart_date),
                formatDate(umrahDetails.return_date || ''),
                '(RP)'
            ];

            if (!umrahDetails.agent_name) {
                commonDetailParts.push(umrahDetails.reference ? umrahDetails.reference.trim() : '');
            }

            const commonDetail = commonDetailParts.filter(Boolean).join('/');

            const agentData = {
                agent_name: umrahDetails.agent_name,
                employee: newPayment.recorded_by,
                detail: commonDetail,
                receivable_amount: 0,
                paid_cash: cashAmount,
                paid_bank: bankAmount,
                credit: 0,
                debit: cashAmount + bankAmount,
                date: newPayment.payment_date,
                entry: `${umrahDetails.entry || ''} (RP)`,
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

    const deletePayment = async (paymentId) => {
        if (!confirm('Are you sure you want to delete this payment? This will also delete the corresponding agent and bank account entries.')) {
            return;
        }

        setIsDeleting(paymentId);
        try {
            const paymentToDelete = payments.find(p => p.id === paymentId);
            if (!paymentToDelete) {
                console.error("Payment to delete not found in state.");
                alert("Could not find payment to delete. Please refresh.");
                setIsDeleting(null);
                return;
            }

            console.log('=== STARTING DELETION PROCESS ===');
            console.log('Payment to delete:', paymentToDelete);
            console.log('Umrah details:', umrahDetails);

            if (umrahDetails && umrahDetails.agent_name && paymentToDelete) {
                try {
                    const agentResponse = await axios.get(`${BASE_URL}/agent`);

                    if (agentResponse.data && agentResponse.data.agents) {
                        const allAgentEntries = agentResponse.data.agents;
                        const entryToDelete = `${umrahDetails.entry || ''} (RP)`;

                        const normalizeDate = (dateStr) => {
                            if (!dateStr) return '';
                            return new Date(dateStr).toISOString().split('T')[0];
                        };

                        const dateToDelete = normalizeDate(paymentToDelete.payment_date);
                        const cashToDelete = parseFloat(paymentToDelete.payed_cash) || 0;
                        const bankToDelete = parseFloat(paymentToDelete.paid_bank) || 0;

                        console.log('🔍 Looking for agent entry with:');
                        console.log('  Agent name:', umrahDetails.agent_name);
                        console.log('  Entry:', entryToDelete);
                        console.log('  Date:', dateToDelete);
                        console.log('  Cash:', cashToDelete);
                        console.log('  Bank:', bankToDelete);

                        const agentEntryToDelete = allAgentEntries.find(entry => {
                            const entryDate = normalizeDate(entry.date);
                            const entryCash = parseFloat(entry.paid_cash) || 0;
                            const entryBank = parseFloat(entry.paid_bank) || 0;

                            const agentMatches = entry.agent_name === umrahDetails.agent_name;
                            const entryMatches = entry.entry === entryToDelete;
                            const dateMatches = entryDate === dateToDelete;
                            const cashMatches = entryCash === cashToDelete;
                            const bankMatches = entryBank === bankToDelete;

                            if (entry.agent_name === umrahDetails.agent_name) {
                                console.log(`\n📋 Checking agent entry ID ${entry.id}:`);
                                console.log('  Entry:', entry.entry, entryMatches ? '✓' : '✗');
                                console.log('  Date:', entryDate, dateMatches ? '✓' : '✗');
                                console.log('  Cash:', entryCash, cashMatches ? '✓' : '✗');
                                console.log('  Bank:', entryBank, bankMatches ? '✓' : '✗');
                            }

                            return agentMatches && entryMatches && dateMatches && cashMatches && bankMatches;
                        });

                        if (agentEntryToDelete) {
                            console.log('✓ Found agent entry to delete:', agentEntryToDelete.id);
                            await axios.delete(`${BASE_URL}/agent/${agentEntryToDelete.id}`, {
                                data: { user_name: user?.name || user?.username }
                            });
                            console.log('✓ Agent entry deleted successfully');
                        } else {
                            console.warn('✗ Could not find matching agent entry');
                            console.log('All agent entries for this agent:');
                            allAgentEntries
                                .filter(e => e.agent_name === umrahDetails.agent_name)
                                .forEach(e => console.log({
                                    id: e.id,
                                    entry: e.entry,
                                    date: normalizeDate(e.date),
                                    cash: e.paid_cash,
                                    bank: e.paid_bank
                                }));

                            if (!confirm('Could not find matching agent entry. Continue deleting payment?')) {
                                setIsDeleting(null);
                                return;
                            }
                        }
                    }
                } catch (agentError) {
                    console.error('Error deleting agent entry:', agentError);
                    if (!confirm('Failed to delete agent entry. Continue deleting payment?')) {
                        setIsDeleting(null);
                        return;
                    }
                }
            }

            if (paymentToDelete.bank_title && parseFloat(paymentToDelete.paid_bank) > 0) {
                try {
                    console.log('\n=== ATTEMPTING BANK ACCOUNT DELETION ===');
                    console.log('Bank title:', paymentToDelete.bank_title);

                    const accountsResponse = await axios.get(`${BASE_URL}/accounts/${paymentToDelete.bank_title}`);
                    console.log('Fetched accounts:', accountsResponse.data?.length || 0, 'entries');

                    if (accountsResponse.data && Array.isArray(accountsResponse.data)) {
                        const normalizeDate = (dateStr) => {
                            if (!dateStr) return '';
                            return new Date(dateStr).toISOString().split('T')[0];
                        };

                        const dateToMatch = normalizeDate(paymentToDelete.payment_date);
                        const amountToMatch = parseFloat(paymentToDelete.paid_bank);
                        const entryToMatch = umrahDetails?.entry || `Umrah Remaining_Payment ${umrahId}`;

                        console.log('🔍 Looking for bank entry with:');
                        console.log('  Entry:', entryToMatch);
                        console.log('  Date:', dateToMatch);
                        console.log('  Credit:', amountToMatch);

                        let bankEntryToDelete = null;

                        for (const entry of accountsResponse.data) {
                            const entryDate = normalizeDate(entry.date);
                            const entryCredit = parseFloat(entry.credit) || 0;

                            const dateMatches = entryDate === dateToMatch;
                            const amountMatches = Math.abs(entryCredit - amountToMatch) < 0.01;
                            const entryMatches = entry.entry === entryToMatch;

                            console.log(`\n📋 Bank entry ID ${entry.id}:`);
                            console.log('  Entry:', entry.entry, entryMatches ? '✓' : '✗');
                            console.log('  Date:', entryDate, dateMatches ? '✓' : '✗');
                            console.log('  Credit:', entryCredit, amountMatches ? '✓' : '✗');

                            if (dateMatches && amountMatches && entryMatches) {
                                bankEntryToDelete = entry;
                                console.log('  ✅ MATCH FOUND!');
                                break;
                            }
                        }

                        if (bankEntryToDelete) {
                            console.log('✓ Deleting bank entry ID:', bankEntryToDelete.id);
                            const bankDeleteResponse = await axios.delete(
                                `${BASE_URL}/accounts/${bankEntryToDelete.id}`,
                                { data: { user_name: user?.name || user?.username } }
                            );

                            if (bankDeleteResponse.status === 200) {
                                console.log('✓ Bank account entry deleted successfully');
                            }
                        } else {
                            console.warn('✗ Could not find matching bank account entry');
                            if (!confirm('Could not find matching bank account entry. Continue deleting payment?')) {
                                setIsDeleting(null);
                                return;
                            }
                        }
                    }
                } catch (bankError) {
                    console.error('Error deleting bank account entry:', bankError);
                    if (!confirm('Failed to delete bank account entry. Continue deleting payment?')) {
                        setIsDeleting(null);
                        return;
                    }
                }
            }

            console.log('\n=== DELETING PAYMENT RECORD ===');
            console.log('Payment ID:', paymentId);

            await axios.delete(`${BASE_URL}/umrah/payment/${paymentId}`);
            console.log('✓ Payment record deleted successfully');

            await fetchPayments();

            window.dispatchEvent(new CustomEvent('paymentUpdated', {
                detail: { umrahId }
            }));

            if (paymentToDelete.bank_title) {
                window.dispatchEvent(new CustomEvent('bankAccountUpdated', {
                    detail: { bankName: paymentToDelete.bank_title }
                }));
            }

            console.log('=== DELETION COMPLETED ===\n');
            alert('Payment and associated entries deleted successfully');
        } catch (error) {
            console.error('=== DELETION FAILED ===');
            console.error('Error:', error);
            console.error('Error details:', error.response?.data);
            alert('Failed to delete payment. Check console for details.');
        } finally {
            setIsDeleting(null);
        }
    };

    const addBankAccountEntry = async () => {
        try {
            if (!umrahDetails) {
                console.error('No umrah details available for bank entry');
                alert('Could not find booking details to create bank entry. Please try again.');
                return;
            }

            const formatDate = (dateStr) => {
                if (!dateStr) return '';
                const date = new Date(dateStr);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = String(date.getFullYear()).slice(-2);
                return `${day}-${month}-${year}`;
            };

            let passengerDetails = [];
            try {
                if (typeof umrahDetails.passportDetail === 'string') {
                    passengerDetails = JSON.parse(umrahDetails.passportDetail);
                } else if (Array.isArray(umrahDetails.passportDetail)) {
                    passengerDetails = umrahDetails.passportDetail;
                }
            } catch (e) {
                console.error('Error parsing passenger details for bank entry:', e);
            }

            const passengerCount = passengerDetails.length;
            const passengerCountDisplay = passengerCount > 0 ? `(${passengerCount})` : null;
            const firstPassengerName = passengerDetails.length > 0 ? `${passengerDetails[0]?.firstName || ''} ${passengerDetails[0]?.lastName || ''}`.trim() : '';

            const commonDetailParts = [
                umrahDetails.agent_name ? `(AG,${umrahDetails.agent_name})` : '',
                passengerCountDisplay,
                firstPassengerName,
                umrahDetails.packageDetail || '',
                `ad: ${umrahDetails.customerAdd || ''}`,
                umrahDetails.sector || '',
                umrahDetails.airline || umrahDetails.airline_select || '',
                formatDate(umrahDetails.depart_date),
                formatDate(umrahDetails.return_date || ''),
                '(RP)'
            ];

            if (!umrahDetails.agent_name) {
                commonDetailParts.push(umrahDetails.reference ? umrahDetails.reference.trim() : '');
            }

            const commonDetail = commonDetailParts.filter(Boolean).join('/');

            const officeAccountData = {
                bank_name: newPayment.bank_title,
                entry: umrahDetails?.entry || `Umrah Remaining_Payment ${umrahId}`,
                date: newPayment.payment_date,
                detail: commonDetail,
                credit: parseFloat(newPayment.paid_bank) || 0,
                debit: 0,
                employee_name: newPayment.recorded_by
            };

            console.log('Adding bank account entry:', officeAccountData);

            const officeAccountResponse = await axios.post(`${BASE_URL}/accounts`, officeAccountData);

            if (officeAccountResponse.status === 200 || officeAccountResponse.status === 201) {
                console.log('Bank account entry added successfully');
            } else {
                console.error('Office Account submission failed:', officeAccountResponse.status);
            }
        } catch (officeAccountError) {
            console.error('Error submitting Office Account data:', officeAccountError.response?.data || officeAccountError.message);
            alert('Payment added successfully, but failed to create bank account entry. Please add manually if needed.');
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
            await axios.put(`${BASE_URL}/umrah/payment/${paymentId}`, {
                payment_date: editingPayment.payment_date,
                payed_cash: cashAmount,
                paid_bank: bankAmount,
                bank_title: editingPayment.bank_title || null,
                recorded_by: editingPayment.recorded_by
            });

            await fetchPayments();
            setEditingPayment(null);

            window.dispatchEvent(new CustomEvent('paymentUpdated', {
                detail: { umrahId }
            }));

            alert('Payment updated successfully');
        } catch (error) {
            console.error('Error updating payment:', error);
            alert('Failed to update payment. Please try again.');
        }
    };

    const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.payed_cash || 0), 0);
    const isOverpayment = currentRemainingAmount < 0;

    if (loading) {
        return <div className="flex justify-center p-4">Loading payments...</div>;
    }

    return (
        <div>
            {/* Payments Table */}
            <div className="mb-4">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-white">Payment Records</h3>
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
                            <th className="border border-gray-300 px-4 py-2 text-left">Paid Bank</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Bank Title</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Recorded By</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                                    No payments recorded yet
                                </td>
                            </tr>
                        ) : (
                            payments.map((payment, index) => (
                                <tr key={payment.id || index}>
                                    <td className="border border-gray-300 px-4 py-2 text-white">
                                        {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('en-GB') : ''}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2 text-white">{payment.remaining_amount || '0'}</td>
                                    <td className="border border-gray-300 px-4 py-2 text-white">{payment.payed_cash || '0'}</td>
                                    <td className="border border-gray-300 px-4 py-2 text-white">{payment.paid_bank || ''}</td>
                                    <td className="border border-gray-300 px-4 py-2 text-white">{payment.bank_title || ''}</td>
                                    <td className="border border-gray-300 px-4 py-2 text-white">{payment.recorded_by || ''}</td>
                                    <td className="border border-gray-300 px-4 py-2 text-white">
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
                </table>

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
                                    onChange={(e) => setNewPayment(prev => ({ ...prev, payment_date: e.target.value }))}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Cash Paid</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={newPayment.payed_cash}
                                    onChange={(e) => setNewPayment(prev => ({ ...prev, payed_cash: e.target.value }))}
                                    placeholder="Enter cash amount paid"
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Paid Bank</label>
                                <input
                                    type="number"
                                    step="0.01"
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
                                    <option value="">
                                        Select Bank (optional)
                                    </option>
                                    {BANK_OPTIONS.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.value}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Employee Name</label>
                                <input
                                    type="text"
                                    value={newPayment.recorded_by}
                                    readOnly
                                    className="w-full border rounded px-3 py-2 bg-gray-100"
                                />
                            </div>

                            {/* Remaining Amount Display */}
                            <div className={`p-4 rounded-lg border-2 ${
                                isOverpayment 
                                    ? 'bg-red-50 border-red-500' 
                                    : currentRemainingAmount === 0 
                                        ? 'bg-green-50 border-green-500'
                                        : 'bg-blue-50 border-blue-500'
                            }`}>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700">
                                        Updated Remaining Amount:
                                    </span>
                                    <span className={`text-lg font-bold ${
                                        isOverpayment 
                                            ? 'text-red-600' 
                                            : currentRemainingAmount === 0 
                                                ? 'text-green-600'
                                                : 'text-blue-600'
                                    }`}>
                                        {currentRemainingAmount.toFixed(2)}
                                    </span>
                                </div>
                                {isOverpayment && (
                                    <div className="mt-2 text-xs text-red-600 flex items-center">
                                        <i className="fas fa-exclamation-triangle mr-1"></i>
                                        <span>Payment exceeds remaining amount!</span>
                                    </div>
                                )}
                                {currentRemainingAmount === 0 && (parseFloat(newPayment.payed_cash) || 0) + (parseFloat(newPayment.paid_bank) || 0) > 0 && (
                                    <div className="mt-2 text-xs text-green-600 flex items-center">
                                        <i className="fas fa-check-circle mr-1"></i>
                                        <span>Payment will settle the remaining amount!</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setNewPayment({
                                        payment_date: new Date().toISOString().split('T')[0],
                                        remaining_amount: '',
                                        payed_cash: '',
                                        paid_bank: '',
                                        bank_title: '',
                                        recorded_by: user?.username || ''
                                    });
                                }}
                                className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addPayment}
                                disabled={!newPayment.payment_date || !newPayment.recorded_by || isOverpayment || isSubmitting}
                                className={`px-4 py-2 text-white rounded flex items-center justify-center min-w-[120px] ${
                                    isSubmitting || isOverpayment || !newPayment.payment_date || !newPayment.recorded_by
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

export default UmrahRemainingPay;