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
    const [expandedRows, setExpandedRows] = useState([]);

    const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;

    const fetchArchives = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${BASE_URL}/archive/all`);
            setArchives(response.data.records);
            console.log("My Delete Data ", response.data.records);
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
    const toggleRowExpansion = (rowId) => {
        setExpandedRows(prev =>
            prev.includes(rowId)
                ? prev.filter(id => id !== rowId)
                : [...prev, rowId]
        );
    };

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
                const isExpanded = expandedRows.includes(row.id);

                // Helper function to render all properties of an object
                const renderAllFields = (obj) => {
                    if (!obj || typeof obj !== 'object') return null;

                    return Object.entries(obj).map(([key, value]) => {
                        if (value === null || value === undefined || value === '') return null;

                        const formattedKey = key
                            .split('_')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');

                        let displayValue = value;

                        if ((key.includes('date') || key.includes('Date')) && typeof value === 'string' && value.includes('T')) {
                            displayValue = new Date(value).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                            });
                        }
                        else if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
                            try {
                                const parsed = JSON.parse(value);
                                displayValue = Array.isArray(parsed) ? `${parsed.length} record(s)` : 'Object data';
                            } catch (e) {
                                displayValue = value;
                            }
                        }
                        else if (Array.isArray(value)) {
                            displayValue = `${value.length} item(s)`;
                        }
                        else if (typeof value === 'object') {
                            displayValue = 'Object data';
                        }
                        else if (typeof value === 'number' || (!isNaN(value) && value !== '')) {
                            displayValue = parseFloat(value).toLocaleString();
                        }

                        return (
                            <div key={key} className="flex mb-1">
                                <strong className="min-w-[150px] text-gray-700">{formattedKey}:</strong>
                                <span className="text-gray-900 ml-2">{String(displayValue)}</span>
                            </div>
                        );
                    }).filter(Boolean);
                };

                // Default 3 fields preview
                const getDefaultPreview = () => {
                    const ticket = data.ticket || {};
                    const umrah = data.umrah || {};
                    const visa = data.visa_processing || {};
                    const gamca = data.gamca_token || {};
                    const service = data.service || {};
                    const navtcc = data.navtcc || {};

                    if (row.module_name === 'ticket') {
                        return (
                            <>
                                <div><strong>Entry:</strong> {ticket.entry}</div>
                                <div><strong>Sector:</strong> {ticket.sector}</div>
                                <div><strong>Amount:</strong> {ticket.receivable_amount}</div>
                            </>
                        );
                    }
                    if (row.module_name === 'Umrah') {
                        return (
                            <>
                                <div><strong>Entry:</strong> {umrah.entry}</div>
                                <div><strong>Sector:</strong> {umrah.sector}</div>
                                <div><strong>Amount:</strong> {umrah.receivableAmount}</div>
                            </>
                        );
                    }
                    if (row.module_name === 'visa_processing') {
                        return (
                            <>
                                <div><strong>Entry:</strong> {visa.entry}</div>
                                <div><strong>File No:</strong> {visa.file_number}</div>
                                <div><strong>Amount:</strong> {visa.receivable_amount}</div>
                            </>
                        );
                    }
                    if (row.module_name === 'gamca_token') {
                        return (
                            <>
                                <div><strong>Entry:</strong> {gamca.entry}</div>
                                <div><strong>Country:</strong> {gamca.country}</div>
                                <div><strong>Amount:</strong> {gamca.receivable_amount}</div>
                            </>
                        );
                    }
                    if (row.module_name === 'service') {
                        return (
                            <>
                                <div><strong>Entry:</strong> {service.entry}</div>
                                <div><strong>Visa Type:</strong> {service.visa_type}</div>
                                <div><strong>Amount:</strong> {service.receivable_amount}</div>
                            </>
                        );
                    }
                    if (row.module_name === 'navtcc') {
                        return (
                            <>
                                <div><strong>Entry:</strong> {navtcc.entry}</div>
                                <div><strong>Reference:</strong> {navtcc.reference}</div>
                                <div><strong>Amount:</strong> {navtcc.receivable_amount}</div>
                            </>
                        );
                    }
                    if (row.module_name === 'protector') {
                        return (
                            <>
                                <div><strong>Entry:</strong> {data.protectors?.entry}</div>
                                <div><strong>Name:</strong> {data.protectors?.name}</div>
                                <div><strong>Passport:</strong> {data.protectors?.passport}</div>
                            </>
                        );
                    }
                    if (row.module_name === 'refunded') {
                        return (
                            <>
                                <div><strong>Entry:</strong> {data.refunded?.entry}</div>
                                <div><strong>Name:</strong> {data.refunded?.name}</div>
                                <div><strong>Balance:</strong> {data.refunded?.total_balance}</div>
                            </>
                        );
                    }
                    if (row.module_name === 'expenses') {
                        return (
                            <>
                                <div><strong>Entry:</strong> {data.expenses?.entry}</div>
                                <div><strong>Detail:</strong> {data.expenses?.detail}</div>
                                <div><strong>Amount:</strong> {data.expenses?.total_amount}</div>
                            </>
                        );
                    }
                    if (row.module_name === 'vender') {
                        return (
                            <>
                                <div><strong>Vendor:</strong> {data.vendors?.vender_name}</div>
                                <div><strong>Entry:</strong> {data.vendors?.entry}</div>
                                <div><strong>Balance:</strong> {data.vendors?.remaining_amount}</div>
                            </>
                        );
                    }
                    if (row.module_name === 'agent') {
                        return (
                            <>
                                <div><strong>Agent:</strong> {data.agents?.agent_name}</div>
                                <div><strong>Entry:</strong> {data.agents?.entry}</div>
                                <div><strong>Balance:</strong> {data.agents?.balance}</div>
                            </>
                        );
                    }
                    if (row.module_name === 'accounts') {
                        return (
                            <>
                                <div><strong>Bank:</strong> {data.accounts?.bank_name}</div>
                                <div><strong>Entry:</strong> {data.accounts?.entry}</div>
                                <div><strong>Balance:</strong> {data.accounts?.balance}</div>
                            </>
                        );
                    }
                    return null;
                };

                return (
                    <div className="text-sm">
                        {!isExpanded ? (
                            // Show default 3 fields
                            <div className="cursor-pointer" onClick={() => toggleRowExpansion(row.id)}>
                                {getDefaultPreview()}
                                <div className="text-blue-500 text-xs mt-2 hover:underline">
                                    <i className="fas fa-chevron-down mr-1"></i>
                                    Click to see all details
                                </div>
                            </div>
                        ) : (
                            // Show all fields when expanded
                            <div className="text-xs max-h-80 overflow-y-auto pr-2 py-1">
                                <div
                                    className="cursor-pointer text-blue-500 text-xs mb-2 hover:underline"
                                    onClick={() => toggleRowExpansion(row.id)}
                                >
                                    <i className="fas fa-chevron-up mr-1"></i>
                                    Click to collapse
                                </div>

                                {row.module_name === 'ticket' && data.ticket && (
                                    <div>
                                        <div className="font-bold text-blue-600 mb-2">TICKET DETAILS:</div>
                                        {renderAllFields(data.ticket)}
                                    </div>
                                )}

                                {row.module_name === 'Umrah' && data.umrah && (
                                    <div>
                                        <div className="font-bold text-blue-600 mb-2">UMRAH DETAILS:</div>
                                        {renderAllFields(data.umrah)}
                                    </div>
                                )}

                                {row.module_name === 'visa_processing' && data.visa_processing && (
                                    <div>
                                        <div className="font-bold text-blue-600 mb-2">VISA PROCESSING DETAILS:</div>
                                        {renderAllFields(data.visa_processing)}
                                    </div>
                                )}

                                {row.module_name === 'gamca_token' && data.gamca_token && (
                                    <div>
                                        <div className="font-bold text-blue-600 mb-2">GAMCA TOKEN DETAILS:</div>
                                        {renderAllFields(data.gamca_token)}
                                    </div>
                                )}

                                {row.module_name === 'service' && data.service && (
                                    <div>
                                        <div className="font-bold text-blue-600 mb-2">SERVICE DETAILS:</div>
                                        {renderAllFields(data.service)}
                                    </div>
                                )}

                                {row.module_name === 'navtcc' && data.navtcc && (
                                    <div>
                                        <div className="font-bold text-blue-600 mb-2">NAVTCC DETAILS:</div>
                                        {renderAllFields(data.navtcc)}
                                    </div>
                                )}

                                {row.module_name === 'protector' && data.protectors && (
                                    <div>
                                        <div className="font-bold text-blue-600 mb-2">PROTECTOR DETAILS:</div>
                                        {renderAllFields(data.protectors)}
                                    </div>
                                )}

                                {row.module_name === 'refunded' && data.refunded && (
                                    <div>
                                        <div className="font-bold text-blue-600 mb-2">REFUNDED DETAILS:</div>
                                        {renderAllFields(data.refunded)}
                                    </div>
                                )}

                                {row.module_name === 'expenses' && data.expenses && (
                                    <div>
                                        <div className="font-bold text-blue-600 mb-2">EXPENSES DETAILS:</div>
                                        {renderAllFields(data.expenses)}
                                    </div>
                                )}

                                {row.module_name === 'vender' && data.vendors && (
                                    <div>
                                        <div className="font-bold text-blue-600 mb-2">VENDOR DETAILS:</div>
                                        {renderAllFields(data.vendors)}
                                    </div>
                                )}

                                {row.module_name === 'agent' && data.agents && (
                                    <div>
                                        <div className="font-bold text-blue-600 mb-2">AGENT DETAILS:</div>
                                        {renderAllFields(data.agents)}
                                    </div>
                                )}

                                {row.module_name === 'accounts' && data.accounts && (
                                    <div>
                                        <div className="font-bold text-blue-600 mb-2">ACCOUNTS DETAILS:</div>
                                        {renderAllFields(data.accounts)}
                                    </div>
                                )}

                                {data.payments && data.payments.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-300">
                                        <div className="font-bold text-green-600 mb-2">PAYMENTS ({data.payments.length}):</div>
                                        {data.payments.map((payment, idx) => (
                                            <div key={idx} className="ml-2 mb-3 p-2 bg-gray-50 rounded">
                                                <div className="font-semibold mb-1">Payment {idx + 1}:</div>
                                                {renderAllFields(payment)}
                                            </div>
                                        ))}
                                    </div>
                                )}
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
                        <option value="umrah">Umrah</option>
                        <option value="visa_processing">Visa Processing</option>
                        <option value="gamca_token">GAMCA Token</option>
                        <option value="service">Services</option>
                        <option value="navtcc">NAVTCC</option>
                        <option value="protector">Protector</option>
                        <option value="refunded">Refunded</option>
                        <option value="expenses">Expenses</option>
                        <option value="vender">Vendor</option>
                        <option value="agent">Agent</option>
                        <option value="accounts">Office Accounts</option>
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