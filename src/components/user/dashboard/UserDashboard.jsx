import { useEffect, useState, useCallback } from 'react';
import { CheckCircle } from 'lucide-react';
import axios from 'axios';
import TableSpinner from '../../ui/TableSpinner';

const api = axios.create({
  baseURL: import.meta.env.VITE_LIVE_API_BASE_URL
});


const cache = {
  data: new Map(),
  timestamp: new Map(),
  ttl: 5 * 60 * 1000, 
};

export default function UserDashboard() {
  const [dashboardData, setDashboardData] = useState({
    totalBookings: 0,
    bookingsByType: [],
    recentTickets: [],
    recentUmrah: []
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({
    dashboard: null,
    tickets: null,
    umrah: null
  });

  
  const fetchWithCache = useCallback(async (endpoint) => {
    const now = Date.now();
    const cacheKey = endpoint;
    
    
    if (cache.data.has(cacheKey)) {
      const timestamp = cache.timestamp.get(cacheKey);
      if (now - timestamp < cache.ttl) {
        return cache.data.get(cacheKey);
      }
    }
    
    
    const response = await api.get(endpoint);
    
    
    cache.data.set(cacheKey, response.data);
    cache.timestamp.set(cacheKey, now);
    
    return response.data;
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      
      try {
        
        const [dashboardData, ticketsData, umrahData] = await Promise.all([
          fetchWithCache('/dashboard').catch(err => {
            setErrors(prev => ({...prev, dashboard: 'Failed to load dashboard summary'}));
            console.error('Dashboard fetch error:', err);
            return { data: { totalBookings: 0, bookingsByType: [] } };
          }),
          
          fetchWithCache('/ticket').catch(err => {
            setErrors(prev => ({...prev, tickets: 'Failed to load tickets data'}));
            console.error('Tickets fetch error:', err);
            return { ticket: [] };
          }),
          
          fetchWithCache('/umrah').catch(err => {
            setErrors(prev => ({...prev, umrah: 'Failed to load umrah data'}));
            console.error('Umrah fetch error:', err);
            return { umrahBookings: [] };
          })
        ]);
        
        
        const recentTickets = ticketsData.ticket
          .sort((a, b) => new Date(b.travel_date) - new Date(a.travel_date))
          .slice(0, 5)
          .map(ticket => ({
            date: new Date(ticket.travel_date).toLocaleDateString(),
            name: ticket.employee_name || ticket.reference,
            detail: ticket.sector,
            amount: ticket.receivable_amount
          }));
        
        
        const recentUmrah = umrahData.umrahBookings
          .sort((a, b) => new Date(b.travelDate) - new Date(a.travelDate))
          .slice(0, 5)
          .map(booking => ({
            date: new Date(booking.travelDate).toLocaleDateString(),
            name: booking.userName || booking.reference,
            detail: booking.packageDetail,
            amount: booking.receivableAmount
          }));
        
        
        setDashboardData({
          ...dashboardData.data,
          recentTickets,
          recentUmrah
        });
        
        console.log("Dashboard data loaded successfully");
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
    
    //
    return () => {
    
    };
  }, [fetchWithCache]);

  const booking = dashboardData.bookingsByType || [];
  const ticket = booking.find(item => item.type === 'Ticket')?.count || 0;
  const umrah = booking.find(item => item.type === 'Umrah')?.count || 0;
  const visa = booking.find(item => item.type === 'Visa Processing')?.count || 0;

  const showPartialData = !isLoading && (dashboardData.recentTickets.length > 0 || dashboardData.recentUmrah.length > 0);

  return (
    <div className="bg-gray-50 p-2 rounded-lg max-h-screen overflow-hidden">


      <div className="grid grid-cols-3  gap-4 mb-4">
        <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500 shadow">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-gray-600 text-sm font-medium">Ticket</h2>
              <p className="text-2xl font-bold text-gray-800">
                {isLoading && !showPartialData ? 
                  <span className="text-gray-300">--</span> : 
                  ticket
                }
              </p>
            </div>
            <div className="bg-blue-100 p-1 sm:p-3 rounded-full">
              <CheckCircle  size={18} sm:size={24} className="text-blue-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border-l-4 border-yellow-500 shadow">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-gray-600 text-sm font-medium">Umrah</h2>
              <p className="text-2xl font-bold text-gray-800">
                {isLoading && !showPartialData ? 
                  <span className="text-gray-300">--</span> : 
                  umrah
                }
              </p>
            </div>
            <div className="bg-yellow-100 p-1 sm:p-3 rounded-full">
              <CheckCircle size={18} sm:size={24} className="text-yellow-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border-l-4 border-green-500 shadow">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-gray-600 text-sm font-medium">Visa</h2>
              <p className="text-2xl font-bold text-gray-800">
                {isLoading && !showPartialData ? 
                  <span className="text-gray-300">--</span> : 
                  visa
                }
              </p>
            </div>
            <div className="bg-green-100 p-1 sm:p-3  rounded-full">
              <CheckCircle size={18} sm:size={24} className="text-green-500" />
            </div>
          </div>
        </div>
      </div>
      
      {isLoading && !showPartialData ? (
        <div className="flex justify-center py-12">
          <TableSpinner/>
        </div>
      ) : (
        <>
          {/* Tables Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-gray-700">Umrah Detail</h2>
                {errors.umrah && <span className="text-xs text-red-500">{errors.umrah}</span>}
                {isLoading && <div className="w-4 h-4"><TableSpinner /></div>}
              </div>
              
              <div className="overflow-auto max-h-64">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detail</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dashboardData.recentUmrah && dashboardData.recentUmrah.length > 0 ? (
                      dashboardData.recentUmrah.map((booking, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{booking.date}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{booking.name}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{booking.detail}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{booking.amount}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-3 py-4 text-center text-sm text-gray-500">
                          No recent Umrah bookings found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Tickets Table */}
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-gray-700">Ticket Detail</h2>
                {errors.tickets && <span className="text-xs text-red-500">{errors.tickets}</span>}
                {isLoading && <div className="w-4 h-4"><TableSpinner /></div>}
              </div>
              
              <div className="overflow-auto max-h-64">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detail</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dashboardData.recentTickets && dashboardData.recentTickets.length > 0 ? (
                      dashboardData.recentTickets.map((booking, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{booking.date}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{booking.name}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{booking.detail}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{booking.amount}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-3 py-4 text-center text-sm text-gray-500">
                          No recent ticket bookings found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}