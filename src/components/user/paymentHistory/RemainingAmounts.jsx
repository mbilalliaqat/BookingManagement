import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import TableSpinner from '../../ui/TableSpinner';
import Table from '../../ui/Table';
import axios from 'axios';

const RemainingAmounts = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [filteredData, setFilteredData] = useState([]);

  const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    // Returns date in DD/MM/YYYY format
    return date.toLocaleDateString('en-GB'); 
  };

  const parsePassportDetail = (detail) => {
    try { return JSON.parse(detail); } catch { return {}; }
  };
  
 const calculateRemainingDays = (dateString) => {
    if (!dateString) return null;
    
    let targetDate;
    
    // Check if the date string includes '/' or '-' (common separators for DD/MM/YYYY or DD-MM-YYYY)
    if (dateString.includes('/') || dateString.includes('-')) {
        const separator = dateString.includes('/') ? '/' : '-';
        const parts = dateString.split(separator);
        
        // Attempt to parse as DD/MM/YYYY or DD-MM-YYYY
        // new Date(year, monthIndex, day)
        // Note: Month index is 0-based (January = 0, December = 11)
        targetDate = new Date(parts[2], parts[1] - 1, parts[0]);
    } else {
        // Assume YYYY-MM-DD or other standard format that new Date() handles natively
        targetDate = new Date(dateString);
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    
    // CRITICAL CHECK: If parsing failed, return null
    if (isNaN(targetDate.getTime())) {
        return null; 
    }

    targetDate.setHours(0, 0, 0, 0);

    const timeDiff = targetDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    return daysDiff;
  };

  // FIX: Ensure that 'remaining_date' is passed as the RAW date string (unformatted)
  const fetchAllRemainingData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [
        umrahData, ticketsData, visaData, gamcaTokenData, 
        servicesData, navtccData
      ] = await Promise.all([
        axios.get(`${BASE_URL}/umrah`).catch(() => ({ data: { umrahBookings: [] } })),
        axios.get(`${BASE_URL}/ticket`).catch(() => ({ data: { ticket: [] } })),
        axios.get(`${BASE_URL}/visa-processing`).catch(() => ({ data: { visa_processing: [] } })),
        axios.get(`${BASE_URL}/gamca-token`).catch(() => ({ data: { gamcaTokens: [] } })),
        axios.get(`${BASE_URL}/services`).catch(() => ({ data: { services: [] } })),
        axios.get(`${BASE_URL}/navtcc`).catch(() => ({ data: { navtcc: [] } })),
      ]);

      // Process Umrah bookings
      const umrahBookings = (umrahData.data.umrahBookings || [])
        .filter(item => item.remainingAmount > 0)
        .map(umrah => {
          let passengerName = '';
          if (umrah.passportDetail) {
            const details = parsePassportDetail(umrah.passportDetail);
            passengerName = `${details.firstName || ''} ${details.lastName || ''}`.trim();
          }
          
          return {
            type: 'Umrah',
            employee_name: umrah.userName,
            entry: umrah.entry,
            receivable_amount: umrah.receivableAmount,
            paid_cash: umrah.paidCash,
            paid_in_bank: umrah.paidInBank,
            remaining_amount: umrah.remainingAmount,
            remaining_date:   formatDate(umrah.remaining_date), // CRITICAL: Use raw date string
            date: formatDate(umrah.createdAt),
            passengerName: passengerName || null,
          };
        });

      // Process Ticket bookings
      const ticketBookings = (ticketsData.data.ticket || [])
        .filter(item => item.remaining_amount > 0)
        .map(ticket => {
          let passengerName = ticket.name || '';
          if (ticket.passport_detail) {
            try {
              const parsed = JSON.parse(ticket.passport_detail);
              const details = Array.isArray(parsed) ? parsed[0] : parsed;
              passengerName = `${details.firstName || ''} ${details.lastName || ''}`.trim();
            } catch (e) {
              passengerName = ticket.name || '';
            }
          }
          
          return {
            type: 'Ticket',
            employee_name: ticket.employee_name,
            entry: ticket.entry,
            receivable_amount: ticket.receivable_amount,
            paid_cash: ticket.paid_cash,
            paid_in_bank: ticket.paid_in_bank,
            remaining_amount: ticket.remaining_amount,
            remaining_date:   formatDate(ticket.remaining_date), // CRITICAL: Use raw date string
            date: formatDate(ticket.created_at),
            passengerName: passengerName,
          };
        });

      // Process Visa bookings
      const visaBookings = (visaData.data.visa_processing || [])
        .filter(item => item.remaining_amount > 0)
        .map(visa => {
          const details = parsePassportDetail(visa.passport_detail);
          return {
            type: 'Visa Processing',
            employee_name: visa.employee_name,
            entry: visa.entry,
            receivable_amount: visa.receivable_amount,
            paid_cash: visa.paid_cash,
            paid_in_bank: visa.paid_in_bank,
            remaining_amount: visa.remaining_amount,
            remaining_date:  formatDate(visa.remaining_date), // CRITICAL: Use raw date string
            date: formatDate(visa.created_at),
            passengerName: `${details.firstName || ''} ${details.lastName || ''}`.trim(),
          };
        });

      // Process GAMCA Token bookings
      const gamcaTokenBookings = (gamcaTokenData.data.gamcaTokens || [])
        .filter(item => item.remaining_amount > 0)
        .map(token => {
          const details = parsePassportDetail(token.passport_detail);
          return {
            type: 'GAMCA Token',
            employee_name: token.employee_name,
            entry: token.entry,
            receivable_amount: token.receivable_amount,
            paid_cash: token.paid_cash,
            paid_in_bank: token.paid_in_bank,
            remaining_amount: token.remaining_amount,
            remaining_date: formatDate( token.remaining_date), // CRITICAL: Use raw date string
            date: formatDate(token.created_at),
            passengerName: `${details.firstName || ''} ${details.lastName || ''}`.trim(),
          };
        });

      // Process Services bookings
     const servicesBookings = (servicesData.data.services || [])
        .filter(item => item.remaining_amount > 0)
        .map(service => ({
          type: 'Services',
          employee_name: service.user_name,
          entry: service.entry,
          receivable_amount: service.receivable_amount,
          paid_cash: service.paid_cash,
          paid_in_bank: service.paid_in_bank,
          remaining_amount: service.remaining_amount,
          remaining_date:  formatDate(service.remaining_date), // CRITICAL: Use raw date string
          date: formatDate(service.booking_date),
          passengerName: service.customer_add || null, // Use customer_add
        }));

      // Process Navtcc bookings
      const navtccBookings = (navtccData.data.navtcc || [])
        .filter(item => item.remaining_amount > 0)
        .map(navtcc => {
          const details = parsePassportDetail(navtcc.passport_detail);
          return {
            type: 'Navtcc',
            employee_name: navtcc.employee_name || navtcc.reference,
            entry: navtcc.entry,
            receivable_amount: navtcc.receivable_amount,
            paid_cash: navtcc.paid_cash,
            paid_in_bank: navtcc.paid_in_bank,
            remaining_amount: navtcc.remaining_amount,
            remaining_date: formatDate( navtcc.remaining_date), // CRITICAL: Use raw date string
            date: formatDate(navtcc.created_at),
            passengerName: `${details.firstName || ''} ${details.lastName || ''}`.trim(),
          };
        });

      const allData = [
        ...umrahBookings,
        ...ticketBookings,
        ...visaBookings,
        ...gamcaTokenBookings,
        ...servicesBookings,
        ...navtccBookings,
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      setData(allData);
      } catch (err) {
      console.error('Error fetching remaining amounts:', err);
      setError('Failed to load remaining amounts data');
    } finally {
      setIsLoading(false);
    }
  }, [BASE_URL]);

  useEffect(() => {
    // Filter logic based on selectedType
    const filtered = selectedType === 'all'
      ? data
      : data.filter(item => item.type === selectedType);
    setFilteredData(filtered);
  }, [data, selectedType]);

  useEffect(() => {
    fetchAllRemainingData();
  }, [fetchAllRemainingData]);


  // COLUMN DEFINITIONS: Updated to render badge with remaining days
  const columns = [
    { header: 'DATE', accessor: 'date' },
    { header: 'TYPE', accessor: 'type' },
    { header: 'EMPLOYEE', accessor: 'employee_name' },
    { header: 'ENTRY', accessor: 'entry' },
    { header: 'PASSENGER NAME', accessor: 'passengerName' },
    { header: 'RECEIVABLE AMOUNT', accessor: 'receivable_amount' },
    { header: 'PAID CASH', accessor: 'paid_cash' },
    { header: 'PAID IN BANK', accessor: 'paid_in_bank' },
    { header: 'REMAINING AMOUNT', accessor: 'remaining_amount' },
    {
        header: 'REMAINING DATE',
        accessor: 'remaining_date',
        // 'relative' is crucial for positioning the badge
        cellClass: 'text-center font-medium relative min-w-[120px]', 
        filter: 'text',
        Cell: ({ cell: { value } }) => {
            const dateStr = formatDate(value); // Formatted date for display (e.g., DD/MM/YYYY)
            const remainingDays = calculateRemainingDays(value); // Calculated days left

            let badgeClass = 'bg-gray-200 text-gray-800';
            let badgeContent = null; 

            // Only render the badge if we successfully calculated days AND have a formatted date
            if (remainingDays !== null && dateStr) { 
                if (remainingDays > 10) { 
                    badgeClass = 'bg-green-100 text-green-700';
                } else if (remainingDays >= 0 && remainingDays <= 10) { 
                    badgeClass = 'bg-yellow-100 text-yellow-700 animate-pulse';
                } else if (remainingDays < 0) {
                    badgeClass = 'bg-red-100 text-red-700';
                }
                
                badgeContent = (
                    <span 
                        className={`absolute top-0 right-0 transform -translate-y-1/2 translate-x-1/2 text-xs font-bold px-2 py-0.5 rounded-full shadow-md ${badgeClass}`}
                        title={remainingDays > 0 ? `Remaining Days: ${remainingDays}` : remainingDays === 0 ? 'Today' : `Days Passed: ${Math.abs(remainingDays)}`}
                    >
                        {remainingDays}
                    </span>
                );
            }
            
            return (
                <div className="flex items-center justify-center min-w-[100px]">
                    {dateStr} 
                    {badgeContent}
                </div>
            );
        }
    },
   
  ];
  
  // Calculate totals for dashboard cards
  const totalReceivable = filteredData.reduce((sum, item) => sum + (parseFloat(item.receivable_amount) || 0), 0);
  const totalPaidCash = filteredData.reduce((sum, item) => sum + (parseFloat(item.paid_cash) || 0), 0);
  const totalPaidInBank = filteredData.reduce((sum, item) => sum + (parseFloat(item.paid_in_bank) || 0), 0);
  const totalRemaining = filteredData.reduce((sum, item) => sum + (parseFloat(item.remaining_amount) || 0), 0);


  const handleTypeChange = (e) => {
    setSelectedType(e.target.value);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">Remaining Amounts Dashboard</h1>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <label htmlFor="type-select" className="text-gray-600 font-medium">Filter by Type:</label>
          <select
            id="type-select"
            value={selectedType}
            onChange={handleTypeChange}
            className="p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 transition duration-150 ease-in-out"
          >
            <option value="all">All</option>
            <option value="Umrah">Umrah</option>
            <option value="Ticket">Ticket</option>
            <option value="Visa Processing">Visa Processing</option>
            <option value="GAMCA Token">GAMCA Token</option>
            <option value="Services">Services</option>
            <option value="Navtcc">Navtcc</option>
          </select>
        </div>

        <div className="w-full md:w-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-2 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-600 font-semibold">Total Receivable</p>
              <p className="text-lg font-bold text-blue-700">{totalReceivable.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 px-4 py-2 rounded-lg border border-green-200">
              <p className="text-xs text-green-600 font-semibold">Total Paid (Cash)</p>
              <p className="text-lg font-bold text-green-700">{totalPaidCash.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 px-4 py-2 rounded-lg border border-yellow-200">
              <p className="text-xs text-yellow-600 font-semibold">Total Paid (Bank)</p>
              <p className="text-lg font-bold text-yellow-700">{totalPaidInBank.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-r from-red-50 to-red-100 px-4 py-2 rounded-lg border border-red-200">
              <p className="text-xs text-red-600 font-semibold">Total Remaining</p>
              <p className="text-lg font-bold text-red-700">{totalRemaining.toLocaleString()}</p>
            </div>
          </div>
        </div>
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
        ) : filteredData.length > 0 ? (
          <Table columns={columns} data={filteredData} />
        ) : (
          <div className="flex items-center justify-center w-full h-64">
            <div className="text-center">
              <div className="text-gray-400 text-5xl mb-4">
                <i className="fas fa-check-circle"></i>
              </div>
              <p className="text-gray-500 text-lg">No remaining amounts found for the selected filter.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RemainingAmounts;