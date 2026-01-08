import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAppContext } from '../../contexts/AppContext';

const RemainingPay = ({ ticketId, onClose, onPaymentSuccess }) => {
    const { user } = useAppContext();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingPayment, setEditingPayment] = useState(null);
    const [isDeleting, setIsDeleting] = useState(null);
    const [newPayment, setNewPayment] = useState({
        payment_date: new Date().toISOString().split('T')[0],
        remaining_amount: '',
        payed_cash: '',
        paid_bank: '',
        bank_title: '',
        recorded_by: user?.username || ''
    });



    useEffect(() => {
        if (user?.username) {
            setNewPayment(prev => ({ ...prev, recorded_by: user.username }));
        }
    }, [user?.username]);



    // Add state to store ticket details for bank account entry
    const [ticketDetails, setTicketDetails] = useState(null);

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
        fetchTicketDetails(); // Fetch ticket details when component mounts
    }, [ticketId]);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${BASE_URL}/ticket_payments/${ticketId}`);
            setPayments(response.data.payments || []);
        } catch (error) {
            console.error('Error fetching payments:', error);
            setPayments([]);
        } finally {
            setLoading(false);
        }
    };

    // Update the fetchTicketDetails function
    const fetchTicketDetails = async () => {
        try {
            // Fetch all tickets first
            const response = await axios.get(`${BASE_URL}/ticket`);
            console.log('Fetch tickets response:', response.data);

            if (response.data && response.data.ticket) {
                // Find the specific ticket by ID from the array
                const specificTicket = response.data.ticket.find(ticket => ticket.id === ticketId);

                if (specificTicket) {
                    setTicketDetails(specificTicket);
                    console.log('Fetched ticketDetails:', specificTicket);
                } else {
                    console.log('Ticket not found with ID:', ticketId);
                }
            }
        } catch (error) {
            console.error('Error fetching ticket details:', error);
        }
    };

    // Replace the entire addPayment function in RemainingPay.jsx with this updated version:

    const addPayment = async () => {
        if (isSubmitting) return;
        if (!newPayment.payment_date || !newPayment.recorded_by) return;

        const cashAmount = parseFloat(newPayment.payed_cash) || 0;
        const bankAmount = parseFloat(newPayment.paid_bank) || 0;

        if (cashAmount === 0 && bankAmount === 0) {
            alert('Please Enter either cash paid & Paid Bank');
            return;
        }

        setIsSubmitting(true);

        try {
            // First, add the payment record
            const response = await axios.post(`${BASE_URL}/ticket_payments`, {
                ticket_id: ticketId,
                payment_date: newPayment.payment_date,
                payment_amount: cashAmount,
                paid_bank: bankAmount,
                bank_title: newPayment.bank_title || null,
                recorded_by: newPayment.recorded_by
            });

            if (response.status === 201) {
                // Add bank account entry if bank payment is made
                if (newPayment.bank_title && bankAmount > 0) {
                    await addBankAccountEntry();
                }

                // Add agent entry for the remaining payment
                if (ticketDetails && ticketDetails.agent_name) {
                    await addAgentEntry();
                }

                setPayments([...payments, response.data.payment]);

                // Create payment data to pass to parent for dashboard update
                const paymentData = {
                    ticketId: ticketId,
                    cashAmount: cashAmount,
                    bankAmount: bankAmount,
                    paymentDate: newPayment.payment_date,
                    recordedBy: newPayment.recorded_by
                };

                // Dispatch the paymentUpdated event to trigger dashboard refresh
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

                // Pass payment data to parent component
                onPaymentSuccess?.(paymentData);
            }
        } catch (error) {
            console.error('Error adding payment:', error);
            alert('Failed to add payment. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Add this new function after the addPayment function:

    const addAgentEntry = async () => {
        try {
            console.log('Adding agent entry for remaining payment');
            console.log('TicketDetails:', ticketDetails);

            if (!ticketDetails) {
                console.error('No ticket details available for agent entry');
                return;
            }

            const cashAmount = parseFloat(newPayment.payed_cash) || 0;
            const bankAmount = parseFloat(newPayment.paid_bank) || 0;

            // Format the detail string similar to ticket form
            const formatDate = (dateStr) => {
                if (!dateStr) return '';
                const date = new Date(dateStr);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = String(date.getFullYear()).slice(-2);
                return `${day}-${month}-${year}`;
            };

            // Parse passenger details to get first passenger name
            let passengerName = '';
            try {
                let passengerDetails = [];
                if (typeof ticketDetails.passport_detail === 'string') {
                    passengerDetails = JSON.parse(ticketDetails.passport_detail);
                } else if (Array.isArray(ticketDetails.passport_detail)) {
                    passengerDetails = ticketDetails.passport_detail;
                }

                if (passengerDetails.length > 0) {
                    const firstPassenger = passengerDetails[0];
                    passengerName = `${firstPassenger.firstName || ''} ${firstPassenger.lastName || ''}`.trim();
                }
            } catch (e) {
                console.error('Error parsing passenger details:', e);
            }

            const commonDetailParts = [
                passengerName,
                ticketDetails.sector || '',
                ticketDetails.airline || '',
                ticketDetails.prn || '',
                formatDate(ticketDetails.depart_date),
                formatDate(ticketDetails.return_date || ''),
                '(RP)'
            ];

            if (!ticketDetails.agent_name && ticketDetails.reference) {
                commonDetailParts.push(ticketDetails.reference);
            }

            const commonDetail = commonDetailParts.filter(Boolean).join(',');

            const agentData = {
                agent_name: ticketDetails.agent_name,
                employee: newPayment.recorded_by,
                detail: commonDetail,
                receivable_amount: 0, // No new receivable amount for remaining payment
                paid_cash: cashAmount,
                paid_bank: bankAmount,
                credit: 0, // No new credit
                debit: cashAmount + bankAmount, // This reduces the agent's balance
                date: newPayment.payment_date,
                entry: `${ticketDetails.entry || ''} (RP)`, // RP = Remaining Payment
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
            // Don't alert here as payment was successful, just log the error
            console.error('Payment added successfully, but failed to create agent entry. Please add manually if needed.');
        }
    };

    // CLEAN VERSION - Without excessive console logs

    // 1. addBankAccountEntry function
    const addBankAccountEntry = async () => {
        try {
            const formatDate = (dateStr) => {
                if (!dateStr) return 'N/A';
                return new Date(dateStr).toISOString().split('T')[0];
            };

            let detailString = 'N/A';

            const createDetailString = (ticket) => {
                let passengerName = '';
                try {
                    const passengers = typeof ticket.passport_detail === 'string'
                        ? JSON.parse(ticket.passport_detail)
                        : ticket.passport_detail;

                    if (passengers && passengers.length > 0) {
                        passengerName = `${passengers[0]?.firstName || ''} ${passengers[0]?.lastName || ''}`.trim();
                    }
                } catch (e) {
                    console.error('Error parsing passport_detail:', e);
                }

                const detailParts = [
                    passengerName,
                    ticket.agent_name || '',
                    ticket.sector || 'N/A',
                    ticket.airline || 'N/A',
                    ticket.prn || '',
                    formatDate(ticket.depart_date),
                    formatDate(ticket.return_date),
                    '(RP)'
                ];

                if (!ticket.agent_name) {
                    detailParts.push(ticket.reference || '');
                }

                return detailParts.filter(Boolean).join(', ');
            };

            if (ticketDetails) {
                detailString = createDetailString(ticketDetails);
            } else {
                try {
                    const response = await axios.get(`${BASE_URL}/ticket`);
                    if (response.data && response.data.ticket) {
                        const specificTicket = response.data.ticket.find(t => t.id === ticketId);
                        if (specificTicket) {
                            detailString = createDetailString(specificTicket);
                        }
                    }
                } catch (error) {
                    console.error('Error fetching tickets for bank entry:', error);
                }
            }

            const entryWithSuffix = ticketDetails?.entry
                ? `${ticketDetails.entry} (RP)`
                : `Ticket Remaining_Payment ${ticketId}`;

            const officeAccountData = {
                bank_name: newPayment.bank_title,
                entry: entryWithSuffix,
                date: newPayment.payment_date,
                detail: detailString,
                credit: parseFloat(newPayment.paid_bank) || 0,
                debit: 0,
                employee_name: newPayment.recorded_by
            };

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

    // 2. deletePayment function
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

            // Step 1: Delete agent entry
            if (ticketDetails && ticketDetails.agent_name && paymentToDelete) {
                try {
                    const agentResponse = await axios.get(`${BASE_URL}/agent`);

                    if (agentResponse.data && agentResponse.data.agents) {
                        const allAgentEntries = agentResponse.data.agents;
                        const entryToDelete = `${ticketDetails.entry || ''} (RP)`;

                        const normalizeDate = (dateStr) => {
                            if (!dateStr) return '';
                            return new Date(dateStr).toISOString().split('T')[0];
                        };

                        const dateToDelete = normalizeDate(paymentToDelete.payment_date);
                        const cashToDelete = parseFloat(paymentToDelete.payed_cash) || 0;
                        const bankToDelete = parseFloat(paymentToDelete.paid_bank) || 0;

                        const agentEntryToDelete = allAgentEntries.find(entry => {
                            const entryDate = normalizeDate(entry.date);
                            const entryCash = parseFloat(entry.paid_cash) || 0;
                            const entryBank = parseFloat(entry.paid_bank) || 0;

                            return (
                                entry.agent_name === ticketDetails.agent_name &&
                                entry.entry === entryToDelete &&
                                entryDate === dateToDelete &&
                                entryCash === cashToDelete &&
                                entryBank === bankToDelete
                            );
                        });

                        if (agentEntryToDelete) {
                            await axios.delete(`${BASE_URL}/agent/${agentEntryToDelete.id}`, {
                                data: { user_name: user?.name || user?.username }
                            });
                            console.log('Agent entry deleted successfully');
                        } else {
                            console.warn('Could not find matching agent entry');
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

            // Step 2: Delete bank account entry
            if (paymentToDelete.bank_title && parseFloat(paymentToDelete.paid_bank) > 0) {
                try {
                    const accountsResponse = await axios.get(`${BASE_URL}/accounts/${paymentToDelete.bank_title}`);

                    if (accountsResponse.data && Array.isArray(accountsResponse.data)) {
                        const normalizeDate = (dateStr) => {
                            if (!dateStr) return '';
                            return new Date(dateStr).toISOString().split('T')[0];
                        };

                        const dateToMatch = normalizeDate(paymentToDelete.payment_date);
                        const amountToMatch = parseFloat(paymentToDelete.paid_bank);
                        const entryToMatch = ticketDetails?.entry
                            ? `${ticketDetails.entry} (RP)`
                            : `Ticket Remaining_Payment ${ticketId}`;

                        let bankEntryToDelete = null;

                        for (const entry of accountsResponse.data) {
                            const entryDate = normalizeDate(entry.date);
                            const entryCredit = parseFloat(entry.credit) || 0;

                            const dateMatches = entryDate === dateToMatch;
                            const amountMatches = Math.abs(entryCredit - amountToMatch) < 0.01;
                            const entryMatches = entry.entry === entryToMatch;

                            if (dateMatches && amountMatches && entryMatches) {
                                bankEntryToDelete = entry;
                                break;
                            }
                        }

                        if (bankEntryToDelete) {
                            const bankDeleteResponse = await axios.delete(
                                `${BASE_URL}/accounts/${bankEntryToDelete.id}`,
                                { data: { user_name: user?.name || user?.username } }
                            );

                            if (bankDeleteResponse.status === 200) {
                                console.log('Bank account entry deleted successfully');
                            }
                        } else {
                            console.warn('Could not find matching bank account entry');
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

            // Step 3: Delete payment record
            await axios.delete(`${BASE_URL}/ticket_payments/${paymentId}`);
            console.log('Payment record deleted successfully');

            // Refresh payments list
            await fetchPayments();

            // Dispatch events to refresh other components
            window.dispatchEvent(new CustomEvent('paymentUpdated', { detail: { ticketId } }));

            if (paymentToDelete.bank_title) {
                window.dispatchEvent(new CustomEvent('bankAccountUpdated', {
                    detail: { bankName: paymentToDelete.bank_title }
                }));
            }

            alert('Payment and associated entries deleted successfully');
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
            await axios.put(`${BASE_URL}/ticket_payments/${paymentId}`, {
                payment_date: editingPayment.payment_date,
                payed_cash: cashAmount,
                paid_bank: bankAmount,
                bank_title: editingPayment.bank_title || null,
                recorded_by: editingPayment.recorded_by
            });

            // Refresh payments list
            await fetchPayments();
            setEditingPayment(null);

            // Dispatch event to refresh dashboard
            window.dispatchEvent(new CustomEvent('paymentUpdated', {
                detail: { ticketId }
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
                        <tr className="bg-indigo-600 text-white">
                            <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Entry</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Receivable Amount</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Paid Cash</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Bank Title</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Paid in Bank</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Remaining Amount</th>
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
                            payments.map((payment, index) => {
                                const entry = ticketDetails?.entry || payment.entry || '';
                                return (
                                    <tr key={payment.id || index}>
                                        <td className="border border-gray-300 px-4 py-2">
                                            {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('en-GB') : ''}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            {entry.startsWith('TK') ? (
                                                <span>
                                                    TK<sub className="text-xs">RP</sub>{entry.substring(2)}
                                                </span>
                                            ) : (
                                                entry
                                            )}
                                        </td>

                                        <td className="border border-gray-300 px-4 py-2">{ticketDetails?.receivable_amount ?? payment.receivable_amount ?? '0'}</td>
                                        <td className="border border-gray-300 px-4 py-2">{payment.payed_cash || '0'}</td>
                                        <td className="border border-gray-300 px-4 py-2">{payment.bank_title || ''}</td>
                                        <td className="border border-gray-300 px-4 py-2">{payment.paid_bank || ''}</td>
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
                                );
                            })
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

            {/* Add Payment Modal */}
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
                                    onChange={(e) => setNewPayment(prev => ({ ...prev, recorded_by: e.target.value }))}
                                    placeholder="Enter your name"
                                    className="w-full border rounded px-3 py-2"
                                    readOnly
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
                                className={`px-4 py-2 text-white rounded flex items-center justify-center min-w-[120px] ${isSubmitting
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
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
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
    );
};

export default RemainingPay;