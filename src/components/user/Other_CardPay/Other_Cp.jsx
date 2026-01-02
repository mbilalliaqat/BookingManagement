import React, { useEffect, useState } from 'react';
import Table from '../../ui/Table';
import Other_Cp_Form from './Other_Cp_Form';
import Other_Cp_Rp from './Other_Cp_Rp';
import { useAppContext } from '../../contexts/AppContext';
import axios from 'axios';
import TableSpinner from '../../ui/TableSpinner';
import Modal from '../../ui/Modal';
import ButtonSpinner from '../../ui/ButtonSpinner';
import { useLocation } from 'react-router-dom';

const Other_Cp = () => {
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [entries, setEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editEntry, setEditEntry] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showRemainingPayModal, setShowRemainingPayModal] = useState(false);
    const [selectedOtherCpForPay, setSelectedOtherCpForPay] = useState(null);
    const location = useLocation();
    const [highlightEntry, setHighlightedEntry] = useState('');

    // Date filter states
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const { user } = useAppContext();

    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            if (!BASE_URL) {
                throw new Error('API base URL is not defined. Please check your environment configuration.');
            }

            const apiUrl = `${BASE_URL}/other-cp`;
            console.log('Fetching Other CP data from:', apiUrl);

            const response = await axios.get(apiUrl, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            console.log('Raw API response:', response);

            if (!response.data) {
                console.error('Empty response data:', response);
                throw new Error('Empty response received from server');
            }

            if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
                console.error('Received HTML instead of JSON. API endpoint may be incorrect.');
                throw new Error('Received HTML instead of JSON. API endpoint may be incorrect.');
            }

            if (!response.data.otherCpEntries) {
                console.error('Response missing otherCpEntries property:', response.data);
                throw new Error('Invalid response format: missing otherCpEntries data');
            }

            const data = response.data.otherCpEntries;
            console.log('Parsed Other CP entries:', data);

            const formattedData = data.map((entry) => {
                const initialCash = entry.initial_paid_cash !== undefined
                    ? parseFloat(entry.initial_paid_cash)
                    : parseFloat(entry.paid_cash || 0);
                const initialBank = entry.initial_paid_in_bank !== undefined
                    ? parseFloat(entry.initial_paid_in_bank)
                    : parseFloat(entry.paid_in_bank || 0);

                return {
                    ...entry,
                    initial_paid_cash: initialCash,
                    initial_paid_in_bank: initialBank,
                    paid_cash: parseFloat(entry.paid_cash || 0),
                    paid_in_bank: parseFloat(entry.paid_in_bank || 0),
                    date: new Date(entry.date).toLocaleDateString('en-GB'),
                    date_raw: entry.date,
                    created_at: new Date(entry.created_at).toLocaleDateString('en-GB'),
                    created_at_raw: entry.created_at
                };
            });

            const sortedData = formattedData.sort((a, b) => new Date(b.created_at_raw) - new Date(a.created_at_raw));
            setEntries(sortedData);

            if (formattedData.length === 0) {
                console.log('No Other CP entries found in the response');
            }
        } catch (error) {
            console.error('Error fetching Other CP data:', error);

            if (error.response) {
                console.error('Server response:', error.response);
                setError(`Server error: ${error.response.status}. ${error.response.data?.message || 'Please try again later.'}`);
            } else if (error.request) {
                console.error('No response received:', error.request);
                setError('No response from server. Please check your network connection.');
            } else {
                setError(`Failed to load data: ${error.message}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (location.state?.highlightEntry) {
            setHighlightedEntry(location.state.highlightEntry);
            setSearch(location.state.highlightEntry);

            const timer = setTimeout(() => {
                setHighlightedEntry(null);
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [location.state]);

    const handleRemainingPay = (otherCp) => {
        setSelectedOtherCpForPay(otherCp);
        setShowRemainingPayModal(true);
    };

    const closeRemainingPayModal = () => {
        setShowRemainingPayModal(false);
        setSelectedOtherCpForPay(null);
    };

    const handlePaymentSuccess = (paymentData) => {
        setEntries(prevEntries => prevEntries.map(entry => {
            if (entry.id === paymentData.otherCpId) {
                return {
                    ...entry,
                    initial_paid_cash: entry.initial_paid_cash || entry.paid_cash,
                    initial_paid_in_bank: entry.initial_paid_in_bank || entry.paid_in_bank,
                    paid_cash: parseFloat(entry.paid_cash || 0) + paymentData.cashAmount,
                    paid_in_bank: parseFloat(entry.paid_in_bank || 0) + paymentData.bankAmount,
                    remaining_amount: parseFloat(entry.remaining_amount || 0) - (paymentData.cashAmount + paymentData.bankAmount)
                };
            }
            return entry;
        }));

        closeRemainingPayModal();
        fetchData();
    };

    const columns = [
        { header: 'DATE', accessor: 'date' },
        { header: 'ENTRY', accessor: 'entry' },
        { header: 'EMPLOYEE', accessor: 'employee' },
        { header: 'DETAIL', accessor: 'detail' },
        { header: 'CARD PAYMENT', accessor: 'card_payment' },
        { header: 'CARD AMOUNT', accessor: 'card_amount' },
        { header: 'RECEIVABLE', accessor: 'receivable_amount' },
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
            header: 'BANK & PAID IN BANK',
            accessor: 'bank_paid',
            render: (cellValue, row) => (
                <div>
                    <div>{row?.paid_from_bank || ''}</div>
                    <div>Initial: {row.initial_paid_in_bank || row.paid_in_bank}</div>
                    <div>Total: {row.paid_in_bank}</div>
                </div>
            )
        },
        { header: 'AGENT NAME', accessor: 'agent_name' },
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
                        onClick={() => openDeleteModal(index.id)}
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
            const entryDate = entry.date_raw ? new Date(entry.date_raw) : null;

            if (entryDate) {
                if (startDate && endDate) {
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    matchesDateRange = entryDate >= start && entryDate <= end;
                } else if (startDate) {
                    const start = new Date(startDate);
                    matchesDateRange = entryDate >= start;
                } else if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    matchesDateRange = entryDate <= end;
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
        console.log('Attempting to delete Other CP entry with id:', id);
        const parsedId = typeof id === 'object' && id !== null ? id.id : id;
        if (!parsedId || isNaN(parsedId) || typeof parsedId !== 'number') {
            console.error('Invalid ID:', id, 'Parsed ID:', parsedId);
            setError('Invalid Other CP entry ID. Cannot delete.');
            setIsDeleting(false);
            return;
        }
        try {
            const response = await axios.delete(`${BASE_URL}/other-cp/${parsedId}`);
            if (response.status === 200) {
                setEntries(entries?.filter(entry => entry.id !== parsedId));
                console.log('Other CP entry deleted successfully');
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error deleting Other CP entry:', error);
            setError('Failed to delete Other CP entry. Please try again later.');
        } finally {
            setIsDeleting(false);
            closeDeleteModal();
        }
    };

    const clearDateFilter = () => {
        setStartDate('');
        setEndDate('');
    };

    const RemainingPayModal = () => {
        if (!showRemainingPayModal || !selectedOtherCpForPay) return null;

        return (
            <div className="fixed inset-0 z-500 flex items-center justify-center bg-black bg-opacity-50">
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
                                <strong>ID:</strong> {selectedOtherCpForPay.id}
                            </div>
                            <div>
                                <strong>Entry:</strong> {selectedOtherCpForPay.entry}
                            </div>
                            <div>
                                <strong>Date:</strong> {selectedOtherCpForPay.date}
                            </div>
                            <div>
                                <strong>Receivable Amount:</strong> {selectedOtherCpForPay.receivable_amount}
                            </div>
                            <div>
                                <strong>Paid Cash:</strong> {selectedOtherCpForPay.initial_paid_cash}
                            </div>
                            <div>
                                <strong>Paid in Bank:</strong> {selectedOtherCpForPay.initial_paid_in_bank}
                            </div>
                            <div>
                                <strong>Remaining Amount:</strong> {selectedOtherCpForPay.remaining_amount || '0'}
                            </div>
                            <div>
                                <strong>Initial Remaining:</strong>
                                <span className="font-semibold text-purple-700">
                                    {selectedOtherCpForPay.initial_remaining_amount || '0'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <Other_Cp_Rp
                        otherCpId={selectedOtherCpForPay.id}
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
                <Other_Cp_Form
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
                            Showing {filteredData?.length || 0} of {entries?.length || 0} entries
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
                    <RemainingPayModal />
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
                    Are you sure you want to delete this entry?
                </p>
                <div className="flex items-center justify-center space-x-4">
                    <button
                        onClick={closeDeleteModal}
                        className="px-4 py-2 text-sm font-medium text-black bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => handleDelete(deleteId)}
                        disabled={isDeleting}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center justify-center"
                    >
                        {isDeleting ? <ButtonSpinner /> : null}
                        Delete
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default Other_Cp;