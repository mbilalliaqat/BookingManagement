import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ButtonSpinner from '../../ui/ButtonSpinner';

const VisaRemainingPay = ({ visaId, onPaymentSuccess }) => {
    const [payments, setPayments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [visaDetails, setVisaDetails] = useState(null); // Add visa details state
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

    // Fixed: Fetch payments using the correct endpoint
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

    // Add function to fetch visa details for bank account entry
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
        if (visaId) {
            fetchPayments();
            fetchVisaDetails(); // Fetch visa details for bank account entry
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

            const formatDate = (dateStr) => {
                if (!dateStr) return '';
                const date = new Date(dateStr);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = String(date.getFullYear()).slice(-2);
                return `${day}-${month}-${year}`;
            };

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

            const commonDetail = [
                visaDetails.embassy || '',
                visaDetails.visa_number || '',
                formatDate(visaDetails.embassy_send_date),
                formatDate(visaDetails.embassy_return_date || ''),
                passengerName,
                '(Remaining Payment)'
            ].filter(Boolean).join(',');

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

    // Add bank account entry function (similar to RemainingPay.jsx)
    const addBankAccountEntry = async () => {
        try {
            let customerInfo = 'N/A';
            let referenceInfo = 'N/A';
            
            if (visaDetails) {
                customerInfo = visaDetails.customer_add || 'N/A';
                referenceInfo = visaDetails.reference || 'N/A';
            }
            
            const detailString = `Customer: ${customerInfo}, Ref: ${referenceInfo}, Recorded by: ${newPayment.recorded_by}`;
            
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

        // Validation - ensure at least one payment method has a value
        const cashAmount = parseFloat(newPayment.payed_cash) || 0;
        const bankAmount = parseFloat(newPayment.paid_bank) || 0;

        if (cashAmount === 0 && bankAmount === 0) {
            alert('Please enter either cash paid or paid bank');
            setIsSubmitting(false);
            return;
        }
        
        try {
            // FIXED: Send data with correct field names that backend expects
            const paymentData = {
                payment_date: newPayment.payment_date,
                payed_cash: cashAmount, // Ensure this matches backend expectations
                paid_bank: bankAmount,  // Ensure this matches backend expectations
                bank_title: newPayment.bank_title || null,
                recorded_by: newPayment.recorded_by,
            };

            console.log('Sending payment data:', paymentData); // Debug log

            const response = await axios.post(`${BASE_URL}/visa-processing/${visaId}/payments`, paymentData);
            
            if (response.status === 201) {
                // Add bank account entry if bank payment is made
                if (newPayment.bank_title && bankAmount > 0) {
                    await addBankAccountEntry();
                }

                // Add agent entry for the remaining payment
                if (visaDetails && visaDetails.agent_name) {
                    await addAgentEntry();
                }

                // Dispatch the paymentUpdated event to trigger dashboard refresh
                window.dispatchEvent(new CustomEvent('paymentUpdated', {
                    detail: {
                        visaId: visaId,
                        cash_amount: cashAmount,
                        bank_amount: bankAmount,
                        paymentDate: newPayment.payment_date,
                        recordedBy: newPayment.recorded_by
                    }
                }));

                // FIXED: Pass the correct data structure to parent component
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
                    recorded_by: ''
                });
                
                // Refresh the payment history
                fetchPayments();
            }
            
        } catch (error) {
            console.error('Error adding payment:', error);
            console.error('Error response:', error.response?.data); // Debug log
            setError(error.response?.data?.message || 'Failed to add payment.');
        } finally {
            setIsSubmitting(false);
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
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="border border-gray-300 px-4 py-8 text-center">
                                        <div className="flex items-center justify-center">
                                            <ButtonSpinner />
                                            <span className="ml-2">Loading payments...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : payments.length === 0 ? (
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
                                        <td className="border border-gray-300 px-4 py-2">{payment.paid_bank || '0'}</td>
                                        <td className="border border-gray-300 px-4 py-2">{payment.bank_title || 'N/A'}</td>
                                        <td className="border border-gray-300 px-4 py-2">{payment.recorded_by || 'N/A'}</td>
                                        <td className="border border-gray-300 px-4 py-2">{payment.remaining_amount || '0'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
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
                            <label className="block text-sm font-medium mb-1 text-gray-700">Recorded By *</label>
                            <input
                                type="text"
                                name="recorded_by"
                                placeholder="Enter recorder name"
                                value={newPayment.recorded_by}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
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