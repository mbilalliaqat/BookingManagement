import React, { useEffect, useState } from 'react';
import Table from '../../ui/Table';
import Other_Cp_Form from './Other_Cp_Form';
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
                return {
                    ...entry,
                    date: new Date(entry.date).toLocaleDateString('en-GB'),
                    date_raw: entry.date, // Store raw date for filtering
                    created_at: new Date(entry.created_at).toLocaleDateString('en-GB'),
                    created_at_raw: entry.created_at
                };
            });

            setEntries(formattedData.reverse());

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

    const columns = [
        { header: 'DATE', accessor: 'date' },
    { header: 'ENTRY', accessor: 'entry' },
    { header: 'EMPLOYEE', accessor: 'employee' },
    { header: 'DETAIL', accessor: 'detail' },
    { header: 'CARD PAYMENT', accessor: 'card_payment' },
    { header: 'CARD AMOUNT', accessor: 'card_amount' },
    { header: 'RECEIVABLE', accessor: 'receivable_amount' },
    { header: 'PAID CASH', accessor: 'paid_cash' },
    { header: 'BANK TITLE', accessor: 'paid_from_bank' },
    { header: 'PAID IN BANK', accessor: 'paid_in_bank' },
    { header: 'AGENT NAME', accessor: 'agent_name' },
    { header: 'PROFIT', accessor: 'profit' },
    { header: 'REMAINING', accessor: 'remaining_amount' },
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
                    end.setHours(23, 59, 59, 999); // Include the entire end date
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