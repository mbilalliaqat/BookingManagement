import { useEffect, useState, useCallback } from 'react';
import { Users, Plane, MapPin, FileText, CreditCard, Landmark, Shield, X, ChevronRight, DollarSign, User, ArrowUp, ArrowDown } from 'lucide-react';
import axios from 'axios';
import TableSpinner from '../../ui/TableSpinner';
import { useNavigate } from 'react-router-dom';

// ====================================================================
// ⚠️ ARCHITECTURAL NOTE: In a real-world application, move the Modal 
// components below into separate files (e.g., Modals/EntriesModal.jsx)
// to improve component separation and maintainability.
// ====================================================================

// --- Custom Color Palette ---
// Using midnight blue (#1e3a8a), emerald green (#10b981), soft ivory (#f8fafc), and rose gold (#e11d48) for highlights.
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

// ====================================================================
// --- Modal Components (Extracted for Modularity) ---
// ====================================================================

const EntriesModal = ({ show, onClose, moduleBreakdown, totalBookings, onModuleClick }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900/40 via-slate-900/60 to-indigo-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 ease-out animate-in zoom-in-95">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-black font-inter mb-1">Bookings Overview</h2>
              <p className="text-indigo-900 text-sm">Detailed breakdown by module</p>
            </div>
            <button 
              onClick={onClose} 
              className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all duration-200 transform hover:rotate-90"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] bg-gradient-to-b from-slate-50 to-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {moduleBreakdown.map((module, index) => {
              const IconComponent = module.icon;
              const color = COLOR_MAP[module.color];
              if (!color) return null;
              
              // Beautiful gradient backgrounds matching module themes
              const cardStyles = {
                'Ticket': 'bg-gradient-to-br from-sky-400 via-blue-300 to-indigo-400',
                'Umrah': 'bg-gradient-to-br from-emerald-200 via-teal-100 to-cyan-200',
                'Hotel': 'bg-gradient-to-br from-amber-200 via-orange-100 to-yellow-200',
                'Visa': 'bg-gradient-to-br from-purple-200 via-violet-100 to-fuchsia-200',
                'Tour': 'bg-gradient-to-br from-rose-200 via-pink-100 to-red-200',
                'Transport': 'bg-gradient-to-br from-lime-200 via-green-100 to-emerald-200',
              };
              
              const cardGradient = cardStyles[module.name] || 'bg-gradient-to-br from-slate-200 via-gray-100 to-zinc-200';
              
              return (
                <div
                  key={index}
                  className={`relative p-5 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 ${cardGradient} border-2 border-white/60 group overflow-hidden cursor-pointer`}
                  onClick={() => onModuleClick(module.name)}
                >
                  <div className="absolute top-0 right-0 w-28 h-28 bg-white/40 rounded-full blur-2xl -mr-14 -mt-14"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/30 rounded-full blur-xl -ml-16 -mb-16"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`${color.bg} p-4 rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                        <IconComponent size={28} className={color.text} />
                      </div>
                      <div>
                        <h3 className="text-gray-700 text-sm font-semibold font-inter mb-1">{module.name}</h3>
                        <p className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{module.count}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-indigo-600 font-semibold font-inter uppercase tracking-wide">Total</span>
                <h3 className="text-2xl font-bold text-indigo-900 font-inter">All Bookings</h3>
              </div>
              <span className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">{totalBookings}</span>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 bg-white">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-black py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-300 font-semibold font-inter transform hover:scale-105 active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const AccountsModal = ({ show, onClose, accounts, handleAccountClick, errors, isLoading, showPartialData }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900/40 via-slate-900/60 to-indigo-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 ease-out animate-in zoom-in-95">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-black font-inter mb-1">Bank Accounts</h2>
              <p className="text-indigo-900 text-sm">Select an account to view details</p>
            </div>
            <button 
              onClick={onClose} 
              className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all duration-200 transform hover:rotate-90"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] bg-gradient-to-b from-slate-50 to-white">
          {isLoading && !showPartialData ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="animate-pulse bg-gradient-to-r from-slate-100 to-slate-50 p-5 rounded-2xl shadow-md">
                  <div className="flex justify-between items-center">
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-32"></div>
                      <div className="h-8 bg-slate-300 rounded w-24"></div>
                    </div>
                    <div className="h-6 w-6 bg-slate-200 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((account, index) => {
                const colorKey = ACCOUNT_COLORS[index % ACCOUNT_COLORS.length];
                const color = COLOR_MAP[colorKey];
                if (!color) return null;

                // Different gradient backgrounds for each account
                const accountGradients = [
                  'bg-gradient-to-br from-sky-200 via-blue-100 to-indigo-200',
                  'bg-gradient-to-br from-emerald-200 via-teal-100 to-cyan-200',
                  'bg-gradient-to-br from-amber-200 via-orange-100 to-yellow-200',
                  'bg-gradient-to-br from-purple-200 via-violet-100 to-fuchsia-200',
                  'bg-gradient-to-br from-rose-200 via-pink-100 to-red-200',
                  'bg-gradient-to-br from-lime-200 via-green-100 to-emerald-200',
                ];

                return (
                  <div
                    key={account.name}
                    className={`relative p-5 rounded-2xl shadow-lg cursor-pointer hover:shadow-2xl transition-all duration-300 ${accountGradients[index % accountGradients.length]} border-2 border-white/60 group overflow-hidden hover:scale-105`}
                    onClick={() => {
                      handleAccountClick(account);
                      onClose();
                    }}
                  >
                    <div className="absolute top-0 right-0 w-28 h-28 bg-white/40 rounded-full blur-2xl -mr-14 -mt-14"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/30 rounded-full blur-xl -ml-16 -mb-16"></div>
                    <div className="relative flex justify-between items-center">
                      <div>
                        <h3 className="text-gray-700 text-sm font-semibold font-inter mb-1">{account.name}</h3>
                        <p className="text-3xl font-bold bg-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{account.balance.toLocaleString()}</p>
                      </div>
                      <div className={`${color.bg} p-3 rounded-full shadow-lg group-hover:scale-110 group-hover:translate-x-2 transition-all duration-300`}>
                        <ChevronRight size={24} className={color.text} />
                      </div>
                    </div>
                  </div>
                );
              })}
              {errors.accounts && (
                <div className="text-rose-600 text-sm text-center mt-4 font-inter bg-rose-50 p-3 rounded-lg border border-rose-200">{errors.accounts}</div>
              )}
            </div>
          )}
          <div className="mt-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-indigo-600 font-semibold font-inter uppercase tracking-wide">Total</span>
                <h3 className="text-2xl font-bold text-indigo-900 font-inter">All Accounts</h3>
              </div>
              <span className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">{accounts.length}</span>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 bg-white">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-black py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-300 font-semibold font-inter transform hover:scale-105 active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

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

