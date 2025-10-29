import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, Users, Plane, MapPin, FileText, CreditCard, Wallet, Landmark, Filter } from 'lucide-react'; // Added Wallet and Landmark icons
import axios from 'axios';
import TableSpinner from '../../ui/TableSpinner';
import DateRangePicker from '../../ui/DateRangePicker';

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
    totalRevenue: 0,
    totalProtectorWithdraw: 0,
    totalExpenseWithdraw:0,
    totalRefundedWithdraw:0,
    totalVendorWithdraw:0,
    TotalWithdraw:0,
    cashInOffice: 0, // State to hold global cash in office calculation
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [errors, setErrors] = useState({
    dashboard: null,
    umrah: null,
    tickets: null,
    visa: null,
    gamcaToken: null,
    services:null,
    protector: null,
    expenses:null,
    refunded:null,
    vendor:null,
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

  const handleDateRangeChange = useCallback((startDate, endDate) => {
    setDateRange({ startDate, endDate });
  }, []);

  // Filter bookings based on date range
  const filterBookingsByDateRange = useCallback((bookings, startDate, endDate) => {
    if (!startDate || !endDate) return bookings;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Set time to start and end of day for accurate comparison
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.booking_date);
      return bookingDate >= start && bookingDate <= end;
    });
  }, []);

  // Update filtered bookings when date range or dashboard data changes
  useEffect(() => {
    const filtered = filterBookingsByDateRange(
      dashboardData.combinedBookings, 
      dateRange.startDate, 
      dateRange.endDate
    );
    setFilteredBookings(filtered);
  }, [dashboardData.combinedBookings, dateRange, filterBookingsByDateRange]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      
      try {
        // Fetch all data in parallel using Promise.all
        const [
          dashboardStats,
          umrahData,
          ticketsData,
          visaData,
          gamcaTokenData,
          servicesData,
          protectorData, 
          expensesData,
          refundedData,
          venderData,
        ] = await Promise.all([
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
          }),
           fetchWithCache('/services').catch(err => {
            setErrors(prev => ({...prev, services: 'Failed to load Services data'}));
            console.error('Services fetch error:', err);
            return { services: [] };
          }),
          fetchWithCache('/protector').catch(err => { // New fetch for Protector data
            setErrors(prev => ({...prev, protector: 'Failed to load Protector data'}));
            console.error('Protector fetch error:', err);
            return { protectors: [] };
          }),
          fetchWithCache('/expenses').catch(err => {
            setErrors(prev => ({...prev, expenses: 'Failed to load Expenses data'}));
            console.error('Expenses fetch error:', err);
            return { expenses: [] };
          }),
          fetchWithCache('/refunded').catch(err => {
            setErrors(prev => ({...prev, refunded: 'Failed to load Refunded data'}));
            console.error('Refunded fetch error:', err);
            return { refunded: [] };
          }),
          fetchWithCache('/vender').catch(err => {
            setErrors(prev => ({...prev, vender: 'Failed to load Vender data'}));
            console.error('Vendor fetch error:', err);
            return { vender: [] };
          }),
        ]);

        // Process Umrah data
        const umrahBookings = umrahData.umrahBookings.map(booking => {
          let passportDetails = {};
          try {
              if (typeof booking.passportDetail === 'string') {
                  passportDetails = JSON.parse(booking.passportDetail);
              } else if (typeof booking.passportDetail === 'object' && booking.passportDetail !== null) {
                  passportDetails = booking.passportDetail;
              }
          } catch (e) {
              console.error("Error parsing passport details for Umrah booking:", e);
          }
          return {
              type: 'Umrah',
              employee_name: booking.userName || booking.reference,
              receivable_amount: booking.receivableAmount,
              paid_cash: booking.paidCash,
              paid_in_bank: booking.paidInBank,
              remaining_amount: booking.remainingAmount,
              booking_date: new Date(booking.createdAt).toLocaleDateString(),
              withdraw: 0, 
              passengerName: `${passportDetails.firstName || ''} ${passportDetails.lastName || ''}`.trim(), 
          };
        });

        // Process Tickets data
        const ticketBookings = ticketsData.ticket.map(ticket => {
          let passportDetails = {};
          try {
              if (typeof ticket.passport_detail === 'string') {
                  passportDetails = JSON.parse(ticket.passport_detail);
              } else if (typeof ticket.passport_detail === 'object' && ticket.passport_detail !== null) {
                  passportDetails = ticket.passport_detail;
              }
          } catch (e) {
              console.error("Error parsing passport details for Ticket:", e);
          }
          return {
              type: 'Ticket',
              employee_name: ticket.employee_name || ticket.reference,
              receivable_amount: ticket.receivable_amount,
              paid_cash: ticket.paid_cash,
              paid_in_bank: ticket.paid_in_bank,
              remaining_amount: ticket.remaining_amount,
              booking_date: new Date(ticket.created_at).toLocaleDateString(),
              withdraw: 0,
              passengerName: `${passportDetails.firstName || ''} ${passportDetails.lastName || ''}`.trim(), 
          };
        });

        // Process Visa data
        const visaBookings = visaData.visa_processing.map(visa => {
          let passportDetails = {};
          try {
              if (typeof visa.passport_detail === 'string') {
                  passportDetails = JSON.parse(visa.passport_detail);
              } else if (typeof visa.passport_detail === 'object' && visa.passport_detail !== null) {
                  passportDetails = visa.passport_detail;
              }
          } catch (e) {
              console.error("Error parsing passport details for Visa:", e);
          }
          return {
              type: 'Visa',
              employee_name: visa.employee_name || visa.reference,
              receivable_amount: visa.receivable_amount,
              paid_cash: visa.paid_cash,
              paid_in_bank: visa.paid_in_bank,
              remaining_amount: visa.remaining_amount,
              booking_date: new Date(visa.created_at).toLocaleDateString(),
              withdraw: 0,
              passengerName: `${passportDetails.firstName || ''} ${passportDetails.lastName || ''}`.trim(), 
          };
        });

        // Process Gamca Token data
        const gamcaTokenBookings = gamcaTokenData.gamcaTokens.map(token => {
          let passportDetails = {};
          try {
              if (typeof token.passport_detail === 'string') {
                  passportDetails = JSON.parse(token.passport_detail);
              } else if (typeof token.passport_detail === 'object' && token.passport_detail !== null) {
                  passportDetails = token.passport_detail;
              }
          } catch (e) {
              console.error("Error parsing passport details for GAMCA token:", e);
          }
          return {
              type: 'Gamca Token',
              employee_name: token.employee_name || token.reference,
              receivable_amount: token.receivable_amount,
              paid_cash: token.paid_cash,
              paid_in_bank: token.paid_in_bank,
              remaining_amount: token.remaining_amount,
              booking_date: new Date(token.created_at).toLocaleDateString(),
              withdraw: 0, // Initialize withdraw for non-protector types
              passengerName: `${passportDetails.firstName || ''} ${passportDetails.lastName || ''}`.trim(),
          };
        });

        // Process Services data
        const servicesBookings = servicesData.services.map(services => ({
          type: 'Services',
          employee_name: services.user_name,
          receivable_amount: services.receivable_amount,
          paid_cash: services.paid_cash,
          paid_in_bank: services.paid_in_bank,
          remaining_amount: services.remaining_amount,
          booking_date: new Date(services.booking_date).toLocaleDateString(),
          withdraw: 0, // Initialize withdraw for non-protector types
          passengerName: null, // No passport detail for this type
        }));

        // Process Protector data (NEW)
        const protectorBookings = protectorData.protectors.map(protector => ({
          type: 'Protector',
          employee_name: protector.employee,
          receivable_amount: 0, 
          paid_cash: 0, 
          paid_in_bank: 0, 
          remaining_amount: 0, 
          booking_date: new Date(protector.protector_date).toLocaleDateString(),
          withdraw: parseFloat(protector.withdraw || 0), // Use the withdraw field from protector
          passengerName: protector.name || null, // No passport detail for this type
        }));
        const expensesBookings = expensesData.expenses.map(expenses => ({
          type: 'Expenses',
          employee_name: expenses.user_name,
          receivable_amount: 0, 
          paid_cash: 0, 
          paid_in_bank: 0, 
          remaining_amount: 0, 
          booking_date: new Date(expenses.date).toLocaleDateString(),
          withdraw: parseFloat(expenses.withdraw || 0), // Use the withdraw field from expenses
          passengerName: null, // No passport detail for this type
        }));
        const refundedBookings = (refundedData.refunded || []).map(refund => ({
          type: 'Refunded',
          employee_name: refund.employee,
          receivable_amount: 0, 
          paid_cash: 0, 
          paid_in_bank: 0, 
          remaining_amount: 0, 
          booking_date: new Date(refund.date).toLocaleDateString(), // Changed from refund.refunded_date
          withdraw: parseFloat(refund.withdraw || 0),
          passengerName:refund.name || null, // No passport detail for this type
        }));
          const venderBookings = (venderData.vender || []).map(vender => ({
          type: 'Vender',
          employee_name: vender.user_name, // Changed from vender.employee
          receivable_amount: 0, 
          paid_cash: 0, 
          paid_in_bank: 0, 
          remaining_amount: 0, 
          booking_date: new Date(vender.date).toLocaleDateString(), // Changed from vender.vender_date
          withdraw: parseFloat(vender.withdraw || 0),
          passengerName: null, // No passport detail for this type
        }));

        // Combine all bookings
        const combinedBookingsRaw = [
          ...umrahBookings,
          ...ticketBookings,
          ...visaBookings,
          ...gamcaTokenBookings,
          ...servicesBookings,
          ...protectorBookings,
          ...expensesBookings,
          ...refundedBookings,
          ...venderBookings, 
        ];

        // Sort bookings by date (oldest first) to calculate running cash in office
        const sortedForRunningTotal = combinedBookingsRaw.sort((a, b) => 
          new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime()
        );

        let runningCashInOffice = 0;
        // Calculate running cash in office for each booking
        const bookingsWithCashInOffice = sortedForRunningTotal.map(booking => {
          // Add paid_cash if it's a type that generates cash
          runningCashInOffice += parseFloat(booking.paid_cash || 0);
          // Subtract withdraw if it's a type that involves withdrawal
          runningCashInOffice -= parseFloat(booking.withdraw || 0);
          
          return {
            ...booking,
            cash_in_office_running: runningCashInOffice, // Store the running balance
          };
        });

        // No re-sorting by date (most recent first) for display,
        // so the table will display in chronological order (oldest to newest)
        const finalCombinedBookings = bookingsWithCashInOffice; 

        // Calculate total protector withdraw
        const totalProtectorWithdraw = protectorBookings.reduce((sum, entry) => {
          return sum + entry.withdraw;
        }, 0);
        
        const totalExpensesWithdraw = expensesBookings.reduce((sum, entry) => {
          return sum + entry.withdraw;
        }, 0);
        const totalRefundedWithdraw = refundedBookings.reduce((sum, entry) => {
          return sum + entry.withdraw;
        }, 0);
        const totalVendorWithdraw = venderBookings.reduce((sum, entry) => {
          return sum + entry.withdraw;
        }, 0);

        // Calculate total paid cash from all combined bookings (global total)
        const totalPaidCash = finalCombinedBookings.reduce((sum, booking) => {
          return sum + parseFloat(booking.paid_cash || 0);
        }, 0);

        // Calculate global Cash in Office (NEW: total paid cash - total withdraws)
        const cashInOffice =  totalPaidCash - totalProtectorWithdraw - totalExpensesWithdraw - totalRefundedWithdraw - totalVendorWithdraw;
        const TotalWithdraw = totalProtectorWithdraw + totalExpensesWithdraw + totalRefundedWithdraw + totalVendorWithdraw


        // Update state with both dashboard stats and combined bookings
        setDashboardData({
          combinedBookings: finalCombinedBookings, // Use the processed array
          totalBookings: dashboardStats.data.totalBookings,
          bookingsByType: dashboardStats.data.bookingsByType,
          totalRevenue: dashboardStats.data.totalRevenue,
          totalProtectorWithdraw, 
          totalExpensesWithdraw,
          totalRefundedWithdraw,
          totalVendorWithdraw,
          cashInOffice, // This remains the global calculated value
          TotalWithdraw,
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
  const serviceCount = booking.find(item => item.type === 'Services')?.count || 0;

  // Calculate total receivable amount
  const totalReceivableAmount = dashboardData.combinedBookings.reduce((sum, booking) => {
    return sum + parseFloat(booking.receivable_amount || 0); // Convert to number
  }, 0);

  // Calculate total paid cash (already derived above for cashInOffice calculation, but keeping this for consistency with existing code)
  const totalPaidCash = dashboardData.combinedBookings.reduce((sum, booking) => {
    return sum + parseFloat(booking.paid_cash || 0); // Convert to number
  }, 0);

  // Calculate total paid in bank
  const totalPaidInBank = dashboardData.combinedBookings.reduce((sum, booking) => {
    return sum + parseFloat(booking.paid_in_bank || 0); // Convert to number
  }, 0);

  // Calculate total remaining amount
  const totalRemainingAmount = dashboardData.combinedBookings.reduce((sum, booking) => {
    return sum + parseFloat(booking.remaining_amount || 0); // Convert to number
  }, 0);

  const showPartialData = !isLoading && dashboardData.combinedBookings.length > 0;

  // Define table columns (Add new columns)
  const columns = [
    { header: 'DATE', accessor: 'booking_date' },
    { header: 'EMPLOYEE NAME', accessor: 'employee_name' },
    { header: 'TYPE', accessor: 'type' },
    { header: 'NAME', accessor: 'passengerName' }, // New NAME column
    { header: 'RECEIVABLE AMOUNT', accessor: 'receivable_amount' },
    { header: 'PAID CASH', accessor: 'paid_cash' },
    { header: 'PAID IN BANK', accessor: 'paid_in_bank' },
    { header: 'REMAINING AMOUNT', accessor: 'remaining_amount' },
    { header: 'WITHDRAW', accessor: 'withdraw' }, // New column for withdraw
    { header: 'CASH IN OFFICE', accessor: 'cash_in_office_display' }, // New column for calculated cash in office
  ];

  return (
    <div className="bg-gray-50 p-2 rounded-lg  overflow-hidden">
      {/* Stats Cards Section */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
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

         <div className="bg-white p-4 rounded-lg border-l-4 border-red-500 shadow">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-gray-600 text-sm font-medium">Service</h2>
              <p className="text-2xl font-bold text-gray-800">
                {isLoading && !showPartialData ? 
                  <span className="text-gray-300">--</span> : 
                  serviceCount
                }
              </p>
            </div>
            <div className="bg-red-100 p-1 sm:p-3 rounded-full">
              <CreditCard size={18} className="text-red-500" />
            </div>
          </div>
        </div>

        {/* Total Receivable Amount Card */}
        <div className="bg-white p-4 rounded-lg border-l-4 border-teal-500 shadow">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-gray-600 text-sm font-medium">Total Receivable</h2>
              <p className="text-2xl font-bold text-gray-800">
                {isLoading && !showPartialData ?
                  <span className="text-gray-300">--</span> :
                  totalReceivableAmount.toLocaleString() 
                }
              </p>
            </div>
            <div className="bg-teal-100 p-1 sm:p-3 rounded-full">
              <CreditCard size={18} className="text-teal-500" /> 
            </div>
          </div>
        </div>

        {/* Total Paid Cash Card */}
        <div className="bg-white p-4 rounded-lg border-l-4 border-indigo-500 shadow">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-gray-600 text-sm font-medium">Total Paid Cash</h2>
              <p className="text-2xl font-bold text-gray-800">
                {isLoading && !showPartialData ?
                  <span className="text-gray-300">--</span> :
                  totalPaidCash.toLocaleString() 
                }
              </p>
            </div>
            <div className="bg-indigo-100 p-1 sm:p-3 rounded-full">
              <CreditCard size={18} className="text-indigo-500" /> 
            </div>
          </div>
        </div>

        {/* Total Paid In Bank Card */}
        <div className="bg-white p-4 rounded-lg border-l-4 border-orange-500 shadow">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-gray-600 text-sm font-medium">Total Paid In Bank</h2>
              <p className="text-2xl font-bold text-gray-800">
                {isLoading && !showPartialData ?
                  <span className="text-gray-300">--</span> :
                  totalPaidInBank.toLocaleString() 
                }
              </p>
            </div>
            <div className="bg-orange-100 p-1 sm:p-3 rounded-full">
              <CreditCard size={18} className="text-orange-500" /> 
            </div>
          </div>
        </div>

        {/* Total Remaining Amount Card */}
        <div className="bg-white p-4 rounded-lg border-l-4 border-pink-500 shadow">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-gray-600 text-sm font-medium">Total Remaining Amount</h2>
              <p className="text-2xl font-bold text-gray-800">
                {isLoading && !showPartialData ?
                  <span className="text-gray-300">--</span> :
                  totalRemainingAmount.toLocaleString() 
                }
              </p>
            </div>
            <div className="bg-pink-100 p-1 sm:p-3 rounded-full">
              <CreditCard size={18} className="text-pink-500" /> 
            </div>
          </div>
        </div>

        {/* Total Withdraw Card (NEW) */}
        <div className="bg-white p-4 rounded-lg border-l-4 border-purple-700 shadow">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-gray-600 text-sm font-medium"> Withdraw</h2>
              <p className="text-2xl font-bold text-gray-800">
                {isLoading && !showPartialData ?
                  <span className="text-gray-300">--</span> :
                  dashboardData.TotalWithdraw.toLocaleString()
                }
              </p>
            </div>
            <div className="bg-purple-200 p-1 sm:p-3 rounded-full">
              <Wallet size={18} className="text-purple-700" />
            </div>
          </div>
        </div>

        {/* Cash in Office Card (NEW) */}
        <div className="bg-white p-4 rounded-lg border-l-4 border-cyan-500 shadow">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-gray-600 text-sm font-medium">Cash in Office</h2>
              <p className="text-2xl font-bold text-gray-800">
                {isLoading && !showPartialData ?
                  <span className="text-gray-300">--</span> :
                  dashboardData.cashInOffice.toLocaleString()
                }
              </p>
            </div>
            <div className="bg-cyan-100 p-1 sm:p-3 rounded-full">
              <Landmark size={18} className="text-cyan-500" />
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">All Bookings</h2>
            <div className="flex items-center space-x-4">
              {(errors.umrah || errors.tickets || errors.visa || errors.gamcaToken || errors.services || errors.protector) && ( 
                <span className="text-xs text-red-500">
                  {Object.values(errors).filter(e => e).join(', ')}
                </span>
              )}
              <div className="flex items-center space-x-2">
                <Filter size={16} className="text-indigo-600" />
                <span className="text-sm text-gray-600 font-medium">Filter by Date:</span>
              </div>
            </div>
          </div>
          
          {/* Date Range Picker */}
          <div className="mb-4 flex items-center space-x-4">
            <DateRangePicker
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onDateChange={handleDateRangeChange}
              placeholder="Select date range to filter bookings"
              className="max-w-md"
            />
            {(dateRange.startDate || dateRange.endDate) && (
              <div className="text-sm text-gray-600">
                Showing {filteredBookings.length} of {dashboardData.combinedBookings.length} bookings
              </div>
            )}
          </div>
          <div className="overflow-y-auto max-h-[60vh] rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 sticky top-0">
                <tr>
                  {columns.map((col, index) => (
                    <th
                      key={index}
                      className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider"
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(dateRange.startDate && dateRange.endDate ? filteredBookings : dashboardData.combinedBookings).length > 0 ? (
                  (dateRange.startDate && dateRange.endDate ? filteredBookings : dashboardData.combinedBookings).map((booking, index) => (
                    <tr 
                      key={index}
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-gradient-to-r from-indigo-50/30 via-purple-50/20 to-pink-50/30'} hover:bg-gradient-to-r hover:from-indigo-100/40 hover:via-purple-100/30 hover:to-pink-100/40 transition-all duration-200`}
                    >
                      <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-700">{booking.booking_date}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700 truncate" title={booking.employee_name}>{booking.employee_name}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold">
                        <span className="px-2 py-1 rounded-md bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 inline-block">
                          {booking.type}
                        </span>
                      </td>   
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700 truncate" title={booking.passengerName}>
                        {booking.passengerName ? booking.passengerName : <span className="text-gray-400">--</span>}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-emerald-600">{booking.receivable_amount}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">{booking.paid_cash}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">{booking.paid_in_bank}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-amber-600">{booking.remaining_amount}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">{booking.withdraw}</td> 
                      <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-indigo-600">
                        {booking.cash_in_office_running !== undefined ? booking.cash_in_office_running.toLocaleString() : <span className="text-gray-400">--</span>} 
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-2xl text-indigo-400">📋</span>
                        </div>
                        <p className="text-sm text-gray-500 font-medium">
                          {dateRange.startDate && dateRange.endDate ? 'No bookings found in the selected date range' : 'No recent bookings found'}
                        </p>
                      </div>
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