// Archive.jsx - NEW FILE (Trash/Archive Page)
import { useEffect, useState } from 'react';
import axios from 'axios';
import Table from '../../ui/Table';
import TableSpinner from '../../ui/TableSpinner';
import ButtonSpinner from '../../ui/ButtonSpinner';

const Archive = () => {
    const [archives, setArchives] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [moduleFilter, setModuleFilter] = useState('all');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;

    const fetchArchives = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${BASE_URL}/archive`);
            setArchives(response.data.records);
        } catch (error) {
            console.error('Error fetching archives:', error);
            setError('Failed to load archived data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchArchives();
    }, []);

    const columns = [
        { 
            header: 'MODULE', 
            accessor: 'module_name',
            render: (cellValue) => (
                <span className="uppercase font-semibold text-blue-600">
                    {cellValue}
                </span>
            )
        },
        { 
            header: 'RECORD ID', 
            accessor: 'original_record_id' 
        },
        {
            header: 'DELETED DATE',
            accessor: 'deleted_at',
            render: (cellValue) => (
                new Date(cellValue).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
            )
        },
        { 
            header: 'DELETED BY', 
            accessor: 'deleted_by' 
        },
        {
            header: 'PREVIEW',
            accessor: 'record_data',
            render: (cellValue, row) => {
                const data = row.record_data;
                const ticket = data.ticket || {};
                
                return (
                    <div className="text-sm">
                        {row.module_name === 'ticket' && (
                            <div>
                                <div><strong>Entry:</strong> {ticket.entry}</div>
                                <div><strong>Sector:</strong> {ticket.sector}</div>
                                <div><strong>Amount:</strong> {ticket.receivable_amount}</div>
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            header: 'ACTIONS',
            accessor: 'actions',
            render: (row, index) => (
                <button
                    className="text-red-500 hover:text-red-700 text-[13px]"
                    onClick={() => openDeleteModal(index.id)}
                    title="Permanent Delete"
                >
                    <i className="fas fa-trash-alt"></i> Delete Forever
                </button>
            )
        }
    ];

    const filteredData = archives.filter((entry) => {
        const matchesSearch = 
            String(entry.original_record_id).includes(search) ||
            entry.module_name.toLowerCase().includes(search.toLowerCase()) ||
            entry.deleted_by.toLowerCase().includes(search.toLowerCase());

        const matchesModule = moduleFilter === 'all' || entry.module_name === moduleFilter;

        return matchesSearch && matchesModule;
    });

    const openDeleteModal = (id) => {
        setDeleteId(id);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setDeleteId(null);
    };

    const handlePermanentDelete = async () => {
        setIsDeleting(true);
        try {
            const response = await axios.delete(`${BASE_URL}/archive/${deleteId}`);
            if (response.status === 200) {
                setArchives(archives.filter(archive => archive.id !== deleteId));
                console.log('Archive permanently deleted');
            }
        } catch (error) {
            console.error('Error deleting archive:', error);
            setError('Failed to delete archive permanently');
        }
        setIsDeleting(false);
        closeDeleteModal();
    };

    const DeleteConfirmationModal = () => {
        if (!showDeleteModal) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto bg-black bg-opacity-50">
                <div className="relative w-full max-w-md mx-auto bg-[#161925] rounded-lg shadow-lg">
                    <div className="p-6">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
                            <i className="fas fa-exclamation-triangle text-red-500 text-xl"></i>
                        </div>
                        <h3 className="mb-5 text-lg font-medium text-center text-white">
                            Permanent Delete Warning
                        </h3>
                        <p className="text-sm text-center text-white mb-6">
                            This will permanently delete this record. This action cannot be undone!
                        </p>
                        <div className="flex items-center justify-center space-x-4">
                            <button
                                onClick={closeDeleteModal}
                                className="px-4 py-2 text-sm font-medium text-white bg-[#161925] border rounded-lg hover:bg-gray-700"
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePermanentDelete}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center justify-center"
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <ButtonSpinner />
                                        <span>Deleting...</span>
                                    </>
                                ) : (
                                    'Delete Forever'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className='h-full flex flex-col'>
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search archives..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-40 p-2 border border-gray-300 pr-8 rounded-md bg-white/90"
                        />
                        <i className="fas fa-search absolute right-3 top-7 transform -translate-y-1/2 text-gray-400"></i>
                    </div>

                    <select
                        value={moduleFilter}
                        onChange={(e) => setModuleFilter(e.target.value)}
                        className="p-2 border border-gray-300 rounded-md bg-white/90"
                    >
                        <option value="all">All Modules</option>
                        <option value="ticket">Tickets</option>
                        <option value="booking">Bookings</option>
                        <option value="invoice">Invoices</option>
                    </select>
                </div>

                <button
                    onClick={fetchArchives}
                    className="font-semibold text-sm bg-white rounded-md shadow px-4 py-2 hover:bg-blue-600 hover:text-white transition-colors duration-200"
                >
                    <i className="fas fa-sync-alt mr-1"></i> Refresh
                </button>
            </div>

            <div className="mb-2 text-sm text-gray-600">
                Showing {filteredData.length} of {archives.length} archived records
            </div>

            <div>
                {isLoading ? (
                    <TableSpinner />
                ) : error ? (
                    <div className="flex items-center justify-center w-full h-64">
                        <div className="text-red-500">
                            <i className="fas fa-exclamation-circle mr-2"></i>
                            {error}
                        </div>
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="flex items-center justify-center w-full h-64">
                        <div className="text-gray-500">
                            <i className="fas fa-inbox mr-2"></i>
                            No archived records found
                        </div>
                    </div>
                ) : (
                    <Table data={filteredData} columns={columns} />
                )}
            </div>
            
            <DeleteConfirmationModal />
        </div>
    );
};

export default Archive;