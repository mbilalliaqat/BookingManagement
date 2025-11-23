import { useEffect, useState, useCallback } from 'react';
// --- MODIFIED: Removed Recharts imports ---
import { Plane, MapPin, FileText, CreditCard, Landmark, Shield, X, ChevronRight, DollarSign, User, Filter, Send, MessageSquare, Minimize2 } from 'lucide-react';
// --------------------------------------------------------------------------
import axios from 'axios';
import TableSpinner from '../../ui/TableSpinner';
import DateRangePicker from '../../ui/DateRangePicker';
import { useNavigate } from 'react-router-dom';

// --- NEW CHART IMPORTS ---

import FinancialOverviewChart from '../../ui/FinancialOverviewChart';
import MonthlyBookingsChart from '../../ui/MonthlyBookingsChart';
// -------------------------

// --- Custom Color Palette ---
const COLOR_MAP = {
  midnight: { border: 'border-[#1e3a8a]', bg: 'bg-[#1e3a8a]/10', text: 'text-[#1e3a8a]', textBold: 'text-[#1e3a8a]', gradient: 'bg-gradient-to-br from-[#1e3a8a]/5 to-[#1e3a8a]/10' },
  emerald: { border: 'border-[#10b981]', bg: 'bg-[#10b981]/10', text: 'text-[#10b981]', textBold: 'text-[#10b981]', gradient: 'bg-gradient-to-br from-[#10b981]/5 to-[#10b981]/10' },
  ivory: { border: 'border-[#f8fafc]', bg: 'bg-[#f8fafc]', text: 'text-[#1e3a8a]', textBold: 'text-[#1e3a8a]', gradient: 'bg-gradient-to-br from-[#f8fafc] to-[#e5e7eb]' },
  rose: { border: 'border-[#e11d48]', bg: 'bg-[#e11d48]/10', text: 'text-[#e11d48]', textBold: 'text-[#e11d48]', gradient: 'bg-gradient-to-br from-[#e11d48]/5 to-[#e11d48]/10' },
  teal: { border: 'border-teal-600', bg: 'bg-teal-600/10', text: 'text-teal-600', textBold: 'text-teal-700', gradient: 'bg-gradient-to-br from-teal-50 to-teal-100' },
  indigo: { border: 'border-indigo-600', bg: 'bg-indigo-600/10', text: 'text-indigo-600', textBold: 'text-indigo-700', gradient: 'bg-gradient-to-br from-indigo-50 to-indigo-100' },
};
const ACCOUNT_COLORS = ['midnight', 'emerald', 'rose', 'teal', 'indigo', 'ivory'];

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

// --- Main Dashboard Component ---
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
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedMonthEnd, setSelectedMonthEnd] = useState(new Date());
  const navigate = useNavigate();
 
  const [errors, setErrors] = useState({
    dashboard: null, umrah: null, tickets: null, visa: null, gamcaToken: null, services: null,
    navtcc: null, protector: null, expenses: null, refunded: null, vendor: null, agent: null, accounts: null,
  });

  const handleMouseEnter = (cardName) => {
    if (delayHandler) {
      clearTimeout(delayHandler);
    }
    setHoveredCard(cardName);
  };

  const handleMouseLeave = () => {
    const handler = setTimeout(() => {
      setHoveredCard(null);
    }, 200); 
    setDelayHandler(handler);
  };

  const handleProtectorClick = useCallback(() => {
    navigate('/admin/protector');
  }, [navigate]);

  const handleExpensesClick = useCallback(() => {
    navigate('/admin/expense');
  }, [navigate]);

  const handleRefundedClick = useCallback(() => {
    navigate('/admin/refunded');
  }, [navigate]);

  const fetchWithCache = useCallback(async (endpoint) => {
    const now = Date.now();
    const cacheKey = endpoint;
    
    const response = await api.get(endpoint);
    cache.data.set(cacheKey, response.data);
    cache.timestamp.set(cacheKey, now);
    
    return response.data;
  }, []);

  const safeTimestamp = (dateValue) => {
    if (!dateValue) return 0;
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? 0 : date.getTime();
  };

 const safeLocaleDateString = (dateValue) => {
    if (!dateValue) return '--';
    const date = new Date(dateValue);
    // Added 'en-GB' for DD/MM/YYYY format and 'UTC' to fix the previous day issue
    return isNaN(date.getTime()) ? '--' : date.toLocaleDateString('en-GB', { timeZone: 'UTC' });
  };

  const handleModuleClick = (moduleName) => {
    if (moduleName === 'Ticket') {
      navigate('/admin/tickets'); 
    }
    if (moduleName === 'Umrah') {
      navigate('/admin/umrah'); 
    }
    if (moduleName === 'Visa Processing') {
      navigate('/admin/visa'); 
    }
    if (moduleName === 'GAMCA Token') {
      navigate('/admin/gamcaToken'); 
    }
    if (moduleName === 'Navtcc') {
      navigate('/admin/navtcc'); 
    }
    if (moduleName === 'Services') {
      navigate('/admin/services'); 
    }
  };

  const handleAccountClick = useCallback((account) => {
    navigate('/admin/officeAccount', { 
      state: { selectedBank: account.name } 
    });
  }, [navigate]);

  const handleVendorClick = useCallback((vendorName) => {
    navigate('/admin/vender/', { 
      state: { selectedVendor: vendorName } 
    });
  }, [navigate]);

  const handleAgentClick = useCallback((agentName) => {
    navigate('/admin/agent', { 
      state: { selectedAgent: agentName } 
    });
  }, [navigate]);

  const handleRemainingAmountClick = useCallback((typeName) => {
    navigate('/admin/remaining-amounts', { 
      state: { selectedType: typeName } 
    });
  }, [navigate]);

