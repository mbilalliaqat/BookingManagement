import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, Users, Plane, MapPin, FileText, CreditCard } from 'lucide-react';
import axios from 'axios';
import TableSpinner from '../../ui/TableSpinner';

// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_LIVE_API_BASE_URL
});

// Add caching for responses
const cache = {
  data: new Map(),
  timestamp: new Map(),
  ttl: 15 * 1000, 
};

export default function UserDashboard() {
  const [dashboardData, setDashboardData] = useState({
    combinedBookings: [],
    totalBookings: 0,
    bookingsByType: [],
    totalRevenue: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({
    dashboard: null,
    umrah: null,
    tickets: null,
    visa: null,
    gamcaToken: null
  });

  // Cached data fetching function
  const fetchWithCache = useCallback(async (endpoint) => {
    const now = Date.now();
    const cacheKey = endpoint;
    
    // Return cached data if it exists and is not expired
    if (cache.data.has(cacheKey)) {
      const timestamp = cache.timestamp.get(cacheKey);
      if (now - timestamp < cache.ttl) {
        return cache.data.get(cacheKey);
      }
    }
    
    // Make API call if cache is invalid or expired
    const response = await api.get(endpoint);
    
    // Update cache
    cache.data.set(cacheKey, response.data);
    cache.timestamp.set(cacheKey, now);
    
    return response.data;
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      
      try {
        // Fetch all data in parallel using Promise.all
        const [dashboardStats, umrahData, ticketsData, visaData, gamcaTokenData] = await Promise.all([
          fetchWithCache('/dashboard').catch(err => {
            setErrors(prev => ({...prev, dashboard: 'Failed to load dashboard summary'}));
            console.error('Dashboard fetch error:', err);
            return { data: { totalBookings: 0, bookingsByType: [], totalRevenue: 0 } };
          }),
          fetchWithCache('/umrah').catch(err => {
            setErrors(prev => ({...prev, umrah: 'Failed to load Umrah data'}));
            console.error('Umrah fetch error:', err);
            return { umrahBookings: [] };
          }),
          fetchWithCache('/ticket').catch(err => {
            setErrors(prev => ({...prev, tickets: 'Failed to load Tickets data'}));
            console.error('Tickets fetch error:', err);
            return { ticket: [] };
          }),
          fetchWithCache('/visa-processing').catch(err => {
            setErrors(prev => ({...prev, visa: 'Failed to load Visa data'}));
            console.error('Visa fetch error:', err);
            return { visa_processing: [] };
          }),
          fetchWithCache('/gamca-token').catch(err => {
            setErrors(prev => ({...prev, gamcaToken: 'Failed to load Gamca Token data'}));
            console.error('Gamca Token fetch error:', err);
            return { gamcaTokens: [] };
          })
        ]);

        // Process Umrah data
        const umrahBookings = umrahData.umrahBookings.map(booking => ({
          type: 'Umrah',
          employee_name: booking.userName || booking.reference,
          receivable_amount: booking.receivableAmount,
          paid_cash: booking.paidCash,
          paid_in_bank: booking.paidInBank,
          remaining_amount: booking.remainingAmount,
          booking_date: new Date(booking.createdAt).toLocaleDateString()
        }));

        // Process Tickets data
        const ticketBookings = ticketsData.ticket.map(ticket => ({
          type: 'Ticket',
          employee_name: ticket.employee_name || ticket.reference,
          receivable_amount: ticket.receivable_amount,
          paid_cash: ticket.paid_cash,
          paid_in_bank: ticket.paid_in_bank,
          remaining_amount: ticket.remaining_amount,
          booking_date: new Date(ticket.created_at).toLocaleDateString()
        }));

        // Process Visa data
        const visaBookings = visaData.visa_processing.map(visa => ({
          type: 'Visa',
          employee_name: visa.employee_name || visa.reference,
          receivable_amount: visa.receivable_amount,
          paid_cash: visa.paid_cash,
          paid_in_bank: visa.paid_in_bank,
          remaining_amount: visa.remaining_amount,
          booking_date: new Date(visa.created_at).toLocaleDateString()
        }));

        // Process Gamca Token data
        const gamcaTokenBookings = gamcaTokenData.gamcaTokens.map(token => ({
          type: 'Gamca Token',
          employee_name: token.employee_name || token.reference,
          receivable_amount: token.receivable_amount,
          paid_cash: token.paid_cash,
          paid_in_bank: token.paid_in_bank,
          remaining_amount: token.remaining_amount,
          booking_date: new Date(token.created_at).toLocaleDateString()
        }));

        // Combine and sort by booking date (most recent first)
        const combinedBookings = [
          ...umrahBookings,
          ...ticketBookings,
          ...visaBookings,
          ...gamcaTokenBookings
        ].sort((a, b) => new Date(b.booking_date) - new Date(a.booking_date));

        // Update state with both dashboard stats and combined bookings
        setDashboardData({
          combinedBookings,
          totalBookings: dashboardStats.data.totalBookings,
          bookingsByType: dashboardStats.data.bookingsByType,
          totalRevenue: dashboardStats.data.totalRevenue
        });
        
        console.log("Dashboard data loaded successfully");
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
    
    // Clean-up function (optional)
    return () => {
      // Any cleanup if needed
    };
  }, [fetchWithCache]);

  // Extract counts for individual booking types
  const booking = dashboardData.bookingsByType || [];
  const ticketCount = booking.find(item => item.type === 'Ticket')?.count || 0;
  const umrahCount = booking.find(item => item.type === 'Umrah')?.count || 0;
  const visaCount = booking.find(item => item.type === 'Visa Processing')?.count || 0;
  const gamcaTokenCount = booking.find(item => item.type === 'GAMCA Token')?.count || 0;

  const showPartialData = !isLoading && dashboardData.combinedBookings.length > 0;

  // Define table columns
  const columns = [
    { header: 'TYPE', accessor: 'type' },
    { header: 'EMPLOYEE NAME', accessor: 'employee_name' },
    { header: 'DATE', accessor: 'booking_date' },
    { header: 'RECEIVABLE AMOUNT', accessor: 'receivable_amount' },
    { header: 'PAID CASH', accessor: 'paid_cash' },
    { header: 'PAID IN BANK', accessor: 'paid_in_bank' },
    { header: 'REMAINING AMOUNT', accessor: 'remaining_amount' },
  ];

  return (
    <div className="bg-gray-50 p-2 rounded-lg max-h-screen overflow-hidden">
      {/* Stats Cards Section */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
        {/* Total Bookings Card */}
        <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500 shadow">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-gray-600 text-sm font-medium">Total Entries</h2>
              <p className="text-2xl font-bold text-gray-800">
                {isLoading && !showPartialData ? 
                  <span className="text-gray-300">--</span> : 
                  dashboardData.totalBookings
                }
              </p>
            </div>
            <div className="bg-purple-100 p-1 sm:p-3 rounded-full">
              <Users size={18} className="text-purple-500" />
            </div>
          </div>
        </div>

        {/* Ticket Card */}
        <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500 shadow">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-gray-600 text-sm font-medium">Ticket</h2>
              <p className="text-2xl font-bold text-gray-800">
                {isLoading && !showPartialData ? 
                  <span className="text-gray-300">--</span> : 
                  ticketCount
                }
              </p>
            </div>
            <div className="bg-blue-100 p-1 sm:p-3 rounded-full">
              <Plane size={18} className="text-blue-500" />
            </div>
          </div>
        </div>
        
        {/* Umrah Card */}
        <div className="bg-white p-4 rounded-lg border-l-4 border-yellow-500 shadow">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-gray-600 text-sm font-medium">Umrah</h2>
              <p className="text-2xl font-bold text-gray-800">
                {isLoading && !showPartialData ? 
                  <span className="text-gray-300">--</span> : 
                  umrahCount
                }
              </p>
            </div>
            <div className="bg-yellow-100 p-1 sm:p-3 rounded-full">
              <MapPin size={18} className="text-yellow-500" />
            </div>
          </div>
        </div>
        
        {/* Visa Card */}
        <div className="bg-white p-4 rounded-lg border-l-4 border-green-500 shadow">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-gray-600 text-sm font-medium">Visa</h2>
              <p className="text-2xl font-bold text-gray-800">
                {isLoading && !showPartialData ? 
                  <span className="text-gray-300">--</span> : 
                  visaCount
                }
              </p>
            </div>
            <div className="bg-green-100 p-1 sm:p-3 rounded-full">
              <FileText size={18} className="text-green-500" />
            </div>
          </div>
        </div>

        {/* GAMCA Token Card */}
        <div className="bg-white p-4 rounded-lg border-l-4 border-red-500 shadow">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-gray-600 text-sm font-medium">GAMCA Token</h2>
              <p className="text-2xl font-bold text-gray-800">
                {isLoading && !showPartialData ? 
                  <span className="text-gray-300">--</span> : 
                  gamcaTokenCount
                }
              </p>
            </div>
            <div className="bg-red-100 p-1 sm:p-3 rounded-full">
              <CreditCard size={18} className="text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      {isLoading && !showPartialData ? (
        <div className="flex justify-center py-12">
          <TableSpinner />
        </div>
      ) : (
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-700">All Bookings</h2>
            {(errors.umrah || errors.tickets || errors.visa || errors.gamcaToken) && (
              <span className="text-xs text-red-500">
                {Object.values(errors).filter(e => e).join(', ')}
              </span>
            )}
          </div>
          <div className="overflow-auto max-h-75">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((col, index) => (
                    <th
                      key={index}
                      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData.combinedBookings.length > 0 ? (
                  dashboardData.combinedBookings.map((booking, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{booking.type}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm  text-gray-700">{booking.employee_name}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{booking.booking_date}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{booking.receivable_amount}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{booking.paid_cash}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{booking.paid_in_bank}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{booking.remaining_amount}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-3 py-4 text-center text-sm text-gray-500">
                      No recent bookings found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}