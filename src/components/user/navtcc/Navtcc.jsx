import { useEffect, useState } from 'react';
import Table from '../../ui/Table';
import { useAppContext } from '../../contexts/AppContext';
import axios from 'axios';
import TableSpinner from '../../ui/TableSpinner';
import ButtonSpinner from '../../ui/ButtonSpinner';
import Navtcc_Form from './Navtcc_Form';
import { useLocation } from 'react-router-dom';


const Navtcc = () => {
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editEntry, setEditEntry] = useState(null);
    const [entries, setEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const location = useLocation();
    const [highlightEntry,setHighlightedEntry]=useState('');
    
    // Date filter states
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const { user } = useAppContext();

    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;

    const fetchTickets = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${BASE_URL}/navtcc`);
            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = response.data;
            console.log("Fetched data:", data);

            const formattedData = data.navtcc?.map((navtcc) => {
                
                let passportDetails = {};
                let vendorsList = [];
                
                
                try {
                    if (typeof navtcc.passport_detail === 'string') {
                        passportDetails = JSON.parse(navtcc.passport_detail);
                    } else if (typeof navtcc.passport_detail === 'object' && navtcc.passport_detail !== null) {
                        passportDetails = navtcc.passport_detail;
                    }
                } catch (e) {
                    console.error("Error parsing passport details:", e);
                }
                
                // Parse vendors
                try {
                    if (typeof navtcc.vendors === 'string') {
                        vendorsList = JSON.parse(navtcc.vendors);
                    } else if (Array.isArray(navtcc.vendors)) {
                        vendorsList = navtcc.vendors;
                    }
                } catch (e) {
                    console.error("Error parsing vendors:", e);
                }
                
                return {
                    ...navtcc,
                    created_at: new Date(navtcc.created_at).toLocaleDateString('en-GB'),
                    created_at_raw: navtcc.created_at, // Store raw date for filtering
                    passengerTitle: passportDetails.title || '',
                    remaining_date_raw: navtcc.remaining_date,
                    passengerFirstName: passportDetails.firstName || '',
                    passengerLastName: passportDetails.lastName || '',
                    passengerDob: passportDetails.dob ? new Date(passportDetails.dob).toLocaleDateString('en-GB') : '',
                    passengerNationality: passportDetails.nationality || '',
                    documentType: passportDetails.documentType || '',
                    documentNo: passportDetails.documentNo || '',
                    documentExpiry: passportDetails.documentExpiry ? new Date(passportDetails.documentExpiry).toLocaleDateString('en-GB') : '',
                    documentIssueCountry: passportDetails.issueCountry || '',
                    passport_detail: navtcc.passport_detail,
                    vendors: vendorsList
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
        fetchTickets();
    }, []);

    useEffect(()=>{
        if(location.state?.highlightEntry){
            setHighlightedEntry(location.state.highlightEntry);
            setSearch(location.state.highlightEntry)

            const timer = setTimeout(()=>{
                setHighlightedEntry(null)
            },5000);

            return clearTimeout(timer)
        }
    },[location.state])

    const columns = [
        { header: 'BOOKING DATE', accessor: 'booking_date' },
        { header: 'EMPLOYEE NAME', accessor: 'employee_name' },
        { header: 'ENTRY', accessor: 'entry' },
        { header: 'CUSTOMER ADD', accessor: 'customer_add' },
        { header: 'REFERENCE', accessor: 'reference' },
        { header: 'PROFESSION/KEY', accessor: 'profession_key' },
        { header: 'TITLE', accessor: 'passengerTitle' },
        { header: 'FIRST NAME', accessor: 'passengerFirstName' },
        { header: 'LAST NAME', accessor: 'passengerLastName' },
        { header: 'DATE OF BIRTH', accessor: 'passengerDob' },
        { header: 'NATIONALITY', accessor: 'passengerNationality' },
        { header: 'DOCUMENT TYPE', accessor: 'documentType' },
        { header: 'DOCUMENT NO', accessor: 'documentNo' },
        { header: 'EXPIRY DATE', accessor: 'documentExpiry' },
        { header: 'ISSUE COUNTRY', accessor: 'documentIssueCountry' },
        { header: 'RECEIVABLE AMOUNT', accessor: 'receivable_amount' },
        { header: 'PAID CASH', accessor: 'paid_cash' },
        { header: 'PAID FROM BANK', accessor: 'paid_from_bank' },
        { header: 'PAYED TO BANK', accessor: 'payed_to_bank' },
        { header: 'PAID IN BANK', accessor: 'paid_in_bank' },
        {
            header: 'VENDORS & PAYABLE',
            accessor: 'vendors',
            render: (cellValue, row) => (
                <div className="space-y-1">
                    {row?.vendors && row.vendors.length > 0 ? (
                        row.vendors.map((vendor, idx) => (
                            <div key={idx} className="text-xs">
                                <div className="font-medium">{vendor.vendor_name}</div>
                                <div className="text-gray-600">{vendor.amount}</div>
                            </div>
                        ))
                    ) : (
                        <span className="text-gray-400">-</span>
                    )}
                </div>
            )
        },
        { header: 'AGENT NAME', accessor: 'agent_name' },
        { header: 'PROFIT', accessor: 'profit' },
        { header: 'REMAINING AMOUNT', accessor: 'remaining_amount' },
        { 
  header: 'REMAINING DATE', 
  accessor: 'remaining_date_raw',
  render: (date) => date ? new Date(date).toLocaleDateString('en-GB') : '-'
},
        ...(user.role === 'admin' ? [{
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
        }] : [])
    ];

    // Enhanced filtering with date range
    const filteredData = entries?.filter((entry) => {
        // Search filter
        const matchesSearch = Object.values(entry).some((value) =>
            String(value).toLowerCase().includes(search.toLowerCase())
        );

        // Date range filter
        let matchesDateRange = true;
        if (startDate || endDate) {
            const createdDate = entry.created_at_raw ? new Date(entry.created_at_raw) : null;
            
            if (createdDate) {
                if (startDate && endDate) {
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999); // Include the entire end date
                    matchesDateRange = createdDate >= start && createdDate <= end;
                } else if (startDate) {
                    const start = new Date(startDate);
                    matchesDateRange = createdDate >= start;
                } else if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    matchesDateRange = createdDate <= end;
                }
            } else {
                matchesDateRange = false;
            }
        }

        return matchesSearch && matchesDateRange;
    });

    const handleCancel = () => {
        setShowForm(false);
        setEditEntry(null);
    };

    const handleFormSubmit = () => {
        fetchTickets();
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
        console.log('Attempting to delete navtcc with id:', id);
        setIsDeleting(true);
        const parsedId = typeof id === 'object' && id !== null ? id.id : id;
        if (!parsedId || isNaN(parsedId) || typeof parsedId !== 'number') {
            console.error('Invalid ID:', id, 'Parsed ID:', parsedId);
            setError('Invalid navtcc ID. Cannot delete.');
            setIsDeleting(false);
            return;
        }
        try {
            const response = await axios.delete(`${BASE_URL}/navtcc/${parsedId}`);
            if (response.status === 200) {
                setEntries(entries.filter(entry => entry.id !== parsedId));
                console.log('navtcc deleted successfully');
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error deleting navtcc:', error);
            setError('Failed to delete navtcc. Please try again later.');
        }
        setIsDeleting(false);
        closeDeleteModal();
    };

    const clearDateFilter = () => {
        setStartDate('');
        setEndDate('');
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
                            Are you sure you want to delete this navtcc Entry?
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
                <Navtcc_Form
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

                            {/* Date Range Filter */}
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="p-2 border border-gray-300 rounded-md bg-white/90 text-sm"
                                        placeholder="Start Date"
                                    />
                                </div>
                                <span className="text-gray-500">to</span>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="p-2 border border-gray-300 rounded-md bg-white/90 text-sm"
                                        placeholder="End Date"
                                    />
                                </div>
                                {(startDate || endDate) && (
                                    <button
                                        onClick={clearDateFilter}
                                        className="text-red-500 hover:text-red-700 px-2"
                                        title="Clear date filter"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                )}
                            </div>
                        </div>

                        <button
                            className="font-semibold text-sm bg-white rounded-md shadow px-4 py-2 hover:bg-purple-700 hover:text-white transition-colors duration-200"
                            onClick={() => setShowForm(true)}
                        >
                            <i className="fas fa-plus mr-1"></i> Add New
                        </button>
                    </div>

                    {/* Display filtered count */}
                    {(startDate || endDate) && (
                        <div className="mb-2 text-sm text-gray-600">
                            Showing {filteredData?.length || 0} of {entries?.length || 0} Navtcc entries
                            {startDate && ` from ${new Date(startDate).toLocaleDateString('en-GB')}`}
                            {endDate && ` to ${new Date(endDate).toLocaleDateString('en-GB')}`}
                        </div>
                    )}

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

export default Navtcc;