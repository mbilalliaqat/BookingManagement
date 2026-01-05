import React, { useEffect, useState } from 'react'
import Table from '../../ui/Table'

import Expense_Form from './Expense_Form';
import axios from 'axios';
import TableSpinner from '../../ui/TableSpinner';
import { useAppContext } from '../../contexts/AppContext';
import Modal from '../../ui/Modal';
import { useLocation } from 'react-router-dom';

const Expense = () => {

    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [entries, setEntries] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editEntry, setEditEntry] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const { user } = useAppContext();
    const location = useLocation();
    const [highlightEntry, setHighlightedEntry] = useState('');


    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${BASE_URL}/expenses`)
            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = response.data;
            console.log("Fetched data:", data);

            const formattedData = data.expenses?.map((entry) => ({
                ...entry,
                date: new Date(entry.date).toLocaleDateString('en-GB'),
            }));
            setEntries(formattedData.reverse());

        }
        catch (error) {
            console.log("Error Fetching data", error);
            setError('Failed to load data. Please try again later.');

        } finally {
            setIsLoading(false);
        }
    }
    useEffect(() => {
        fetchData();
    }, [])

    useEffect(() => {
        if (location.state?.highlightEntry) {
            setHighlightedEntry(location.state.highlightEntry);
            setSearch(location.state.highlightEntry)

            const timer = setTimeout(() => {
                setHighlightedEntry(null)
            }, 5000);

            return clearTimeout(timer)
        }
    }, [location.state])


    const columns = [
        { header: 'SELECT', accessor: 'selection' },
        { header: 'EMPLOYEE NAME', accessor: 'user_name' },
        { header: 'DATE', accessor: 'date' },
        { header: 'ENTRY', accessor: 'entry' },
        {
            header: 'DETAIL',
            accessor: 'detail',
            render: (value, row) => {
                const detailParts = [row.detail, row.vendor_name, row.bank_title];
                return detailParts.filter(Boolean).join(' / ');
            }
        },
        { header: 'WITHDRAW', accessor: 'withdraw' },
        { header: 'CASH OFFICE', accessor: 'cash_office' },
        { header: 'TOTAL AMOUNT', accessor: 'total_amount' },
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
    const filteredData = entries?.filter((index) =>
        Object.values(index).some((value) =>
            String(value).toLowerCase().includes(search.toLowerCase())
        )
    );

    const handleCancel = () => {
        setShowForm(false);
        setEditEntry(null);
    }
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

    // Spinner component for the loader
    const LoadingSpinner = () => (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    );

    const handleDelete = async (id) => {
        console.log('Attempting to delete expense with id:', id);
        const parsedId = typeof id === 'object' && id !== null ? id.id : id;
        if (!parsedId || isNaN(parsedId) || typeof parsedId !== 'number') {
            console.error('Invalid ID:', id, 'Parsed ID:', parsedId);
            setError('Invalid expense ID. Cannot delete.');
            return;
        }

        setIsDeleting(true);

        try {
            const response = await axios.delete(`${BASE_URL}/expenses/${parsedId}`, {
                data: { user_name: user.name }
            });
            if (response.status === 200) {
                setEntries(entries.filter(entry => entry.id !== parsedId));
                console.log('Expense deleted successfully');
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error deleting expense:', error);
            setError('Failed to delete expense. Please try again later.');
        } finally {
            setIsDeleting(false);
            closeDeleteModal();
        }
    };

    return (
        <div className="h-full flex flex-col">
            {showForm ? (
                <Expense_Form onCancel={handleCancel} onSubmitSuccess={handleFormSubmit} editEntry={editEntry} />
            ) : (
                <div className="flex flex-col h-full ">
                    <div className="flex justify-between items-center mb-4 relative">
                        <input
                            type="text"
                            placeholder="Search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-40 p-2 border border-gray-300 pr-8 rounded-md bg-white/90"
                        />
                        <i className="fas fa-search absolute left-33 top-7 transform -translate-y-1/2 text-gray-400"></i>

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
                    Are you sure you want to delete this expense entry?
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
                        disabled={isDeleting}
                        className={`px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg flex items-center justify-center ${isDeleting ? 'opacity-75 cursor-not-allowed' : 'hover:bg-red-600'} focus:outline-none focus:ring-2 focus:ring-red-500`}
                    >
                        {isDeleting && <LoadingSpinner />}
                        Delete
                    </button>
                </div>
            </Modal>
        </div>
    )
}

export default Expense