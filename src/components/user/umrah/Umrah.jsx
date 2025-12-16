import React, { useState, useEffect } from 'react';
import Table from '../../ui/Table';
import Umrah_Form from './Umrah_Form';
import { useAppContext } from '../../contexts/AppContext';
import TableSpinner from '../../ui/TableSpinner';
import ButtonSpinner from '../../ui/ButtonSpinner';
import axios from 'axios';
import Modal from '../../ui/Modal';
import UmrahRemainingPay from './UmrahRemainingPay';
import { useLocation } from 'react-router-dom';


const Umrah = () => {
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
    const [selectedUmrahForPay, setSelectedUmrahForPay] = useState(null);
    const location = useLocation();
    const [highlightEntry,setHighlightedEntry]=useState('');
    
    // Date filter states
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const { user } = useAppContext();

    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;

    const fetchUmrah = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${BASE_URL}/umrah`);
            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = response.data;
            console.log("Fetched umrah data:", data);

            // Sort by ID to maintain consistent order
            const sortedBookings = data.umrahBookings.sort((a, b) => a.id - b.id);

            const formattedData = sortedBookings.map((booking) => {
                let parsedPassengerDetails = [];
                try {
                    if (typeof booking.passportDetail === 'string') {
                        const parsed = JSON.parse(booking.passportDetail);
                        if (Array.isArray(parsed)) {
                            parsedPassengerDetails = parsed;
                        } else if (typeof parsed === 'object' && parsed !== null) {
                            parsedPassengerDetails = [parsed];
                        }
                    } else if (Array.isArray(booking.passportDetail)) {
                        parsedPassengerDetails = booking.passportDetail;
                    } else if (typeof booking.passportDetail === 'object' && booking.passportDetail !== null) {
                        parsedPassengerDetails = [booking.passportDetail];
                    }
                } catch (e) {
                    console.error("Error parsing passport details:", e);
                    parsedPassengerDetails = [];
                }

                // Calculate total payments
                const initialCash = booking.initial_paid_cash !== undefined
                    ? parseFloat(booking.initial_paid_cash)
                    : parseFloat(booking.paidCash || 0);
                const initialBank = booking.initial_paid_in_bank !== undefined
                    ? parseFloat(booking.initial_paid_in_bank)
                    : parseFloat(booking.paidInBank || 0);

                return {
                    ...booking,
                    initial_paid_cash: initialCash,
                    initial_paid_in_bank: initialBank,
                    paidCash: parseFloat(booking.paidCash || 0),
                    paidInBank: parseFloat(booking.paidInBank || 0),
                    booking_date: new Date(booking.booking_date).toLocaleDateString('en-GB', { timeZone: 'UTC' }),
                    depart_date: new Date(booking.depart_date).toLocaleDateString('en-GB', { timeZone: 'UTC' }),
                    return_date: new Date(booking.return_date).toLocaleDateString('en-GB', { timeZone: 'UTC' }),
                    createdAt: new Date(booking.createdAt).toLocaleDateString('en-GB', { timeZone: 'UTC' }),
                    booking_date_raw: booking.booking_date, // Store raw date for filtering
                    allPassengerDetails: parsedPassengerDetails,
                    passportDetail: booking.passportDetail
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

    const updateSingleEntry = async (updatedBooking) => {
        try {
            const entryIndex = entries.findIndex(entry => entry.id === updatedBooking.id);
            if (entryIndex === -1) return;

            let parsedPassengerDetails = [];
            try {
                if (typeof updatedBooking.passportDetail === 'string') {
                    const parsed = JSON.parse(updatedBooking.passportDetail);
                    if (Array.isArray(parsed)) {
                        parsedPassengerDetails = parsed;
                    } else if (typeof parsed === 'object' && parsed !== null) {
                        parsedPassengerDetails = [parsed];
                    }
                } else if (Array.isArray(updatedBooking.passportDetail)) {
                    parsedPassengerDetails = updatedBooking.passportDetail;
                } else if (typeof updatedBooking.passportDetail === 'object' && updatedBooking.passportDetail !== null) {
                    parsedPassengerDetails = [updatedBooking.passportDetail];
                }
            } catch (e) {
                console.error("Error parsing passport details:", e);
                parsedPassengerDetails = [];
            }

            const formattedBooking = {
                ...updatedBooking,
                serialNo: entries[entryIndex].serialNo,
                booking_date: new Date(updatedBooking.booking_date).toLocaleDateString('en-GB', { timeZone: 'UTC' }),
                depart_date: new Date(updatedBooking.depart_date).toLocaleDateString('en-GB', { timeZone: 'UTC' }),
                return_date: new Date(updatedBooking.return_date).toLocaleDateString('en-GB', { timeZone: 'UTC' }),
                createdAt: new Date(updatedBooking.createdAt).toLocaleDateString('en-GB', { timeZone: 'UTC' }),
                booking_date_raw: updatedBooking.booking_date,
                allPassengerDetails: parsedPassengerDetails,
            };

            const updatedEntries = [...entries];
            updatedEntries[entryIndex] = formattedBooking;
            setEntries(updatedEntries);
        } catch (error) {
            console.error('Error updating single entry:', error);
            fetchUmrah();
        }
    };

    useEffect(() => {
        fetchUmrah();
    }, []);

useEffect(() => {
    if (location.state?.highlightEntry) {
        setHighlightedEntry(location.state.highlightEntry);
        setSearch(location.state.highlightEntry); // This will filter to show that entry
        
        // Clear highlight after 5 seconds
        const timer = setTimeout(() => {
            setHighlightedEntry(null);
        }, 5000);
        
        return () => clearTimeout(timer);
    }
}, [location.state]);

    const handleRemainingPay = (umrah) => {
        setSelectedUmrahForPay(umrah);
        setShowRemainingPayModal(true);
    };

    const closeRemainingPayModal = () => {
        setShowRemainingPayModal(false);
        setSelectedUmrahForPay(null);
    };

    const handlePaymentSuccess = (paymentData) => {
        setEntries(prevEntries => prevEntries.map(umrah => {
            if (umrah.id === paymentData.umrahId) {
                return {
                    ...umrah,
                    initial_paid_cash: umrah.initial_paid_cash || umrah.paidCash,
                    initial_paid_in_bank: umrah.initial_paid_in_bank || umrah.paidInBank,
                    paidCash: parseFloat(umrah.paidCash || 0) + paymentData.cashAmount,
                    paidInBank: parseFloat(umrah.paidInBank || 0) + paymentData.bankAmount,
                    remainingAmount: parseFloat(umrah.remainingAmount || 0) - (paymentData.cashAmount + paymentData.bankAmount)
                };
            }
            return umrah;
        }));

        closeRemainingPayModal();
        fetchUmrah();
    };

    const baseColumns = [
        { header: 'BOOKING DATE', accessor: 'booking_date' },
        {
            header: 'EMPLOYEE & ENTRY',
            accessor: 'employee_entry',
            render: (cellValue, row) => (
                <div className="uppercase">
                    <div>{row?.userName || ''}</div>
                    <div>{row?.entry || ''}</div>
                </div>
            )
        },
        { header: 'CUSTOMER ADD', accessor: 'customerAdd' },
        { header: 'REFERENCE', accessor: 'reference' },
        { header: 'PACKAGE DETAIL', accessor: 'packageDetail' },
        {
            header: 'DEPART & RETURN DATE',
            accessor: 'depart_return_date',
            render: (cellValue, row) => (
                <div >
                    <div>{row?.depart_date || ''}</div>
                    <div>{row?.return_date || ''}</div>
                </div>
            )
        },
       { 
    header: 'SECTOR', 
    accessor: 'sector',
    render: (cellValue, row) => (
        <div className="uppercase">
            <div>{ row?.sector || ''}</div>
        </div>
    )
},
        { 
    header: 'AIRLINE', 
    accessor: 'airline',
    render: (cellValue, row) => (
        <div className='uppercase'>
            <div>{row?.airline_select || row?.airline || ''}</div>
        </div>
    )
},
        {
            header: 'PASSENGERS',
            accessor: 'passengerCount',
            render: (cellValue, row) => {
                const adults = row.adults === undefined ? 0 : row.adults;
                const children = row.children === undefined ? 0 : row.children;
                const infants = row.infants === undefined ? 0 : row.infants;
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

    const passportColumns = [
        {
            header: 'DATE OF BIRTH',
            accessor: 'passengerDob',
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
            accessor: 'passengerNationality',
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
            accessor: 'documentType',
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
            accessor: 'documentNo',
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
            accessor: 'documentExpiry',
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
            accessor: 'documentIssueCountry',
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

    const financialColumns = [
        { header: 'RECEIVABLE AMOUNT', accessor: 'receivableAmount' },
        {
            header: 'PAID CASH',
            accessor: 'paidCash',
            render: (cellValue, row) => (
                <div>
                    <div>Initial: {row.initial_paid_cash || row.paidCash || '0'}</div>
                    <div>Total: {row.paidCash || '0'}</div>
                </div>
            )
        },
        {
            header: 'BANK & PAID IN BANK',
            accessor: 'bank_paid',
            render: (cellValue, row) => (
                <div>
                    <div>{row?.bank_title || ''}</div>
                    <div>Initial: {row.initial_paid_in_bank || row.paidInBank || '0'}</div>
                    <div>Total: {row.paidInBank || '0'}</div>
                </div>
            )
        },
        {
            header: 'REMAINING AMOUNT',
            accessor: 'remainingAmount',
            render: (cellValue, row) => (
                <div className="flex flex-col items-center">
                    <span className="mb-1">{row?.remainingAmount || '0'}</span>
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
        { header: 'AGENT NAME', accessor: 'agent_name' },
        {
            header: 'VENDOR & PAYABLE',
            accessor: 'vendor_payable',
            render: (cellValue, row) => (
                <div>
                    <div>{row?.vendorName || ''}</div>
                    <div>{row?.payableToVendor || ''}</div>
                </div>
            )
        },
        { header: 'PROFIT', accessor: 'profit' },
    ];

    const actionColumns = user.role === 'admin' ? [{
        header: 'ACTIONS',
        accessor: 'actions',
        render: (row, index) => (
            <>
                <button
                    className="text-blue-500 hover:text-blue-700 mr-1 text-[13px]"
                    onClick={() => handleUpdate(index)}
                >
                    <i className="fas fa-edit"></i>
                </button>
                <button
                    className="text-red-500 hover:text-red-700 text-[13px]"
                    onClick={() => openDeleteModal(index.id)}
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

    // Enhanced filtering with date range
    const filteredData = entries.filter((entry) => {
        // Search filter
        const matchesSearch = Object.values(entry).some((value) =>
            String(value).toLowerCase().includes(search.toLowerCase())
        );

        // Date range filter
        let matchesDateRange = true;
        if (startDate || endDate) {
            const bookingDate = entry.booking_date_raw ? new Date(entry.booking_date_raw) : null;
            
            if (bookingDate) {
                if (startDate && endDate) {
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999); // Include the entire end date
                    matchesDateRange = bookingDate >= start && bookingDate <= end;
                } else if (startDate) {
                    const start = new Date(startDate);
                    matchesDateRange = bookingDate >= start;
                } else if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    matchesDateRange = bookingDate <= end;
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

    const handleFormSubmit = (updatedBooking = null) => {
        if (updatedBooking && editEntry) {
            updateSingleEntry(updatedBooking);
        } else {
            fetchUmrah();
        }
        setShowForm(false);
        setEditEntry(null);
    };

    const handleUpdate = (entry) => {
        const actualEntry = typeof entry === 'number' 
            ? filteredData[entry] 
            : entry;
        setEditEntry(actualEntry);
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
        console.log('Attempting to delete umrah booking with id:', id);
        const parsedId = typeof id === 'object' && id !== null ? id.id : id;
        if (!parsedId || isNaN(parsedId) || typeof parsedId !== 'number') {
            console.error('Invalid ID:', id, 'Parsed ID:', parsedId);
            setError('Invalid umrah booking ID. Cannot delete.');
            setIsDeleting(false);
            return;
        }
        try {
            const response = await axios.delete(`${BASE_URL}/umrah/${parsedId}`);
            if (response.status === 200) {
                setEntries(entries.filter(entry => entry.id !== parsedId));
                console.log('Umrah booking deleted successfully');
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error deleting umrah booking:', error);
            setError('Failed to delete umrah booking. Please try again later.');
        } finally {
            setIsDeleting(false);
            closeDeleteModal();
        }
    };

    const clearDateFilter = () => {
        setStartDate('');
        setEndDate('');
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
        <div className="h-full flex flex-col">
            {showForm ? (
                <Umrah_Form
                    onCancel={handleCancel}
                    onSubmitSuccess={handleFormSubmit}
                    editEntry={editEntry}
                />
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

                    {/* Display filtered count */}
                    {(startDate || endDate) && (
                        <div className="mb-2 text-sm text-gray-600">
                            Showing {filteredData.length} of {entries.length} umrah bookings
                            {startDate && ` from ${new Date(startDate).toLocaleDateString('en-GB')}`}
                            {endDate && ` to ${new Date(endDate).toLocaleDateString('en-GB')}`}
                        </div>
                    )}

                    <div className="flex-1 overflow-hidden bg-white/80 backdrop-blur-md shadow-2xl rounded-2xl">
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
                    Are you sure you want to delete this umrah booking?
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
                        {isDeleting && <ButtonSpinner />}
                        Delete
                    </button>
                </div>
            </Modal>
            {showRemainingPayModal && (
                <Modal
                    isOpen={showRemainingPayModal}
                    onClose={closeRemainingPayModal}
                    title={`Add Payment for ${selectedUmrahForPay?.customerAdd}`}
                    width="4xl"
                >
                    <div className="bg-gray-800 p-4 rounded mb-4 text-white">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <strong>Umrah ID:</strong> {selectedUmrahForPay.id}
                            </div>
                            <div>
                                <strong>Customer:</strong> {selectedUmrahForPay.customerAdd}
                            </div>
                            <div>
                                <strong>Reference:</strong> {selectedUmrahForPay.reference}
                            </div>
                            <div>
                                <strong>Remaining Amount:</strong> {selectedUmrahForPay.remainingAmount || '0'}
                            </div>
                        </div>
                    </div>
                    <UmrahRemainingPay
                        umrahId={selectedUmrahForPay?.id}
                        onPaymentSuccess={handlePaymentSuccess}
                        onCancel={closeRemainingPayModal}
                    />
                </Modal>
            )}
        </div>
    );
};

export default Umrah;