import { useEffect, useState, useCallback } from 'react';
import { Plane, MapPin, FileText, CreditCard, Landmark, Shield, X, ChevronRight, DollarSign, User, Filter } from 'lucide-react';
import axios from 'axios';
import TableSpinner from '../../ui/TableSpinner';
import DateRangePicker from '../../ui/DateRangePicker';
import { useNavigate } from 'react-router-dom';
// --- ADDED: Recharts Imports for Pie Chart and Bar Chart ---
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
// ----------------------------------------------

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
    return isNaN(date.getTime()) ? '--' : date.toLocaleDateString();
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
  const firstDayOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
  const lastDayOfMonth = new Date(selectedMonthEnd.getFullYear(), selectedMonthEnd.getMonth() + 1, 0);
  
  firstDayOfMonth.setHours(0, 0, 0, 0);
  lastDayOfMonth.setHours(23, 59, 59, 999);

  const monthlyBookings = dashboardData.combinedBookings.filter(booking => {
    const bookingDate = new Date(booking.timestamp);
    return bookingDate >= firstDayOfMonth && bookingDate <= lastDayOfMonth;
  });

  const summary = {
    Ticket: 0,
    Umrah: 0,
    'Visa Processing': 0,
    'GAMCA Token': 0,
    Navtcc: 0,
    Services: 0,
    Vendor: 0,
    Agent: 0,
  };

  monthlyBookings.forEach(booking => {
    if (booking.type === 'Ticket' && booking.receivable_amount > 0) {
      summary.Ticket++;
    } else if (booking.type === 'Umrah' && booking.receivable_amount > 0) {
      summary.Umrah++;
    } else if (booking.type === 'Visa Processing') {
      summary['Visa Processing']++;
    } else if (booking.type === 'GAMCA Token') {
      summary['GAMCA Token']++;
    } else if (booking.type === 'Navtcc') {
      summary.Navtcc++;
    } else if (booking.type === 'Services') {
      summary.Services++;
    } else if (booking.type === 'Vender') {
      summary.Vendor++;
    }
  });

  const bankTransactions = monthlyBookings.filter(
    b => parseFloat(b.paid_in_bank || 0) > 0
  ).length;

  return [
    { name: 'Ticket', count: summary.Ticket, color: '#1e3a8a' },
    { name: 'Umrah', count: summary.Umrah, color: '#10b981' },
    { name: 'Visa', count: summary['Visa Processing'], color: '#e11d48' },
    { name: 'Gamca', count: summary['GAMCA Token'], color: '#0d9488' },
    { name: 'NAVTCC', count: summary.Navtcc, color: '#6366f1' },
    { name: 'Services', count: summary.Services, color: '#8b5cf6' },
    { name: 'Vendor', count: summary.Vendor, color: '#f59e0b' },
    { name: 'Banks', count: bankTransactions, color: '#06b6d4' },
  ];
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
          booking_date: safeLocaleDateString(umrah.createdAt), 
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
            booking_date: safeLocaleDateString(ticket.created_at), 
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
        const totalPaidCash = finalCombinedBookings.reduce((sum, booking) => sum + parseFloat(booking.paid_cash || 0), 0);
        
        const cashInOffice = totalPaidCash - totalProtectorWithdraw - totalExpensesWithdraw - totalRefundedWithdraw - totalVendorWithdraw;
        const TotalWithdraw = totalProtectorWithdraw + totalExpensesWithdraw + totalRefundedWithdraw + totalVendorWithdraw;

        setDashboardData({
          combinedBookings: finalCombinedBookings,
          totalBookings: dashboardStats.data.totalBookings,
          bookingsByType: dashboardStats.data.bookingsByType,
          totalRevenue: dashboardStats.data.totalRevenue,
          totalProtectorWithdraw, 
          totalExpenseWithdraw: totalExpensesWithdraw, 
          totalRefundedWithdraw, 
          totalVendorWithdraw,
          cashInOffice, 
          TotalWithdraw, 
          accounts: accountsData, 
          vendors: aggregatedVendors, 
          agents: aggregatedAgents,
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

    const handlePaymentUpdate = () => {
      cache.data.clear();
      cache.timestamp.clear();
      fetchDashboardData();
    };
    
    window.addEventListener('paymentUpdated', handlePaymentUpdate);
    fetchDashboardData();
    
    return () => {
      window.removeEventListener('paymentUpdated', handlePaymentUpdate);
      if (delayHandler) {
        clearTimeout(delayHandler);
      }
    };
  }, [fetchWithCache]); 

  const booking = dashboardData.bookingsByType || [];
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
    .map(type => ({
      name: type,
      amount: profitBreakdown[type],
    }))
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
      acc[booking.type] = (acc[booking.type] || 0) + remaining;
    }
    return acc;
  }, {});
  
  const remainingBreakdownArray = Object.keys(remainingBreakdown)
    .map(type => ({
      name: type,
      amount: remainingBreakdown[type],
    }))
    .filter(item => item.amount > 0);

  // --- MODIFIED: Data calculation for the Financial Overview Pie Chart ---
  const financialOverviewData = [
    { name: 'Bank Amount', value: totalAccountsBalance, color: '#6366f1' }, // Indigo
    { name: 'Total Profit', value: totalProfit, color: '#10b981' }, // Emerald
    { name: 'Cash in Office', value: dashboardData.cashInOffice, color: '#f97316' }, // Orange
    { name: 'Remaining Receivable', value: totalRemainingAmount, color: '#f43f5e' }, // Rose
  ].filter(item => item.value > 0); // Only show segments with a value > 0
  // -------------------------------------------------------------------

  const columns = [
    { header: 'DATE', accessor: 'booking_date' },
    { header: 'EMPLOYEE NAME', accessor: 'employee_name' },
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
    <div className="bg-[#f8fafc] p-6 rounded-2xl shadow-md overflow-hidden font-inter">
      {/* Stats Cards Section - Adjusted for 8 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
        {/* Total Bookings Card */}
        <div
          className="relative w-full"
          onMouseEnter={() => handleMouseEnter('bookings')}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className="relative bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 p-3 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] group cursor-pointer"
            title="Total Bookings"
          >
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
          <div
            className="relative bg-gradient-to-br from-emerald-600 via-green-700 to-teal-800 p-3 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] group cursor-pointer"
            title="Total Paid In Bank Amount"
          >
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
                  {dashboardData.accounts.map((account, index) => (
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
        <div
          className="relative w-full"
          onMouseEnter={() => handleMouseEnter('vendors')}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className="relative bg-gradient-to-br from-red-600 via-rose-700 to-red-800 p-3 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] group cursor-pointer"
            title="Vendors"
          >
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
                  {dashboardData.vendors.map((vendor, index) => (
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
                  {errors.vendor && (
                    <div className="text-rose-600 text-[0.65rem] text-center font-inter bg-rose-50 p-1 rounded-lg border border-rose-200 mt-1">
                      {errors.vendor}
                    </div>
                  )}
                  <div className="list-item text-[0.65rem] text-[#333] font-bold p-1 rounded-lg border-t border-gray-200 mt-1 pt-2 flex justify-between">
                    <span>Total Payable:</span> <span className="text-emerald-600">{totalVendorPayable.toLocaleString()}</span>
                  </div>
                  <div className="list-item text-[0.65rem] text-[#333] font-bold p-1 rounded-lg flex justify-between">
                    <span>Total Paid:</span> <span className="text-red-600">{totalVendorPaid.toLocaleString()}</span>
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
          <div
            className="relative bg-gradient-to-br from-cyan-600 via-teal-700 to-cyan-800 p-3 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] group cursor-pointer"
            title="Agents"
          >
            <div className="relative z-8">
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-black text-[0.65rem] font-bold tracking-wide font-inter truncate">Agents</h2>
              </div>
              <p className="text-sm font-bold text-white mt-0 break-all">
                {isLoading && !showPartialData ? <span className="text-white/60">--</span> : `${totalAgentPayable.toLocaleString()}`}
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
                  {dashboardData.agents.map((agent, index) => (
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
                  {errors.agent && (
                    <div className="text-rose-600 text-[0.65rem] text-center font-inter bg-rose-50 p-1 rounded-lg border border-rose-200 mt-1">
                      {errors.agent}
                    </div>
                  )}
                  <div className="list-item text-[0.65rem] text-[#333] font-bold p-1 rounded-lg border-t border-gray-200 mt-1 pt-2 flex justify-between">
                    <span>Total Payable:</span> <span className="text-emerald-600">{totalAgentPayable.toLocaleString()}</span>
                  </div>
                  <div className="list-item text-[0.65rem] text-[#333] font-bold p-1 rounded-lg flex justify-between">
                    <span>Total Paid:</span> <span className="text-red-600">{totalAgentPaid.toLocaleString()}</span>
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
          <div
            className="relative bg-gradient-to-br from-gray-700 via-slate-800 to-stone-900 p-3 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group cursor-pointer"
            title="Total Remaining Amount"
          >
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
                  {remainingBreakdownArray.map((item, index) => (
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

        {/* New Profit Card */}
        <div
          className="relative w-full"
          onMouseEnter={() => handleMouseEnter('profit')}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className="relative bg-gradient-to-br from-yellow-500 via-amber-600 to-orange-700 p-3 rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] group cursor-pointer"
            title="Total Profit"
          >
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

      {/* --- CHART SECTIONS --- */}
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-8 mb-8">
        {/* Financial Overview Pie Chart */}
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

        {/* Monthly Summary Bar Chart */}
<div className="bg-white p-4 rounded-2xl shadow-xl border border-indigo-100">
  <div className="flex items-start justify-between flex-col">
    <div>
      <h2 className="font-bold text-sm text-black font-inter mb-3">
      Monthly Summary
    </h2>
    </div>
    <div className="flex items-center space-x-1">
  <div className="flex items-center space-x-1 bg-slate-50 px-1 py-1 rounded-lg border border-slate-200">
    <span className="text-sm font-semibold text-slate-600">From:</span>
    <input
      type="month"
      value={`${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`}
      onChange={(e) => {
        const [year, month] = e.target.value.split('-');
        setSelectedMonth(new Date(parseInt(year), parseInt(month) - 1, 1));
      }}
      className="px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  </div>
  
  <div className="flex items-center space-x-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
    <span className="text-xs font-semibold text-slate-600">To:</span>
    <input
      type="month"
      value={`${selectedMonthEnd.getFullYear()}-${String(selectedMonthEnd.getMonth() + 1).padStart(2, '0')}`}
      onChange={(e) => {
        const [year, month] = e.target.value.split('-');
        setSelectedMonthEnd(new Date(parseInt(year), parseInt(month) - 1, 1));
      }}
      max={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`}
      className="px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  </div>

  <button
    onClick={() => {
      setSelectedMonth(new Date());
      setSelectedMonthEnd(new Date());
    }}
    className="px-3 py-1 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition-colors text-xs font-semibold"
  >
    Reset
  </button>
</div>
  </div>

  {isLoading && !showPartialData ? (
    <div className="flex justify-center items-center h-64">
      <TableSpinner />
    </div>
  ) : monthlySummaryData.length > 0 ? (
    <div style={{ width: '100%', height: 350 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={monthlySummaryData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
          />
          <YAxis 
            tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
            label={{ value: '', angle: -90, position: 'insideLeft', style: { fill: '#475569', fontWeight: 600 } }}
          />
          <Tooltip 
            formatter={(value, name) => [value, 'Entries']}
            contentStyle={{ 
              backgroundColor: '#ffffff', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          />
          <Bar 
            dataKey="count" 
            radius={[8, 8, 0, 0]}
            label={{ position: 'top', fill: '#1f2937', fontWeight: 'bold', fontSize: 12 }}
          >
            {monthlySummaryData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
    
    </div>
  ) : (
    <div className="text-center py-12 text-slate-500">
      No data available for this month.
    </div>
  )}
</div>
      </div>
      {/* ----------------------------------------------------------------- */}

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
              {(errors.umrah || errors.tickets || errors.visa || errors.gamcaToken || errors.services || errors.navtcc || errors.protector || errors.vendor || errors.agent) && (
                <span className="text-xs text-rose-600 font-inter bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                  {Object.values(errors).filter(e => e).join(', ')}
                </span>
              )}
              <div className="flex items-center space-x-2">
                <Filter size={18} className="text-indigo-600" />
                <span className="text-sm text-gray-600 font-medium">Filter by Date:</span>
              </div>
            </div>
          </div>
          
          {/* Date Range Picker */}
          <div className="mb-6 flex items-center space-x-4">
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
                className="ml-2 text-xs px-3 py-1.5 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition-colors"
              >
                Clear
              </button>
            )}
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
                {(dateRange.startDate && dateRange.endDate ? filteredBookings : dashboardData.combinedBookings).length > 0 ? (
                  <>
                  {(dateRange.startDate && dateRange.endDate ? filteredBookings : dashboardData.combinedBookings).map((booking, index) => (
  <tr 
    key={index} 
    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gradient-to-r from-indigo-50/30 via-purple-50/20 to-pink-50/30'} hover:bg-gradient-to-r hover:from-indigo-100/40 hover:via-purple-100/30 hover:to-pink-100/40 transition-all duration-200`}
  >
    <td className="px-1 py-2 text-[0.65rem] text-slate-700 font-bold font-large truncate">
      {booking.booking_date}
    </td>
    <td className="px-1 py-2 text-[0.65rem] text-slate-700 font-bold font-large truncate" title={booking.employee_name}>
      {booking.employee_name}
    </td>
    <td 
      className="px-1 py-2 text-[0.65rem] text-slate-700 font-bold font-large truncate cursor-pointer hover:text-indigo-600 hover:underline" 
      title={booking.entry}
      onClick={() => handleEntryClick(booking)}
    >
      {booking.entry ? booking.entry : <span className="text-slate-400">--</span>}
    </td>
    <td className="px-1 py-2 text-[0.65rem] font-bold font-large truncate">
      <span className="px-1 py-0.5 rounded-md bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 inline-block">
        {booking.type}
      </span>
    </td>
    <td className="px-1 py-2 text-[0.65rem] text-slate-700 font-bold font-large truncate" title={booking.passengerName}>
      {booking.passengerName ? booking.passengerName : <span className="text-slate-400">--</span>}
    </td>
    <td className="px-1 py-2 text-[0.65rem] text-emerald-600 font-bold font-large truncate">
      {booking.receivable_amount}
    </td>
    <td className="px-1 py-2 text-[0.65rem] text-slate-700 font-bold font-large truncate">
      {booking.paid_cash}
    </td>
    <td className="px-1 py-2 text-[0.65rem] text-slate-700 font-bold font-large truncate">
      {booking.paid_in_bank}
    </td>
    <td className="px-1 py-2 text-[0.65rem] text-amber-600 font-bold font-large truncate">
      {booking.remaining_amount}
    </td>
    <td className="px-1 py-2 text-[0.65rem] text-slate-700 font-bold font-large truncate">
      {booking.withdraw}
    </td>
    <td className="px-1 py-2 text-[0.65rem] text-indigo-600 font-bold font-large truncate">
      {booking.cash_in_office_running !== undefined ? booking.cash_in_office_running.toLocaleString() : <span className="text-slate-400">--</span>}
    </td>
  </tr>
))}
                  </>
                ) : (
                  <tr>
                    <td colSpan="11" className="px-4 py-8 text-center">
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
      )}
    </div> 
     );
}