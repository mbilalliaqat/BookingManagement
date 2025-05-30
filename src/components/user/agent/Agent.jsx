import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useAppContext } from '../../contexts/AppContext';
import TableSpinner from '../../ui/TableSpinner';
import ButtonSpinner from '../../ui/ButtonSpinner';
import Table from '../../ui/Table';
import Modal from '../../ui/Modal';
import axios from 'axios';
import AgentForm from './Agent_Form';

const Agent = () => {
    const { user } = useAppContext();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null); 
    const [data, setData] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [agentNames, setAgentNames] = useState([]);
    const [selectedAgent, setSelectedAgent] = useState('');
    const [filteredData, setFilteredData] = useState([]);
    const [editingEntry, setEditingEntry] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [loadingActionId, setLoadingActionId] = useState(null);

    // Date formatting function - same as Services component
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
    };

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get('http://localhost:8787/agent')
            
            // Format dates for display - same as Services component
            const formattedData = response.data.agents.map((entry) => ({
                ...entry,
                date: formatDate(entry.date),
            }));
            
            setData(formattedData.reverse() || []);
        } catch (error) {
            setError(error.message);
            console.error("Error Fetching Data", error.message);
        } finally {
            setIsLoading(false);
        }
    }

    const fetchAgentNames = async () => {
        try {
            const response = await axios.get('http://localhost:8787/agent-names/existing');
            if (response.data.status === 'success') {
                setAgentNames(response.data.agentNames || []);
            }
        } catch (error) {
            console.error('Error fetching agent names:', error);
        }
    };

    useEffect(() => {
        fetchData();
        fetchAgentNames();
    }, []);

    // Filter data based on selected agent
    useEffect(() => {
        if (selectedAgent === '' || selectedAgent === 'all') {
            setFilteredData(data);
        } else {
            setFilteredData(data.filter(item => item.agent_name === selectedAgent));
        }
    }, [data, selectedAgent]);

    const handleCancel = useCallback(() => {
        setShowForm(false);
        setEditingEntry(null);
    }, []);

    const handleFormSubmit = useCallback(() => {
        setShowForm(false);
        setEditingEntry(null);
        fetchData();
        fetchAgentNames();
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
        if (!entry) {
            console.error('Entry is undefined or null');
            return;
        }
        
        // Set loading state for this specific row
        setLoadingActionId(entry.id);
        
        console.log('Updating entry:', entry);
        const entryForEdit = {
            ...entry,
            // Convert formatted date back to YYYY-MM-DD format for form input
            date: entry.date ? convertToInputDate(entry.date) : '',
        };
        console.log('Prepared entry for edit:', entryForEdit);
        
        // Small timeout to show the loading spinner
        setTimeout(() => {
            setEditingEntry(entryForEdit);
            setShowForm(true);
            setLoadingActionId(null);
        }, 500);
        
    }, []);

    // Helper function to convert MM/DD/YYYY back to YYYY-MM-DD for form input
    const convertToInputDate = (formattedDate) => {
        if (!formattedDate) return '';
        
        // Check if it's already in YYYY-MM-DD format
        if (formattedDate.includes('-') && formattedDate.length === 10) {
            return formattedDate;
        }
        
        // Convert MM/DD/YYYY to YYYY-MM-DD
        const parts = formattedDate.split('/');
        if (parts.length === 3) {
            const [month, day, year] = parts;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        
        return formattedDate;
    };

    const handleDelete = useCallback(async (id) => {
        const parsedId = typeof id === 'object' && id !== null ? id.id : id;
        if (!parsedId || isNaN(parsedId) || typeof parsedId !== 'number') {
            setError('Invalid agent ID. Cannot delete.');
            return;
        }
        
        setIsDeleting(true);
        setLoadingActionId(parsedId);
        
        try {
            const response = await axios.delete(`http://localhost:8787/agent/${parsedId}`);
            if (response.status === 200) {
                setData(data.filter(entry => entry.id !== parsedId));
                console.log('Agent entry deleted successfully');
                fetchData();
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error deleting agent entry:', error);
            setError('Failed to delete agent entry. Please try again later.');
        } finally {
            setIsDeleting(false);
            setLoadingActionId(null);
            closeDeleteModal();
        }
    }, [data, closeDeleteModal]);

    const handleAgentChange = (e) => {
        setSelectedAgent(e.target.value);
    };

    const columns = useMemo(() => [
        { header: 'AGENT NAME', accessor: 'agent_name' },
        { header: 'DATE', accessor: 'date' },
        { header: 'EMPLOYEE', accessor: 'employee' },
        { header: 'ENTRY', accessor: 'entry' },
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
    ], [user.role, loadingActionId, handleUpdate, openDeleteModal]);
    
    return (
        <div className='flex flex-col h-full'>
           {showForm ? (
                <AgentForm 
                    onCancel={handleCancel} 
                    onSubmitSuccess={handleFormSubmit}
                    editingEntry={editingEntry}
                />
            ) : (
                <>
                    <div className='flex justify-between items-center mb-4 relative'>
                        <select 
                            className="p-2 border border-gray-300 rounded-md"
                            value={selectedAgent}
                            onChange={handleAgentChange}
                        >
                            <option value="all">All Agents</option>
                            {agentNames.map((name, index) => (
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
                            <Table 
                                columns={columns} 
                                data={filteredData.length ? filteredData : []} 
                            />
                        )}
                    </div>
                </>
            )}
            
            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={closeDeleteModal}
                title="Delete Confirmation"
            >
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
                    <i className="fas fa-exclamation-triangle text-red-500 text-xl"></i>
                </div>
                <p className="text-sm text-center text-white mb-6">
                    Are you sure you want to delete this agent entry? 
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
    )
}

export default Agent