const handleDateRangeChange = useCallback((startDate, endDate) => {
  setDateRange({ startDate: startDate || null, endDate: endDate || null });
}, []);

    const handleEntryClick = useCallback((booking) => {
  const entryNumber = booking.entry;
  
  // Navigate based on booking type
  switch(booking.type) {
    case 'Ticket':
    case 'Ticket Payment':
      navigate('/admin/tickets', { 
        state: { searchEntry: entryNumber } 
      });
      break;
    
    case 'Umrah':
    case 'Umrah Payment':
      navigate('/admin/umrah', { 
        state: { searchEntry: entryNumber } 
      });
      break;
    
    case 'Visa Processing':
    case 'Visa Payment':
      navigate('/admin/visa', { 
        state: { searchEntry: entryNumber } 
      });
      break;
    
    case 'GAMCA Token':
    case 'GAMCA Token Payment':
      navigate('/admin/gamcaToken', { 
        state: { searchEntry: entryNumber } 
      });
      break;
    
    case 'Services':
      navigate('/admin/services', { 
        state: { searchEntry: entryNumber } 
      });
      break;
    
    case 'Navtcc':
      navigate('/admin/navtcc', { 
        state: { searchEntry: entryNumber } 
      });
      break;
    
    case 'Protector':
      navigate('/admin/protector', { 
        state: { searchEntry: entryNumber } 
      });
      break;
    
    case 'Expenses':
      navigate('/admin/expense', { 
        state: { searchEntry: entryNumber } 
      });
      break;
    
    case 'Refunded':
      navigate('/admin/refunded', { 
        state: { searchEntry: entryNumber } 
      });
      break;
    
    case 'Vender':
      navigate('/admin/vender', { 
        state: { searchEntry: entryNumber } 
      });
      break;
    
    default:
      console.log('Unknown booking type:', booking.type);
  }
}, [navigate]);


  // Filter bookings based on date range
  const filterBookingsByDateRange = useCallback((bookings, startDate, endDate) => {
    if (!startDate || !endDate) return bookings;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Set time to start and end of day for accurate comparison
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.timestamp);
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

  // Calculate summary totals for the current table data (filtered or all)
  const calculateSummaryTotals = useCallback((bookings) => {
    return bookings.reduce((totals, booking) => {
      return {
        receivable_amount: totals.receivable_amount + parseFloat(booking.receivable_amount || 0),
        paid_cash: totals.paid_cash + parseFloat(booking.paid_cash || 0),
        paid_in_bank: totals.paid_in_bank + parseFloat(booking.paid_in_bank || 0),
        remaining_amount: totals.remaining_amount + parseFloat(booking.remaining_amount || 0),
        withdraw: totals.withdraw + parseFloat(booking.withdraw || 0),
      };
    }, {
      receivable_amount: 0,
      paid_cash: 0,
      paid_in_bank: 0,
      remaining_amount: 0,
      withdraw: 0,
    });
  }, []);

  // Calculate monthly summary data
const calculateMonthlySummary = useCallback(() => {
  const startDate = new Date(selectedMonth);
  const endDate = new Date(selectedMonthEnd);
  
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  const dateRangeBookings = dashboardData.combinedBookings.filter(booking => {
    const bookingDate = new Date(booking.timestamp);
    return bookingDate >= startDate && bookingDate <= endDate;
  });

  // Group bookings by date
  const groupedByDate = {};
  
  dateRangeBookings.forEach(booking => {
    const bookingDate = new Date(booking.timestamp);
    const dateKey = bookingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = {
        date: dateKey,
        Ticket: 0,
        Umrah: 0,
        Visa: 0,
        Gamca: 0,
        NAVTCC: 0,
        Services: 0,
        Vendor: 0,
        Banks: 0,
      };
    }
    
    if (booking.type === 'Ticket' && booking.receivable_amount > 0) {
      groupedByDate[dateKey].Ticket++;
    } else if (booking.type === 'Umrah' && booking.receivable_amount > 0) {
      groupedByDate[dateKey].Umrah++;
    } else if (booking.type === 'Visa Processing') {
      groupedByDate[dateKey].Visa++;
    } else if (booking.type === 'GAMCA Token') {
      groupedByDate[dateKey].Gamca++;
    } else if (booking.type === 'Navtcc') {
      groupedByDate[dateKey].NAVTCC++;
    } else if (booking.type === 'Services') {
      groupedByDate[dateKey].Services++;
    } else if (booking.type === 'Vender') {
      groupedByDate[dateKey].Vendor++;
    }
    
    if (parseFloat(booking.paid_in_bank || 0) > 0) {
      groupedByDate[dateKey].Banks++;
    }
  });

  return Object.values(groupedByDate);
}, [dashboardData.combinedBookings, selectedMonth, selectedMonthEnd]);

  // Get current table data and calculate totals
  const currentTableData = dateRange.startDate && dateRange.endDate ? filteredBookings : dashboardData.combinedBookings;
  const summaryTotals = calculateSummaryTotals(currentTableData);
  const monthlySummaryData = calculateMonthlySummary();
  
  const currentMonthName = selectedMonth.getMonth() === selectedMonthEnd.getMonth() && 
                         selectedMonth.getFullYear() === selectedMonthEnd.getFullYear()
    ? selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : `${selectedMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${selectedMonthEnd.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
    
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      
      try {
        const [
          dashboardStats, umrahData, ticketsData, visaData, gamcaTokenData, servicesData,
          navtccData, protectorData, expensesData, refundedData, venderData, agentData,
        ] = await Promise.all([
          fetchWithCache('/dashboard').catch(err => { 
            setErrors(prev => ({ ...prev, dashboard: 'Failed to load dashboard summary' })); 
            return { data: { totalBookings: 0, bookingsByType: [], totalRevenue: 0 } }; 
          }),
          fetchWithCache('/umrah').catch(err => { 
            setErrors(prev => ({ ...prev, umrah: 'Failed to load Umrah data' })); 
            return { umrahBookings: [] }; 
          }),
          fetchWithCache('/ticket').catch(err => { 
            setErrors(prev => ({ ...prev, tickets: 'Failed to load Tickets data' })); 
            return { ticket: [] }; 
          }),
          fetchWithCache('/visa-processing').catch(err => { 
            setErrors(prev => ({ ...prev, visa: 'Failed to load Visa data' })); 
            return { visa_processing: [] }; 
          }),
          fetchWithCache('/gamca-token').catch(err => { 
            setErrors(prev => ({ ...prev, gamcaToken: 'Failed to load Gamca Token data' })); 
            return { gamcaTokens: [] }; 
          }),
          fetchWithCache('/services').catch(err => { 
            setErrors(prev => ({ ...prev, services: 'Failed to load Services data' })); 
            return { services: [] }; 
          }),
          fetchWithCache('/navtcc').catch(err => { 
            setErrors(prev => ({ ...prev, navtcc: 'Failed to load Navtcc data' })); 
            return { navtcc: [] }; 
          }),
          fetchWithCache('/protector').catch(err => { 
            setErrors(prev => ({ ...prev, protector: 'Failed to load Protector data' })); 
            return { protectors: [] }; 
          }),
          fetchWithCache('/expenses').catch(err => { 
            setErrors(prev => ({ ...prev, expenses: 'Failed to load Expenses data' })); 
            return { expenses: [] }; 
          }),
          fetchWithCache('/refunded').catch(err => { 
            setErrors(prev => ({ ...prev, refunded: 'Failed to load Refunded data' })); 
            return { refunded: [] }; 
          }),
          fetchWithCache('/vender').catch(err => { 
            setErrors(prev => ({ ...prev, vendor: 'Failed to load Vendor data' })); 
            return { vendors: [] }; 
          }),
          fetchWithCache('/agent').catch(err => { 
            setErrors(prev => ({ ...prev, agent: 'Failed to load Agent data' })); 
            return { agents: [] }; 
          }),
        ]);

        const accountNames = ["UBL M.A.R", "UBL F.Z", "HBL M.A.R", "HBL F.Z", "JAZ C", "MCB FIT"];
        const accountsData = await Promise.all(
          accountNames.map(async (name) => {
            try {
              const data = await fetchWithCache(`/accounts/${name}`);
              const lastEntry = data.length > 0 ? data[data.length - 1] : null;
              return { name, balance: lastEntry ? lastEntry.balance : 0 };
            } catch (error) {
              console.error(`Error fetching ${name}:`, error);
              return { name, balance: 0 };
            }
          })
        );

        const vendorsData = venderData.vendors?.map((entry, index) => ({
          id: entry.id || index, 
          vender_name: entry.vender_name || '', 
          credit: Number(entry.credit) || 0, 
          debit: Number(entry.debit) || 0,
        })) || [];
        const aggregatedVendors = vendorsData.reduce((acc, curr) => {
          const existing = acc.find(v => v.vender_name === curr.vender_name);
          if (existing) {
            existing.credit += curr.credit; 
            existing.debit += curr.debit; 
            existing.remaining_amount = existing.credit - existing.debit;
          } else { 
            acc.push({ 
              vender_name: curr.vender_name, 
              credit: curr.credit, 
              debit: curr.debit, 
              remaining_amount: curr.credit - curr.debit 
            }); 
          }
          return acc;
        }, []);
        
        const totalVendorPayable = aggregatedVendors.reduce((sum, curr) => sum + curr.credit, 0);
        const totalVendorPaid = aggregatedVendors.reduce((sum, curr) => sum + curr.debit, 0);

        const agentsData = agentData.agents?.map((entry, index) => ({
          id: entry.id || index, 
          agent_name: entry.agent_name || '', 
          credit: Number(entry.credit) || 0, 
          debit: Number(entry.debit) || 0,
        })) || [];
        const aggregatedAgents = agentsData.reduce((acc, curr) => {
          const existing = acc.find(a => a.agent_name === curr.agent_name);
          if (existing) {
            existing.credit += curr.credit; 
            existing.debit += curr.debit; 
            existing.remaining_amount = existing.credit - existing.debit;
          } else { 
            acc.push({ 
              agent_name: curr.agent_name, 
              credit: curr.credit, 
              debit: curr.debit, 
              remaining_amount: curr.credit - curr.debit 
            }); 
          }
          return acc;
        }, []);

        const totalAgentPayable = aggregatedAgents.reduce((sum, curr) => sum + curr.credit, 0);
        const totalAgentPaid = aggregatedAgents.reduce((sum, curr) => sum + curr.debit, 0);

        const parsePassportDetail = (detail) => {
          try { return JSON.parse(detail); } catch { return {}; }
        };

        const umrahBookings = umrahData.umrahBookings.map(umrah => ({
          type: 'Umrah', 
          employee_name: umrah.userName, 
          receivable_amount: umrah.receivableAmount, 
          entry: umrah.entry, 
          paid_cash: umrah.paidCash, 
          paid_in_bank: umrah.paidInBank, 
          remaining_amount: umrah.remainingAmount, 
          booking_date: safeLocaleDateString(umrah.booking_date || umrah.createdAt), 
          timestamp: safeTimestamp(umrah.createdAt), 
          withdraw: 0, 
          passengerName: null,
          profit: umrah.profit,
        }));

        const allUmrahPayments = [];
        for (const umrah of umrahData.umrahBookings) {
          try {
            const paymentHistory = await fetchWithCache(`/umrah_payments/${umrah.id}`);
            if (paymentHistory.payments && paymentHistory.payments.length > 0) {
              const paymentsWithUmrahInfo = paymentHistory.payments.map(payment => ({
                ...payment,
                umrah_id: umrah.id,
                umrah_entry: umrah.entry,
                customer_name: umrah.customerAdd,
                employee_name: payment.recorded_by || umrah.userName,
              }));
              allUmrahPayments.push(...paymentsWithUmrahInfo);
            }
          } catch (err) {
            console.error(`Failed to load payments for umrah ${umrah.id}`);
          }
        }

        const umrahPaymentEntries = allUmrahPayments.map(payment => ({
          type: 'Umrah Payment',
          employee_name: payment.employee_name,
          receivable_amount: 0,
          entry: payment.umrah_entry,
          paid_cash: parseFloat(payment.payed_cash || payment.payment_amount || 0),
          paid_in_bank: parseFloat(payment.paid_bank || 0),
          remaining_amount: payment.remaining_amount,
          booking_date: safeLocaleDateString(payment.payment_date),
          timestamp: safeTimestamp(payment.created_at),
          withdraw: 0,
          passengerName: payment.customer_name,
          profit: 0,
        }));

        console.log('Umrah payment entries:', umrahPaymentEntries);

        const ticketBookings = ticketsData.ticket.map(ticket => {
          let firstPassengerName = null;
          try {
            let parsedDetails = [];
            if (typeof ticket.passport_detail === 'string') {
              parsedDetails = JSON.parse(ticket.passport_detail);
            } else if (Array.isArray(ticket.passport_detail)) {
              parsedDetails = ticket.passport_detail;
            }
            
            if (parsedDetails.length > 0) {
              const firstPassenger = parsedDetails[0];
              firstPassengerName = `${firstPassenger.title || ''} ${firstPassenger.firstName || ''} ${firstPassenger.lastName || ''}`.trim();
            }
          } catch (e) {
            console.error("Error parsing passenger details:", e);
          }

          return {
            type: 'Ticket', 
            employee_name: ticket.employee_name, 
            receivable_amount: ticket.receivable_amount, 
            entry: ticket.entry, 
            paid_cash: ticket.paid_cash, 
            paid_in_bank: ticket.paid_in_bank, 
            remaining_amount: ticket.remaining_amount, 
            booking_date: safeLocaleDateString(ticket.booking_date || ticket.created_at), 
            timestamp: safeTimestamp(ticket.created_at), 
            withdraw: 0, 
            passengerName: firstPassengerName || ticket.customer_add || null,
            profit: ticket.profit,
          };
        });

        const allTicketPayments = [];
        for (const ticket of ticketsData.ticket) {
          try {
            const paymentHistory = await fetchWithCache(`/ticket_payments/${ticket.id}`);
            if (paymentHistory.payments && paymentHistory.payments.length > 0) {
              const paymentsWithTicketInfo = paymentHistory.payments.map(payment => ({
                ...payment,
                ticket_id: ticket.id,
                ticket_entry: ticket.entry,
                customer_name: ticket.customer_add,
                employee_name: payment.recorded_by || ticket.employee_name,
              }));
              allTicketPayments.push(...paymentsWithTicketInfo);
            }
          } catch (err) {
            console.error(`Failed to load payments for ticket ${ticket.id}`);
          }
        }

        const ticketPaymentEntries = allTicketPayments.map(payment => ({
          type: 'Ticket Payment',
          employee_name: payment.employee_name,
          receivable_amount: 0,
          entry: payment.ticket_entry,
          paid_cash: parseFloat(payment.payed_cash || payment.payment_amount || 0),
          paid_in_bank: parseFloat(payment.paid_bank || 0),
          remaining_amount: payment.remaining_amount,
          booking_date: safeLocaleDateString(payment.payment_date),
          timestamp: safeTimestamp(payment.created_at),
          withdraw: 0,
          passengerName: payment.customer_name,
          profit: 0,
        }));

        console.log('Ticket payment entries:', ticketPaymentEntries);

        const visaBookings = visaData.visa_processing.map(visa => {
          const details = parsePassportDetail(visa.passport_detail);
          return { 
            type: 'Visa Processing', 
            employee_name: visa.employee_name, 
            receivable_amount: visa.receivable_amount, 
            entry: visa.entry, 
            paid_cash: visa.paid_cash, 
            paid_in_bank: visa.paid_in_bank, 
            remaining_amount: visa.remaining_amount, 
            booking_date: safeLocaleDateString(visa.created_at), 
            timestamp: safeTimestamp(visa.created_at), 
            withdraw: 0,
            passengerName: `${details.firstName || ''} ${details.lastName || ''}`.trim(), 
            profit: visa.profit,
          };
        });

        const allVisaPayments = [];
        for (const visa of visaData.visa_processing) {
          try {
            const paymentHistory = await fetchWithCache(`/visa-processing/${visa.id}/payments`);
            if (paymentHistory.payments && paymentHistory.payments.length > 0) {
              const paymentsWithVisaInfo = paymentHistory.payments.map(payment => ({
                ...payment,
                visa_id: visa.id,
                visa_entry: visa.entry,
                customer_name: visa.customer_add,
                employee_name: payment.recorded_by || visa.employee_name,
              }));
              allVisaPayments.push(...paymentsWithVisaInfo);
            }
          } catch (err) {
            console.error(`Failed to load payments for visa ${visa.id}`);
          }
        }

        const visaPaymentEntries = allVisaPayments.map(payment => ({
          type: 'Visa Payment',
          employee_name: payment.employee_name,
          receivable_amount: 0,
          entry: payment.visa_entry,
          paid_cash: parseFloat(payment.payed_cash || 0),
          paid_in_bank: parseFloat(payment.paid_bank || 0),
          remaining_amount: 0,
          booking_date: safeLocaleDateString(payment.payment_date),
          timestamp: safeTimestamp(payment.created_at),
          withdraw: 0,
          passengerName: payment.customer_name,
          profit: 0,
        }));

        console.log('Visa payment entries:', visaPaymentEntries);

        const gamcaTokenBookings = gamcaTokenData.gamcaTokens.map(token => {
          const details = parsePassportDetail(token.passport_detail);
          return { 
            type: 'GAMCA Token', 
            employee_name: token.employee_name, 
            receivable_amount: token.receivable_amount, 
            entry: token.entry, 
            paid_cash: token.paid_cash, 
            paid_in_bank: token.paid_in_bank, 
            remaining_amount: token.remaining_amount, 
            booking_date: safeLocaleDateString(token.created_at), 
            timestamp: safeTimestamp(token.created_at), 
            withdraw: 0, 
            passengerName: `${details.firstName || ''} ${details.lastName || ''}`.trim(), 
            profit: token.profit,
          };
        });

        const allGamcaTokenPayments = [];
        for (const token of gamcaTokenData.gamcaTokens) {
          try {
            const paymentHistory = await fetchWithCache(`/gamca-token/${token.id}/payments`);
            if (paymentHistory.payments && paymentHistory.payments.length > 0) {
              const paymentsWithGamcaInfo = paymentHistory.payments.map(payment => ({
                ...payment,
                gamca_token_id: token.id,
                gamca_entry: token.entry,
                customer_name: token.customer_add,
                employee_name: payment.recorded_by || token.employee_name,
              }));
              allGamcaTokenPayments.push(...paymentsWithGamcaInfo);
            }
          } catch (err) {
            console.error(`Failed to load payments for GAMCA Token ${token.id}`);
          }
        }

        const gamcaTokenPaymentEntries = allGamcaTokenPayments.map(payment => ({
          type: 'GAMCA Token Payment',
          employee_name: payment.employee_name,
          receivable_amount: 0,
          entry: payment.gamca_entry,
          paid_cash: parseFloat(payment.payed_cash || 0),
          paid_in_bank: parseFloat(payment.paid_bank || 0),
          remaining_amount: 0,
          booking_date: safeLocaleDateString(payment.payment_date),
          timestamp: safeTimestamp(payment.created_at),
          withdraw: 0,
          passengerName: payment.customer_name,
          profit: 0,
        }));

        console.log('GAMCA Token payment entries:', gamcaTokenPaymentEntries);

        const servicesBookings = servicesData.services.map(services => {
          console.log('Service entry:', {
            entry: services.entry,
            created_at: services.created_at,
            booking_date: services.booking_date
          });
          
          return {
            type: 'Services', 
            employee_name: services.user_name, 
            receivable_amount: services.receivable_amount, 
            entry: services.entry, 
            paid_cash: services.paid_cash, 
            paid_in_bank: services.paid_in_bank, 
            remaining_amount: services.remaining_amount, 
            booking_date: safeLocaleDateString(services.booking_date), 
            timestamp: safeTimestamp(services.createdAt), 
            withdraw: 0, 
            passengerName: null,
            profit: services.profit,
          };
        });

        const navtccBookings = navtccData.navtcc.map(navtcc => {
          const details = parsePassportDetail(navtcc.passport_detail);
          return { 
            type: 'Navtcc', 
            employee_name: navtcc.employee_name || navtcc.reference, 
            receivable_amount: navtcc.receivable_amount, 
            entry: navtcc.entry, 
            paid_cash: navtcc.paid_cash, 
            paid_in_bank: navtcc.paid_in_bank, 
            remaining_amount: navtcc.remaining_amount, 
            booking_date: safeLocaleDateString(navtcc.created_at), 
            timestamp: safeTimestamp(navtcc.created_at), 
            withdraw: 0, 
            passengerName: `${details.firstName || ''} ${details.lastName || ''}`.trim(), 
            profit: navtcc.profit,
          };
        });

        const protectorBookings = protectorData.protectors.map(protector => ({
          type: 'Protector', 
          employee_name: protector.employee, 
          entry: protector.entry, 
          receivable_amount: 0, 
          paid_cash: 0, 
          paid_in_bank: 0, 
          remaining_amount: 0, 
          booking_date: safeLocaleDateString(protector.protector_date), 
          timestamp: safeTimestamp(protector.createdAt), 
          withdraw: parseFloat(protector.withdraw || 0), 
          passengerName: protector.name || null,
          profit: 0,
        }));

        const expensesBookings = expensesData.expenses.map(expenses => ({
          type: 'Expenses', 
          employee_name: expenses.user_name, 
          entry: expenses.entry, 
          receivable_amount: 0, 
          paid_cash: 0, 
          paid_in_bank: 0, 
          remaining_amount: 0, 
          booking_date: safeLocaleDateString(expenses.date), 
          timestamp: safeTimestamp(expenses.createdAt), 
          withdraw: parseFloat(expenses.withdraw || 0), 
          passengerName: expenses.detail || null,
          profit: 0,
        }));

        const refundedBookings = (refundedData.refunded || []).map(refund => ({
          type: 'Refunded', 
          employee_name: refund.employee, 
          entry: refund.entry, 
          receivable_amount: 0, 
          paid_cash: 0, 
          paid_in_bank: 0, 
          remaining_amount: 0, 
          booking_date: safeLocaleDateString(refund.date), 
          timestamp: safeTimestamp(refund.created_at), 
          withdraw: parseFloat(refund.withdraw || 0), 
          passengerName: refund.name || null,
          profit: 0,
        }));

        const venderBookings = (venderData.vendors || []).map(vender => ({
          type: 'Vender', 
          employee_name: vender.user_name, 
          entry: vender.entry, 
          receivable_amount: 0, 
          paid_cash: 0, 
          paid_in_bank: 0, 
          remaining_amount: 0, 
          booking_date: safeLocaleDateString(vender.date), 
          timestamp: safeTimestamp(vender.created_at), 
          withdraw: parseFloat(vender.withdraw || 0), 
          passengerName: null,
          profit: 0,
        }));

        const combinedBookingsRaw = [
          ...umrahBookings, ...ticketBookings, ...ticketPaymentEntries, ...visaBookings, 
          ...gamcaTokenBookings, ...servicesBookings, ...umrahPaymentEntries, ...visaPaymentEntries,
          ...navtccBookings, ...protectorBookings, ...expensesBookings, ...refundedBookings,
          ...gamcaTokenPaymentEntries,
        ];

        const sortedForRunningTotal = combinedBookingsRaw.sort((a, b) => safeTimestamp(a.timestamp) - safeTimestamp(b.timestamp));

        let runningCashInOffice = 0;
        const bookingsWithCashInOffice = sortedForRunningTotal.map(booking => {
          runningCashInOffice += parseFloat(booking.paid_cash || 0);
          runningCashInOffice -= parseFloat(booking.withdraw || 0);
          return { ...booking, cash_in_office_running: runningCashInOffice };
        });

        console.log('Sample booking timestamps:', bookingsWithCashInOffice.slice().map(b => ({
          entry: b.entry,
          type: b.type,
          booking_date: b.booking_date,
          timestamp: b.timestamp,
          timestampDate: new Date(b.timestamp)
        })));

        const finalCombinedBookings = [...bookingsWithCashInOffice].sort((a, b) => {
          return b.timestamp - a.timestamp;
        });

        const totalProtectorWithdraw = protectorBookings.reduce((sum, entry) => sum + entry.withdraw, 0);
        const totalExpensesWithdraw = expensesBookings.reduce((sum, entry) => sum + entry.withdraw, 0);
        const totalRefundedWithdraw = refundedBookings.reduce((sum, entry) => sum + entry.withdraw, 0);
        const totalVendorWithdraw = venderBookings.reduce((sum, entry) => sum + entry.withdraw, 0);
        const TotalWithdraw = totalProtectorWithdraw + totalExpensesWithdraw + totalRefundedWithdraw + totalVendorWithdraw;

        setDashboardData({
          combinedBookings: finalCombinedBookings,
          totalBookings: dashboardStats.data.totalBookings,
          bookingsByType: dashboardStats.data.bookingsByType,
          totalRevenue: dashboardStats.data.totalRevenue,
          totalProtectorWithdraw: totalProtectorWithdraw,
          totalExpenseWithdraw: totalExpensesWithdraw,
          totalRefundedWithdraw: totalRefundedWithdraw,
          totalVendorWithdraw: totalVendorWithdraw,
          TotalWithdraw: TotalWithdraw,
          cashInOffice: runningCashInOffice,
          accounts: accountsData,
          vendors: aggregatedVendors,
          agents: aggregatedAgents,
          totalVendorPayable: totalVendorPayable,
          totalVendorPaid: totalVendorPaid,
          totalAgentPayable: totalAgentPayable,
          totalAgentPaid: totalAgentPaid,
        });

      } catch (error) {
        console.error('Final fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [fetchWithCache]);

  const booking = dashboardData.bookingsByType;
  const ticketCount = booking.find(item => item.type === 'Ticket')?.count || 0;
  const umrahCount = booking.find(item => item.type === 'Umrah')?.count || 0;
  const visaCount = booking.find(item => item.type === 'Visa Processing')?.count || 0;
  const gamcaTokenCount = booking.find(item => item.type === 'GAMCA Token')?.count || 0;
  const serviceCount = booking.find(item => item.type === 'Services')?.count || 0;
  const navtccCount = booking.find(item => item.type === 'Navtcc')?.count || 0;

  const moduleBreakdown = [
    { name: 'Ticket', count: ticketCount, color: 'midnight', icon: Plane },
    { name: 'Umrah', count: umrahCount, color: 'emerald', icon: MapPin },
    { name: 'Visa Processing', count: visaCount, color: 'rose', icon: FileText },
    { name: 'GAMCA Token', count: gamcaTokenCount, color: 'teal', icon: CreditCard },
    { name: 'Services', count: serviceCount, color: 'indigo', icon: CreditCard },
    { name: 'Navtcc', count: navtccCount, color: 'ivory', icon: Shield },
  ];

  // Calculate profit breakdown by module (using profit field from data)
  const profitBreakdown = dashboardData.combinedBookings.reduce((acc, booking) => {
    const mainBookingTypes = ['Ticket', 'Umrah', 'Visa Processing', 'GAMCA Token', 'Services', 'Navtcc'];
    if (mainBookingTypes.includes(booking.type)) {
      const profit = parseFloat(booking.profit || 0);
      acc[booking.type] = (acc[booking.type] || 0) + profit;
    }
    return acc;
  }, {});

  const profitBreakdownArray = Object.keys(profitBreakdown)
    .map(type => ({ name: type, amount: profitBreakdown[type], }))
    .filter(item => item.amount !== 0);

  const totalProfit = profitBreakdownArray.reduce((sum, item) => sum + item.amount, 0);

  const totalAccountsBalance = dashboardData.accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const totalRemainingAmount = dashboardData.combinedBookings.reduce((sum, booking) => sum + parseFloat(booking.remaining_amount || 0), 0);

  const totalVendorPayable = dashboardData.totalVendorPayable || 0;
  const totalVendorPaid = dashboardData.totalVendorPaid || 0;
  const totalAgentPayable = dashboardData.totalAgentPayable || 0;
  const totalAgentPaid = dashboardData.totalAgentPaid || 0;

  const showPartialData = !isLoading && dashboardData.combinedBookings.length > 0;

  const remainingBreakdown = dashboardData.combinedBookings.reduce((acc, booking) => {
    if (booking.receivable_amount > 0) {
      const remaining = parseFloat(booking.remaining_amount || 0);
      if (remaining > 0) {
        acc[booking.type] = (acc[booking.type] || 0) + remaining;
      }
    }
    return acc;
  }, {});
  
  const remainingBreakdownArray = Object.keys(remainingBreakdown)
    .map(type => ({ 
      name: type, 
      amount: remainingBreakdown[type],
      color: moduleBreakdown.find(m => m.name === type)?.color || 'ivory',
    }))
    .filter(item => item.amount !== 0);

  // --- DERIVED DATA FOR CHARTS (Kept in Dashboard as it depends on main state) ---
  const financialOverviewData = [
    { name: 'Receivable Amount', value: summaryTotals.receivable_amount, color: '#3b82f6' }, 
    { name: 'Paid Cash', value: summaryTotals.paid_cash, color: '#10b981' }, 
    { name: 'Paid In Bank', value: summaryTotals.paid_in_bank, color: '#f59e0b' }, 
    { name: 'Remaining Amount', value: summaryTotals.remaining_amount, color: '#ef4444' }, 
    { name: 'Total Withdraw', value: summaryTotals.withdraw, color: '#8b5cf6' }, 
  ].filter(item => item.value > 0);
  // -------------------------------------------------------------------------------
  
  // Table Structure
  const columns = [
    { header: 'DATE', accessor: 'booking_date' },
    { header: 'ENTRY', accessor: 'entry' },
    { header: 'TYPE', accessor: 'type' },
    { header: 'NAME', accessor: 'passengerName' },
    { header: 'RECEIVABLE AMOUNT', accessor: 'receivable_amount' },
    { header: 'PAID CASH', accessor: 'paid_cash' },
    { header: 'PAID IN BANK', accessor: 'paid_in_bank' },
    { header: 'REMAINING AMOUNT', accessor: 'remaining_amount' },
    { header: 'WITHDRAW', accessor: 'withdraw' },
    { header: 'CASH IN OFFICE', accessor: 'cash_in_office_display' },
  ];

  return (
    <div className=""> {/* Stats Cards Section - Adjusted for 8 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
        {/* Total Bookings Card */}
        <div className="relative w-full" onMouseEnter={() => handleMouseEnter('bookings')} onMouseLeave={handleMouseLeave} >
          <div className="relative bg-blue-500 p-3 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] group cursor-pointer" title="Total Bookings" >
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
                    <div key={index} className="list-item text-[0.65rem] text-[#333] cursor-pointer hover:bg-[#e0e0e0] p-1 rounded-lg transition-colors duration-150 flex justify-between items-center" onClick={() => handleModuleClick(module.name)}>
                      <span className={`font-semibold ${COLOR_MAP[module.color].textBold} flex items-center space-x-1`}>
                        {module.icon && <module.icon className={`w-3 h-3 ${COLOR_MAP[module.color].text}`} />}
                        <span className="truncate pr-2 hover:underline">{module.name}</span>
                      </span>
                      <span className={`font-bold text-sm ${COLOR_MAP[module.color].textBold} flex-shrink-0`}>
                        {module.count.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
       

        {/* Total Withdraw Card */}
        <div className="relative w-full" onMouseEnter={() => handleMouseEnter('withdraw')} onMouseLeave={handleMouseLeave} >
          <div className="relative bg-green-500 p-3 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] group cursor-pointer" title="Total Withdraw" >
            <div className="relative z-10">
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
                  <div className="list-item text-[0.65rem] text-[#333] hover:bg-[#e0e0e0] p-1 rounded-lg transition-colors duration-150 flex justify-between cursor-pointer" onClick={handleProtectorClick} >
                    <span className="font-semibold text-fuchsia-700 hover:underline">Protector</span>
                    <span className="font-bold text-fuchsia-600">{dashboardData.totalProtectorWithdraw.toLocaleString()}</span>
                  </div>
                  <div className="list-item text-[0.65rem] text-[#333] hover:bg-[#e0e0e0] p-1 rounded-lg transition-colors duration-150 flex justify-between cursor-pointer" onClick={handleExpensesClick} >
                    <span className="font-semibold text-fuchsia-700 hover:underline">Expenses</span>
                    <span className="font-bold text-fuchsia-600">{dashboardData.totalExpenseWithdraw.toLocaleString()}</span>
                  </div>
                  <div className="list-item text-[0.65rem] text-[#333] hover:bg-[#e0e0e0] p-1 rounded-lg transition-colors duration-150 flex justify-between cursor-pointer" onClick={handleRefundedClick} >
                    <span className="font-semibold text-fuchsia-700 hover:underline">Refunded</span>
                    <span className="font-bold text-fuchsia-600">{dashboardData.totalRefundedWithdraw.toLocaleString()}</span>
                  </div>
                   <div className="list-item text-[0.65rem] text-[#333] hover:bg-[#e0e0e0] p-1 rounded-lg transition-colors duration-150 flex justify-between cursor-pointer" >
                    <span className="font-semibold text-fuchsia-700 hover:underline">Vendor</span>
                    <span className="font-bold text-fuchsia-600">{dashboardData.totalVendorWithdraw.toLocaleString()}</span>
                  </div>
                  <div className="list-item text-[0.65rem] text-[#333] font-bold p-1 rounded-lg border-t border-gray-200 mt-1 pt-2 flex justify-between">
                    <span>Total:</span>
                    <span className="text-fuchsia-600">{dashboardData.TotalWithdraw.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Cash in Office Card */}
        <div className="bg-red-500 p-3 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group cursor-pointer">
          <div className="relative z-10 w-full">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-black text-[0.65rem] font-bold tracking-wide font-inter truncate">Cash in Office</h2>
            </div>
            <p className="text-sm font-bold text-white mt-0 break-all">
              {isLoading && !showPartialData ? <span className="text-white/60">--</span> : dashboardData.cashInOffice.toLocaleString()}
            </p>
          </div>
        </div>
        
        {/* Accounts Card */}
        <div className="relative w-full" onMouseEnter={() => handleMouseEnter('accounts')} onMouseLeave={handleMouseLeave} >
          <div className="relative bg-blue-500 p-3 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] group cursor-pointer" title="Bank Accounts" >
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-black text-[0.65rem] font-bold tracking-wide font-inter truncate">Accounts</h2>
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
                  {dashboardData.accounts.map((account, index) => (
                    <div key={account.name} className="list-item text-[0.65rem] text-[#333] cursor-pointer hover:bg-[#e0e0e0] p-1 rounded-lg transition-colors duration-150 flex justify-start" onClick={() => handleAccountClick(account)}>
                      <span className="font-semibold text-[#1e3a8a]">
                        {`${account.name} (${account.balance.toLocaleString()})`}
                      </span>
                    </div>
                  ))}
                  {errors.accounts && (
                    <div className="text-rose-600 text-[0.65rem] text-center font-inter bg-rose-50 p-1 rounded-lg border border-rose-200 mt-1">
                      {errors.accounts}
                    </div>
                  )}
                  <div className="list-item text-[0.65rem] text-[#333] font-bold p-1 rounded-lg border-t border-gray-200 mt-1 pt-2">
                    Total: {totalAccountsBalance.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Vendor Card */}
        <div className="relative w-full" onMouseEnter={() => handleMouseEnter('vendors')} onMouseLeave={handleMouseLeave} >
          <div className="relative bg-green-500 p-3 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] group cursor-pointer" title="Vendors" >
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-black text-[0.65rem] font-bold tracking-wide font-inter truncate">Vendors</h2>
              </div>
              <p className="text-[0.65rem] font-bold text-white mt-0 break-all">
                {isLoading && !showPartialData ? <span className="text-white/60">--</span> : `${totalVendorPayable.toLocaleString()} / ${totalVendorPaid.toLocaleString()}`}
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
                    <div key={vendor.vender_name} className="list-item text-[0.65rem] text-[#333] hover:bg-[#e0e0e0] p-1 rounded-lg transition-colors duration-150 flex justify-between items-center cursor-pointer" onClick={() => handleVendorClick(vendor.vender_name)} >
                      <span className="font-semibold text-red-700 truncate pr-2 hover:underline">
                        {vendor.vender_name}
                      </span>
                      <span className={`font-bold ${vendor.remaining_amount < 0 ? 'text-red-600' : 'text-emerald-600'} flex-shrink-0`}>
                        {vendor.remaining_amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {errors.vendor && (
                    <div className="text-rose-600 text-[0.65rem] text-center font-inter bg-rose-50 p-1 rounded-lg border border-rose-200 mt-1">
                      {errors.vendor}
                    </div>
                  )}
                  <div className="list-item text-[0.65rem] text-[#333] font-bold p-1 rounded-lg border-t border-gray-200 mt-1 pt-2 flex justify-between">
                    <span>Total Payable:</span>
                    <span className="text-emerald-600">{totalVendorPayable.toLocaleString()}</span>
                  </div>
                   <div className="list-item text-[0.65rem] text-[#333] font-bold p-1 rounded-lg flex justify-between">
                    <span>Total Paid:</span>
                    <span className="text-red-600">{totalVendorPaid.toLocaleString()}</span>
                  </div>
                  <div className="list-item text-[0.65rem] text-[#333] font-bold p-1 rounded-lg">
                    Total Vendors: {dashboardData.vendors.length}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Agents Card */}
        <div className="relative w-full" onMouseEnter={() => handleMouseEnter('agents')} onMouseLeave={handleMouseLeave} >
          <div className="relative bg-blue-500  p-3 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] group cursor-pointer" title="Agents" >
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-black text-[0.65rem] font-bold tracking-wide font-inter truncate">Agents</h2>
              </div>
              <p className="text-[0.65rem] font-bold text-white mt-0 break-all">
                 {isLoading && !showPartialData ? <span className="text-white/60">--</span> : `${totalAgentPayable.toLocaleString()} / ${totalAgentPaid.toLocaleString()}`}
              </p>
            </div>
          </div>
          {hoveredCard === 'agents' && (
            <div className="absolute top-full left-0 mt-2 w-full min-w-[150px] bg-[#f9f9f9] rounded-xl shadow-2xl z-[50] p-2 border border-[#ddd] animate-in fade-in duration-300 max-h-64 overflow-y-auto">
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
                  {dashboardData.agents.map((agent, index) => (
                    <div key={agent.agent_name} className="list-item text-[0.65rem] text-[#333] hover:bg-[#e0e0e0] p-1 rounded-lg transition-colors duration-150 flex justify-between items-center cursor-pointer" onClick={() => handleAgentClick(agent.agent_name)} >
                      <span className="font-semibold text-cyan-700 truncate pr-2 hover:underline">
                        {agent.agent_name}
                      </span>
                      <span className={`font-bold ${agent.remaining_amount < 0 ? 'text-red-600' : 'text-emerald-600'} flex-shrink-0`}>
                        {agent.remaining_amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {errors.agent && (
                    <div className="text-rose-600 text-[0.65rem] text-center font-inter bg-rose-50 p-1 rounded-lg border border-rose-200 mt-1">
                      {errors.agent}
                    </div>
                  )}
                  <div className="list-item text-[0.65rem] text-[#333] font-bold p-1 rounded-lg border-t border-gray-200 mt-1 pt-2 flex justify-between">
                    <span>Total Payable:</span>
                    <span className="text-emerald-600">{totalAgentPayable.toLocaleString()}</span>
                  </div>
                  <div className="list-item text-[0.65rem] text-[#333] font-bold p-1 rounded-lg flex justify-between">
                    <span>Total Paid:</span>
                    <span className="text-red-600">{totalAgentPaid.toLocaleString()}</span>
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
        <div className="relative w-full" onMouseEnter={() => handleMouseEnter('remaining')} onMouseLeave={handleMouseLeave} >
          <div className="relative bg-green-500 p-3 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] group cursor-pointer" title="Remaining Amount" >
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-black text-[0.65rem] font-bold tracking-wide font-inter truncate">Remaining Amount</h2>
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
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="animate-pulse bg-[#e0e0e0] p-1 rounded">
                      <div className="h-3 bg-[#ddd] rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : remainingBreakdownArray.length > 0 ? (
                <div className="space-y-1">
                  {remainingBreakdownArray.map((item, index) => (
                    <div key={item.name} className="list-item text-[0.65rem] text-[#333] hover:bg-[#e0e0e0] p-1 rounded-lg transition-colors duration-150 flex justify-between items-center cursor-pointer" onClick={() => handleRemainingAmountClick(item.name)}>
                      <span className={`font-semibold ${COLOR_MAP[item.color].textBold} truncate pr-2 hover:underline`}>
                        {item.name}
                      </span>
                      <span className={`font-bold text-amber-600 flex-shrink-0`}>
                        {item.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="list-item text-[0.65rem] text-[#333] font-bold p-1 rounded-lg border-t border-gray-200 mt-1 pt-2 flex justify-between">
                    <span>Total:</span>
                    <span className="text-amber-600">{totalRemainingAmount.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-[0.65rem] text-center p-1">
                  No pending remaining amounts.
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* New Profit Card */}
        <div className="relative w-full" onMouseEnter={() => handleMouseEnter('profit')} onMouseLeave={handleMouseLeave} >
          <div className="relative bg-yellow-500 p-3 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] group cursor-pointer" title="Total Profit" >
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
                  {profitBreakdownArray.map((item, index) => (
                    <div key={item.name} className="list-item text-[0.65rem] text-[#333] hover:bg-[#e0e0e0] p-1 rounded-lg transition-colors duration-150 flex justify-between items-center" >
                      <span className="font-semibold text-yellow-700 truncate pr-2">
                        {item.name}
                      </span>
                      <span className={`font-bold ${item.amount < 0 ? 'text-red-600' : 'text-emerald-600'} flex-shrink-0`}>
                        {item.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="list-item text-[0.65rem] text-[#333] font-bold p-1 rounded-lg border-t border-gray-200 mt-1 pt-2 flex justify-between">
                    <span>Total:</span>
                    <span className="text-emerald-600">{totalProfit.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-[0.65rem] text-center p-1">
                  No profits recorded yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- CHART SECTIONS: NOW USING SEPARATED COMPONENTS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8"> 
        {/* Financial Overview Pie Chart */}
        <FinancialOverviewChart
          isLoading={isLoading}
          financialOverviewData={financialOverviewData}
        />

        {/* Monthly Bookings Bar Chart */}
        <MonthlyBookingsChart
          isLoading={isLoading}
          monthlySummaryData={monthlySummaryData}
          currentMonthName={currentMonthName}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          setSelectedMonthEnd={setSelectedMonthEnd}
        />
      </div>


      {/* --- RECENT BOOKINGS TABLE --- */}
      <div className="px-4 py-3 bg-white rounded-xl shadow-lg border border-indigo-100 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 font-inter">All Bookings</h2>
         
        </div>
        
        {/* Date Range Filter */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <Filter size={18} className="text-indigo-600" />
            <span className="text-sm text-gray-600 font-medium">Filter by Date:</span>
          </div>
          <div className="flex items-center space-x-2">
            <input 
              type="date" 
              value={dateRange.startDate || ''} 
              onChange={(e) => handleDateRangeChange(e.target.value, dateRange.endDate)} 
              className="px-3 py-2 text-sm border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
              placeholder="Start Date" 
            />
            <span className="text-sm font-medium text-gray-600">to</span>
            <input 
              type="date" 
              value={dateRange.endDate || ''} 
              onChange={(e) => handleDateRangeChange(dateRange.startDate, e.target.value)} 
              className="px-3 py-2 text-sm border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
              placeholder="End Date" 
            />
          </div>
          {(dateRange.startDate || dateRange.endDate) && (
            <button 
              onClick={() => setDateRange({ startDate: null, endDate: null })} 
              className="text-xs px-3 py-1.5 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition-colors self-start sm:self-auto" 
            > 
              Clear Filter 
            </button>
          )}
        </div>

        {/* Table Totals Summary */}
        <div className="mb-4 grid grid-cols-2 md:grid-cols-5 gap-4 bg-indigo-50 p-3 rounded-xl border border-indigo-200">
          <div className="text-xs font-inter">
            <p className="text-gray-600 font-medium">Receivable Total</p>
            <p className="font-bold text-indigo-700">{summaryTotals.receivable_amount.toLocaleString()}</p>
          </div>
          <div className="text-xs font-inter">
            <p className="text-gray-600 font-medium">Cash Paid Total</p>
            <p className="font-bold text-emerald-700">{summaryTotals.paid_cash.toLocaleString()}</p>
          </div>
          <div className="text-xs font-inter">
            <p className="text-gray-600 font-medium">Bank Paid Total</p>
            <p className="font-bold text-amber-700">{summaryTotals.paid_in_bank.toLocaleString()}</p>
          </div>
          <div className="text-xs font-inter">
            <p className="text-gray-600 font-medium">Remaining Total</p>
            <p className="font-bold text-rose-700">{summaryTotals.remaining_amount.toLocaleString()}</p>
          </div>
          <div className="text-xs font-inter">
            <p className="text-gray-600 font-medium">Withdraw Total</p>
            <p className="font-bold text-fuchsia-700">{summaryTotals.withdraw.toLocaleString()}</p>
          </div>
        </div>

        {/* Actual Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 font-semibold
 shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-indigo-600 text-white">
              <tr>
                {columns.map(column => (
                  <th key={column.header} scope="col" className="px-1 py-2 text-center text-[0.6rem] font-bold uppercase tracking-wider">
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading && !showPartialData ? (
                <tr>
                  <td colSpan={columns.length} className="py-8 text-center">
                    <TableSpinner message="Loading dashboard data..." />
                  </td>
                </tr>
              ) : currentTableData.length > 0 ? (
                <>
                  {currentTableData.map((booking, index) => (
                    <tr key={index} className="hover:bg-indigo-50 transition-colors duration-150">
                      <td className="px-1 py-2 text-[0.70rem] text-slate-700 font-large truncate">
                        {booking.booking_date}
                      </td>
                      <td 
                        className="px-1 py-2 text-[0.70rem] text-slate-700 font-bold font-large truncate cursor-pointer hover:text-indigo-600 hover:underline" 
                        title={booking.entry} 
                        onClick={() => handleEntryClick(booking)} 
                      >
                        {booking.entry ? booking.entry : <span className="text-slate-400">--</span>}
                      </td>
                      <td className="px-1 py-2 text-[0.70rem] font-bold font-large truncate">
                        <span className="px-1 py-0.5 rounded-md bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 text-[0.70rem] font-semibold">
                          {booking.type}
                        </span>
                      </td>
                      <td className="px-1 py-2 text-[0.70rem] text-slate-700 font-large truncate">
                        {booking.passengerName || booking.employee_name || '--'}
                      </td>
                      <td className="px-1 py-2 text-[0.70rem] text-emerald-600 font-bold font-large truncate">
                        {booking.receivable_amount.toLocaleString()}
                      </td>
                      <td className="px-1 py-2 text-[0.70rem] text-teal-600 font-bold font-large truncate">
                        {booking.paid_cash.toLocaleString()}
                      </td>
                      <td className="px-1 py-2 text-[0.70rem] text-cyan-600 font-bold font-large truncate">
                        {booking.paid_in_bank.toLocaleString()}
                      </td>
                      <td className="px-1 py-2 text-[0.70rem] text-amber-600 font-bold font-large truncate">
                        {booking.remaining_amount.toLocaleString()}
                      </td>
                      <td className="px-1 py-2 text-[0.70rem] text-slate-700 font-bold font-large truncate">
                        {booking.withdraw.toLocaleString()}
                      </td>
                      <td className="px-1 py-2 text-[0.70rem] text-indigo-600 font-bold font-large truncate">
                        {booking.cash_in_office_running !== undefined ? booking.cash_in_office_running.toLocaleString() : <span className="text-slate-400">--</span>}
                      </td>
                    </tr>
                  ))}
                </>
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl text-indigo-400">📋</span>
                      </div>
                      <p className="text-sm text-black font-bold">
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
      
     
    </div>
  );
}