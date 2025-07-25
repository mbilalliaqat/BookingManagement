import { useEffect, useState } from 'react';
import Table from '../../ui/Table';
import { useAppContext } from '../../contexts/AppContext';
import Tickets_Form from './Tickets_Form';
import RemainingPay from '../paymentHistory/RemainingPay'; // Import the RemainingPay component
import axios from 'axios';
import TableSpinner from '../../ui/TableSpinner';
import ButtonSpinner from '../../ui/ButtonSpinner';

const Tickets = () => {
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editEntry, setEditEntry] = useState(null);
    const [entries, setEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showPassportFields, setShowPassportFields] = useState(false);
    // New state for remaining pay modal
    const [showRemainingPayModal, setShowRemainingPayModal] = useState(false);
    const [selectedTicketForPay, setSelectedTicketForPay] = useState(null);
    
    const { user } = useAppContext();

    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;

    const fetchTickets = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${BASE_URL}/ticket`);
            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = response.data;
            console.log("Fetched data:", data);

            // Sort by ID to maintain consistent order
            const sortedTickets = data.ticket.sort((a, b) => a.id - b.id);

            const formattedData = sortedTickets.map((ticket) => {
                let parsedPassengerDetails = [];
                try {
                    if (typeof ticket.passport_detail === 'string') {
                        const parsed = JSON.parse(ticket.passport_detail);
                        if (Array.isArray(parsed)) {
                            parsedPassengerDetails = parsed;
                        } else if (typeof parsed === 'object' && parsed !== null) {
                            parsedPassengerDetails = [parsed]; // Wrap single object in an array for consistency
                        }
                    } else if (Array.isArray(ticket.passport_detail)) {
                        parsedPassengerDetails = ticket.passport_detail;
                    } else if (typeof ticket.passport_detail === 'object' && ticket.passport_detail !== null) {
                        parsedPassengerDetails = [ticket.passport_detail]; // Wrap single object in an array
                    }
                } catch (e) {
                    console.error("Error parsing passport details:", e);
                    parsedPassengerDetails = []; // Ensure it's an empty array on error
                }

                return {
                    ...ticket,
                    depart_date: new Date(ticket.depart_date).toLocaleDateString('en-GB'),
                    return_date: new Date(ticket.return_date).toLocaleDateString('en-GB'),
                    created_at: new Date(ticket.created_at).toLocaleDateString('en-GB'),
                    allPassengerDetails: parsedPassengerDetails, // This now holds the array of all passenger objects
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

    const updateSingleEntry = async (updatedTicket) => {
        try {
            const entryIndex = entries.findIndex(entry => entry.id === updatedTicket.id);
            if (entryIndex === -1) return;

            let parsedPassengerDetails = [];
            try {
                if (typeof updatedTicket.passport_detail === 'string') {
                    const parsed = JSON.parse(updatedTicket.passport_detail);
                    if (Array.isArray(parsed)) {
                        parsedPassengerDetails = parsed;
                    } else if (typeof parsed === 'object' && parsed !== null) {
                        parsedPassengerDetails = [parsed];
                    }
                } else if (Array.isArray(updatedTicket.passport_detail)) {
                    parsedPassengerDetails = updatedTicket.passport_detail;
                } else if (typeof updatedTicket.passport_detail === 'object' && updatedTicket.passport_detail !== null) {
                    parsedPassengerDetails = [updatedTicket.passport_detail];
                }
            } catch (e) {
                console.error("Error parsing passport details:", e);
                parsedPassengerDetails = [];
            }

            const formattedTicket = {
                ...updatedTicket,
                serialNo: entries[entryIndex].serialNo,
                depart_date: new Date(updatedTicket.depart_date).toLocaleDateString('en-GB'),
                return_date: new Date(updatedTicket.return_date).toLocaleDateString('en-GB'),
                created_at: new Date(updatedTicket.created_at).toLocaleDateString('en-GB'),
                allPassengerDetails: parsedPassengerDetails, // Ensure this is also updated
            };

            const updatedEntries = [...entries];
            updatedEntries[entryIndex] = formattedTicket;
            setEntries(updatedEntries);
        } catch (error) {
            console.error('Error updating single entry:', error);
            fetchTickets();
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    // Function to handle remaining pay button click
    const handleRemainingPay = (ticket) => {
        setSelectedTicketForPay(ticket);
        setShowRemainingPayModal(true);
    };

    // Function to close remaining pay modal
    const closeRemainingPayModal = () => {
        setShowRemainingPayModal(false);
        setSelectedTicketForPay(null);
    };

    // Function to handle successful payment
    const handlePaymentSuccess = () => {
        // Optionally refresh tickets data or update UI
        fetchTickets();
    };

    const baseColumns=[
         { header: 'BOOKING DATE', accessor: 'created_at' },
         {
            header: 'EMPLOYEE & ENTRY',
            accessor: 'employee_entry',
            render: (cellValue, row) => (
                <div>
                    <div>{row?.employee_name || ''}</div>
                    <div style={{ }}>{row?.entry || ''}</div>
                </div>
            )
        },
        { header: 'CUSTOMER ADD', accessor: 'customer_add' },
        { header: 'REFERENCE', accessor: 'reference' },
        {
            header: 'DEPART & RETURN DATE',
            accessor: 'depart_return_date',
            render: (cellValue, row) => (
                <div>
                    <div>{row?.depart_date || ''}</div>
                    <div style={{  }}>{row?.return_date || ''}</div>
                </div>
            )
        },
        { header: 'SECTOR', accessor: 'sector' },
        { header: 'AIRLINE', accessor: 'airline' },
        {
            header: 'PASSENGERS',
            accessor: 'passengerCount',
            render: (row,index) => {
                const adults = index.adults === undefined ? 0 : index.adults;
                const children = index.children === undefined ? 0 : index.children;
                const infants = index.infants === undefined ? 0 : index.infants;
                return `Adult: ${adults}, Children: ${children}, Infants: ${infants}`;
            }
        },
        {
            header: 'PASSENGER DETAILS',
            accessor: 'passenger_details',
            render: (cellValue, row) => (
                <div className="flex flex-col space-y-1">
                    {row.allPassengerDetails && row.allPassengerDetails.length > 0 ? (
                        row.allPassengerDetails.map((passenger, idx) => (
                            <div key={idx} className="border-b border-gray-200 last:border-b-0 pb-1 pt-1">
                                <p className="font-semibold text-gray-800">
                                    {passenger.title || ''} {passenger.firstName || ''} {passenger.lastName || ''}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500">No passenger details</p>
                    )}
                </div>
            )
        },
    ];

    const passportColumns=[
        {
            header: 'DATE OF BIRTH',
            accessor: 'passengerDob', // You can change this accessor, it's not strictly necessary with render
            render: (cellValue, row) => (
                <div className="flex flex-col space-y-1">
                    {row.allPassengerDetails && row.allPassengerDetails.map((p, idx) => (
                        <div key={idx} className="border-b border-gray-200 last:border-b-0 pb-1 pt-1">
                            {p.dob ? new Date(p.dob).toLocaleDateString('en-GB') : ''}
                        </div>
                    ))}
                </div>
            )
        },
        {
            header: 'NATIONALITY',
            accessor: 'passengerNationality', // You can change this accessor
            render: (cellValue, row) => (
                <div className="flex flex-col space-y-1">
                    {row.allPassengerDetails && row.allPassengerDetails.map((p, idx) => (
                        <div key={idx} className="border-b border-gray-200 last:border-b-0 pb-1 pt-1">
                            {p.nationality || ''}
                        </div>
                    ))}
                </div>
            )
        },
        {
            header: 'DOCUMENT TYPE',
            accessor: 'documentType', // You can change this accessor
            render: (cellValue, row) => (
                <div className="flex flex-col space-y-1">
                    {row.allPassengerDetails && row.allPassengerDetails.map((p, idx) => (
                        <div key={idx} className="border-b border-gray-200 last:border-b-0 pb-1 pt-1">
                            {p.documentType || ''}
                        </div>
                    ))}
                </div>
            )
        },
        {
            header: 'DOCUMENT NO',
            accessor: 'documentNo', // You can change this accessor
            render: (cellValue, row) => (
                <div className="flex flex-col space-y-1">
                    {row.allPassengerDetails && row.allPassengerDetails.map((p, idx) => (
                        <div key={idx} className="border-b border-gray-200 last:border-b-0 pb-1 pt-1">
                            {p.documentNo || ''}
                        </div>
                    ))}
                </div>
            )
        },
        {
            header: 'EXPIRY DATE',
            accessor: 'documentExpiry', // You can change this accessor
            render: (cellValue, row) => (
                <div className="flex flex-col space-y-1">
                    {row.allPassengerDetails && row.allPassengerDetails.map((p, idx) => (
                        <div key={idx} className="border-b border-gray-200 last:border-b-0 pb-1 pt-1">
                            {p.documentExpiry ? new Date(p.documentExpiry).toLocaleDateString('en-GB') : ''}
                        </div>
                    ))}
                </div>
            )
        },
        {
            header: 'ISSUE COUNTRY',
            accessor: 'documentIssueCountry', // You can change this accessor
            render: (cellValue, row) => (
                <div className="flex flex-col space-y-1">
                    {row.allPassengerDetails && row.allPassengerDetails.map((p, idx) => (
                        <div key={idx} className="border-b border-gray-200 last:border-b-0 pb-1 pt-1">
                            {p.issueCountry || ''}
                        </div>
                    ))}
                </div>
            )
        },
    ];
    const financialColumns=[
        { header: 'RECEIVABLE AMOUNT', accessor: 'receivable_amount' },
        { header: 'AGENT NAME', accessor: 'agent_name' },
        { header: 'PAID CASH', accessor: 'paid_cash' },
     {
        header: 'BANK & PAID IN BANK',
        accessor: 'bank_paid',
        render: (cellValue, row) => (
            <div>
                <div>{row?.bank_title || ''}</div>
                <div >{row?.paid_in_bank || ''}</div>
            </div>
        )
    },
         {
        header: 'VENDOR & PAYABLE',
        accessor: 'vendor_payable',
        render: (cellValue, row) => (
            <div>
                <div>{row?.vendor_name || ''}</div>
                <div >{row?.payable_to_vendor || ''}</div>
            </div>
        )
    },
        { header: 'PROFIT', accessor: 'profit' },
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
                    className="text-blue-500 hover:text-blue-700 pr-1 text-[8px]"
                    onClick={() => handleUpdate(index)}
                >
                    <i className="fas fa-edit"></i>
                </button>
                <button
                    className="text-red-500 hover:text-red-700 text-[8px]"
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

    const filteredData = entries.filter((index) =>
        Object.values(index).some((value) =>
            String(value).toLowerCase().includes(search.toLowerCase())
        )
    );

    const handleCancel = () => {
        setShowForm(false);
        setEditEntry(null);
    };

    const handleFormSubmit = (updatedTicket = null) => {
        if (updatedTicket && editEntry) {
            updateSingleEntry(updatedTicket);
        } else {
            fetchTickets();
        }
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
        console.log('Attempting to delete ticket with id:', id);
        setIsDeleting(true);
        const parsedId = typeof id === 'object' && id !== null ? id.id : id;
        if (!parsedId || isNaN(parsedId) || typeof parsedId !== 'number') {
            console.error('Invalid ID:', id, 'Parsed ID:', parsedId);
            setError('Invalid ticket ID. Cannot delete.');
            setIsDeleting(false);
            return;
        }
        try {
            const response = await axios.delete(`${BASE_URL}/ticket/${parsedId}`);
            if (response.status === 200) {
                setEntries(entries.filter(entry => entry.id !== parsedId));
                console.log('Ticket deleted successfully');
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error deleting ticket:', error);
            setError('Failed to delete ticket. Please try again later.');
        }
        setIsDeleting(false);
        closeDeleteModal();
    };

    const DeleteConfirmationModal = () => {
        if (!showDeleteModal) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto bg-black bg-opacity-50">
                <div className="relative w-full max-w-md mx-auto bg-[#161925] rounded-lg shadow-lg">
                    <div className="p-6">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
                            <i className="fas fa-exclamation-triangle text-red-500 text-xl"></i>
                        </div>
                        <h3 className="mb-5 text-lg font-medium text-center text-white">
                            Delete Confirmation
                        </h3>
                        <p className="text-sm text-center text-white mb-6">
                            Are you sure you want to delete this ticket?
                        </p>
                        <div className="flex items-center justify-center space-x-4">
                            <button
                                onClick={closeDeleteModal}
                                className="px-4 py-2 text-sm font-medium text-white bg-[#161925] border rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteId)}
                                className="px-4 py-2 text-sm font-medium text-white bg-[#161925] border rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center justify-center"
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <ButtonSpinner />
                                        <span>Deleting...</span>
                                    </>
                                ) : (
                                    'Delete'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Remaining Pay Modal Component
    const RemainingPayModal = () => {
        if (!showRemainingPayModal || !selectedTicketForPay) return null;

        return (
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
                    
                    {/* Display Ticket Info */}
                    <div className="bg-gray-100 p-4 rounded mb-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <strong>Ticket ID:</strong> {selectedTicketForPay.id}
                            </div>
                            <div>
                                <strong>Customer:</strong> {selectedTicketForPay.customer_add}
                            </div>
                            <div>
                                <strong>Reference:</strong> {selectedTicketForPay.reference}
                            </div>
                            <div>
                                <strong>Remaining Amount:</strong> {selectedTicketForPay.remaining_amount || '0'}
                            </div>
                        </div>
                    </div>

                    {/* RemainingPay Component */}
                    <RemainingPay
                        ticketId={selectedTicketForPay.id}
                        onClose={closeRemainingPayModal}
                        onPaymentSuccess={handlePaymentSuccess}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className='h-full flex flex-col'>
            {showForm ? (
                <Tickets_Form
                    onCancel={handleCancel}
                    onSubmitSuccess={handleFormSubmit}
                    editEntry={editEntry}
                />
            ) : (
                <div className='flex flex-col h-full'>
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
                    <div>
                        {isLoading ? (
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
                        )}
                    </div>
                    <DeleteConfirmationModal />
                    <RemainingPayModal />
                </div>
            )}
        </div>
    );
};

export default Tickets;