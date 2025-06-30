import React, { useEffect, useState } from 'react';
import Table from '../../ui/Table';
import GamcaToken_Form from './GamcaToken_Form';
import { useAppContext } from '../../contexts/AppContext';
import axios from 'axios';
import TableSpinner from '../../ui/TableSpinner';
import Modal from '../../ui/Modal';
import ButtonSpinner from '../../ui/ButtonSpinner';

const GamcaToken = () => {
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
        setError(null); 
        
      try {
           
            if (!BASE_URL) {
                throw new Error('API base URL is not defined. Please check your environment configuration.');
            }
            
            const apiUrl = `${BASE_URL}/gamca-token`;
            console.log('Fetching GAMCA token data from:', apiUrl);
            
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
            
            if (!response.data.gamcaTokens) {
                console.error('Response missing gamcaTokens property:', response.data);
                throw new Error('Invalid response format: missing gamcaTokens data');
            }
            
            const data = response.data.gamcaTokens;
            console.log('Parsed GAMCA tokens:', data);
            
            const formattedData = data.map((token) => {
                let passportDetails = {};
                try {
                    if (typeof token.passport_detail === 'string') {
                        passportDetails = JSON.parse(token.passport_detail);
                    } else if (typeof token.passport_detail === 'object' && token.passport_detail !== null) {
                        passportDetails = token.passport_detail;
                    }
                } catch (e) {
                    console.error("Error parsing passport details:", e);
                }
                return {
                    ...token,
                    
                    created_at: new Date(token.created_at).toLocaleDateString('en-GB'),
                    passengerTitle: passportDetails.title || '',
                    passengerFirstName: passportDetails.firstName || '',
                    passengerLastName: passportDetails.lastName || '',
                    passengerDob: passportDetails.dob ? new Date(passportDetails.dob).toLocaleDateString('en-GB') : '',
                    passengerNationality: passportDetails.nationality || '',
                    documentType: passportDetails.documentType || '',
                    documentNo: passportDetails.documentNo || '',
                    documentExpiry: passportDetails.documentExpiry ? new Date(passportDetails.documentExpiry).toLocaleDateString('en-GB') : '',
                    documentIssueCountry: passportDetails.issueCountry || '',
                    passport_detail: token.passport_detail
                };
            });
            
            setEntries(formattedData.reverse());
            
            if (formattedData.length === 0) {
                console.log('No GAMCA tokens found in the response');
            }
        } catch (error) {
            console.error('Error fetching GAMCA token data:', error);
            
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

    const columns = [
        { header: 'BOOKING DATE', accessor: 'created_at' },
        { header: 'EMPLOYEE NAME', accessor: 'employee_name' },
        { header: 'ENTRY', accessor: 'entry' },
        { header: 'CUSTOMER ADD', accessor: 'customer_add' },
        { header: 'REFERENCE', accessor: 'reference' },
        { header: 'COUNTRY', accessor: 'country' },
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
        { header: 'PAID IN BANK', accessor: 'paid_in_bank' },
        { header: 'PROFIT', accessor: 'profit' },
        { header: 'REMAINING AMOUNT', accessor: 'remaining_amount' },
        ...(user.role === 'admin' ? [{
            header: 'ACTIONS', accessor: 'actions', render: (row,index) => (
                <>
                    <button
                        className="text-blue-500 hover:text-blue-700 mr-1 text-[8px]"
                        onClick={() => handleUpdate(index)}
                    >
                        <i className="fas fa-edit"></i>
                    </button>
                    <button
                        className="text-red-500 hover:text-red-700 text-[8px]"
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
        console.log('Attempting to delete GAMCA token with id:', id);
        const parsedId = typeof id === 'object' && id !== null ? id.id : id;
        if (!parsedId || isNaN(parsedId) || typeof parsedId !== 'number') {
            console.error('Invalid ID:', id, 'Parsed ID:', parsedId);
            setError('Invalid GAMCA token ID. Cannot delete.');
            setIsDeleting(false);
            return;
        }
        try {
            const response = await axios.delete(`${BASE_URL}/gamca-token/${parsedId}`);
            if (response.status === 200) {
                setEntries(entries?.filter(entry => entry.id !== parsedId));
                console.log('GAMCA token deleted successfully');
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error deleting GAMCA token:', error);
            setError('Failed to delete GAMCA token. Please try again later.');
        } finally {
            setIsDeleting(false);
            closeDeleteModal();
        }
    };

    return (
        <div className="h-full flex flex-col">
            {showForm ? (
                <GamcaToken_Form
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
            <Modal
                isOpen={showDeleteModal}
                onClose={closeDeleteModal}
                title="Delete Confirmation"
            >
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
                    <i className="fas fa-exclamation-triangle text-red-500 text-xl"></i>
                </div>
                <p className="text-sm text-center text-white mb-6">
                    Are you sure you want to delete this GAMCA token entry? 
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

export default GamcaToken;