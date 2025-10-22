import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import TableSpinner from '../../ui/TableSpinner';
import Table from '../../ui/Table';
import axios from 'axios';

const Profit = () => {
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

  const safeParseFloat = (value) => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const fetchAllProfitData = useCallback(async () => {
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
        .filter(item => safeParseFloat(item.receivableAmount) > 0)
        .map(umrah => {
          let passengerName = '';
          if (umrah.passportDetail) {
            const details = parsePassportDetail(umrah.passportDetail);
            passengerName = `${details.firstName || ''} ${details.lastName || ''}`.trim();
          }
          const profit = safeParseFloat(umrah.receivableAmount) - safeParseFloat(umrah.paidCash) - safeParseFloat(umrah.paidInBank);
          
          return {
            type: 'Umrah',
            employee_name: umrah.userName || '',
            entry: umrah.entry || '',
            profit: isNaN(profit) ? 0 : profit,
            date: formatDate(umrah.createdAt),
            passengerName: passengerName || null,
          };
        });

      // Process Ticket bookings
      const ticketBookings = (ticketsData.data.ticket || [])
        .filter(item => safeParseFloat(item.receivable_amount) > 0)
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
          const profit = safeParseFloat(ticket.receivable_amount) - safeParseFloat(ticket.paid_cash) - safeParseFloat(ticket.paid_in_bank);

          return {
            type: 'Ticket',
            employee_name: ticket.employee_name || '',
            entry: ticket.entry || '',
            profit: isNaN(profit) ? 0 : profit,
            date: formatDate(ticket.created_at),
            passengerName: passengerName,
          };
        });

      // Process Visa bookings
      const visaBookings = (visaData.data.visa_processing || [])
        .filter(item => safeParseFloat(item.receivable_amount) > 0)
        .map(visa => {
          const details = parsePassportDetail(visa.passport_detail);
          const profit = safeParseFloat(visa.receivable_amount) - safeParseFloat(visa.paid_cash) - safeParseFloat(visa.paid_in_bank);
          
          return {
            type: 'Visa Processing',
            employee_name: visa.employee_name || '',
            entry: visa.entry || '',
            profit: isNaN(profit) ? 0 : profit,
            date: formatDate(visa.created_at),
            passengerName: `${details.firstName || ''} ${details.lastName || ''}`.trim(),
          };
        });

      // Process GAMCA Token bookings
      const gamcaTokenBookings = (gamcaTokenData.data.gamcaTokens || [])
        .filter(item => safeParseFloat(item.receivable_amount) > 0)
        .map(token => {
          const details = parsePassportDetail(token.passport_detail);
          const profit = safeParseFloat(token.receivable_amount) - safeParseFloat(token.paid_cash) - safeParseFloat(token.paid_in_bank);
          
          return {
            type: 'GAMCA Token',
            employee_name: token.employee_name || '',
            entry: token.entry || '',
            profit: isNaN(profit) ? 0 : profit,
            date: formatDate(token.created_at),
            passengerName: `${details.firstName || ''} ${details.lastName || ''}`.trim(),
          };
        });

      // Process Services bookings
      const servicesBookings = (servicesData.data.services || [])
        .filter(item => safeParseFloat(item.receivable_amount) > 0)
        .map(service => {
          const profit = safeParseFloat(service.receivable_amount) - safeParseFloat(service.paid_cash) - safeParseFloat(service.paid_in_bank);
          
          return {
            type: 'Services',
            employee_name: service.user_name || '',
            entry: service.entry || '',
            profit: isNaN(profit) ? 0 : profit,
            date: formatDate(service.booking_date),
            passengerName: service.customer_add || null,
          };
        });

      // Process Navtcc bookings
      const navtccBookings = (navtccData.data.navtcc || [])
        .filter(item => safeParseFloat(item.receivable_amount) > 0)
        .map(navtcc => {
          const details = parsePassportDetail(navtcc.passport_detail);
          const profit = safeParseFloat(navtcc.receivable_amount) - safeParseFloat(navtcc.paid_cash) - safeParseFloat(navtcc.paid_in_bank);
          
          return {
            type: 'Navtcc',
            employee_name: navtcc.employee_name || navtcc.reference || '',
            entry: navtcc.entry || '',
            profit: isNaN(profit) ? 0 : profit,
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

      // Log data for debugging
      console.log('Processed Profit Data:', allData);

      // Validate that all entries have a profit value
      const invalidEntries = allData.filter(item => item.profit === undefined || item.profit === null);
      if (invalidEntries.length > 0) {
        console.warn('Invalid entries found with undefined/null profit:', invalidEntries);
      }

      setData(allData);
    } catch (err) {
      console.error('Error fetching profit data:', err);
      setError('Failed to load profit data');
    } finally {
      setIsLoading(false);
    }
  }, [BASE_URL]);

  useEffect(() => {
    fetchAllProfitData();
  }, [fetchAllProfitData]);

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
    // Log filtered data for debugging
    console.log('Filtered Data:', filteredData);
  }, [data, selectedType]);

  const handleTypeChange = (e) => {
    setSelectedType(e.target.value);
  };

  // Get unique types for filter dropdown
  const uniqueTypes = ['all', ...new Set(data.map(item => item.type))];

  // Calculate totals
  const totalProfit = filteredData.reduce((sum, item) => sum + safeParseFloat(item.profit), 0);

  const columns = [
    { header: 'DATE', accessor: 'date' },
    { header: 'TYPE', accessor: 'type' },
    { header: 'EMPLOYEE', accessor: 'employee_name' },
    { header: 'ENTRY', accessor: 'entry' },
    { header: 'PASSENGER NAME', accessor: 'passengerName' },
    { 
      header: 'PROFIT', 
      accessor: 'profit',
      render: (row) => {
        const profitValue = safeParseFloat(row.profit);
        console.log('Rendering profit for row:', { entry: row.entry, type: row.type, profit: row.profit, parsedProfit: profitValue });
        return (
          <span className={`font-bold ${profitValue < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {profitValue.toLocaleString()}
          </span>
        );
      }
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Profit Amounts</h1>
        
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
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 px-4 py-2 rounded-lg border border-amber-200">
              <p className="text-xs text-amber-600 font-semibold">Total Profit</p>
              <p className="text-lg font-bold text-amber-700">{totalProfit.toLocaleString()}</p>
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
              <p className="text-gray-500 text-lg">No profit data found</p>
              <p className="text-gray-400 text-sm mt-2">No bookings with profit available!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profit;