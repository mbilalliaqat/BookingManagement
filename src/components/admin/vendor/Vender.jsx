import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import TableSpinner from '../../ui/TableSpinner';
import ButtonSpinner from '../../ui/ButtonSpinner';
import Table from '../../ui/Table';
import Modal from '../../ui/Modal';
import axios from 'axios';
import VenderForm from './Vendor_Form';

const Vender = () => {
  const { user } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [vendorNames, setVendorNames] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingActionId, setLoadingActionId] = useState(null);

  const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get(`${BASE_URL}/vender`);
      
      if (response.data.status === 'success') {
        const formattedData = response.data.vendors?.map((entry, index) => ({
          ...entry,
          key: entry.id || index,
          date: formatDate(entry.date),
          debit: Number(entry.debit) || 0,
          credit: Number(entry.credit) || 0,
          remaining_amount: Number(entry.remaining_amount) || 0, 
          bank_title: entry.bank_title || '',
        }))
        .sort((a, b) => a.id - b.id) || [];
        
        setData(formattedData);
      } else {
        throw new Error(response.data.message || 'Failed to fetch data');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error fetching data';
      setError(errorMessage);
      console.error('Error Fetching Data:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVendorNames = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/vender-names/existing`);
      if (response.data.status === 'success') {
        setVendorNames(response.data.vendorNames || []);
      }
    } catch (error) {
      console.error('Error fetching vendor names:', error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchVendorNames();
  }, []);

  useEffect(() => {
    if (selectedVendor === '' || selectedVendor === 'all') {
      setFilteredData(data);
    } else {
      setFilteredData(data.filter(item => item.vender_name === selectedVendor));
    }
  }, [data, selectedVendor]);

  const handleCancel = useCallback(() => {
    setShowForm(false);
    setEditingEntry(null);
  }, []);

  const handleFormSubmit = useCallback(() => {
    setShowForm(false);
    setEditingEntry(null);
    fetchData();
    fetchVendorNames();
  }, []);

  const openDeleteModal = useCallback((id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setDeleteId(null);
  }, []);

  const handleUpdate = useCallback((entry) => {
    if (!entry || !entry.id) {
      console.error('Entry is undefined, null, or missing ID');
      return;
    }
    
    setLoadingActionId(entry.id);
    console.log('Updating entry:', entry);
    
    // Prepare entry for editing
    const entryForEdit = {
      id: entry.id,
      vender_name: entry.vender_name || '',
      date: entry.date ? convertToInputDate(entry.date) : '',
      bank_title: entry.bank_title || '',
      entry: entry.entry || '',
      detail: entry.detail || '',
      credit: entry.credit || 0,
      debit: entry.debit || 0,
      remaining_amount: entry.remaining_amount || 0
    };
    
    console.log('Prepared entry for edit:', entryForEdit);
    
    setTimeout(() => {
      setEditingEntry(entryForEdit);
      setShowForm(true);
      setLoadingActionId(null);
    }, 500);
  }, []);

  const convertToInputDate = (formattedDate) => {
    if (!formattedDate) return '';
    
    // If already in YYYY-MM-DD format
    if (formattedDate.includes('-') && formattedDate.length === 10) {
      return formattedDate;
    }
    
    // If in MM/DD/YYYY format
    const parts = formattedDate.split('/');
    if (parts.length === 3) {
      const [month, day, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return formattedDate;
  };

  const handleDelete = useCallback(
    async (id) => {
      // Handle both direct ID and object with ID
      const parsedId = typeof id === 'object' && id !== null ? id.id : id;
      
      if (!parsedId || isNaN(Number(parsedId))) {
        setError('Invalid vendor ID. Cannot delete.');
        return;
      }
      
      const numericId = Number(parsedId);
      setIsDeleting(true);
      setLoadingActionId(numericId);
      
      try {
        const response = await axios.delete(`${BASE_URL}/vender/${numericId}`);
        
        if (response.data.status === 'success') {
          console.log('Vendor entry deleted successfully');
          // Refresh data to get updated balances
          await fetchData();
        } else {
          throw new Error(response.data.message || 'Failed to delete vendor entry');
        }
      } catch (error) {
        console.error('Error deleting vendor entry:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to delete vendor entry';
        setError(errorMessage);
      } finally {
        setIsDeleting(false);
        setLoadingActionId(null);
        closeDeleteModal();
      }
    },
    [closeDeleteModal]
  );

  const handleVendorChange = (e) => {
    setSelectedVendor(e.target.value);
  };

  const columns = useMemo(
    () => [
      { header: 'VENDOR NAME', accessor: 'vender_name' },
      { header: 'DATE', accessor: 'date' },
      { header: 'ENTRY', accessor: 'entry' },
      { header: 'BANK TITLE', accessor: 'bank_title' },
      { header: 'DETAIL', accessor: 'detail' },
     { header: 'CREDIT', accessor: 'credit' },
        { header: 'DEBIT', accessor: 'debit' },
        { header: 'BALANCE', accessor: 'remaining_amount' },
     ...(user.role === 'admin'
                 ? [
                       {
                           header: 'ACTIONS',
                           accessor: 'actions',
                           render: (row, index) => (
                               <>
                                   <button
                                       className="text-blue-500 hover:text-blue-700 mr-3"
                                       onClick={() => handleUpdate(index)}
                                       disabled={loadingActionId === index.id}
                                   >
                                       {loadingActionId === index.id ? <ButtonSpinner /> : <i className="fas fa-edit"></i>}
                                   </button>
                                   <button
                                       className="text-red-500 hover:text-red-700"
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
    ],
    [user.role, loadingActionId, handleUpdate, openDeleteModal]
  );

  return (
    <div className="flex flex-col h-full">
      {showForm ? (
        <VenderForm 
          onCancel={handleCancel} 
          onSubmitSuccess={handleFormSubmit} 
          editingEntry={editingEntry} 
        />
      ) : (
        <>
          <div className="flex justify-between items-center mb-4 relative">
            <select 
              className="p-2 border border-gray-300 rounded-md" 
              value={selectedVendor} 
              onChange={handleVendorChange}
            >
              <option value="all">All Vendors</option>
              {vendorNames.map((name, index) => (
                <option key={index} value={name}>
                  {name}
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
              <Table columns={columns} data={filteredData.length ? filteredData : []} />
            )}
          </div>
        </>
      )}
      
      <Modal isOpen={showDeleteModal} onClose={closeDeleteModal} title="Delete Confirmation">
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
          <i className="fas fa-exclamation-triangle text-red-500 text-xl"></i>
        </div>
        <p className="text-sm text-center text-white mb-6">
          Are you sure you want to delete this vendor entry? This will recalculate all remaining balances.
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

export default Vender;