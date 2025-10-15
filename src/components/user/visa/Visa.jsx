// Modified Visa.jsx
import React, { useEffect, useState } from 'react';
import Table from '../../ui/Table';
import VisaProcessing_Form from './VisaProcessing_Form';
import { useAppContext } from '../../contexts/AppContext';
import axios from 'axios';
import TableSpinner from '../../ui/TableSpinner';
import Modal from '../../ui/Modal';
import ButtonSpinner from '../../ui/ButtonSpinner';
import VisaRemainingPay from './VisaRemainingPay';

const Visa = () => {
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [entries, setEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editEntry, setEditEntry] = useState(null); 
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showPassportFields, setShowPassportFields] = useState(false);
    const [showRemainingPayModal, setShowRemainingPayModal] = useState(false);
    const [selectedVisaForPay, setSelectedVisaForPay] = useState(null);
    const { user } = useAppContext();

    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;
    
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${BASE_URL}/visa-processing`); 
            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = response.data;
            const formattedData = data.visa_processing?.map((visa) => {
                let passportDetails = {};
                try {
                    if (typeof visa.passport_detail === 'string') {
                        passportDetails = JSON.parse(visa.passport_detail);
                    } else if (typeof visa.passport_detail === 'object' && visa.passport_detail !== null) {
                        passportDetails = visa.passport_detail;
                    }
                } catch (e) {
                    console.error("Error parsing passport details:", e);
                }

                let totalCashPaid = parseFloat(visa.paid_cash || 0);
                let totalBankPaid = parseFloat(visa.paid_in_bank || 0);
                
                const initialCash = visa.initial_paid_cash !== undefined 
                    ? parseFloat(visa.initial_paid_cash) 
                    : parseFloat(visa.paid_cash || 0);
                const initialBank = visa.initial_paid_in_bank !== undefined 
                    ? parseFloat(visa.initial_paid_in_bank) 
                    : parseFloat(visa.paid_in_bank || 0);

                return {
                    ...visa,
                    initial_paid_cash: initialCash,
                    initial_paid_in_bank: initialBank,
                    paid_cash: totalCashPaid,
                    paid_in_bank: totalBankPaid,
                    created_at: new Date(visa.created_at).toLocaleDateString('en-GB'),  
                    embassy_send_date: visa.embassy_send_date
                        ? new Date(visa.embassy_send_date).toLocaleDateString('en-GB')
                        : 'N/A',
                    embassy_return_date: visa.embassy_return_date
                        ? new Date(visa.embassy_return_date).toLocaleDateString('en-GB')
                        : 'N/A',
                    protector_date: visa.protector_date
                        ? new Date(visa.protector_date).toLocaleDateString('en-GB')
                        : 'N/A',
                    expiry_medical_date: visa.expiry_medical_date
                        ? new Date(visa.expiry_medical_date).toLocaleDateString('en-GB')
                        : 'N/A',
                    passport_deliver_date: visa.passport_deliver_date
                        ? new Date(visa.passport_deliver_date).toLocaleDateString('en-GB')
                        : 'N/A',
                    passengerTitle: passportDetails.title || '',
                    passengerFirstName: passportDetails.firstName || '',
                    passengerLastName: passportDetails.lastName || '',
                    passengerDob: passportDetails.dob ? new Date(passportDetails.dob).toLocaleDateString('en-GB') : '',
                    passengerNationality: passportDetails.nationality || '',
                    documentType: passportDetails.documentType || '',
                    documentNo: passportDetails.documentNo || '',
                    documentExpiry: passportDetails.documentExpiry ? new Date(passportDetails.documentExpiry).toLocaleDateString('en-GB') : '',
                    documentIssueCountry: passportDetails.issueCountry || '',
                    passport_detail: visa.passport_detail,
                    status: visa.status || 'Processing',
                    agent_name: visa.agent_name || '',
                    vendor_name: visa.vendor_name || ''
                };
            });
            setEntries(formattedData.reverse());
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to load data. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRemainingPay = (visa) => {
        setSelectedVisaForPay(visa);
        setShowRemainingPayModal(true);
    };

    const closeRemainingPayModal = () => {
        setShowRemainingPayModal(false);
        setSelectedVisaForPay(null);
    };

    const handlePaymentSuccess = (paymentData) => {
        setEntries(prevEntries => prevEntries.map(visa => {
            if (visa.id === paymentData.visaId) {
                return {
                    ...visa,
                    initial_paid_cash: visa.initial_paid_cash || visa.paid_cash,
                    initial_paid_in_bank: visa.initial_paid_in_bank || visa.paid_in_bank,
                    paid_cash: parseFloat(visa.paid_cash || 0) + paymentData.cash_amount,
                    paid_in_bank: parseFloat(visa.paid_in_bank || 0) + paymentData.bank_amount,
                    remaining_amount: parseFloat(visa.remaining_amount || 0) - (paymentData.cash_amount + paymentData.bank_amount)
                };
            }
            return visa;
        }));
        closeRemainingPayModal();
        fetchData();
    };

    const baseColumns = [
        { header: 'BOOKING DATE', accessor: 'created_at' },
        {
    header: 'FILE NO. EMBASSY',
    accessor: 'file_embassy',
    render: (cellValue, row) => (
        <div>
            <div> {row.file_number || 'N/A'}</div>
            <div>{row.embassy || 'N/A'}</div>
        </div>
    )
},
{ header: 'REFERENCE', accessor: 'reference' },
{
    header: 'VISA NO. ID NO.',
    accessor: 'visa_id',
    render: (cellValue, row) => (
        <div>
            <div>{row.visa_number || 'N/A'}</div>
            <div>{row.id_number || 'N/A'}</div>
        </div>
    )
},
{
    header: 'FULL NAME  FATHER NAME',
    accessor: 'passenger_name',
    render: (cellValue, row) => (
        <div>
            <div> {row.passengerFirstName || 'N/A'}</div>
            <div> {row.passengerLastName || 'N/A'}</div>
        </div>
    )
},
{
    header: 'E-NUMBER  MEDICAL EXPIRY',
    accessor: 'e_number_medical',
    render: (cellValue, row) => (
        <div>
            <div> {row.e_number || 'N/A'}</div>
            <div> {row.expiry_medical_date || 'N/A'}</div>
        </div>
    )
},
        { header: 'PTN/PERMISSION', accessor: 'ptn_permission' },

        // { header: 'ENTRY', accessor: 'entry' },
        { header: 'STATUS', accessor: 'status' }, // Added status column
        
        
        { header: 'AGENT NAME', accessor: 'agent_name' },
        { header: 'VENDOR NAME', accessor: 'vendor_name' },
        // { header: 'SPONSOR NAME', accessor: 'sponsor_name' },
       
        
        
        // { header: 'CUSTOMER ADD', accessor: 'customer_add' },
        // { header: 'EMBASSY SEND DATE', accessor: 'embassy_send_date' },
        // { header: 'EMBASSY RETURN DATE', accessor: 'embassy_return_date' },
        // { header: 'PROTECTOR DATE', accessor: 'protector_date' },
        
        // { header: 'PASSPORT DELIVER DATE', accessor: 'passport_deliver_date' },
        // {
        //     header: 'PASSENGERS',
        //     accessor: 'passengerCount',
        //     render: (row, index) => {
        //         const adults = index.adults === undefined ? 0 : index.adults;
        //         const children = index.children === undefined ? 0 : index.children;
        //         const infants = index.infants === undefined ? 0 : index.infants;
        //         return `Adult: ${adults}, Children: ${children}, Infants: ${infants}`;
        //     }
        // },
        // { header: 'TITLE', accessor: 'passengerTitle' },
        
    ];
    const passportColumns = [
        { header: 'DATE OF BIRTH', accessor: 'passengerDob' },
    
        { header: 'PASSPORT NO', accessor: 'documentNo' },
        { header: 'EXPIRY DATE', accessor: 'documentExpiry' },
        
    ];

    const financialColumns = [
        { header: 'RECEIVE ABLE AMOUNT', accessor: 'receivable_amount' },
        { header: 'ADDITIONAL CHARGES', accessor: 'additional_charges' },
        // { header: 'PAY FOR PROTECTOR', accessor: 'pay_for_protector' },
        {
            header: 'PAID CASH',
            accessor: 'paid_cash_details',
            render: (cellValue, row) => (
                <div>
                    <div>Initial: {row.initial_paid_cash || '0'}</div>
                    <div>Total: {row.paid_cash || '0'}</div>
                </div>
            )
        },
        {
            header: 'PAID IN BANK',
            accessor: 'paid_in_bank_details',
            render: (cellValue, row) => (
                <div>
                    <div>Initial: {row.initial_paid_in_bank || '0'}</div>
                    <div>Total: {row.paid_in_bank || '0'}</div>
                </div>
            )
        },
        // { header: 'PROFIT', accessor: 'profit' },
        {
            header: 'REMAINING AMOUNT',
            accessor: 'remaining_amount',
            render: (cellValue, row) => (
                <div className="flex flex-col items-center">
                    <span className="mb-1">{row?.remaining_amount || '0'}</span>
                    <button
                        className="text-green-600 hover:text-green-800 text-xs px-2 py-1 border border-green-600 rounded hover:bg-green-50"
                        onClick={() => handleRemainingPay(row)}
                        title="Add Payment"
                    >
                        <i className="fas fa-plus"></i> Pay
                    </button>
                </div>
            )
        },
    ];
       
    const actionColumns = user.role === 'admin' ? [{
        header: 'ACTIONS', accessor: 'actions', render: (row, index) => (
            <>
                <button
                    className="text-blue-500 hover:text-blue-700 mr-1 text-[13px]"
                    onClick={() => handleUpdate(index)}
                >
                    <i className="fas fa-edit"></i>
                </button>
                <button
                    className="text-red-500 hover:text-red-700 text-[13px]"
                    onClick={() => openDeleteModal(index)}
                >
                    <i className="fas fa-trash"></i>
                </button>
            </>
        )
    }] : [];

    const columns = [
        ...baseColumns,
        ...(showPassportFields ? passportColumns : []),
        ...financialColumns,
        ...actionColumns
    ];

    const filteredData = entries?.filter((index) =>
        Object.values(index).some((value) =>
            String(value).toLowerCase().includes(search.toLowerCase())
        )
    );

    const handleCancel = () => {
        setShowForm(false);
        setEditEntry(null);
    };
    
    const handleFormSubmit = () => {
        fetchData();
        setShowForm(false);
        setEditEntry(null);
    };

    const handleUpdate = (entry) => {
        setEditEntry(entry);
        setShowForm(true);
    };

    const openDeleteModal = (id) => {
        setDeleteId(id);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setDeleteId(null);
    };

    const handleDelete = async (id) => {
        setIsDeleting(true);
        console.log('Attempting to delete visa processing with id:', id);
        const parsedId = typeof id === 'object' && id !== null ? id.id : id;
        if (!parsedId || isNaN(parsedId) || typeof parsedId !== 'number') {
            console.error('Invalid ID:', id, 'Parsed ID:', parsedId);
            setError('Invalid visa processing ID. Cannot delete.');
            setIsDeleting(false);
            return;
        }
        try {
            const response = await axios.delete(`${BASE_URL}/visa-processing/${parsedId}`);
            if (response.status === 200) {
                setEntries(entries.filter(entry => entry.id !== parsedId));
                console.log('Visa processing deleted successfully');
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error deleting visa processing:', error);
            setError('Failed to delete visa processing. Please try again later.');
        } finally {
            setIsDeleting(false);
            closeDeleteModal();
        }
    };

    return (
        <div className="h-full flex flex-col">
            {showForm ? (
                <VisaProcessing_Form onCancel={handleCancel} onSubmitSuccess={handleFormSubmit} editEntry={editEntry}/>
            ) : (
                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4 relative">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-40 p-2 border border-gray-300 pr-8 rounded-md bg-white/90"
                                />
                                <i className="fas fa-search absolute right-3 top-7 transform -translate-y-1/2 text-gray-400"></i>
                            </div>
                            <button
                                className={`font-semibold text-sm rounded-md shadow px-4 py-2 transition-colors duration-200 ${
                                    showPassportFields 
                                        ? 'bg-purple-600 text-white hover:bg-purple-700' 
                                        : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                                onClick={() => setShowPassportFields(!showPassportFields)}
                            >
                                <i className={`fas ${showPassportFields ? 'fa-eye-slash' : 'fa-eye'} mr-1`}></i>
                                {showPassportFields ? 'Hide' : 'Show'} Passport Details
                            </button>
                        </div>

                        <button
                            className="font-semibold text-sm bg-white rounded-md shadow px-4 py-2 hover:bg-purple-700 hover:text-white transition-colors duration-200"
                            onClick={() => setShowForm(true)}
                        >
                            <i className="fas fa-plus mr-1"></i> Add New
                        </button>
                    </div>
                    <div className="flex-1 overflow-hidden bg-white/80 backdrop-blur-md shadow-2xl rounded-2xl">
                        {
                            isLoading ? (
                                <TableSpinner />
                            ) : error ? (
                                <div className="flex items-center justify-center w-full h-64">
                                    <div className="text-red-500">
                                        <i className="fas fa-exclamation-circle mr-2"></i>
                                        {error}
                                    </div>
                                </div> 
                            ) : (
                                <Table data={filteredData} columns={columns} />
                            )
                        }
                    </div>
                </div>
            )}
            <Modal
                isOpen={showDeleteModal}
                onClose={closeDeleteModal}
                title="Delete Confirmation"
            >
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
                    <i className="fas fa-exclamation-triangle text-red-500 text-xl"></i>
                </div>
                <p className="text-sm text-center text-white mb-6">
                    Are you sure you want to delete this visa processing record? 
                </p>
                <div className="flex items-center justify-center space-x-4">
                    <button
                        onClick={closeDeleteModal}
                        className="px-4 py-2 text-sm font-medium text-black bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
                        disabled={isDeleting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => handleDelete(deleteId)}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center justify-center"
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <>
                                <ButtonSpinner /> 
                                Deleting...
                            </>
                        ) : (
                            'Delete'
                        )}
                    </button>
                </div>
            </Modal>
            {showRemainingPayModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Payment Details</h2>
                            <button
                                onClick={closeRemainingPayModal}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <i className="fas fa-times text-xl"></i>
                            </button>
                        </div>
                        <div className="bg-gray-100 p-4 rounded mb-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <strong>Visa ID:</strong> {selectedVisaForPay?.id}
                                </div>
                                <div>
                                    <strong>Customer:</strong> {selectedVisaForPay?.customer_add}
                                </div>
                                <div>
                                    <strong>Reference:</strong> {selectedVisaForPay?.reference}
                                </div>
                                <div>
                                    <strong>Remaining Amount:</strong> {selectedVisaForPay?.remaining_amount || '0'}
                                </div>
                            </div>
                        </div>
                        <VisaRemainingPay
                            visaId={selectedVisaForPay?.id}
                            onClose={closeRemainingPayModal}
                            onPaymentSuccess={handlePaymentSuccess}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Visa;