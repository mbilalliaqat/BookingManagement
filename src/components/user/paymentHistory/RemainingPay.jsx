import { useState, useEffect } from 'react';
import axios from 'axios';

const RemainingPay = ({ ticketId, onClose, onPaymentSuccess }) => {
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

    // New function to fetch ticket details
  // Update the fetchTicketDetails function in RemainingPay.jsx
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

    const addPayment = async () => {
        if(isSubmitting) return ;
        if (!newPayment.payment_date || !newPayment.recorded_by) return;

        const cashAmount = parseFloat(newPayment.payed_cash) || 0;
        const bankAmount = parseFloat(newPayment.paid_bank) || 0;

        if(cashAmount === 0 && bankAmount === 0){
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
                    paid_bank:'',
                    bank_title: '',
                    recorded_by: ''
                });
                setShowModal(false);
                
                // Pass payment data to parent component
                onPaymentSuccess?.(paymentData);
            }
        } catch (error) {
            console.error('Error adding payment:', error);
            alert('Failed to add payment. Please try again.');
        } finally{
            setIsSubmitting(false);
        }
    };

    // New function to add bank account entry
   // Updated addBankAccountEntry function in RemainingPay.jsx
const addBankAccountEntry = async () => {
    try {
        // Debug: Log the ticketDetails to see what we're getting
        console.log('TicketDetails in addBankAccountEntry:', ticketDetails);
        console.log('TicketId:', ticketId);
        
        // If ticketDetails is not available, fetch it from the tickets list
        let customerInfo = 'N/A';
        let referenceInfo = 'N/A';
        
        if (!ticketDetails) {
            // Fetch all tickets and find the one we need
            try {
                const response = await axios.get(`${BASE_URL}/ticket`);
                console.log('All tickets response:', response.data);
                
                if (response.data && response.data.ticket) {
                    // Find the specific ticket by ID
                    const specificTicket = response.data.ticket.find(ticket => ticket.id === ticketId);
                    console.log('Found specific ticket:', specificTicket);
                    
                    if (specificTicket) {
                        customerInfo = specificTicket.customer_add || 'N/A';
                        referenceInfo = specificTicket.reference || 'N/A';
                    }
                }
            } catch (error) {
                console.error('Error fetching tickets for bank entry:', error);
            }
        } else {
            customerInfo = ticketDetails.customer_add || 'N/A';
            referenceInfo = ticketDetails.reference || 'N/A';
        }
        
        const detailString = `Customer: ${customerInfo}, Ref: ${referenceInfo}, Recorded by: ${newPayment.recorded_by}`;
        
        const officeAccountData = {
            bank_name: newPayment.bank_title,
            entry: ticketDetails?.entry || `Ticket Remaining_Payment ${ticketId}`,
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
                            <th className="border border-gray-300 px-4 py-2 text-left">Paid Bank</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Bank Title</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Recorded By</th>
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
                                    <td className="border border-gray-300 px-4 py-2">{payment.remaining_amount || '0'}</td>
                                    <td className="border border-gray-300 px-4 py-2">{payment.payed_cash || '0'}</td>
                                    <td className="border border-gray-300 px-4 py-2">{payment.paid_bank || ''}</td>
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

export default RemainingPay;