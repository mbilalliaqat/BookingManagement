import { useEffect, useState, useCallback, useMemo } from 'react';
import { Plane, MapPin, FileText, CreditCard, Landmark, Shield, X, ChevronRight, DollarSign, User, Filter } from 'lucide-react';
import axios from 'axios';
import TableSpinner from '../../ui/TableSpinner';
import DateRangePicker from '../../ui/DateRangePicker';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

// Custom Color Palette
const COLOR_MAP = {
  midnight: { border: 'border-[#1e3a8a]', bg: 'bg-[#1e3a8a]/10', text: 'text-[#1e3a8a]', textBold: 'text-[#1e3a8a]', gradient: 'bg-gradient-to-br from-[#1e3a8a]/5 to-[#1e3a8a]/10' },
  emerald: { border: 'border-[#10b981]', bg: 'bg-[#10b981]/10', text: 'text-[#10b981]', textBold: 'text-[#10b981]', gradient: 'bg-gradient-to-br from-[#10b981]/5 to-[#10b981]/10' },
  ivory: { border: 'border-[#f8fafc]', bg: 'bg-[#f8fafc]', text: 'text-[#1e3a8a]', textBold: 'text-[#1e3a8a]', gradient: 'bg-gradient-to-br from-[#f8fafc] to-[#e5e7eb]' },
  rose: { border: 'border-[#e11d48]', bg: 'bg-[#e11d48]/10', text: 'text-[#e11d48]', textBold: 'text-[#e11d48]', gradient: 'bg-gradient-to-br from-[#e11d48]/5 to-[#e11d48]/10' },
  teal: { border: 'border-teal-600', bg: 'bg-teal-600/10', text: 'text-teal-600', textBold: 'text-teal-700', gradient: 'bg-gradient-to-br from-teal-50 to-teal-100' },
  indigo: { border: 'border-indigo-600', bg: 'bg-indigo-600/10', text: 'text-indigo-600', textBold: 'text-indigo-700', gradient: 'bg-gradient-to-br from-indigo-50 to-indigo-100' },
};

// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_LIVE_API_BASE_URL,
  timeout: 10000,
});

// Enhanced caching
const cache = {
  data: new Map(),
  timestamp: new Map(),
  ttl: 5 * 60 * 1000,
};

// Utility functions
const safeTimestamp = (dateValue) => {
  if (!dateValue) return 0;
  const date = new Date(dateValue);
  return isNaN(date.getTime()) ? 0 : date.getTime();
};

const safeLocaleDateString = (dateValue) => {
  if (!dateValue) return '--';
  const date = new Date(dateValue);
  return isNaN(date.getTime()) ? '--' : date.toLocaleDateString();
};

const parsePassportDetail = (detail) => {
  try { return JSON.parse(detail); } catch { return {}; }
};

// Safe number parsing
const safeFloat = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

