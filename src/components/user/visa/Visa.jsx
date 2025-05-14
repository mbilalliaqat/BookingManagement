import React, { useEffect, useState } from 'react';

import Table from '../../ui/Table';
import VisaProcessing_Form from './VisaProcessing_Form';
import { useAppContext } from '../../contexts/AppContext';
import axios from 'axios';
import TableSpinner from '../../ui/TableSpinner';
import Modal from '../../ui/Modal';
import ButtonSpinner from '../../ui/ButtonSpinner';

const Visa = () => {
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [entries, setEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editEntry, setEditEntry] = useState(null); 
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { user } = useAppContext();

    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${BASE_URL}/visa-processing`); // Adjust the endpoint as needed
            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = response.data;
            const formattedData = data.visa_processing.map((visa) => ({
                ...visa,
                embassy_send_date: visa.embassy_send_date
                    ? new Date(visa.embassy_send_date).toLocaleDateString()
                    : 'N/A', // Handle null/undefined
                embassy_return_date: visa.embassy_return_date
                    ? new Date(visa.embassy_return_date).toLocaleDateString()
                    : 'N/A',
                protector_date: visa.protector_date
                    ? new Date(visa.protector_date).toLocaleDateString()
                    : 'N/A',
                passport_deliver_date: visa.passport_deliver_date
                    ? new Date(visa.passport_deliver_date).toLocaleDateString()
                    : 'N/A',
            }));
            setEntries(formattedData.reverse());
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to load data. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const columns = [
        { header: 'USER NAME', accessor: 'employee_name' },
        { header: 'ENTRY', accessor: 'entry' },
        { header: 'FILE NO.', accessor: 'file_number' },
        { header: 'REFERENCE', accessor: 'reference' },
        { header: 'SPONSOR NAME', accessor: 'sponsor_name' },
        { header: 'VISA NO.', accessor: 'visa_number' },
        { header: 'ID NO.', accessor: 'id_number' },
        { header: 'EMBASSY', accessor: 'embassy' },
        { header: 'PASSPORT DETAIL', accessor: 'passport_detail' },
        { header: 'E-NUMBER', accessor: 'e_number' },
        { header: 'CUSTOMER ADD', accessor: 'customer_add' },
        { header: 'PTN/PERMISSION', accessor: 'ptn_permission' },
        { header: 'EMBASSY SEND DATE', accessor: 'embassy_send_date' },
        { header: 'EMBASSY RETURN DATE', accessor: 'embassy_return_date' },
        { header: 'PROTECTOR DATE', accessor: 'protector_date' },
        { header: 'PASSPORT DELIVER DATE', accessor: 'passport_deliver_date' },
        { header: 'RECEIVE ABLE AMOUNT', accessor: 'receivable_amount' },
        { header: 'ADDITIONAL CHARGES', accessor: 'additional_charges' },
        { header: 'PAY FOR PROTECTOR', accessor: 'pay_for_protector' },
        { header: 'PAID CASH', accessor: 'paid_cash' },
        { header: 'PAID IN BANK', accessor: 'paid_in_bank' },
        { header: 'PROFIT', accessor: 'profit' },
        { header: 'REMAINING AMOUNT', accessor: 'remaining_amount' },
        ...(user.role === 'admin' ? [{
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
    };
    const handleFormSubmit = () => {
        fetchData();
        setShowForm(false);
        setEditEntry(null);
    };

    const handleUpdate = (entry) => {
        setEditEntry(entry); // Set the entry to edit
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
        console.log('Attempting to delete expense with id:', id); // Debug log
        // Handle case where id is an object (temporary safeguard)
        const parsedId = typeof id === 'object' && id !== null ? id.id : id;
        if (!parsedId || isNaN(parsedId) || typeof parsedId !== 'number') {
             console.error('Invalid ID:', id, 'Parsed ID:', parsedId);
             setError('Invalid expense ID. Cannot delete.');
             setIsDeleting(false);
             return;
        }
        try {
            const response = await axios.delete(`${BASE_URL}/visa-processing/${parsedId}`);
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
        <VisaProcessing_Form onCancel={handleCancel} onSubmitSuccess={handleFormSubmit} editEntry={editEntry}/>
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
                    className="font-semibold text-sm bg-white  rounded-md shadow px-4 py-2 hover:bg-purple-700 hover:text-white transition-colors duration-200"
                    onClick={() => setShowForm(true)}
                >
                    <i className="fas fa-plus mr-1"></i> Add New
                </button>
            </div>
            <div className="flex-1 overflow-hidden bg-white/80 backdrop-blur-md shadow-2xl rounded-2xl">
            {
                    isLoading ?(
                        <TableSpinner />
                    ) : error ?(
                        <div className="flex items-center justify-center w-full h-64">
                        <div className="text-red-500">
                            <i className="fas fa-exclamation-circle mr-2"></i>
                            {error}
                        </div>
                    </div> 
                    ):(
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
                        {isDeleting ? (
                            <>
                                <ButtonSpinner /> 
                                Deleting...
                            </>
                        ) : (
                            'Delete'
                        )}
                    </button>
                </div>
            </Modal>
</div>
    );
};

export default Visa;