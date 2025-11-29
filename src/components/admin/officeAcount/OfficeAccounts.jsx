import React, { useEffect, useState, useCallback, useMemo } from 'react';
import OfficeAccounts_Form from './OfficeAccounts_Form';
import TableSpinner from '../../ui/TableSpinner';
import ButtonSpinner from '../../ui/ButtonSpinner';
import { useAppContext } from '../../contexts/AppContext';
import Table from '../../ui/Table';
import axios from 'axios';
import Modal from '../../ui/Modal';
import { useLocation } from 'react-router-dom';

const OfficeAccounts = () => {
    const { user } = useAppContext();
    const [showForm, setShowForm] = useState(false);
    const [allData, setAllData] = useState([]); // Store all data
    const [filteredData, setFilteredData] = useState([]); // Store filtered data
    const [selectedBank, setSelectedBank] = useState('all');
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

    // Set initial selected bank from navigation state
    useEffect(() => {
        if (location.state?.selectedBank) {
            setSelectedBank(location.state.selectedBank);
        }
    }, [location.state]);

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
    const fetchAllEntries = useCallback(async () => {
        setIsLoading(true);
        
        try {
            // Fetch from all banks
            const banks = ["UBL M.A.R", "UBL F.Z", "HBL M.A.R", "HBL F.Z", "JAZ C", "MCB FIT"];
            const promises = banks.map(bank => 
                fetch(`${BASE_URL}/accounts/${bank}`)
                    .then(res => res.ok ? res.json() : [])
                    .catch(() => [])
            );
            
            const results = await Promise.all(promises);
            
            // Combine all data and add bank_name to each entry
            const combinedData = results.flatMap((data, index) => 
                (data || []).map(entry => ({
                    ...entry,
                    bank_name: banks[index],
                    date: formatDate(entry.date),
                }))
            );
            
            setAllData(combinedData);
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
        if (selectedBank === 'all') {
            // Show only unique banks (one entry per bank)
            const uniqueBanks = [];
            const seenBanks = new Set();
            
            allData.forEach(item => {
                if (!seenBanks.has(item.bank_name)) {
                    seenBanks.add(item.bank_name);
                    uniqueBanks.push(item);
                }
            });
            
            setFilteredData(uniqueBanks);
        } else {
            // Show all entries for the selected bank
            setFilteredData(allData.filter(item => item.bank_name === selectedBank));
        }
    }, [allData, selectedBank]);

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
            bank_name: entry.bank_name || selectedBank,
            date: entry.date ? formatDateForInput(entry.date) : '',
        };
        console.log('Prepared entry for edit:', entryForEdit);
        
        setTimeout(() => {
            setEditingEntry(entryForEdit);
            setShowForm(true);
            setLoadingActionId(null);
        }, 500);
        
    }, [selectedBank, formatDateForInput]);

    const handleDelete = useCallback(async (id) => {
        const parsedId = typeof id === 'object' && id !== null ? id.id : id;
        if (!parsedId || isNaN(parsedId) || typeof parsedId !== 'number') {
            setError('Invalid entry ID. Cannot delete.');
            return;
        }
        
        setIsDeleting(true);
        setLoadingActionId(parsedId);
        
        try {
            const response = await axios.delete(`${BASE_URL}/accounts/${parsedId}`);
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
    }, [closeDeleteModal, fetchAllEntries, BASE_URL]);

    // Handle clicking on a bank name in the table
    const handleBankClick = useCallback((bankName) => {
        setSelectedBank(bankName);
    }, []);

    const columns = useMemo(() => [
        { 
            header: 'BANK NAME', 
            accessor: 'bank_name',
            render: (row, fullRow) => {
                const bankName = fullRow?.bank_name || row?.bank_name || row;
                return (
                    <span 
                        className={selectedBank === 'all' ? 'cursor-pointer text-blue-600 hover:text-blue-800 hover:underline' : ''}
                        onClick={() => selectedBank === 'all' && handleBankClick(bankName)}
                    >
                        {bankName}
                    </span>
                );
            }
        },
        { header: 'DATE', accessor: 'date' },
        { header: 'ENTRY', accessor: 'entry' },
        { header: 'EMPLOYEE', accessor: 'employee_name' },
        { header: 'VENDOR', accessor: 'vendor_name' },
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
    ], [user.role, loadingActionId, handleUpdate, openDeleteModal, selectedBank, handleBankClick]);

    const bankOptions = useMemo(() => [
        { value: "all", label: "All Banks" },
        { value: "UBL M.A.R", label: "UBL M.A.R" },
        { value: "UBL F.Z", label: "UBL F.Z" },
        { value: "HBL M.A.R", label: "HBL M.A.R" },
        { value: "HBL F.Z", label: "HBL F.Z" },
        { value: "JAZ C", label: "JAZ C" },
        { value: "MCB FIT", label: "MCB FIT" }
    ], []);

    return (
        <div className="h-full flex flex-col">
            {showForm ? (
                <OfficeAccounts_Form
                    onCancel={handleCancel}
                    onSubmitSuccess={handleFormSubmit}
                    editingEntry={editingEntry}
                />
            ) : (
                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4 relative">
                        <select
                            value={selectedBank}
                            onChange={(e) => setSelectedBank(e.target.value)}
                            className="p-2 border border-gray-300 rounded-md"
                        >
                            {bankOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
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

export default OfficeAccounts;