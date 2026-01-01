import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Banks_Detail_Form from './Banks_Detail_Form';
import TableSpinner from '../../ui/TableSpinner';
import ButtonSpinner from '../../ui/ButtonSpinner';
import { useAppContext } from '../../contexts/AppContext';
import Table from '../../ui/Table';
import axios from 'axios';
import Modal from '../../ui/Modal';
import { useLocation } from 'react-router-dom';

const Banks_Detail = () => {
    const { user } = useAppContext();
    const [showForm, setShowForm] = useState(false);
    const [allData, setAllData] = useState([]); // Store all data
    const [filteredData, setFilteredData] = useState([]); // Store filtered data
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [loadingActionId, setLoadingActionId] = useState(null);

    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;

    const formatDate = useCallback((dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            return date.toLocaleDateString('en-GB');
        } catch (error) {
            console.error('Error parsing date:', dateString, error);
            return '';
        }
    }, []);

    const location = useLocation();

    const formatDateForInput = useCallback((dateString) => {
        if (!dateString) return '';
        try {
            const parts = dateString.split('/');
            if (parts.length === 3) {
                return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }

            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            return date.toISOString().split('T')[0];
        } catch (error) {
            console.error('Error formatting date for input:', dateString, error);
            return '';
        }
    }, []);

    // Fetch all entries from all banks
    // Replace your fetchAllEntries function with this:

    const fetchAllEntries = useCallback(async () => {
        setIsLoading(true);

        try {
            const response = await fetch(`${BASE_URL}/bank-details`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const responseData = await response.json();

            // Extract the bankDetails array from the response
            let data = responseData.bankDetails || [];

            // Ensure data is an array
            if (!Array.isArray(data)) {
                console.error('Fetched data is not an array:', data);
                data = [];
            }

            // Sort by ID in descending order (latest first)
            const sortedData = data.sort((a, b) => b.id - a.id).map(entry => ({
                ...entry,
                date: formatDate(entry.date),
                originalDate: entry.date, // Keep original date for sorting
            }));

            setAllData(sortedData);
        } catch (error) {
            console.error('Error fetching entries:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    }, [formatDate, BASE_URL]);

    // Fetch entries on component mount
    useEffect(() => {
        fetchAllEntries();
    }, [fetchAllEntries]);

    // Filter data based on selected bank
    useEffect(() => {
        setFilteredData(allData);
    }, [allData]);

   

    const handleCancel = useCallback(() => {
        setShowForm(false);
        setEditingEntry(null);
    }, []);

    const handleFormSubmit = useCallback(() => {
        setShowForm(false);
        setEditingEntry(null);
        fetchAllEntries();
    }, [fetchAllEntries]);

    const openDeleteModal = useCallback((id) => {
        setDeleteId(id);
        setShowDeleteModal(true);
    }, []);

    const closeDeleteModal = useCallback(() => {
        setShowDeleteModal(false);
        setDeleteId(null);
    }, []);

    const handleUpdate = useCallback((entry) => {
        if (!entry) {
            console.error('Entry is undefined or null');
            return;
        }

        setLoadingActionId(entry.id);

        console.log('Updating entry:', entry);
        const entryForEdit = {
            ...entry,
            bank_name: entry.bank_name,
            date: entry.date ? formatDateForInput(entry.date) : '',
        };
        console.log('Prepared entry for edit:', entryForEdit);

        setTimeout(() => {
            setEditingEntry(entryForEdit);
            setShowForm(true);
            setLoadingActionId(null);
        }, 500);

    }, [formatDateForInput]);

    const handleDelete = useCallback(async (id) => {
        const parsedId = typeof id === 'object' && id !== null ? id.id : id;
        if (!parsedId || isNaN(parsedId) || typeof parsedId !== 'number') {
            setError('Invalid entry ID. Cannot delete.');
            return;
        }

        setIsDeleting(true);
        setLoadingActionId(parsedId);

        try {
            const entryToDelete = allData.find(entry => entry.id === parsedId);
            if (!entryToDelete) {
                throw new Error('Entry not found');
            }

            const response = await axios.delete(`${BASE_URL}/bank-details/${parsedId}`);
            if (response.status === 200) {
                console.log('Entry deleted successfully');
                fetchAllEntries();
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error deleting entry:', error);
            setError('Failed to delete entry. Please try again later.');
        } finally {
            setIsDeleting(false);
            setLoadingActionId(null);
            closeDeleteModal();
        }
    }, [closeDeleteModal, fetchAllEntries, BASE_URL, user.name, allData]);

    const columns = useMemo(() => [
      
        { header: 'DATE', accessor: 'date' },
        { header: 'ENTRY', accessor: 'entry' },
        { header: 'EMPLOYEE', accessor: 'employee' },
        { header: 'DETAIL', accessor: 'detail' },
        { header: 'CREDIT', accessor: 'credit' },
        { header: 'DEBIT', accessor: 'debit' },
        { header: 'BALANCE', accessor: 'balance' },
        
        ...(user.role === 'admin'
            ? [
                {
                    header: 'ACTIONS',
                    accessor: 'actions',
                    render: (row, index) => (
                        <>
                            <button
                                className="text-blue-500 hover:text-blue-700 mr-1 text-[13px]"
                                onClick={() => handleUpdate(index)}
                                disabled={loadingActionId === index.id}
                            >
                                {loadingActionId === index.id ? <ButtonSpinner /> : <i className="fas fa-edit"></i>}
                            </button>
                            <button
                                className="text-red-500 hover:text-red-700 text-[13px]"
                                onClick={() => openDeleteModal(index.id)}
                                disabled={loadingActionId === index.id}
                            >
                                <i className="fas fa-trash"></i>
                            </button>
                        </>
                    ),
                },
            ]
            : []),
    ], [user.role, loadingActionId, handleUpdate, openDeleteModal]);

    return (
        <div className="h-full flex flex-col">
            {showForm ? (
                <Banks_Detail_Form
                    onCancel={handleCancel}
                    onSubmitSuccess={handleFormSubmit}
                    editEntry={editingEntry}
                />
            ) : (
                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4 relative">
                        <div className="flex items-center gap-4">
                            {/* Total Summary */}
                            
                        </div>

                        <button
                            className="font-semibold text-sm bg-white rounded-md shadow px-4 py-2 hover:bg-purple-700 hover:text-white transition-colors duration-200"
                            onClick={() => setShowForm(true)}
                        >
                            <i className="fas fa-plus mr-1"></i> Add New
                        </button>
                    </div>
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
                            <Table columns={columns} data={filteredData} />
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
        </div>
    );
};

export default Banks_Detail;