// Main Dashboard Component
export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    combinedBookings: [],
    totalBookings: 0,
    bookingsByType: [],
    totalRevenue: 0,
    totalProtectorWithdraw: 0,
    totalExpenseWithdraw: 0,
    totalRefundedWithdraw: 0,
    totalVendorWithdraw: 0,
    TotalWithdraw: 0,
    cashInOffice: 0,
    accounts: [],
    vendors: [],
    agents: [],
    totalVendorPayable: 0,
    totalVendorPaid: 0,
    totalAgentPayable: 0,
    totalAgentPaid: 0,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null); 
  const [delayHandler, setDelayHandler] = useState(null);
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const navigate = useNavigate();

  const handleMouseEnter = useCallback((cardName) => {
    if (delayHandler) clearTimeout(delayHandler);
    setHoveredCard(cardName);
  }, [delayHandler]);

  const handleMouseLeave = useCallback(() => {
    const handler = setTimeout(() => setHoveredCard(null), 200);
    setDelayHandler(handler);
  }, []);

  const handleProtectorClick = useCallback(() => navigate('/admin/protector'), [navigate]);
  const handleExpensesClick = useCallback(() => navigate('/admin/expense'), [navigate]);
  const handleRefundedClick = useCallback(() => navigate('/admin/refunded'), [navigate]);

  const fetchWithCache = useCallback(async (endpoint) => {
    const now = Date.now();
    const cacheKey = endpoint;
    
    if (cache.data.has(cacheKey)) {
      const cachedTime = cache.timestamp.get(cacheKey);
      if (now - cachedTime < cache.ttl) {
        return cache.data.get(cacheKey);
      }
    }
    
    const response = await api.get(endpoint);
    cache.data.set(cacheKey, response.data);
    cache.timestamp.set(cacheKey, now);
    
    return response.data;
  }, []);

  const handleModuleClick = useCallback((moduleName) => {
    const routes = {
      'Ticket': '/admin/tickets',
      'Umrah': '/admin/umrah',
      'Visa Processing': '/admin/visa',
      'GAMCA Token': '/admin/gamcaToken',
      'Navtcc': '/admin/navtcc',
      'Services': '/admin/services',
    };
    if (routes[moduleName]) navigate(routes[moduleName]);
  }, [navigate]);

  const handleAccountClick = useCallback((account) => {
    navigate('/admin/officeAccount', { state: { selectedBank: account.name } });
  }, [navigate]);

  const handleVendorClick = useCallback((vendorName) => {
    navigate('/admin/vender/', { state: { selectedVendor: vendorName } });
  }, [navigate]);

  const handleAgentClick = useCallback((agentName) => {
    navigate('/admin/agent', { state: { selectedAgent: agentName } });
  }, [navigate]);

  const handleRemainingAmountClick = useCallback((typeName) => {
    navigate('/admin/remaining-amounts', { state: { selectedType: typeName } });
  }, [navigate]);

  const handleDateRangeChange = useCallback((startDate, endDate) => {
    setDateRange({ startDate, endDate });
  }, []);

  // Memoized filtered bookings
  const filteredBookings = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) return dashboardData.combinedBookings;
    
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    return dashboardData.combinedBookings.filter(booking => {
      const bookingDate = new Date(booking.timestamp);
      return bookingDate >= start && bookingDate <= end;
    });
  }, [dashboardData.combinedBookings, dateRange]);

  // Memoized summary totals
  const summaryTotals = useMemo(() => {
    const bookings = dateRange.startDate && dateRange.endDate ? filteredBookings : dashboardData.combinedBookings;
    return bookings.reduce((totals, booking) => ({
      receivable_amount: totals.receivable_amount + safeFloat(booking.receivable_amount),
      paid_cash: totals.paid_cash + safeFloat(booking.paid_cash),
      paid_in_bank: totals.paid_in_bank + safeFloat(booking.paid_in_bank),
      remaining_amount: totals.remaining_amount + safeFloat(booking.remaining_amount),
      withdraw: totals.withdraw + safeFloat(booking.withdraw),
    }), {
      receivable_amount: 0,
      paid_cash: 0,
      paid_in_bank: 0,
      remaining_amount: 0,
      withdraw: 0,
    });
  }, [filteredBookings, dashboardData.combinedBookings, dateRange]);

  // Main data fetching effect
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      
      try {
        // Fetch main booking data and payments in parallel
        const [
          dashboardStats, umrahData, ticketsData, visaData, gamcaTokenData, servicesData,
          navtccData, protectorData, expensesData, refundedData, venderData, agentData,
        ] = await Promise.all([
          fetchWithCache('/dashboard').catch(() => ({ data: { totalBookings: 0, bookingsByType: [], totalRevenue: 0 } })),
          fetchWithCache('/umrah').catch(() => ({ umrahBookings: [] })),
          fetchWithCache('/ticket').catch(() => ({ ticket: [] })),
          fetchWithCache('/visa-processing').catch(() => ({ visa_processing: [] })),
          fetchWithCache('/gamca-token').catch(() => ({ gamcaTokens: [] })),
          fetchWithCache('/services').catch(() => ({ services: [] })),
          fetchWithCache('/navtcc').catch(() => ({ navtcc: [] })),
          fetchWithCache('/protector').catch(() => ({ protectors: [] })),
          fetchWithCache('/expenses').catch(() => ({ expenses: [] })),
          fetchWithCache('/refunded').catch(() => ({ refunded: [] })),
          fetchWithCache('/vender').catch(() => ({ vendors: [] })),
          fetchWithCache('/agent').catch(() => ({ agents: [] })),
        ]);

        // Fetch accounts data
        const accountNames = ["UBL M.A.R", "UBL F.Z", "HBL M.A.R", "HBL F.Z", "JAZ C", "MCB FIT"];
        const accountsData = await Promise.all(
          accountNames.map(async (name) => {
            try {
              const data = await fetchWithCache(`/accounts/${name}`);
              const lastEntry = data.length > 0 ? data[data.length - 1] : null;
              return { name, balance: lastEntry ? safeFloat(lastEntry.balance) : 0 };
            } catch (error) {
              return { name, balance: 0 };
            }
          })
        );

        // Process vendor data with proper number parsing
        const vendorsData = (venderData.vendors || []).map((entry) => ({
          vender_name: entry.vender_name || '',
          credit: safeFloat(entry.credit),
          debit: safeFloat(entry.debit),
        }));
        
        const aggregatedVendors = vendorsData.reduce((acc, curr) => {
          const existing = acc.get(curr.vender_name);
          if (existing) {
            existing.credit += curr.credit;
            existing.debit += curr.debit;
          } else {
            acc.set(curr.vender_name, {
              vender_name: curr.vender_name,
              credit: curr.credit,
              debit: curr.debit,
            });
          }
          return acc;
        }, new Map());

        const vendorsArray = Array.from(aggregatedVendors.values()).map(v => ({
          ...v,
          remaining_amount: v.credit - v.debit
        }));
        
        const totalVendorPayable = vendorsArray.reduce((sum, v) => sum + v.credit, 0);
        const totalVendorPaid = vendorsArray.reduce((sum, v) => sum + v.debit, 0);

        // Process agent data with proper number parsing
        const agentsData = (agentData.agents || []).map((entry) => ({
          agent_name: entry.agent_name || '',
          credit: safeFloat(entry.credit),
          debit: safeFloat(entry.debit),
        }));

        const aggregatedAgents = agentsData.reduce((acc, curr) => {
          const existing = acc.get(curr.agent_name);
          if (existing) {
            existing.credit += curr.credit;
            existing.debit += curr.debit;
          } else {
            acc.set(curr.agent_name, {
              agent_name: curr.agent_name,
              credit: curr.credit,
              debit: curr.debit,
            });
          }
          return acc;
        }, new Map());

        const agentsArray = Array.from(aggregatedAgents.values()).map(a => ({
          ...a,
          remaining_amount: a.credit - a.debit
        }));

        const totalAgentPayable = agentsArray.reduce((sum, a) => sum + a.credit, 0);
        const totalAgentPaid = agentsArray.reduce((sum, a) => sum + a.debit, 0);

        // Process all bookings with proper number parsing
        const umrahBookings = (umrahData.umrahBookings || []).map(umrah => ({
          type: 'Umrah',
          employee_name: umrah.userName || '',
          receivable_amount: safeFloat(umrah.receivableAmount),
          entry: umrah.entry || '',
          paid_cash: safeFloat(umrah.paidCash),
          paid_in_bank: safeFloat(umrah.paidInBank),
          remaining_amount: safeFloat(umrah.remainingAmount),
          booking_date: safeLocaleDateString(umrah.createdAt),
          timestamp: safeTimestamp(umrah.createdAt),
          withdraw: 0,
          passengerName: umrah.customerAdd || null,
          profit: safeFloat(umrah.profit),
        }));

        const ticketBookings = (ticketsData.ticket || []).map(ticket => {
          let firstPassengerName = null;
          try {
            let parsedDetails = typeof ticket.passport_detail === 'string' 
              ? JSON.parse(ticket.passport_detail) 
              : Array.isArray(ticket.passport_detail) ? ticket.passport_detail : [];
            
            if (parsedDetails.length > 0) {
              const firstPassenger = parsedDetails[0];
              firstPassengerName = `${firstPassenger.title || ''} ${firstPassenger.firstName || ''} ${firstPassenger.lastName || ''}`.trim();
            }
          } catch (e) {
            console.error("Error parsing passenger details:", e);
          }

          return {
            type: 'Ticket',
            employee_name: ticket.employee_name || '',
            receivable_amount: safeFloat(ticket.receivable_amount),
            entry: ticket.entry || '',
            paid_cash: safeFloat(ticket.paid_cash),
            paid_in_bank: safeFloat(ticket.paid_in_bank),
            remaining_amount: safeFloat(ticket.remaining_amount),
            booking_date: safeLocaleDateString(ticket.created_at),
            timestamp: safeTimestamp(ticket.created_at),
            withdraw: 0,
            passengerName: firstPassengerName || ticket.customer_add || null,
            profit: safeFloat(ticket.profit),
          };
        });

        const visaBookings = (visaData.visa_processing || []).map(visa => {
          const details = parsePassportDetail(visa.passport_detail);
          return {
            type: 'Visa Processing',
            employee_name: visa.employee_name || '',
            receivable_amount: safeFloat(visa.receivable_amount),
            entry: visa.entry || '',
            paid_cash: safeFloat(visa.paid_cash),
            paid_in_bank: safeFloat(visa.paid_in_bank),
            remaining_amount: safeFloat(visa.remaining_amount),
            booking_date: safeLocaleDateString(visa.created_at),
            timestamp: safeTimestamp(visa.created_at),
            withdraw: 0,
            passengerName: `${details.firstName || ''} ${details.lastName || ''}`.trim() || visa.customer_add || null,
            profit: safeFloat(visa.profit),
          };
        });

        const gamcaTokenBookings = (gamcaTokenData.gamcaTokens || []).map(token => {
          const details = parsePassportDetail(token.passport_detail);
          return {
            type: 'GAMCA Token',
            employee_name: token.employee_name || '',
            receivable_amount: safeFloat(token.receivable_amount),
            entry: token.entry || '',
            paid_cash: safeFloat(token.paid_cash),
            paid_in_bank: safeFloat(token.paid_in_bank),
            remaining_amount: safeFloat(token.remaining_amount),
            booking_date: safeLocaleDateString(token.created_at),
            timestamp: safeTimestamp(token.created_at),
            withdraw: 0,
            passengerName: `${details.firstName || ''} ${details.lastName || ''}`.trim() || token.customer_add || null,
            profit: safeFloat(token.profit),
          };
        });

        const servicesBookings = (servicesData.services || []).map(service => ({
          type: 'Services',
          employee_name: service.user_name || '',
          receivable_amount: safeFloat(service.receivable_amount),
          entry: service.entry || '',
          paid_cash: safeFloat(service.paid_cash),
          paid_in_bank: safeFloat(service.paid_in_bank),
          remaining_amount: safeFloat(service.remaining_amount),
          booking_date: safeLocaleDateString(service.booking_date || service.created_at),
          timestamp: safeTimestamp(service.createdAt || service.created_at),
          withdraw: 0,
          passengerName: service.customer_add || null,
          profit: safeFloat(service.profit),
        }));

        const navtccBookings = (navtccData.navtcc || []).map(navtcc => {
          const details = parsePassportDetail(navtcc.passport_detail);
          return {
            type: 'Navtcc',
            employee_name: navtcc.employee_name || navtcc.reference || '',
            receivable_amount: safeFloat(navtcc.receivable_amount),
            entry: navtcc.entry || '',
            paid_cash: safeFloat(navtcc.paid_cash),
            paid_in_bank: safeFloat(navtcc.paid_in_bank),
            remaining_amount: safeFloat(navtcc.remaining_amount),
            booking_date: safeLocaleDateString(navtcc.created_at),
            timestamp: safeTimestamp(navtcc.created_at),
            withdraw: 0,
            passengerName: `${details.firstName || ''} ${details.lastName || ''}`.trim() || navtcc.customer_add || null,
            profit: safeFloat(navtcc.profit),
          };
        });

        const protectorBookings = (protectorData.protectors || []).map(protector => ({
          type: 'Protector',
          employee_name: protector.employee || '',
          entry: protector.entry || '',
          receivable_amount: 0,
          paid_cash: 0,
          paid_in_bank: 0,
          remaining_amount: 0,
          booking_date: safeLocaleDateString(protector.protector_date),
          timestamp: safeTimestamp(protector.createdAt || protector.created_at),
          withdraw: safeFloat(protector.withdraw),
          passengerName: protector.name || null,
          profit: 0,
        }));

        const expensesBookings = (expensesData.expenses || []).map(expense => ({
          type: 'Expenses',
          employee_name: expense.user_name || '',
          entry: expense.entry || '',
          receivable_amount: 0,
          paid_cash: 0,
          paid_in_bank: 0,
          remaining_amount: 0,
          booking_date: safeLocaleDateString(expense.date),
          timestamp: safeTimestamp(expense.createdAt || expense.created_at),
          withdraw: safeFloat(expense.withdraw),
          passengerName: expense.detail || null,
          profit: 0,
        }));

        const refundedBookings = (refundedData.refunded || []).map(refund => ({
          type: 'Refunded',
          employee_name: refund.employee || '',
          entry: refund.entry || '',
          receivable_amount: 0,
          paid_cash: 0,
          paid_in_bank: 0,
          remaining_amount: 0,
          booking_date: safeLocaleDateString(refund.date),
          timestamp: safeTimestamp(refund.created_at),
          withdraw: safeFloat(refund.withdraw),
          passengerName: refund.name || null,
          profit: 0,
        }));

        const venderBookings = (venderData.vendors || []).map(vender => ({
          type: 'Vender',
          employee_name: vender.user_name || '',
          entry: vender.entry || '',
          receivable_amount: 0,
          paid_cash: 0,
          paid_in_bank: 0,
          remaining_amount: 0,
          booking_date: safeLocaleDateString(vender.date),
          timestamp: safeTimestamp(vender.created_at),
          withdraw: safeFloat(vender.withdraw),
          passengerName: null,
          profit: 0,
        }));

        // Combine all bookings
        const combinedBookingsRaw = [
          ...umrahBookings,
          ...ticketBookings,
          ...visaBookings,
          ...gamcaTokenBookings,
          ...servicesBookings,
          ...navtccBookings,
          ...protectorBookings,
          ...expensesBookings,
          ...refundedBookings
          // ...venderBookings,
        ];

        // Calculate running cash in office - CRITICAL: sort by timestamp ASCENDING first
        const sortedForRunningTotal = [...combinedBookingsRaw].sort((a, b) => a.timestamp - b.timestamp);
        
        let runningCashInOffice = 0;
        const bookingsWithCashInOffice = sortedForRunningTotal.map(booking => {
          // Add cash received, subtract withdrawals
          runningCashInOffice += safeFloat(booking.paid_cash);
          runningCashInOffice -= safeFloat(booking.withdraw);
          return { 
            ...booking, 
            cash_in_office_running: Math.round(runningCashInOffice * 100) / 100 // Round to 2 decimal places
          };
        });

        // Now sort by most recent first for display
        const finalCombinedBookings = bookingsWithCashInOffice.sort((a, b) => b.timestamp - a.timestamp);

        // Calculate totals with proper number handling
        const totalProtectorWithdraw = protectorBookings.reduce((sum, entry) => sum + safeFloat(entry.withdraw), 0);
        const totalExpensesWithdraw = expensesBookings.reduce((sum, entry) => sum + safeFloat(entry.withdraw), 0);
        const totalRefundedWithdraw = refundedBookings.reduce((sum, entry) => sum + safeFloat(entry.withdraw), 0);
        const totalVendorWithdraw = venderBookings.reduce((sum, entry) => sum + safeFloat(entry.withdraw), 0);
        
        // Calculate total paid cash from all bookings
        const totalPaidCash = [
          ...umrahBookings,
          ...ticketBookings,
          ...visaBookings,
          ...gamcaTokenBookings,
          ...servicesBookings,
          ...navtccBookings,
        ].reduce((sum, booking) => sum + safeFloat(booking.paid_cash), 0);
        
        const cashInOffice = totalPaidCash - totalProtectorWithdraw - totalExpensesWithdraw - totalRefundedWithdraw - totalVendorWithdraw;
        const TotalWithdraw = totalProtectorWithdraw + totalExpensesWithdraw + totalRefundedWithdraw + totalVendorWithdraw;

        console.log('Calculation Check:', {
          totalPaidCash,
          totalProtectorWithdraw,
          totalExpensesWithdraw,
          totalRefundedWithdraw,
          totalVendorWithdraw,
          cashInOffice,
          TotalWithdraw
        });

        setDashboardData({
          combinedBookings: finalCombinedBookings,
          totalBookings: dashboardStats.data.totalBookings || 0,
          bookingsByType: dashboardStats.data.bookingsByType || [],
          totalRevenue: safeFloat(dashboardStats.data.totalRevenue),
          totalProtectorWithdraw,
          totalExpenseWithdraw: totalExpensesWithdraw,
          totalRefundedWithdraw,
          totalVendorWithdraw,
          cashInOffice,
          TotalWithdraw,
          accounts: accountsData,
          vendors: vendorsArray,
          agents: agentsArray,
          totalVendorPayable,
          totalVendorPaid,
          totalAgentPayable,
          totalAgentPaid,
        });
        
        console.log("Dashboard data loaded successfully");
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
    
    return () => {
      if (delayHandler) clearTimeout(delayHandler);
    };
  }, [fetchWithCache]);

  // Memoized calculations
  const booking = dashboardData.bookingsByType || [];
  const moduleBreakdown = useMemo(() => [
    { name: 'Ticket', count: booking.find(item => item.type === 'Ticket')?.count || 0, color: 'midnight', icon: Plane },
    { name: 'Umrah', count: booking.find(item => item.type === 'Umrah')?.count || 0, color: 'emerald', icon: MapPin },
    { name: 'Visa Processing', count: booking.find(item => item.type === 'Visa Processing')?.count || 0, color: 'rose', icon: FileText },
    { name: 'GAMCA Token', count: booking.find(item => item.type === 'GAMCA Token')?.count || 0, color: 'teal', icon: CreditCard },
    { name: 'Services', count: booking.find(item => item.type === 'Services')?.count || 0, color: 'indigo', icon: CreditCard },
    { name: 'Navtcc', count: booking.find(item => item.type === 'Navtcc')?.count || 0, color: 'ivory', icon: Shield },
  ], [booking]);

  const profitBreakdownArray = useMemo(() => {
    const profitBreakdown = dashboardData.combinedBookings.reduce((acc, booking) => {
      const mainBookingTypes = ['Ticket', 'Umrah', 'Visa Processing', 'GAMCA Token', 'Services', 'Navtcc'];
      if (mainBookingTypes.includes(booking.type)) {
        const profit = safeFloat(booking.profit);
        acc[booking.type] = (acc[booking.type] || 0) + profit;
      }
      return acc;
    }, {});

    return Object.keys(profitBreakdown)
      .map(type => ({ name: type, amount: Math.round(profitBreakdown[type] * 100) / 100 }))
      .filter(item => item.amount !== 0);
  }, [dashboardData.combinedBookings]);

  const totalProfit = useMemo(() => 
    profitBreakdownArray.reduce((sum, item) => sum + item.amount, 0),
    [profitBreakdownArray]
  );

  const totalAccountsBalance = useMemo(() => 
    dashboardData.accounts.reduce((sum, acc) => sum + safeFloat(acc.balance), 0),
    [dashboardData.accounts]
  );

  const totalRemainingAmount = useMemo(() => 
    dashboardData.combinedBookings.reduce((sum, booking) => sum + safeFloat(booking.remaining_amount), 0),
    [dashboardData.combinedBookings]
  );

  const remainingBreakdownArray = useMemo(() => {
    const remainingBreakdown = dashboardData.combinedBookings.reduce((acc, booking) => {
      if (safeFloat(booking.receivable_amount) > 0) {
        const remaining = safeFloat(booking.remaining_amount);
        acc[booking.type] = (acc[booking.type] || 0) + remaining;
      }
      return acc;
    }, {});
    
    return Object.keys(remainingBreakdown)
      .map(type => ({ name: type, amount: Math.round(remainingBreakdown[type] * 100) / 100 }))
      .filter(item => item.amount > 0);
  }, [dashboardData.combinedBookings]);

  const financialOverviewData = useMemo(() => 
    [
      { name: 'Bank Amount', value: Math.round(totalAccountsBalance * 100) / 100, color: '#6366f1' },
      { name: 'Total Profit', value: Math.round(totalProfit * 100) / 100, color: '#10b981' },
      { name: 'Cash in Office', value: Math.round(dashboardData.cashInOffice * 100) / 100, color: '#f97316' },
      { name: 'Remaining Receivable', value: Math.round(totalRemainingAmount * 100) / 100, color: '#f43f5e' },
    ].filter(item => item.value > 0),
    [totalAccountsBalance, totalProfit, dashboardData.cashInOffice, totalRemainingAmount]
  );

  const currentTableData = dateRange.startDate && dateRange.endDate ? filteredBookings : dashboardData.combinedBookings;
  const showPartialData = !isLoading && dashboardData.combinedBookings.length > 0;

  return (
    <div className="bg-[#f8fafc] p-6 rounded-2xl shadow-md overflow-hidden font-inter">
      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
        {/* Total Bookings Card */}
        <div
          className="relative w-full"
          onMouseEnter={() => handleMouseEnter('bookings')}
          onMouseLeave={handleMouseLeave}
        >
          <div className="relative bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 p-3 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] group cursor-pointer">
            <div className="relative z-10">
              <h2 className="text-black text-[0.65rem] font-bold uppercase tracking-wide font-inter mb-1 truncate">Total Bookings</h2>
              <p className="text-sm font-bold text-white">
                {isLoading && !showPartialData ? <span className="text-white/60">--</span> : dashboardData.totalBookings.toLocaleString()}
              </p>
            </div>
          </div>
          {hoveredCard === 'bookings' && (
            <div className="absolute top-full left-0 mt-2 w-full min-w-[150px] bg-[#f9f9f9] rounded-xl shadow-2xl z-50 p-2 border border-[#ddd] animate-in fade-in duration-300 max-h-64 overflow-y-auto">
              {isLoading && !showPartialData ? (
                <div className="space-y-1">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="animate-pulse bg-[#e0e0e0] p-1 rounded">
                      <div className="h-3 bg-[#ddd] rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {moduleBreakdown.map((module, index) => (
                    <div
                      key={index}
                      className="list-item text-[0.65rem] text-[#333] cursor-pointer hover:bg-[#e0e0e0] p-1 rounded-lg transition-colors duration-150"
                      onClick={() => handleModuleClick(module.name)}
                    >
                      {module.name} ({module.count})
                    </div>
                  ))}
                  <div className="list-item text-[0.65rem] text-[#333] font-bold p-1 rounded-lg border-t border-gray-200 mt-1 pt-2">
                    Total: {dashboardData.totalBookings}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bank Accounts Card */}
        <div
          className="relative w-full"
          onMouseEnter={() => handleMouseEnter('accounts')}
          onMouseLeave={handleMouseLeave}
        >
          <div className="relative bg-gradient-to-br from-emerald-600 via-green-700 to-teal-800 p-3 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] group cursor-pointer">
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-black text-[0.65rem] font-bold tracking-wide font-inter truncate">Bank Amount</h2>
              </div>
              <p className="text-sm font-bold text-white mt-0 break-all">
                {isLoading && !showPartialData ? <span className="text-white/60">--</span> : totalAccountsBalance.toLocaleString()}
              </p>
            </div>
          </div>
          {hoveredCard === 'accounts' && (
            <div className="absolute top-full left-0 mt-2 w-full min-w-[150px] bg-[#f9f9f9] rounded-xl shadow-2xl z-50 p-2 border border-[#ddd] animate-in fade-in duration-300 max-h-64 overflow-y-auto">
              {isLoading && !showPartialData ? (
                <div className="space-y-1">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="animate-pulse bg-[#e0e0e0] p-1 rounded">
                      <div className="h-3 bg-[#ddd] rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {dashboardData.accounts.map((account) => (
                    <div
                      key={account.name}
                      className="list-item text-[0.65rem] text-[#333] cursor-pointer hover:bg-[#e0e0e0] p-1 rounded-lg transition-colors duration-150 flex justify-start"
                      onClick={() => handleAccountClick(account)}
                    >
                      <span className="font-semibold text-[#1e3a8a]">
                        {`${account.name} (${account.balance.toLocaleString()})`}
                      </span>
                    </div>
                  ))}
                  <div className="list-item text-[0.65rem] text-[#333] font-bold p-1 rounded-lg border-t border-gray-200 mt-1 pt-2">
                    Total: {totalAccountsBalance.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Vendor Card */}
        <div
          className="relative w-full"
          onMouseEnter={() => handleMouseEnter('vendors')}
          onMouseLeave={handleMouseLeave}
        >
          <div className="relative bg-gradient-to-br from-red-600 via-rose-700 to-red-800 p-3 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] group cursor-pointer">
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-black text-[0.65rem] font-bold tracking-wide font-inter truncate">Vendors</h2>
              </div>
              <p className="text-[0.65rem] font-bold text-white mt-0 break-all">
                {isLoading && !showPartialData ? <span className="text-white/60">--</span> : `${dashboardData.totalVendorPayable.toLocaleString()} / ${dashboardData.totalVendorPaid.toLocaleString()}`}
              </p>
            </div>
          </div>
          {hoveredCard === 'vendors' && (
            <div className="absolute top-full left-0 mt-2 w-full min-w-[150px] bg-[#f9f9f9] rounded-xl shadow-2xl z-50 p-2 border border-[#ddd] animate-in fade-in duration-300 max-h-64 overflow-y-auto">
              {isLoading && !showPartialData ? (
                <div className="space-y-1">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="animate-pulse bg-[#e0e0e0] p-1 rounded">
                      <div className="h-3 bg-[#ddd] rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {dashboardData.vendors.map((vendor) => (
                    <div
                      key={vendor.vender_name}
                      className="list-item text-[0.65rem] text-[#333] hover:bg-[#e0e0e0] p-1 rounded-lg transition-colors duration-150 flex justify-between items-center cursor-pointer"
                      onClick={() => handleVendorClick(vendor.vender_name)}
                    >
                      <span className="font-semibold text-[#1e3a8a] truncate pr-2 hover:underline">
                        {vendor.vender_name}
                      </span>
                      <span className={`font-bold ${vendor.remaining_amount < 0 ? 'text-red-600' : 'text-emerald-600'} flex-shrink-0`}>
                        {vendor.remaining_amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="list-item text-[0.65rem] text-[#333] font-bold p-1 rounded-lg border-t border-gray-200 mt-1 pt-2 flex justify-between">
                    <span>Total Payable:</span> <span className="text-emerald-600">{dashboardData.totalVendorPayable.toLocaleString()}</span>
                  </div>
                  <div className="list-item text-[0.65rem] text-[#333] font-bold p-1 rounded-lg flex justify-between">
                    <span>Total Paid:</span> <span className="text-red-600">{dashboardData.totalVendorPaid.toLocaleString()}</span>
                  </div>
                  <div className="list-item text-[0.65rem] text-[#333] font-bold p-1 rounded-lg">
                    Total Vendors: {dashboardData.vendors.length}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Agent Card */}
        <div
          className="relative w-full"
          onMouseEnter={() => handleMouseEnter('agents')}
          onMouseLeave={handleMouseLeave}
        >
          <div className="relative bg-gradient-to-br from-cyan-600 via-teal-700 to-cyan-800 p-3 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] group cursor-pointer">
            <div className="relative z-8">
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-black text-[0.65rem] font-bold tracking-wide font-inter truncate">Agents</h2>
              </div>
              <p className="text-sm font-bold text-white mt-0 break-all">
                {isLoading && !showPartialData ? <span className="text-white/60">--</span> : `${dashboardData.totalAgentPayable.toLocaleString()}`}
              </p>
            </div>
          </div>
          {hoveredCard === 'agents' && (
            <div className="absolute top-full left-0 mt-2 w-full min-w-[150px] bg-[#f9f9f9] rounded-xl shadow-2xl z-50 p-2 border border-[#ddd] animate-in fade-in duration-300 max-h-64 overflow-y-auto">
              {isLoading && !showPartialData ? (
                <div className="space-y-1">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="animate-pulse bg-[#e0e0e0] p-1 rounded">
                      <div className="h-3 bg-[#ddd] rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {dashboardData.agents.map((agent) => (
                    <div
                      key={agent.agent_name}
                      className="list-item text-[0.65rem] text-[#333] hover:bg-[#e0e0e0] p-1 rounded-lg transition-colors duration-150 flex justify-between items-center cursor-pointer"
                      onClick={() => handleAgentClick(agent.agent_name)}
                    >
                      <span className="font-semibold text-cyan-700 truncate pr-2 hover:underline">
                        {agent.agent_name}
                      </span>
                      <span className={`font-bold ${agent.remaining_amount < 0 ? 'text-red-600' : 'text-emerald-600'} flex-shrink-0`}>
                        {agent.remaining_amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="list-item text-[0.65rem] text-[#333] font-bold p-1 rounded-lg border-t border-gray-200 mt-1 pt-2 flex justify-between">
                    <span>Total Payable:</span> <span className="text-emerald-600">{dashboardData.totalAgentPayable.toLocaleString()}</span>
                  </div>
                  <div className="list-item text-[0.65rem] text-[#333] font-bold p-1 rounded-lg flex justify-between">
                    <span>Total Paid:</span> <span className="text-red-600">{dashboardData.totalAgentPaid.toLocaleString()}</span>
                  </div>
                  <div className="list-item text-[0.65rem] text-[#333] font-bold p-1 rounded-lg">
                    Total Agents: {dashboardData.agents.length}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Remaining Amount Card */}
        <div
          className="relative w-full"
          onMouseEnter={() => handleMouseEnter('remaining')}
          onMouseLeave={handleMouseLeave}
        >
          <div className="relative bg-gradient-to-br from-gray-700 via-slate-800 to-stone-900 p-3 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group cursor-pointer">
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-white/90 text-[0.65rem] font-bold tracking-wide font-inter truncate">Remaining Amount</h2>
              </div>
              <p className="text-sm font-bold text-white mt-0 break-all">
                {isLoading && !showPartialData ? <span className="text-white/60">--</span> : totalRemainingAmount.toLocaleString()}
              </p>
            </div>
          </div>
          {hoveredCard === 'remaining' && (
            <div className="absolute top-full left-0 mt-2 w-full min-w-[150px] bg-[#f9f9f9] rounded-xl shadow-2xl z-50 p-2 border border-[#ddd] animate-in fade-in duration-300 max-h-64 overflow-y-auto">
              {isLoading && !showPartialData ? (
                <div className="space-y-1">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="animate-pulse bg-[#e0e0e0] p-1 rounded">
                      <div className="h-3 bg-[#ddd] rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : remainingBreakdownArray.length > 0 ? (
                <div className="space-y-1">
                  {remainingBreakdownArray.map((item) => (
                    <div
                      key={item.name}
                      className="list-item text-[0.65rem] text-[#333] hover:bg-[#e0e0e0] p-1 rounded-lg transition-colors duration-150 flex justify-between items-center cursor-pointer"
                      onClick={() => handleRemainingAmountClick(item.name)}
                    >
                      <span className="font-semibold text-slate-700 truncate pr-2 hover:underline">
                        {item.name}
                      </span>
                      <span className="font-bold text-amber-600 flex-shrink-0">
                        {item.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div
                    className="list-item text-[0.65rem] text-[#333] font-bold p-1 rounded-lg border-t border-gray-200 mt-1 pt-2 flex justify-between cursor-pointer hover:bg-[#e0e0e0]"
                    onClick={() => handleRemainingAmountClick('all')}
                  >
                    <span className="hover:underline">Total:</span>
                    <span className="text-amber-600">{totalRemainingAmount.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-[0.65rem] text-slate-500 py-2">
                  No remaining amounts.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profit Card */}
        <div
          className="relative w-full"
          onMouseEnter={() => handleMouseEnter('profit')}
          onMouseLeave={handleMouseLeave}
        >
          <div className="relative bg-gradient-to-br from-yellow-500 via-amber-600 to-orange-700 p-3 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] group cursor-pointer">
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-black text-[0.65rem] font-bold tracking-wide font-inter truncate">Profit</h2>
              </div>
              <p className="text-sm font-bold text-white mt-0 break-all">
                {isLoading && !showPartialData ? <span className="text-white/60">--</span> : totalProfit.toLocaleString()}
              </p>
            </div>
          </div>
          {hoveredCard === 'profit' && (
            <div className="absolute top-full left-0 mt-2 w-full min-w-[150px] bg-[#f9f9f9] rounded-xl shadow-2xl z-50 p-2 border border-[#ddd] animate-in fade-in duration-300 max-h-64 overflow-y-auto">
              {isLoading && !showPartialData ? (
                <div className="space-y-1">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="animate-pulse bg-[#e0e0e0] p-1 rounded">
                      <div className="h-3 bg-[#ddd] rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : profitBreakdownArray.length > 0 ? (
                <div className="space-y-1">
                  {profitBreakdownArray.map((item) => (
                    <div
                      key={item.name}
                      className="list-item text-[0.65rem] text-[#333] hover:bg-[#e0e0e0] p-1 rounded-lg transition-colors duration-150 flex justify-between items-center"
                    >
                      <span className="font-semibold text-yellow-700 truncate pr-2">
                        {item.name}
                      </span>
                      <span className={`font-bold ${item.amount < 0 ? 'text-red-600' : 'text-emerald-600'} flex-shrink-0`}>
                        {item.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="list-item text-[0.65rem] text-[#333] font-bold p-1 rounded-lg border-t border-gray-200 mt-1 pt-2 flex justify-between">
                    <span>Total:</span> <span className="text-emerald-600">{totalProfit.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-[0.65rem] text-slate-500 py-2">
                  No profit data available.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Total Withdraw Card */}
        <div
          className="relative w-full"
          onMouseEnter={() => handleMouseEnter('withdraw')}
          onMouseLeave={handleMouseLeave}
        >
          <div className="bg-gradient-to-br from-fuchsia-600 via-pink-700 to-purple-800 p-3 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group cursor-pointer">
            <div className="relative z-10 w-full">
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-black text-[0.65rem] font-bold tracking-wide font-inter truncate">Total Withdraw</h2>
              </div>
              <p className="text-sm font-bold text-white mt-0 break-all">
                {isLoading && !showPartialData ? <span className="text-white/60">--</span> : dashboardData.TotalWithdraw.toLocaleString()}
              </p>
            </div>
          </div>
          {hoveredCard === 'withdraw' && (
            <div className="absolute top-full left-0 mt-2 w-full min-w-[150px] bg-[#f9f9f9] rounded-xl shadow-2xl z-50 p-2 border border-[#ddd] animate-in fade-in duration-300 max-h-64 overflow-y-auto">
              {isLoading && !showPartialData ? (
                <div className="space-y-1">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="animate-pulse bg-[#e0e0e0] p-1 rounded">
                      <div className="h-3 bg-[#ddd] rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  <div
                    className="list-item text-[0.65rem] text-[#333] hover:bg-[#e0e0e0] p-1 rounded-lg transition-colors duration-150 flex justify-between cursor-pointer"
                    onClick={handleProtectorClick}
                  >
                    <span className="font-semibold text-fuchsia-700 hover:underline">Protector</span>
                    <span className="font-bold text-fuchsia-600">{dashboardData.totalProtectorWithdraw.toLocaleString()}</span>
                  </div>
                  <div
                    className="list-item text-[0.65rem] text-[#333] hover:bg-[#e0e0e0] p-1 rounded-lg transition-colors duration-150 flex justify-between cursor-pointer"
                    onClick={handleExpensesClick}
                  >
                    <span className="font-semibold text-fuchsia-700 hover:underline">Expenses</span>
                    <span className="font-bold text-fuchsia-600">{dashboardData.totalExpenseWithdraw.toLocaleString()}</span>
                  </div>
                  <div
                    className="list-item text-[0.65rem] text-[#333] hover:bg-[#e0e0e0] p-1 rounded-lg transition-colors duration-150 flex justify-between cursor-pointer"
                    onClick={handleRefundedClick}
                  >
                    <span className="font-semibold text-fuchsia-700 hover:underline">Refunded</span>
                    <span className="font-bold text-fuchsia-600">{dashboardData.totalRefundedWithdraw.toLocaleString()}</span>
                  </div>
                  <div className="list-item text-[0.65rem] text-[#333] font-bold p-1 rounded-lg border-t border-gray-200 mt-1 pt-2 flex justify-between">
                    <span>Total:</span> <span className="text-fuchsia-600">{dashboardData.TotalWithdraw.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cash in Office Card */}
        <div className="bg-gradient-to-br from-lime-500 via-green-600 to-teal-700 p-3 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group cursor-pointer">
          <div className="relative z-10 w-full">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-black text-[0.65rem] font-bold tracking-wide font-inter truncate">Cash in Office</h2>
            </div>
            <p className="text-sm font-bold text-white mt-0 break-all">
              {isLoading && !showPartialData ? <span className="text-white/60">--</span> : dashboardData.cashInOffice.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Financial Overview Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-indigo-100">
          <h2 className="font-bold text-xl text-black font-inter mb-4">Financial Overview</h2>
          {isLoading && !showPartialData ? (
            <div className="flex justify-center items-center h-64">
              <TableSpinner />
            </div>
          ) : financialOverviewData.length > 0 ? (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={financialOverviewData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                  >
                    {financialOverviewData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [value.toLocaleString(), name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              No financial data to display in the chart.
            </div>
          )}
        </div>
      </div>

      {/* Table Section */}
      {isLoading && !showPartialData ? (
        <div className="flex justify-center py-12">
          <TableSpinner />
        </div>
      ) : (
        <div className="bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-6 rounded-2xl shadow-xl border border-indigo-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-2xl text-black font-inter">
              All Bookings
            </h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter size={18} className="text-indigo-600" />
                <span className="text-sm text-gray-600 font-medium">Filter by Date:</span>
              </div>
            </div>
          </div>

          {/* Date Range Picker */}
          <div className="mb-6 flex items-center space-x-4">
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
          <div className="overflow-y-auto max-h-[75vh] rounded-xl border border-indigo-100">
            <table className="w-full table-fixed divide-y divide-indigo-100">
              <thead className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 sticky top-0">
                <tr>
                  <th className="w-[7%] px-1 py-2 text-left text-[0.6rem] font-bold text-black uppercase tracking-wider font-inter">DATE</th>
                  <th className="w-[9%] px-1 py-2 text-left text-[0.6rem] font-bold text-black uppercase tracking-wider font-inter">EMPLOYEE</th>
                  <th className="w-[6%] px-1 py-2 text-left text-[0.6rem] font-bold text-black uppercase tracking-wider font-inter">ENTRY</th>
                  <th className="w-[9%] px-1 py-2 text-left text-[0.6rem] font-bold text-black uppercase tracking-wider font-inter">TYPE</th>
                  <th className="w-[10%] px-1 py-2 text-left text-[0.6rem] font-bold text-black uppercase tracking-wider font-inter">NAME</th>
                  <th className="w-[10%] px-1 py-2 text-left text-[0.6rem] font-bold text-black uppercase tracking-wider font-inter">RECEIVABLE</th>
                  <th className="w-[8%] px-1 py-2 text-left text-[0.6rem] font-bold text-black uppercase tracking-wider font-inter">PAID CASH</th>
                  <th className="w-[9%] px-1 py-2 text-left text-[0.6rem] font-bold text-black uppercase tracking-wider font-inter">PAID BANK</th>
                  <th className="w-[9%] px-1 py-2 text-left text-[0.6rem] font-bold text-black uppercase tracking-wider font-inter">REMAINING</th>
                  <th className="w-[8%] px-1 py-2 text-left text-[0.6rem] font-bold text-black uppercase tracking-wider font-inter">WITHDRAW</th>
                  <th className="w-[10%] px-1 py-2 text-left text-[0.6rem] font-bold text-black uppercase tracking-wider font-inter">CASH OFFICE</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-indigo-50">
                {currentTableData.length > 0 ? (
                  <>
                    {currentTableData.map((booking, index) => (
                      <tr
                        key={index}
                        className={`${index % 2 === 0 ? 'bg-white' : 'bg-gradient-to-r from-indigo-50/30 via-purple-50/20 to-pink-50/30'} hover:bg-gradient-to-r hover:from-indigo-100/40 hover:via-purple-100/30 hover:to-pink-100/40 transition-all duration-200`}
                      >
                        <td className="px-1 py-2 text-[0.65rem] text-slate-700 font-inter font-medium truncate">
                          {booking.booking_date}
                        </td>
                        <td className="px-1 py-2 text-[0.65rem] text-slate-700 font-inter truncate" title={booking.employee_name}>
                          {booking.employee_name}
                        </td>
                        <td className="px-1 py-2 text-[0.65rem] text-slate-700 font-inter truncate" title={booking.entry}>
                          {booking.entry ? booking.entry : <span className="text-slate-400">--</span>}
                        </td>
                        <td className="px-1 py-2 text-[0.65rem] font-semibold font-inter truncate">
                          <span className="px-1 py-0.5 rounded-md bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 inline-block">
                            {booking.type}
                          </span>
                        </td>
                        <td className="px-1 py-2 text-[0.65rem] text-slate-700 font-inter truncate" title={booking.passengerName}>
                          {booking.passengerName ? booking.passengerName : <span className="text-slate-400">--</span>}
                        </td>
                        <td className="px-1 py-2 text-[0.65rem] text-emerald-600 font-inter font-semibold truncate">
                          {safeFloat(booking.receivable_amount).toLocaleString()}
                        </td>
                        <td className="px-1 py-2 text-[0.65rem] text-slate-700 font-inter truncate">
                          {safeFloat(booking.paid_cash).toLocaleString()}
                        </td>
                        <td className="px-1 py-2 text-[0.65rem] text-slate-700 font-inter truncate">
                          {safeFloat(booking.paid_in_bank).toLocaleString()}
                        </td>
                        <td className="px-1 py-2 text-[0.65rem] text-amber-600 font-inter font-semibold truncate">
                          {safeFloat(booking.remaining_amount).toLocaleString()}
                        </td>
                        <td className="px-1 py-2 text-[0.65rem] text-slate-700 font-inter truncate">
                          {safeFloat(booking.withdraw).toLocaleString()}
                        </td>
                        <td className="px-1 py-2 text-[0.65rem] text-indigo-600 font-inter font-semibold truncate">
                          {booking.cash_in_office_running !== undefined ? booking.cash_in_office_running.toLocaleString() : <span className="text-slate-400">--</span>}
                        </td>
                      </tr>
                    ))}

                    {/* Summary Row */}
                    <tr className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 border-t-2 border-indigo-300">
                      <td className="px-1 py-3 text-[0.7rem] font-bold text-white font-inter uppercase tracking-wider" colSpan="5">
                        📊 TOTAL SUMMARY ({currentTableData.length} records)
                      </td>
                      <td className="px-1 py-3 text-[0.7rem] font-bold text-white font-inter text-center">
                        {summaryTotals.receivable_amount.toLocaleString()}
                      </td>
                      <td className="px-1 py-3 text-[0.7rem] font-bold text-white font-inter text-center">
                        {summaryTotals.paid_cash.toLocaleString()}
                      </td>
                      <td className="px-1 py-3 text-[0.7rem] font-bold text-white font-inter text-center">
                        {summaryTotals.paid_in_bank.toLocaleString()}
                      </td>
                      <td className="px-1 py-3 text-[0.7rem] font-bold text-white font-inter text-center">
                        {summaryTotals.remaining_amount.toLocaleString()}
                      </td>
                      <td className="px-1 py-3 text-[0.7rem] font-bold text-white font-inter text-center">
                        {summaryTotals.withdraw.toLocaleString()}
                      </td>
                      <td className="px-1 py-3 text-[0.7rem] font-bold text-white font-inter text-center">
                        {currentTableData.length > 0 ? currentTableData[currentTableData.length - 1].cash_in_office_running?.toLocaleString() || '--' : '--'}
                      </td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan="11" className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-2xl text-indigo-400">📋</span>
                        </div>
                        <p className="text-sm text-slate-500 font-inter">
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