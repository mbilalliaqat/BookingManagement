import React, { useEffect, useState } from 'react';
import Table from '../../ui/Table';
import Services_Form from '../services/Services_Form';
import axios from 'axios';
import TableSpinner from '../../ui/TableSpinner';
import ButtonSpinner from '../../ui/ButtonSpinner';
import Modal from '../../ui/Modal';
import { useAppContext } from '../../contexts/AppContext';
import ServiceRemainingPay from './ServiceRemainingPay';

const Services = () => {
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [entries, setEntries] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [editEntry, setEditEntry] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showRemainingPay, setShowRemainingPay] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const { user } = useAppContext();

    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${BASE_URL}/services`);
            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = response.data;
            console.log("Fetched data:", data);

            // Assign serialNo based on the fetched order
            const formattedData = data.services.map((entry) => ({
                ...entry,
                booking_date: formatDate(entry.booking_date),
            }));
            setEntries(formattedData.reverse());
        } catch (error) {
            console.log("Error Fetching data", error);
            setError('Failed to load data. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRemainingPay = (service) => {
        setSelectedService(service);
        setShowRemainingPay(true);
    };

    const handlePaymentSuccess = (paymentData) => {
        fetchData(); // Refetch data to update the UI
        setShowRemainingPay(false);
    };

    const columns = [
        { header: 'VISA TYPE', accessor: 'visa_type' },
        { header: 'BOOKING DATE', accessor: 'booking_date' },
        { header: 'EMPLOYEE NAME', accessor: 'user_name' },
        { header: 'ENTRY', accessor: 'entry' },
        { header: 'CUSTOMER ADD', accessor: 'customer_add' },
        { header: 'SPECIAL DETAIL', accessor: 'specific_detail' },
        { header: 'RECEIVABLE AMOUNT', accessor: 'receivable_amount' },
        { header: 'PAID CASH', accessor: 'paid_cash' },
        { header: 'PAID IN BANK', accessor: 'paid_in_bank' },
        { header: 'PROFIT', accessor: 'profit' },
        {
            header: 'REMAINING AMOUNT',
            accessor: 'remaining_amount',
            render: (row) => (
                <div className="flex flex-col items-center">
                    <span className="mb-1">{row?.remaining_amount || '0'}</span>
                    <button
                        onClick={() => handleRemainingPay(row)}
                        className="text-green-600 hover:text-green-800 text-xs px-2 py-1 border border-green-600 rounded hover:bg-green-50"
                        title="Add Payment"
                    >
                        <i className="fas fa-plus mr-1"></i> Pay
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

    const filteredData = entries.filter((entry) => // Changed index to entry for clarity
        Object.values(entry).some((value) =>
            String(value).toLowerCase().includes(search.toLowerCase())
        )
    );

     const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB'); // Format as day/month/year
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditEntry(null);
    };

    const handleFormSubmit = (submittedEntry) => {
        if (editEntry) { // If it was an edit operation
            setEntries(prevEntries =>
                prevEntries.map(entry =>
                    entry.id === submittedEntry.id
                        ? { ...submittedEntry, booking_date: formatDate(submittedEntry.booking_date), serialNo: entry.serialNo }
                        : entry
                )
            );
        } else { // If it was a new entry
            setEntries(prevEntries => {
                const newSerialNo = prevEntries.length > 0 ? Math.max(...prevEntries.map(e => e.serialNo)) + 1 : 1;
                return [
                    ...prevEntries,
                    {
                        ...submittedEntry,
                        serialNo: newSerialNo,
                        booking_date: formatDate(submittedEntry.booking_date)
                    }
                ];
            });
        }
        setShowForm(false);
        setEditEntry(null);
        fetchData();
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
        console.log('Attempting to delete service with id:', id);
        // The id passed here should already be a number from openDeleteModal
        const parsedId = typeof id === 'object' && id !== null ? id.id : id; // This line might not be needed if id is always correct
        if (!parsedId || typeof parsedId !== 'number') { // Simplified check
            console.error('Invalid ID:', id, 'Parsed ID:', parsedId);
            setError('Invalid service ID. Cannot delete.');
            setIsDeleting(false);
            return;
        }
        try {
            const response = await axios.delete(`${BASE_URL}/services/${parsedId}`);
            if (response.status === 200) {
                setEntries(entries.filter(entry => entry.id !== parsedId));
                console.log('Service deleted successfully');
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error deleting service:', error);
            setError('Failed to delete service. Please try again later.');
        } finally {
            setIsDeleting(false);
            closeDeleteModal();
        }
    };

    return (
        <div className="h-full flex flex-col">
            {showForm ? (
                <Services_Form
                    onCancel={handleCancel}
                    onSubmitSuccess={handleFormSubmit}
                    editEntry={editEntry}
                />
            ) : (
                <div className="flex flex-col h-full">
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
            
            {showRemainingPay && (
                <ServiceRemainingPay
                    service={selectedService}
                    onClose={() => setShowRemainingPay(false)}
                    onPaymentSuccess={handlePaymentSuccess}
                />
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
                    Are you sure you want to delete this service entry?
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
                        {isDeleting ? <><ButtonSpinner /> Deleting...</> : 'Delete'}
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default Services;