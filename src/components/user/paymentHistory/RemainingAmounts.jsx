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
    return date.toLocaleDateString('en-GB');
  };

  const parsePassportDetail = (detail) => {
    try { return JSON.parse(detail); } catch { return {}; }
  };

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
      date: formatDate(umrah.createdAt),
      passengerName: passengerName || null,
    };
  });

      // Process Ticket bookings
      const ticketBookings = (ticketsData.data.ticket || [])
  .filter(item => item.remaining_amount > 0)
  .map(ticket => {
    let passengerName = ticket.name || ''; // fallback to 'name' field if it exists
    
    // Try to parse passport_detail if it exists
    if (ticket.passport_detail) {
      try {
        const parsed = JSON.parse(ticket.passport_detail);
        const details = Array.isArray(parsed) ? parsed[0] : parsed;
        passengerName = `${details.firstName || ''} ${details.lastName || ''}`.trim();
      } catch (e) {
        // If parsing fails, check if there's a 'name' field
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
    fetchAllRemainingData();
  }, [fetchAllRemainingData]);

  // Set initial selected type from navigation state
  useEffect(() => {
    if (location.state?.selectedType) {
      setSelectedType(location.state.selectedType);
    }
  }, [location.state]);

  // Filter data based on selected type
  useEffect(() => {
    if (selectedType === 'all') {
      setFilteredData(data);
    } else {
      setFilteredData(data.filter(item => item.type === selectedType));
    }
  }, [data, selectedType]);

  const handleTypeChange = (e) => {
    setSelectedType(e.target.value);
  };

  // Get unique types for filter dropdown
  const uniqueTypes = ['all', ...new Set(data.map(item => item.type))];

  // Calculate totals
  const totalReceivable = filteredData.reduce((sum, item) => sum + parseFloat(item.receivable_amount || 0), 0);
  const totalPaidCash = filteredData.reduce((sum, item) => sum + parseFloat(item.paid_cash || 0), 0);
  const totalPaidBank = filteredData.reduce((sum, item) => sum + parseFloat(item.paid_in_bank || 0), 0);
  const totalRemaining = filteredData.reduce((sum, item) => sum + parseFloat(item.remaining_amount || 0), 0);

  const columns = [
    { header: 'DATE', accessor: 'date' },
    { header: 'TYPE', accessor: 'type' },
    { header: 'EMPLOYEE', accessor: 'employee_name' },
    { header: 'ENTRY', accessor: 'entry' },
    { header: 'PASSENGER NAME', accessor: 'passengerName' },
    { header: 'RECEIVABLE AMOUNT', accessor: 'receivable_amount' },
    { header: 'PAID CASH', accessor: 'paid_cash' },
    { header: 'PAID IN BANK', accessor: 'paid_in_bank' },
    { header: 'REMAINING AMOUNT', accessor: 'remaining_amount' }
  //   { 
  //     header: 'REMAINING AMOUNT', 
  //     accessor: 'remaining_amount',
  //     render: (row) => (
  //       <span className="font-bold text-amber-600">
  //         {row.remaining_amount}
  //       </span>
  //     )
  //   },
   ];

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Remaining Amounts</h1>
        
        {/* Filter and Summary Section */}
        <div className="flex justify-between items-center mb-4">
          <select
            className="p-2 border border-gray-300 rounded-md"
            value={selectedType}
            onChange={handleTypeChange}
          >
            {uniqueTypes.map((type) => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Types' : type}
              </option>
            ))}
          </select>

          {/* Summary Cards */}
          <div className="flex gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-2 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-600 font-semibold">Total Receivable</p>
              <p className="text-lg font-bold text-blue-700">{totalReceivable.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 px-4 py-2 rounded-lg border border-green-200">
              <p className="text-xs text-green-600 font-semibold">Total Paid</p>
              <p className="text-lg font-bold text-green-700">{(totalPaidCash + totalPaidBank).toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 px-4 py-2 rounded-lg border border-amber-200">
              <p className="text-xs text-amber-600 font-semibold">Total Remaining</p>
              <p className="text-lg font-bold text-amber-700">{totalRemaining.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-4 py-2 rounded-lg border border-purple-200">
              <p className="text-xs text-purple-600 font-semibold">Total Entries</p>
              <p className="text-lg font-bold text-purple-700">{filteredData.length}</p>
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
              <p className="text-gray-500 text-lg">No remaining amounts found</p>
              <p className="text-gray-400 text-sm mt-2">All payments are completed!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RemainingAmounts;