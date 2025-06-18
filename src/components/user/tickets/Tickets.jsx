import { useEffect, useState } from 'react';
import Table from '../../ui/Table';
import { useAppContext } from '../../contexts/AppContext';
import Tickets_Form from './Tickets_Form';
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
            
            const formattedData = sortedTickets.map((ticket, index) => {
                let passportDetails = {};
                try {
                    if (typeof ticket.passport_detail === 'string') {
                        passportDetails = JSON.parse(ticket.passport_detail);
                    } else if (typeof ticket.passport_detail === 'object' && ticket.passport_detail !== null) {
                        passportDetails = ticket.passport_detail;
                    }
                } catch (e) {
                    console.error("Error parsing passport details:", e);
                }
                return {
                    ...ticket,
                    serialNo: index + 1,
                    depart_date: new Date(ticket.depart_date).toLocaleDateString(),
                    return_date: new Date(ticket.return_date).toLocaleDateString(),
                    created_at: new Date(ticket.created_at).toLocaleDateString('en-US'),
                    // Add formatted passport details for display
                    passengerTitle: passportDetails.title || '',
                    passengerFirstName: passportDetails.firstName || '',
                    passengerLastName: passportDetails.lastName || '',
                    passengerDob: passportDetails.dob ? new Date(passportDetails.dob).toLocaleDateString() : '',
                    passengerNationality: passportDetails.nationality || '',
                    documentType: passportDetails.documentType || '',
                    documentNo: passportDetails.documentNo || '',
                    documentExpiry: passportDetails.documentExpiry ? new Date(passportDetails.documentExpiry).toLocaleDateString() : '',
                    documentIssueCountry: passportDetails.issueCountry || '',
                    // Keep the original passport detail for editing
                    passport_detail: ticket.passport_detail
                };
            });
            setEntries(formattedData);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to load data. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    // Alternative: Update single entry without full refetch
    const updateSingleEntry = async (updatedTicket) => {
        try {
            // Find the index of the updated entry
            const entryIndex = entries.findIndex(entry => entry.id === updatedTicket.id);
            if (entryIndex === -1) return;

            // Format the updated ticket data
            let passportDetails = {};
            try {
                if (typeof updatedTicket.passport_detail === 'string') {
                    passportDetails = JSON.parse(updatedTicket.passport_detail);
                } else if (typeof updatedTicket.passport_detail === 'object' && updatedTicket.passport_detail !== null) {
                    passportDetails = updatedTicket.passport_detail;
                }
            } catch (e) {
                console.error("Error parsing passport details:", e);
            }

            const formattedTicket = {
                ...updatedTicket,
                serialNo: entries[entryIndex].serialNo, // Keep original serial number
                depart_date: new Date(updatedTicket.depart_date).toLocaleDateString(),
                return_date: new Date(updatedTicket.return_date).toLocaleDateString(),
                created_at: new Date(updatedTicket.created_at).toLocaleDateString('en-US'),
                passengerTitle: passportDetails.title || '',
                passengerFirstName: passportDetails.firstName || '',
                passengerLastName: passportDetails.lastName || '',
                passengerDob: passportDetails.dob ? new Date(passportDetails.dob).toLocaleDateString() : '',
                passengerNationality: passportDetails.nationality || '',
                documentType: passportDetails.documentType || '',
                documentNo: passportDetails.documentNo || '',
                documentExpiry: passportDetails.documentExpiry ? new Date(passportDetails.documentExpiry).toLocaleDateString() : '',
                documentIssueCountry: passportDetails.issueCountry || '',
                passport_detail: updatedTicket.passport_detail
            };

            // Update the specific entry in place
            const updatedEntries = [...entries];
            updatedEntries[entryIndex] = formattedTicket;
            setEntries(updatedEntries);
        } catch (error) {
            console.error('Error updating single entry:', error);
            // Fallback to full refetch if single update fails
            fetchTickets();
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const baseColumns=[
         { header: 'BOOKING DATE', accessor: 'created_at' },
        { header: 'EMPLOYEE NAME', accessor: 'employee_name' },
        { header: 'ENTRY', accessor: 'entry' },
        { header: 'CUSTOMER ADD', accessor: 'customer_add' },
        { header: 'REFERENCE', accessor: 'reference' },
        { header: 'DEPART DATE', accessor: 'depart_date' },
        { header: 'RETURN DATE', accessor: 'return_date' },
        { header: 'SECTOR', accessor: 'sector' },
        { header: 'AIRLINE', accessor: 'airline' },
         {
            header: 'PASSENGERS',
            accessor: 'passengerCount',
            render: (row,index) => {
                // Ensure default values are used if properties are undefined
                const adults = index.adults === undefined ? 0 : index.adults;
                const children = index.children === undefined ? 0 : index.children;
                const infants = index.infants === undefined ? 0 : index.infants;
                return `Adult: ${adults}, Children: ${children}, Infants: ${infants}`;
            }
        },
        { header: 'TITLE', accessor: 'passengerTitle' },
        { header: 'FIRST NAME', accessor: 'passengerFirstName' },
        { header: 'LAST NAME', accessor: 'passengerLastName' },
    ];
    const passportColumns=[
         { header: 'DATE OF BIRTH', accessor: 'passengerDob' },
        { header: 'NATIONALITY', accessor: 'passengerNationality' },
        { header: 'DOCUMENT TYPE', accessor: 'documentType' },
        { header: 'DOCUMENT NO', accessor: 'documentNo' },
        { header: 'EXPIRY DATE', accessor: 'documentExpiry' },
        { header: 'ISSUE COUNTRY', accessor: 'documentIssueCountry' },
    ];
    const financialColumns=[
        { header: 'RECEIVABLE AMOUNT', accessor: 'receivable_amount' },
        { header: 'PAID CASH', accessor: 'paid_cash' },
        { header: 'BANK TITLE', accessor: 'bank_title' },
        { header: 'PAID IN BANK', accessor: 'paid_in_bank' },
        { header: 'PAYABLE TO VENDOR', accessor: 'payable_to_vendor' },
        { header: 'VENDOR NAME', accessor: 'vendor_name' },
        { header: 'PROFIT', accessor: 'profit' },
        { header: 'REMAINING AMOUNT', accessor: 'remaining_amount' },
    ];
    const actionColumns = user.role === 'admin' ? [{
        header: 'ACTIONS', accessor: 'actions', render: (row, index) => (
            <>
                <button
                    className="text-blue-500 hover:text-blue-700 mr-3"
                    onClick={() => handleUpdate(index)}
                >
                    <i className="fas fa-edit"></i>
                </button>
                <button
                    className="text-red-500 hover:text-red-700"
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

    // Modified to accept updated ticket data and preserve position
    const handleFormSubmit = (updatedTicket = null) => {
        if (updatedTicket && editEntry) {
            // If we have the updated ticket data, update in place
            updateSingleEntry(updatedTicket);
        } else {
            // For new entries, refetch all data
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

    // Confirmation modal component
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
                            
                            {/* Toggle button for passport fields */}
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
                </div>
            )}
        </div>
    );
};

export default Tickets;