const VenderAgentModal = ({ show, onClose, data, type, errors, isLoading, showPartialData }) => {
  if (!show) return null;

  const title = type === 'Vender' ? 'Vendors' : 'Agents';
  const nameKey = type === 'Vender' ? 'vender_name' : 'agent_name';
  const errorKey = type === 'Vender' ? errors.vendor : errors.agent;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900/40 via-slate-900/60 to-indigo-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 ease-out animate-in zoom-in-95">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-black font-inter mb-1">{title} Overview</h2>
              <p className="text-indigo-900 text-sm">Detailed breakdown by {title.toLowerCase()}</p>
            </div>
            <button 
              onClick={onClose} 
              className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all duration-200 transform hover:rotate-90"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] bg-gradient-to-b from-slate-50 to-white">
          {isLoading && !showPartialData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="animate-pulse bg-gradient-to-br from-slate-200 via-gray-100 to-zinc-200 p-5 rounded-2xl shadow-lg border-2 border-white/60">
                  <div className="flex justify-between items-center">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-8 bg-gray-300 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {data.map((item, index) => {
                const colorKey = ACCOUNT_COLORS[index % ACCOUNT_COLORS.length];
                const color = COLOR_MAP[colorKey];
                if (!color) return null;

                const status = item.remaining_amount >= 0 ? 'Payable' : 'Receivable';
                const amount = Math.abs(item.remaining_amount).toLocaleString();
                const isPayable = status === 'Payable';
                
                // Gradient styles matching EntriesModal pattern
                const cardStyles = isPayable 
                  ? 'bg-gradient-to-br from-rose-200 via-pink-100 to-red-200'
                  : 'bg-gradient-to-br from-emerald-200 via-teal-100 to-cyan-200';

                return (
                  <div
                    key={item[nameKey]}
                    className={`relative p-5 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 ${cardStyles} border-2 border-white/60 group overflow-hidden`}
                  >
                    <div className="absolute top-0 right-0 w-28 h-28 bg-white/40 rounded-full blur-2xl -mr-14 -mt-14"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/30 rounded-full blur-xl -ml-16 -mb-16"></div>
                    <div className="relative">
                      <div className="mb-3">
                        <h3 className="text-gray-700 text-sm font-semibold font-inter mb-1">{item[nameKey]}</h3>
                        <p className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-black">{amount}</p>
                      </div>
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        isPayable 
                          ? 'bg-rose-500/20 text-rose-700' 
                          : 'bg-emerald-500/20 text-emerald-700'
                      }`}>
                        {status}
                      </div>
                    </div>
                  </div>
                );
              })}
              {errorKey && (
                <div className="col-span-full text-rose-600 text-sm text-center mt-4 font-inter bg-rose-50 p-3 rounded-xl border border-rose-200">
                  {errorKey}
                </div>
              )}
            </div>
          )}
          <div className="mt-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-indigo-600 font-semibold font-inter uppercase tracking-wide">Total</span>
                <h3 className="text-2xl font-bold text-indigo-900 font-inter">All {title}</h3>
              </div>
              <span className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">{data.length}</span>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 bg-white">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-black py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-300 font-semibold font-inter transform hover:scale-105 active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ====================================================================
// --- Main Dashboard Component ---
// ====================================================================

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
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [showEntriesModal, setShowEntriesModal] = useState(false);
  const [showBankAccountsModal, setShowBankAccountsModal] = useState(false);
  const [showVenderModal, setShowVenderModal] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showAccountsModal, setShowAccountsModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accountEntries, setAccountEntries] = useState([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const navigate = useNavigate();
 
  const [errors, setErrors] = useState({
    dashboard: null, umrah: null, tickets: null, visa: null, gamcaToken: null, services: null,
    navtcc: null, protector: null, expenses: null, refunded: null, vendor: null, agent: null, accounts: null,
  });

  // Cached data fetching function
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

  const safeTimestamp = (dateValue) => {
    if (!dateValue) return Date.now();
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? Date.now() : date.getTime();
  };

  const safeLocaleDateString = (dateValue) => {
    if (!dateValue) return new Date().toLocaleDateString();
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? new Date().toLocaleDateString() : date.toLocaleDateString();
  };

  const handleModuleClick = (moduleName) => {
  setShowEntriesModal(false); 
  if (moduleName === 'Ticket') {
    navigate('/admin/tickets'); 
  }
  if (moduleName === 'Umrah') {
    navigate('/admin/umrah'); 
  }
  if (moduleName === 'Visa') {
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
  // Add more conditions for other modules if needed
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

        const agentsData = agentData.agents?.map((entry, index) => ({
          id: entry.id || index, agent_name: entry.agent_name || '', credit: Number(entry.credit) || 0, debit: Number(entry.debit) || 0,
        })) || [];
        const aggregatedAgents = agentsData.reduce((acc, curr) => {
          const existing = acc.find(a => a.agent_name === curr.agent_name);
          if (existing) {
            existing.credit += curr.credit; existing.debit += curr.debit; existing.remaining_amount = existing.credit - existing.debit;
          } else { acc.push({ agent_name: curr.agent_name, credit: curr.credit, debit: curr.debit, remaining_amount: curr.credit - curr.debit }); }
          return acc;
        }, []);

        const parsePassportDetail = (detail) => {
          try { return JSON.parse(detail); } catch { return {}; }
        };

        const umrahBookings = umrahData.umrahBookings.map(umrah => ({
          type: 'Umrah', employee_name: umrah.user_name, receivable_amount: umrah.receivable_amount, entry: umrah.entry, paid_cash: umrah.paid_cash, paid_in_bank: umrah.paid_in_bank, remaining_amount: umrah.remaining_amount, booking_date: safeLocaleDateString(umrah.created_at), timestamp: safeTimestamp(umrah.created_at), withdraw: 0, passengerName: null,
        }));

        const ticketBookings = ticketsData.ticket.map(ticket => ({
          type: 'Ticket', employee_name: ticket.employee_name, receivable_amount: ticket.receivable_amount, entry: ticket.entry, paid_cash: ticket.paid_cash, paid_in_bank: ticket.paid_in_bank, remaining_amount: ticket.remaining_amount, booking_date: safeLocaleDateString(ticket.booking_date), timestamp: safeTimestamp(ticket.booking_date), withdraw: 0, passengerName: ticket.name,
        }));

        const visaBookings = visaData.visa_processing.map(visa => {
          const details = parsePassportDetail(visa.passport_detail);
          return { type: 'Visa Processing', employee_name: visa.employee_name, receivable_amount: visa.receivable_amount, entry: visa.entry, paid_cash: visa.paid_cash, paid_in_bank: visa.paid_in_bank, remaining_amount: visa.remaining_amount, booking_date: safeLocaleDateString(visa.booking_date), timestamp: safeTimestamp(visa.booking_date), withdraw: 0, passengerName: `${details.firstName || ''} ${details.lastName || ''}`.trim(), };
        });

        const gamcaTokenBookings = gamcaTokenData.gamcaTokens.map(token => {
          const details = parsePassportDetail(token.passport_detail);
          return { type: 'GAMCA Token', employee_name: token.employee_name, receivable_amount: token.receivable_amount, entry: token.entry, paid_cash: token.paid_cash, paid_in_bank: token.paid_in_bank, remaining_amount: token.remaining_amount, booking_date: safeLocaleDateString(token.created_at), timestamp: safeTimestamp(token.created_at), withdraw: 0, passengerName: `${details.firstName || ''} ${details.lastName || ''}`.trim(), };
        });

        const servicesBookings = servicesData.services.map(services => ({
          type: 'Services', employee_name: services.user_name, receivable_amount: services.receivable_amount, entry: services.entry, paid_cash: services.paid_cash, paid_in_bank: services.paid_in_bank, remaining_amount: services.remaining_amount, booking_date: safeLocaleDateString(services.booking_date), timestamp: safeTimestamp(services.booking_date), withdraw: 0, passengerName: null,
        }));

        const navtccBookings = navtccData.navtcc.map(navtcc => {
          const details = parsePassportDetail(navtcc.passport_detail);
          return { type: 'Navtcc', employee_name: navtcc.employee_name || navtcc.reference, receivable_amount: navtcc.receivable_amount, entry: navtcc.entry, paid_cash: navtcc.paid_cash, paid_in_bank: navtcc.paid_in_bank, remaining_amount: navtcc.remaining_amount, booking_date: safeLocaleDateString(navtcc.created_at), timestamp: safeTimestamp(navtcc.created_at), withdraw: 0, passengerName: `${details.firstName || ''} ${details.lastName || ''}`.trim(), };
        });

        const protectorBookings = protectorData.protectors.map(protector => ({
          type: 'Protector', employee_name: protector.employee, entry: protector.entry, receivable_amount: 0, paid_cash: 0, paid_in_bank: 0, remaining_amount: 0, booking_date: safeLocaleDateString(protector.protector_date), timestamp: safeTimestamp(protector.protector_date), withdraw: parseFloat(protector.withdraw || 0), passengerName: protector.name || null,
        }));

        const expensesBookings = expensesData.expenses.map(expenses => ({
          type: 'Expenses', employee_name: expenses.user_name, entry: expenses.entry, receivable_amount: 0, paid_cash: 0, paid_in_bank: 0, remaining_amount: 0, booking_date: safeLocaleDateString(expenses.date), timestamp: safeTimestamp(expenses.date), withdraw: parseFloat(expenses.withdraw || 0), passengerName: expenses.detail || null,
        }));

        const refundedBookings = (refundedData.refunded || []).map(refund => ({
          type: 'Refunded', employee_name: refund.employee, entry: refund.entry, receivable_amount: 0, paid_cash: 0, paid_in_bank: 0, remaining_amount: 0, booking_date: safeLocaleDateString(refund.date), timestamp: safeTimestamp(refund.date), withdraw: parseFloat(refund.withdraw || 0), passengerName: refund.name || null,
        }));

        const venderBookings = (venderData.vendors || []).map(vender => ({
          type: 'Vender', employee_name: vender.user_name, entry: vender.entry, receivable_amount: 0, paid_cash: 0, paid_in_bank: 0, remaining_amount: 0, booking_date: safeLocaleDateString(vender.date), timestamp: safeTimestamp(vender.date), withdraw: parseFloat(vender.withdraw || 0), passengerName: null,
        }));

        const combinedBookingsRaw = [
          ...umrahBookings, ...ticketBookings, ...visaBookings, ...gamcaTokenBookings, ...servicesBookings,
          ...navtccBookings, ...protectorBookings, ...expensesBookings, ...refundedBookings, ...venderBookings,
        ];

        const sortedForRunningTotal = combinedBookingsRaw.sort((a, b) => safeTimestamp(a.timestamp) - safeTimestamp(b.timestamp));

        let runningCashInOffice = 0;
        const bookingsWithCashInOffice = sortedForRunningTotal.map(booking => {
          runningCashInOffice += parseFloat(booking.paid_cash || 0);
          runningCashInOffice -= parseFloat(booking.withdraw || 0);
          return { ...booking, cash_in_office_running: runningCashInOffice };
        });

        const finalCombinedBookings = bookingsWithCashInOffice.sort((a, b) => safeTimestamp(b.timestamp) - safeTimestamp(a.timestamp));

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
    { name: 'Visa', count: visaCount, color: 'rose', icon: FileText },
    { name: 'GAMCA Token', count: gamcaTokenCount, color: 'teal', icon: CreditCard },
    { name: 'Services', count: serviceCount, color: 'indigo', icon: CreditCard },
    { name: 'Navtcc', count: navtccCount, color: 'ivory', icon: Shield },
  ];

  // Calculate total amounts
  const totalReceivableAmount = dashboardData.combinedBookings.reduce((sum, booking) => sum + parseFloat(booking.receivable_amount || 0), 0);
  const totalPaidCash = dashboardData.combinedBookings.reduce((sum, booking) => sum + parseFloat(booking.paid_cash || 0), 0);
  const totalPaidInBank = dashboardData.combinedBookings.reduce((sum, booking) => sum + parseFloat(booking.paid_in_bank || 0), 0);
  const totalRemainingAmount = dashboardData.combinedBookings.reduce((sum, booking) => sum + parseFloat(booking.remaining_amount || 0), 0);

  const showPartialData = !isLoading && dashboardData.combinedBookings.length > 0;

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
      <EntriesModal 
        show={showEntriesModal} 
        onClose={() => setShowEntriesModal(false)} 
        moduleBreakdown={moduleBreakdown} 
        totalBookings={dashboardData.totalBookings}
        onModuleClick={handleModuleClick}
      />
      
      <AccountsModal
        show={showBankAccountsModal}
        onClose={() => setShowBankAccountsModal(false)}
        accounts={dashboardData.accounts}
        handleAccountClick={handleAccountClick}
        errors={errors}
        isLoading={isLoading}
        showPartialData={showPartialData}
      />

      <AccountEntriesModal
        show={showAccountsModal}
        onClose={() => setShowAccountsModal(false)}
        accountEntries={accountEntries}
        selectedAccount={selectedAccount}
        isLoadingEntries={isLoadingEntries}
        errors={errors}
      />

      <VenderAgentModal
        show={showVenderModal}
        onClose={() => setShowVenderModal(false)}
        data={dashboardData.vendors}
        type="Vender"
        errors={errors}
        isLoading={isLoading}
        showPartialData={showPartialData}
      />

      <VenderAgentModal
        show={showAgentModal}
        onClose={() => setShowAgentModal(false)}
        data={dashboardData.agents}
        type="Agent"
        errors={errors}
        isLoading={isLoading}
        showPartialData={showPartialData}
      />

      {/* Stats Cards Section */}
     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
  {/* Total Bookings Card - Deep Ocean Blue to Indigo */}
  <div
    className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 p-5 rounded-2xl shadow-xl cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden group"
    onClick={() => setShowEntriesModal(true)}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="relative z-10">
      <h2 className="text-white/90 text-sm font-semibold uppercase tracking-wide font-inter mb-2">Total Bookings</h2>
      <p className="text-4xl font-bold text-white mb-1">
        {isLoading && !showPartialData ? <span className="text-white/60">--</span> : dashboardData.totalBookings.toLocaleString()}
      </p>
    </div>
  </div>

  {/* Bank Accounts Card - Emerald Green to Forest Teal */}
  <div
    className="bg-gradient-to-br from-emerald-600 via-green-700 to-teal-800 p-5 rounded-2xl shadow-xl cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden group"
    onClick={() => setShowBankAccountsModal(true)}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h2 className="text-white/90 text-sm font-semibold tracking-wide font-inter">Bank Accounts</h2>
          <p className="text-3xl font-bold text-white mt-1">
            {isLoading && !showPartialData ? <span className="text-white/60">--</span> : dashboardData.accounts.length}
          </p>
        </div>
        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl hover:scale-110 transition-transform duration-200 shadow-lg">
          <Landmark size={24} className="text-white" />
        </div>
      </div>
      <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden backdrop-blur-sm">
        <div className="bg-white h-2 rounded-full transition-all duration-500 shadow-sm" style={{ width: `${Math.min(100, (dashboardData.accounts.length / 10) * 100)}%` }}></div>
      </div>
    </div>
  </div>

  {/* Vendor Card - Fiery Red to Dark Burgundy */}
  <div
    className="bg-gradient-to-br from-red-600 via-rose-700 to-red-800 p-5 rounded-2xl shadow-xl cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden group"
    onClick={() => setShowVenderModal(true)}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h2 className="text-white/90 text-sm font-semibold tracking-wide font-inter">Vendors</h2>
          <p className="text-3xl font-bold text-white mt-1">
            {isLoading && !showPartialData ? <span className="text-white/60">--</span> : dashboardData.vendors.length}
          </p>
        </div>
        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl hover:scale-110 transition-transform duration-200 shadow-lg">
          <DollarSign size={24} className="text-white" />
        </div>
      </div>
      <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden backdrop-blur-sm">
        <div className="bg-white h-2 rounded-full transition-all duration-500 shadow-sm" style={{ width: `${Math.min(100, (dashboardData.vendors.length / 50) * 100)}%` }}></div>
      </div>
    </div>
  </div>

  {/* Agent Card - Sky Blue to Deep Cyan */}
  <div
    className="bg-gradient-to-br from-cyan-600 via-teal-700 to-cyan-800 p-5 rounded-2xl shadow-xl cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden group"
    onClick={() => setShowAgentModal(true)}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h2 className="text-white/90 text-sm font-semibold tracking-wide font-inter">Agents</h2>
          <p className="text-3xl font-bold text-white mt-1">
            {isLoading && !showPartialData ? <span className="text-white/60">--</span> : dashboardData.agents.length}
          </p>
        </div>
        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl hover:scale-110 transition-transform duration-200 shadow-lg">
          <User size={24} className="text-white" />
        </div>
      </div>
      <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden backdrop-blur-sm">
        <div className="bg-white h-2 rounded-full transition-all duration-500 shadow-sm" style={{ width: `${Math.min(100, (dashboardData.agents.length / 50) * 100)}%` }}></div>
      </div>
    </div>
  </div>

  {/* Total Receivable Amount Card - Royal Purple to Dark Magenta */}
  <div className="bg-gradient-to-br from-indigo-700 via-purple-800 to-fuchsia-900 p-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden group">
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h2 className="text-white/90 text-sm font-semibold tracking-wide font-inter">Total Receivable</h2>
          <p className="text-3xl font-bold text-white mt-1">
            {isLoading && !showPartialData ? <span className="text-white/60">--</span> : totalReceivableAmount.toLocaleString()}
          </p>
        </div>
      </div>
      <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden backdrop-blur-sm">
        <div className="bg-white h-2 rounded-full transition-all duration-500 shadow-sm" style={{ width: `${Math.min(100, (totalReceivableAmount / 1000000) * 100)}%` }}></div>
      </div>
    </div>
  </div>

  {/* Total Paid Cash Card - Classic Gold to Sunlit Orange (Representing Immediate Value/Cash) */}
  <div className="bg-gradient-to-br from-yellow-500 via-yellow-600 to-amber-700 p-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden group">
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h2 className="text-white/90 text-sm font-semibold tracking-wide font-inter">Total Paid Cash</h2>
          <p className="text-3xl font-bold text-white mt-1">
            {isLoading && !showPartialData ? <span className="text-white/60">--</span> : totalPaidCash.toLocaleString()}
          </p>
        </div>
      </div>
      <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden backdrop-blur-sm">
        <div className="bg-white h-2 rounded-full transition-all duration-500 shadow-sm" style={{ width: `${Math.min(100, (totalPaidCash / 1000000) * 100)}%` }}></div>
      </div>
    </div>
  </div>

  {/* Total Paid In Bank Card - Deep Sea Blue to Sky Blue */}
  <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-700 p-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden group">
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h2 className="text-white/90 text-sm font-semibold tracking-wide font-inter">Total Paid In Bank</h2>
          <p className="text-3xl font-bold text-white mt-1">
            {isLoading && !showPartialData ? <span className="text-white/60">--</span> : totalPaidInBank.toLocaleString()}
          </p>
        </div>
      </div>
      <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden backdrop-blur-sm">
        <div className="bg-white h-2 rounded-full transition-all duration-500 shadow-sm" style={{ width: `${Math.min(100, (totalPaidInBank / 1000000) * 100)}%` }}></div>
      </div>
    </div>
  </div>

  {/* Total Remaining Amount Card - Dark Graphite to Slate Gray (Representing Debt/Remaining) */}
  <div className="bg-gradient-to-br from-gray-700 via-slate-800 to-stone-900 p-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden group">
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h2 className="text-white/90 text-sm font-semibold tracking-wide font-inter">Total Remaining Amount</h2>
          <p className="text-3xl font-bold text-white mt-1">
            {isLoading && !showPartialData ? <span className="text-white/60">--</span> : totalRemainingAmount.toLocaleString()}
          </p>
        </div>
      </div>
      <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden backdrop-blur-sm">
        <div className="bg-white h-2 rounded-full transition-all duration-500 shadow-sm" style={{ width: `${Math.min(100, (totalRemainingAmount / 1000000) * 100)}%` }}></div>
      </div>
    </div>
  </div>

  {/* Total Withdraw Card - Vivid Magenta to Dark Violet */}
  <div className="bg-gradient-to-br from-fuchsia-600 via-pink-700 to-purple-800 p-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden group">
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h2 className="text-white/90 text-sm font-semibold tracking-wide font-inter">Withdraw</h2>
          <p className="text-3xl font-bold text-white mt-1">
            {isLoading && !showPartialData ? <span className="text-white/60">--</span> : dashboardData.TotalWithdraw.toLocaleString()}
          </p>
        </div>
      </div>
      <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden backdrop-blur-sm">
        <div className="bg-white h-2 rounded-full transition-all duration-500 shadow-sm" style={{ width: `${Math.min(100, (dashboardData.TotalWithdraw / 1000000) * 100)}%` }}></div>
      </div>
    </div>
  </div>

  {/* Cash in Office Card - Clean, Bright Lime Green to Dark Teal (Representing Available Cash) */}
  <div className="bg-gradient-to-br from-lime-500 via-green-600 to-teal-700 p-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden group">
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h2 className="text-white/90 text-sm font-semibold tracking-wide font-inter">Cash in Office</h2>
          <p className="text-3xl font-bold text-white mt-1">
            {isLoading && !showPartialData ? <span className="text-white/60">--</span> : dashboardData.cashInOffice.toLocaleString()}
          </p>
        </div>
      </div>
      <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden backdrop-blur-sm">
        <div className="bg-white h-2 rounded-full transition-all duration-500 shadow-sm" style={{ width: `${Math.min(100, (dashboardData.cashInOffice / 1000000) * 100)}%` }}></div>
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
    <div className="overflow-auto max-h-[75vh] rounded-xl border border-indigo-100">
      <table className="min-w-full divide-y divide-indigo-100">
        <thead className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 sticky top-0">
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                className="px-4 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider font-inter"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-indigo-50">
          {dashboardData.combinedBookings.length > 0 ? (
            dashboardData.combinedBookings.map((booking, index) => (
              <tr 
                key={index} 
                className={`${
                  index % 2 === 0 
                    ? 'bg-white' 
                    : 'bg-gradient-to-r from-indigo-50/30 via-purple-50/20 to-pink-50/30'
                } hover:bg-gradient-to-r hover:from-indigo-100/40 hover:via-purple-100/30 hover:to-pink-100/40 transition-all duration-200`}
              >
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 font-inter font-medium">
                  {booking.booking_date}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 font-inter">
                  {booking.employee_name}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 font-inter">
                  {booking.entry ? booking.entry : <span className="text-slate-400">--</span>}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold font-inter">
                  <span className="px-2 py-1 rounded-md bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700">
                    {booking.type}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 font-inter">
                  {booking.passengerName ? booking.passengerName : <span className="text-slate-400">--</span>}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-emerald-600 font-inter font-semibold">
                  {booking.receivable_amount}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 font-inter">
                  {booking.paid_cash}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 font-inter">
                  {booking.paid_in_bank}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-amber-600 font-inter font-semibold">
                  {booking.remaining_amount}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 font-inter">
                  {booking.withdraw}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-indigo-600 font-inter font-semibold">
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