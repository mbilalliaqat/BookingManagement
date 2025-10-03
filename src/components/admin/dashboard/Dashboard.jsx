import { useEffect, useState, useCallback } from 'react';
import { Plane, MapPin, FileText, CreditCard, Landmark, Shield, X, ChevronRight, DollarSign, User } from 'lucide-react';
import axios from 'axios';
import TableSpinner from '../../ui/TableSpinner';
import { useNavigate } from 'react-router-dom';

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

// --- Account Entries Modal ---
const AccountEntriesModal = ({ show, onClose, accountEntries, selectedAccount, isLoadingEntries, errors }) => {
  if (!show) return null;

  const accountColumns = [
    { header: 'DATE', accessor: 'date' },
    { header: 'ENTRY', accessor: 'entry' },
    { header: 'EMPLOYEE', accessor: 'employee_name' },
    { header: 'VENDOR', accessor: 'vendor_name' },
    { header: 'DETAIL', accessor: 'detail' },
    { header: 'CREDIT', accessor: 'credit' },
    { header: 'DEBIT', accessor: 'debit' },
    { header: 'BALANCE', accessor: 'balance' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
      <div className="bg-[#f8fafc] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform transition-all duration-300 ease-in-out scale-95 hover:scale-100">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-[#1e3a8a] font-inter">{selectedAccount?.name} Entries</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-[#e11d48] transition-colors duration-200 transform hover:scale-110">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {isLoadingEntries ? (
            <div className="flex justify-center py-12">
              <TableSpinner />
            </div>
          ) : errors.accounts ? (
            <div className="text-[#e11d48] text-center py-4 font-inter">{errors.accounts}</div>
          ) : accountEntries.length > 0 ? (
            <div className="overflow-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#f8fafc] sticky top-0">
                  <tr>
                    {accountColumns.map((col, index) => (
                      <th
                        key={index}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter"
                      >
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-[#f8fafc] divide-y divide-gray-200">
                  {accountEntries.map((entry, index) => (
                    <tr key={index} className={`${index % 2 === 0 ? 'bg-[#f8fafc]' : 'bg-gray-50'} hover:bg-[#10b981]/10 transition-colors duration-200`}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-[#1e3a8a] font-inter">{entry.date}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-[#1e3a8a] font-inter">{entry.entry || '--'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-[#1e3a8a] font-inter">{entry.employee_name || '--'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-[#1e3a8a] font-inter">{entry.vendor_name || '--'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-[#1e3a8a] font-inter">{entry.detail || '--'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-[#1e3a8a] font-inter">{entry.credit || 0}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-[#1e3a8a] font-inter">{entry.debit || 0}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-[#1e3a8a] font-inter">{entry.balance || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 font-inter">No entries found for this account.</div>
          )}
        </div>
        <div className="p-6 border-t bg-[#f8fafc]">
          <button
            onClick={onClose}
            className="w-full bg-[#10b981] text-white py-2 px-4 rounded-lg hover:bg-[#059669] transition-all duration-200 font-medium font-inter transform hover:scale-105"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
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
    // Vendor Totals
    totalVendorPayable: 0,
    totalVendorPaid: 0,
    // NEW: Agent Totals
    totalAgentPayable: 0,
    totalAgentPaid: 0,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [showAccountsModal, setShowAccountsModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accountEntries, setAccountEntries] = useState([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null); // State to track which card is hovered
  const [delayHandler, setDelayHandler] = useState(null); // State to manage the close delay
  const navigate = useNavigate();
 
  const [errors, setErrors] = useState({
    dashboard: null, umrah: null, tickets: null, visa: null, gamcaToken: null, services: null,
    navtcc: null, protector: null, expenses: null, refunded: null, vendor: null, agent: null, accounts: null,
  });

  // New unified mouse enter handler
  const handleMouseEnter = (cardName) => {
    // Clear any existing timeout to prevent closing
    if (delayHandler) {
      clearTimeout(delayHandler);
    }
    setHoveredCard(cardName);
  };

  // New unified mouse leave handler with a delay
  const handleMouseLeave = () => {
    // Set a timeout before closing the dropdown
    const handler = setTimeout(() => {
      setHoveredCard(null);
    }, 200); // 200ms delay to allow mouse movement

    setDelayHandler(handler);
  };

  // Cached data fetching function
  const fetchWithCache = useCallback(async (endpoint) => {
    const now = Date.now();
    const cacheKey = endpoint;
    
    // if (cache.data.has(cacheKey)) {
    //   const timestamp = cache.timestamp.get(cacheKey);
    //   if (now - timestamp < cache.ttl) {
    //     return cache.data.get(cacheKey);
    //   }
    // }
    
    const response = await api.get(endpoint);
    cache.data.set(cacheKey, response.data);
    cache.timestamp.set(cacheKey, now);
    
    return response.data;
  }, []);

 const safeTimestamp = (dateValue) => {
  if (!dateValue) return 0; // Changed from new Date().getTime()
  const date = new Date(dateValue);
  return isNaN(date.getTime()) ? 0 : date.getTime(); // Changed from new Date().getTime()
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
    if (moduleName === 'Visa Processing') { // Corrected name for navigation
      navigate('/admin/visa-processing'); 
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

  // Fetch account entries for selected bank
  const fetchAccountEntries = useCallback(async (bankName) => {
    setIsLoadingEntries(true);
    setErrors(prev => ({ ...prev, accounts: null }));
    try {
      const response = await api.get(`/accounts/${bankName}`);
      const formattedData = response.data.map(entry => ({
        ...entry,
        date: safeLocaleDateString(entry.date),
      }));
      setAccountEntries(formattedData);
    } catch (error) {
      console.error('Error fetching account entries:', error);
      setErrors(prev => ({ ...prev, accounts: 'Failed to load account entries' }));
    } finally {
      setIsLoadingEntries(false);
    }
  }, []);

  // Handle account card click
  const handleAccountClick = useCallback((account) => {
    setSelectedAccount(account);
    fetchAccountEntries(account.name);
    setShowAccountsModal(true);
  }, [fetchAccountEntries]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      
      try {
        const [
          dashboardStats, umrahData, ticketsData, visaData, gamcaTokenData, servicesData,
          navtccData, protectorData, expensesData, refundedData, venderData, agentData,
        ] = await Promise.all([
          fetchWithCache('/dashboard').catch(err => { setErrors(prev => ({ ...prev, dashboard: 'Failed to load dashboard summary' })); return { data: { totalBookings: 0, bookingsByType: [], totalRevenue: 0 } }; }),
          fetchWithCache('/umrah').catch(err => { setErrors(prev => ({ ...prev, umrah: 'Failed to load Umrah data' })); return { umrahBookings: [] }; }),
          fetchWithCache('/ticket').catch(err => { setErrors(prev => ({ ...prev, tickets: 'Failed to load Tickets data' })); return { ticket: [] }; }),
          fetchWithCache('/visa-processing').catch(err => { setErrors(prev => ({ ...prev, visa: 'Failed to load Visa data' })); return { visa_processing: [] }; }),
          fetchWithCache('/gamca-token').catch(err => { setErrors(prev => ({ ...prev, gamcaToken: 'Failed to load Gamca Token data' })); return { gamcaTokens: [] }; }),
          fetchWithCache('/services').catch(err => { setErrors(prev => ({ ...prev, services: 'Failed to load Services data' })); return { services: [] }; }),
          fetchWithCache('/navtcc').catch(err => { setErrors(prev => ({ ...prev, navtcc: 'Failed to load Navtcc data' })); return { navtcc: [] }; }),
          fetchWithCache('/protector').catch(err => { setErrors(prev => ({ ...prev, protector: 'Failed to load Protector data' })); return { protectors: [] }; }),
          fetchWithCache('/expenses').catch(err => { setErrors(prev => ({ ...prev, expenses: 'Failed to load Expenses data' })); return { expenses: [] }; }),
          fetchWithCache('/refunded').catch(err => { setErrors(prev => ({ ...prev, refunded: 'Failed to load Refunded data' })); return { refunded: [] }; }),
          fetchWithCache('/vender').catch(err => { setErrors(prev => ({ ...prev, vendor: 'Failed to load Vendor data' })); return { vendors: [] }; }),
          fetchWithCache('/agent').catch(err => { setErrors(prev => ({ ...prev, agent: 'Failed to load Agent data' })); return { agents: [] }; }),
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
          id: entry.id || index, vender_name: entry.vender_name || '', credit: Number(entry.credit) || 0, debit: Number(entry.debit) || 0,
        })) || [];
        const aggregatedVendors = vendorsData.reduce((acc, curr) => {
          const existing = acc.find(v => v.vender_name === curr.vender_name);
          if (existing) {
            existing.credit += curr.credit; existing.debit += curr.debit; existing.remaining_amount = existing.credit - existing.debit;
          } else { acc.push({ vender_name: curr.vender_name, credit: curr.credit, debit: curr.debit, remaining_amount: curr.credit - curr.debit }); }
          return acc;
        }, []);
        
        // Calculate Total Vendor Payable and Paid
        const totalVendorPayable = aggregatedVendors.reduce((sum, curr) => sum + curr.credit, 0);
        const totalVendorPaid = aggregatedVendors.reduce((sum, curr) => sum + curr.debit, 0);
        // END Vendor Calculations

        const agentsData = agentData.agents?.map((entry, index) => ({
          id: entry.id || index, agent_name: entry.agent_name || '', credit: Number(entry.credit) || 0, debit: Number(entry.debit) || 0,
        })) || [];
        const aggregatedAgents = agentsData.reduce((acc, curr) => {
          const existing = acc.find(a => a.agent_name === curr.agent_name);
          if (existing) {
            existing.credit += curr.credit; existing.debit += curr.debit; existing.remaining_amount = existing.credit - curr.debit;
          } else { acc.push({ agent_name: curr.agent_name, credit: curr.credit, debit: curr.debit, remaining_amount: curr.credit - curr.debit }); }
          return acc;
        }, []);

        // NEW: Calculate Total Agent Payable and Paid
        const totalAgentPayable = aggregatedAgents.reduce((sum, curr) => sum + curr.credit, 0);
        const totalAgentPaid = aggregatedAgents.reduce((sum, curr) => sum + curr.debit, 0);
        // END NEW: Agent Calculations

        const parsePassportDetail = (detail) => {
          try { return JSON.parse(detail); } catch { return {}; }
        };

        // FIX: Updated Umrah Bookings to use camelCase properties from the API
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
        }));
        // END FIX

        const ticketBookings = ticketsData.ticket.map(ticket => ({
          type: 'Ticket', employee_name: ticket.employee_name, receivable_amount: ticket.receivable_amount, entry: ticket.entry, paid_cash: ticket.paid_cash, paid_in_bank: ticket.paid_in_bank, remaining_amount: ticket.remaining_amount, booking_date: safeLocaleDateString(ticket.created_at), timestamp: safeTimestamp(ticket.created_at), withdraw: 0, passengerName: ticket.name,
        }));

        const visaBookings = visaData.visa_processing.map(visa => {
          const details = parsePassportDetail(visa.passport_detail);
          return { type: 'Visa Processing', employee_name: visa.employee_name, receivable_amount: visa.receivable_amount, entry: visa.entry, paid_cash: visa.paid_cash, paid_in_bank: visa.paid_in_bank, remaining_amount: visa.remaining_amount, booking_date: safeLocaleDateString(visa.created_at), timestamp: safeTimestamp(visa.created_at), withdraw: 0, passengerName: `${details.firstName || ''} ${details.lastName || ''}`.trim(), };
        });

        const gamcaTokenBookings = gamcaTokenData.gamcaTokens.map(token => {
          const details = parsePassportDetail(token.passport_detail);
          return { type: 'GAMCA Token', employee_name: token.employee_name, receivable_amount: token.receivable_amount, entry: token.entry, paid_cash: token.paid_cash, paid_in_bank: token.paid_in_bank, remaining_amount: token.remaining_amount, booking_date: safeLocaleDateString(token.created_at), timestamp: safeTimestamp(token.created_at), withdraw: 0, passengerName: `${details.firstName || ''} ${details.lastName || ''}`.trim(), };
        });

        // const servicesBookings = servicesData.services.map(services => ({
        //   type: 'Services', employee_name: services.user_name, receivable_amount: services.receivable_amount, entry: services.entry, paid_cash: services.paid_cash, paid_in_bank: services.paid_in_bank, remaining_amount: services.remaining_amount, booking_date: safeLocaleDateString(services.booking_date), timestamp: safeTimestamp(services.created_at), withdraw: 0, passengerName: null,
        // }));

        const servicesBookings = servicesData.services.map(services => {
  console.log('Service entry:', {
    entry: services.entry,
    created_at: services.created_at,
    booking_date: services.booking_date
  });
  
  return {
     type: 'Services', employee_name: services.user_name, receivable_amount: services.receivable_amount, entry: services.entry, paid_cash: services.paid_cash, paid_in_bank: services.paid_in_bank, remaining_amount: services.remaining_amount, booking_date: safeLocaleDateString(services.booking_date), timestamp: safeTimestamp(services.createdAt), withdraw: 0, passengerName: null,
  };
});

        const navtccBookings = navtccData.navtcc.map(navtcc => {
          const details = parsePassportDetail(navtcc.passport_detail);
          return { type: 'Navtcc', employee_name: navtcc.employee_name || navtcc.reference, receivable_amount: navtcc.receivable_amount, entry: navtcc.entry, paid_cash: navtcc.paid_cash, paid_in_bank: navtcc.paid_in_bank, remaining_amount: navtcc.remaining_amount, booking_date: safeLocaleDateString(navtcc.created_at), timestamp: safeTimestamp(navtcc.created_at), withdraw: 0, passengerName: `${details.firstName || ''} ${details.lastName || ''}`.trim(), };
        });

        const protectorBookings = protectorData.protectors.map(protector => ({
          type: 'Protector', employee_name: protector.employee, entry: protector.entry, receivable_amount: 0, paid_cash: 0, paid_in_bank: 0, remaining_amount: 0, booking_date: safeLocaleDateString(protector.protector_date), timestamp: safeTimestamp(protector.createdAt), withdraw: parseFloat(protector.withdraw || 0), passengerName: protector.name || null,
        }));

        const expensesBookings = expensesData.expenses.map(expenses => ({
          type: 'Expenses', employee_name: expenses.user_name, entry: expenses.entry, receivable_amount: 0, paid_cash: 0, paid_in_bank: 0, remaining_amount: 0, booking_date: safeLocaleDateString(expenses.create), timestamp: safeTimestamp(expenses.createdAt), withdraw: parseFloat(expenses.withdraw || 0), passengerName: expenses.detail || null,
        }));

        const refundedBookings = (refundedData.refunded || []).map(refund => ({
          type: 'Refunded', employee_name: refund.employee, entry: refund.entry, receivable_amount: 0, paid_cash: 0, paid_in_bank: 0, remaining_amount: 0, booking_date: safeLocaleDateString(refund.date), timestamp: safeTimestamp(refund.created_at), withdraw: parseFloat(refund.withdraw || 0), passengerName: refund.name || null,
        }));

        const venderBookings = (venderData.vendors || []).map(vender => ({
          type: 'Vender', employee_name: vender.user_name, entry: vender.entry, receivable_amount: 0, paid_cash: 0, paid_in_bank: 0, remaining_amount: 0, booking_date: safeLocaleDateString(vender.date), timestamp: safeTimestamp(vender.created_at), withdraw: parseFloat(vender.withdraw || 0), passengerName: null,
        }));

        const combinedBookingsRaw = [
          ...umrahBookings, ...ticketBookings, ...visaBookings, ...gamcaTokenBookings, ...servicesBookings,
          ...navtccBookings, ...protectorBookings, ...expensesBookings, ...refundedBookings,
          //  ...venderBookings,
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

// Final sort for display (by timestamp descending - newest first)
const finalCombinedBookings = [...bookingsWithCashInOffice].sort((a, b) => {
  return b.timestamp - a.timestamp; // Use direct timestamp comparison
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
          totalProtectorWithdraw, totalExpenseWithdraw: totalExpensesWithdraw, totalRefundedWithdraw, totalVendorWithdraw,
          cashInOffice, TotalWithdraw, accounts: accountsData, vendors: aggregatedVendors, agents: aggregatedAgents,
          // Vendor Totals
          totalVendorPayable,
          totalVendorPaid,
          // NEW: Agent Totals
          totalAgentPayable,
          totalAgentPaid,
          // END NEW
        });
        
        console.log("Dashboard data loaded successfully");
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const handlePaymentUpdate = () => {
      // Clear cache and refetch data on payment update event
      cache.data.clear();
      cache.timestamp.clear();
      fetchDashboardData();
    };
    
    window.addEventListener('paymentUpdated', handlePaymentUpdate);
    fetchDashboardData();
    
    return () => {
      window.removeEventListener('paymentUpdated', handlePaymentUpdate);
      // Clean up the delay timer on component unmount
      if (delayHandler) {
        clearTimeout(delayHandler);
      }
    };
  }, [fetchWithCache]); 

  // Extract counts for individual booking types
  const booking = dashboardData.bookingsByType || [];
  const ticketCount = booking.find(item => item.type === 'Ticket')?.count || 0;
  const umrahCount = booking.find(item => item.type === 'Umrah')?.count || 0;
  const visaCount = booking.find(item => item.type === 'Visa Processing')?.count || 0;
  const gamcaTokenCount = booking.find(item => item.type === 'GAMCA Token')?.count || 0;
  const serviceCount = booking.find(item => item.type === 'Services')?.count || 0;
  const navtccCount = booking.find(item => item.type === 'Navtcc')?.count || 0;

  // Prepare module breakdown data with updated colors
  const moduleBreakdown = [
    { name: 'Ticket', count: ticketCount, color: 'midnight', icon: Plane },
    { name: 'Umrah', count: umrahCount, color: 'emerald', icon: MapPin },
    { name: 'Visa Processing', count: visaCount, color: 'rose', icon: FileText },
    { name: 'GAMCA Token', count: gamcaTokenCount, color: 'teal', icon: CreditCard },
    { name: 'Services', count: serviceCount, color: 'indigo', icon: CreditCard },
    { name: 'Navtcc', count: navtccCount, color: 'ivory', icon: Shield },
  ];

  // Calculate total amounts
  // const totalReceivableAmount = dashboardData.combinedBookings.reduce((sum, booking) => sum + parseFloat(booking.receivable_amount || 0), 0);
  const totalPaidInBank = dashboardData.combinedBookings.reduce((sum, booking) => sum + parseFloat(booking.paid_in_bank || 0), 0);
  const totalRemainingAmount = dashboardData.combinedBookings.reduce((sum, booking) => sum + parseFloat(booking.remaining_amount || 0), 0);

  // Vendor Totals
  const totalVendorPayable = dashboardData.totalVendorPayable || 0;
  const totalVendorPaid = dashboardData.totalVendorPaid || 0;
  
  // NEW: Agent Totals
  const totalAgentPayable = dashboardData.totalAgentPayable || 0;
  const totalAgentPaid = dashboardData.totalAgentPaid || 0;
  // END NEW

  const showPartialData = !isLoading && dashboardData.combinedBookings.length > 0;

  // --- Remaining Amount Card Update ---
  // Calculate remaining amount breakdown by type
  const remainingBreakdown = dashboardData.combinedBookings.reduce((acc, booking) => {
    if (booking.receivable_amount > 0) { // Only count bookings that had a receivable amount
      const remaining = parseFloat(booking.remaining_amount || 0);
      acc[booking.type] = (acc[booking.type] || 0) + remaining;
    }
    return acc;
  }, {});
  
  // Convert object to array for mapping in dropdown
  const remainingBreakdownArray = Object.keys(remainingBreakdown)
    .map(type => ({
      name: type,
      amount: remainingBreakdown[type],
    }))
    .filter(item => item.amount > 0); // Only show types with a remaining amount

  // Define table columns
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
      {/* Modals */}
      <AccountEntriesModal
        show={showAccountsModal}
        onClose={() => setShowAccountsModal(false)}
        accountEntries={accountEntries}
        selectedAccount={selectedAccount}
        isLoadingEntries={isLoadingEntries}
        errors={errors}
      />

      {/* Stats Cards Section - ADJUSTED FOR 10 COLUMNS */}
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-4 mb-8">        
        {/* Total Bookings Card - WRAPPER with DELAY FIX */}
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
                    <h2 className="text-black text-[0.65rem] font-bold uppercase tracking-wide font-inter mb-1 truncate">Bookings</h2>
                    <p className="text-sm font-bold text-white">
                    {isLoading && !showPartialData ? <span className="text-white/60">--</span> : dashboardData.totalBookings.toLocaleString()}
                    </p>
                </div>
            </div>
          {/* Hover List for Bookings */}
          {/* Ensure z-50 for visibility above other elements */}
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

        {/* Bank Accounts Card - UPDATED to show Paid Bank Amount */}
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
                    {/* CARD FIX: text-xl and break-all applied here */}
                    <p className="text-sm font-bold text-white mt-0 break-all">
                    {isLoading && !showPartialData ? <span className="text-white/60">--</span> : totalPaidInBank.toLocaleString()}
                    </p>
                </div>
            </div>
          {/* Hover List for Accounts - UPDATED FORMATTING */}
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
                    Total: {dashboardData.accounts.length}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Vendor Card - WRAPPER with DELAY FIX */}
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
                    {/* UPDATED: Display Total Payable and Paid */}
                    <p className="text-sm font-bold text-white mt-0 break-all">
                    {isLoading && !showPartialData ? <span className="text-white/60">--</span> : `${totalVendorPayable.toLocaleString()} / ${totalVendorPaid.toLocaleString()}`}
                    </p>
                    {/* Secondary text to clarify */}
                    {/* <p className="text-white/80 text-[0.6rem] font-medium uppercase mt-1">
                        Payable / Paid
                    </p> */}
                    {/* END UPDATED */}
                </div>
            </div>
          {/* Hover List for Vendors - UPDATED FORMATTING */}
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
                      className="list-item text-[0.65rem] text-[#333] hover:bg-[#e0e0e0] p-1 rounded-lg transition-colors duration-150 flex justify-between items-center"
                    >
                      <span className="font-semibold text-[#1e3a8a] truncate pr-2">
                        {vendor.vender_name}
                      </span>
                      {/* Color-code the remaining amount (Negative = you owe/Red, Positive = they owe/Green) */}
                      <span className={`font-bold ${vendor.remaining_amount < 0 ? 'text-red-600' : 'text-emerald-600'} flex-shrink-0`}>
                        {vendor.remaining_amount.toLocaleString()}
                      </span>
                      {/* END UPDATED */}
                    </div>
                  ))}
                  {errors.vendor && (
                    <div className="text-rose-600 text-[0.65rem] text-center font-inter bg-rose-50 p-1 rounded-lg border border-rose-200 mt-1">
                      {errors.vendor}
                    </div>
                  )}
                  {/* Total Payable/Paid in the footer */}
                  <div className="list-item text-[0.65rem] text-[#333] font-bold p-1 rounded-lg border-t border-gray-200 mt-1 pt-2 flex justify-between">
                    <span>Total Payable:</span> <span className="text-emerald-600">{totalVendorPayable.toLocaleString()}</span>
                  </div>
                  <div className="list-item text-[0.65rem] text-[#333] font-bold p-1 rounded-lg flex justify-between">
                    <span>Total Paid:</span> <span className="text-red-600">{totalVendorPaid.toLocaleString()}</span>
                  </div>
                  <div className="list-item text-[0.65rem] text-[#333] font-bold p-1 rounded-lg">
                    Total Vendors: {dashboardData.vendors.length}
                  </div>
                  {/* END UPDATED */}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Agent Card - WRAPPER with DELAY FIX (Updated) */}
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
                    {/* UPDATED: Display Total Payable and Paid */}
                    <p className="text-sm font-bold text-white mt-0 break-all">
                    {isLoading && !showPartialData ? <span className="text-white/60">--</span> : `${totalAgentPayable.toLocaleString()}`}
                    </p>
                    {/* NEW: Secondary text to clarify */}
                    {/* <p className="text-white/80 text-[0.6rem] font-medium uppercase mt-1">
                        Payable / Paid
                    </p> */}
                    {/* END UPDATED */}
                </div>
            </div>
          {/* Hover List for Agents - UPDATED FORMATTING */}
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
                      className="list-item text-[0.65rem] text-[#333] hover:bg-[#e0e0e0] p-1 rounded-lg transition-colors duration-150 flex justify-between items-center"
                    >
                      <span className="font-semibold text-cyan-700 truncate pr-2">
                        {agent.agent_name}
                      </span>
                      {/* Color-code the remaining amount (Negative = you owe/Red, Positive = they owe/Green) */}
                      <span className={`font-bold ${agent.remaining_amount < 0 ? 'text-red-600' : 'text-emerald-600'} flex-shrink-0`}>
                        {agent.remaining_amount.toLocaleString()}
                      </span>
                      {/* END UPDATED */}
                    </div>
                  ))}
                  {errors.agent && (
                    <div className="text-rose-600 text-[0.65rem] text-center font-inter bg-rose-50 p-1 rounded-lg border border-rose-200 mt-1">
                      {errors.agent}
                    </div>
                  )}
                  {/* UPDATED: Total Payable/Paid in the footer */}
                  <div className="list-item text-[0.65rem] text-[#333] font-bold p-1 rounded-lg border-t border-gray-200 mt-1 pt-2 flex justify-between">
                    <span>Total Payable:</span> <span className="text-emerald-600">{totalAgentPayable.toLocaleString()}</span>
                  </div>
                  <div className="list-item text-[0.65rem] text-[#333] font-bold p-1 rounded-lg flex justify-between">
                    <span>Total Paid:</span> <span className="text-red-600">{totalAgentPaid.toLocaleString()}</span>
                  </div>
                  <div className="list-item text-[0.65rem] text-[#333] font-bold p-1 rounded-lg">
                    Total Agents: {dashboardData.agents.length}
                  </div>
                  {/* END UPDATED */}
                </div>
              )}
            </div>
          )}
        </div>
     
        {/* Total Remaining Amount Card (Original Line 930) */}
        {/* --- Remaining Amount Card Update --- */}
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
          {/* Hover List for Remaining Amount */}
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
                      className="list-item text-[0.65rem] text-[#333] hover:bg-[#e0e0e0] p-1 rounded-lg transition-colors duration-150 flex justify-between items-center"
                    >
                      <span className="font-semibold text-slate-700 truncate pr-2">
                        {item.name}
                      </span>
                      <span className="font-bold text-amber-600 flex-shrink-0">
                        {item.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="list-item text-[0.65rem] text-[#333] font-bold p-1 rounded-lg border-t border-gray-200 mt-1 pt-2 flex justify-between">
                    <span>Total:</span> <span className="text-amber-600">{totalRemainingAmount.toLocaleString()}</span>
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
        {/* --- End Remaining Amount Card Update --- */}

        {/* Total Withdraw Card (Original Line 943) */}

        <div
    className="relative w-full"
    onMouseEnter={() => handleMouseEnter('withdraw')}
    onMouseLeave={handleMouseLeave}
>
    <div className="bg-gradient-to-br from-fuchsia-600 via-pink-700 to-purple-800 p-3 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group">
          <div className="relative z-10 w-full">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-black text-[0.65rem] font-bold tracking-wide font-inter truncate">Total Withdraw</h2>
             
            </div>
            {/* CARD FIX: text-xl and break-all applied here */}
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
                <div className="list-item text-[0.65rem] text-[#333] hover:bg-[#e0e0e0] p-1 rounded-lg transition-colors duration-150 flex justify-between">
                    <span className="font-semibold text-fuchsia-700">Protector</span>
                    <span className="font-bold text-fuchsia-600">{dashboardData.totalProtectorWithdraw.toLocaleString()}</span>
                </div>
                <div className="list-item text-[0.65rem] text-[#333] hover:bg-[#e0e0e0] p-1 rounded-lg transition-colors duration-150 flex justify-between">
                    <span className="font-semibold text-fuchsia-700">Expenses</span>
                    <span className="font-bold text-fuchsia-600">{dashboardData.totalExpenseWithdraw.toLocaleString()}</span>
                </div>
                <div className="list-item text-[0.65rem] text-[#333] hover:bg-[#e0e0e0] p-1 rounded-lg transition-colors duration-150 flex justify-between">
                    <span className="font-semibold text-fuchsia-700">Refunded</span>
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


        {/* Cash in Office Card (Original Line 956) */}
        <div className="bg-gradient-to-br from-lime-500 via-green-600 to-teal-700 p-3 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group">
          <div className="relative z-10 w-full">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-black text-[0.65rem] font-bold tracking-wide font-inter truncate">Cash in Office</h2>
              
            </div>
            {/* CARD FIX: text-xl and break-all applied here */}
            <p className="text-sm font-bold text-white mt-0 break-all">
              {isLoading && !showPartialData ? <span className="text-white/60">--</span> : dashboardData.cashInOffice.toLocaleString()}
            </p>
          </div>
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
      {(errors.umrah || errors.tickets || errors.visa || errors.gamcaToken || errors.services || errors.navtcc || errors.protector || errors.vendor || errors.agent) && (
        <span className="text-xs text-rose-600 font-inter bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
          {Object.values(errors).filter(e => e).join(', ')}
        </span>
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
          {dashboardData.combinedBookings.length > 0 ? (
            dashboardData.combinedBookings.map((booking, index) => (
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
                  {booking.receivable_amount}
                </td>
                <td className="px-1 py-2 text-[0.65rem] text-slate-700 font-inter truncate">
                  {booking.paid_cash}
                </td>
                <td className="px-1 py-2 text-[0.65rem] text-slate-700 font-inter truncate">
                  {booking.paid_in_bank}
                </td>
                <td className="px-1 py-2 text-[0.65rem] text-amber-600 font-inter font-semibold truncate">
                  {booking.remaining_amount}
                </td>
                <td className="px-1 py-2 text-[0.65rem] text-slate-700 font-inter truncate">
                  {booking.withdraw}
                </td>
                <td className="px-1 py-2 text-[0.65rem] text-indigo-600 font-inter font-semibold truncate">
                  {booking.cash_in_office_running !== undefined ? booking.cash_in_office_running.toLocaleString() : <span className="text-slate-400">--</span>}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="11" className="px-4 py-8 text-center">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl text-indigo-400">📋</span>
                  </div>
                  <p className="text-sm text-slate-500 font-inter">No recent bookings found</p>
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