// Header.jsx
import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const Header = () => {
  const { user, logout, toggleSidebar, isSidebarOpen } = useAppContext();
  const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;

  const[AddCustomer,setAddCustomer] = useState(false);
  const[showSearch,setShowSearch] = useState(false);
  const[searchTerm,setSearchTerm] = useState('');
  const[searchResults,setSearchResults] = useState([]);
  const[loading,setLoading] = useState(false);

  const [customerForm,setCustomerForm] = useState({
    name:'',
    mobile_number:'',
    address:'',
    passport_number:''
  });

  const [isSubmitted,setIsSubmitted] = useState(false);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const parsePassportDetail = (detail) => {
    try { return JSON.parse(detail); } catch { return {}; }
  };

  const globalSearch = async (term) => {
    if(!term.trim()) {
      setSearchResults([]);
      return;
    }
    
    setLoading(true);
    try {
      const [
        umrahData, ticketsData, visaData, gamcaTokenData, servicesData,
        navtccData, protectorData, expensesData, refundedData, vendorData,
      ] = await Promise.all([
        axios.get(`${BASE_URL}/umrah`),
        axios.get(`${BASE_URL}/ticket`),
        axios.get(`${BASE_URL}/visa-processing`),
        axios.get(`${BASE_URL}/gamca-token`),
        axios.get(`${BASE_URL}/services`),
        axios.get(`${BASE_URL}/navtcc`),
        axios.get(`${BASE_URL}/protector`),
        axios.get(`${BASE_URL}/expenses`),
        axios.get(`${BASE_URL}/refunded`),
        axios.get(`${BASE_URL}/vender`),
      ]);

      const lowerTerm = term.toLowerCase();

      // Map each type similarly to Dashboard.jsx
      const umrahBookings = umrahData.data.umrahBookings.map(umrah => ({
        type: 'Umrah', 
        employee_name: umrah.userName, 
        entry: umrah.entry, 
        passengerName: null, // As per dashboard
        original: umrah
      }));

      const ticketBookings = ticketsData.data.ticket.map(ticket => ({
        type: 'Ticket', 
        employee_name: ticket.employee_name, 
        entry: ticket.entry, 
        passengerName: ticket.name,
        original: ticket
      }));

      const visaBookings = visaData.data.visa_processing.map(visa => {
        const details = parsePassportDetail(visa.passport_detail);
        return { 
          type: 'Visa Processing', 
          employee_name: visa.employee_name, 
          entry: visa.entry, 
          passengerName: `${details.firstName || ''} ${details.lastName || ''}`.trim(), 
          original: visa
        };
      });

      const gamcaTokenBookings = gamcaTokenData.data.gamcaTokens.map(token => {
        const details = parsePassportDetail(token.passport_detail);
        return { 
          type: 'GAMCA Token', 
          employee_name: token.employee_name, 
          entry: token.entry, 
          passengerName: `${details.firstName || ''} ${details.lastName || ''}`.trim(), 
          original: token
        };
      });

      const servicesBookings = servicesData.data.services.map(services => ({
        type: 'Services', 
        employee_name: services.user_name, 
        entry: services.entry, 
        passengerName: null,
        original: services
      }));

      const navtccBookings = navtccData.data.navtcc.map(navtcc => {
        const details = parsePassportDetail(navtcc.passport_detail);
        return { 
          type: 'Navtcc', 
          employee_name: navtcc.employee_name || navtcc.reference, 
          entry: navtcc.entry, 
          passengerName: `${details.firstName || ''} ${details.lastName || ''}`.trim(), 
          original: navtcc
        };
      });

      const protectorBookings = protectorData.data.protectors.map(protector => ({
        type: 'Protector', 
        employee_name: protector.employee, 
        entry: protector.entry, 
        passengerName: protector.name || null,
        original: protector
      }));

      const expensesBookings = expensesData.data.expenses.map(expenses => ({
        type: 'Expenses', 
        employee_name: expenses.user_name, 
        entry: expenses.entry, 
        passengerName: expenses.detail || null,
        original: expenses
      }));

      const refundedBookings = (refundedData.data.refunded || []).map(refund => ({
        type: 'Refunded', 
        employee_name: refund.employee, 
        entry: refund.entry, 
        passengerName: refund.name || null,
        original: refund
      }));

      const vendorBookings = (vendorData.data.vendors || []).map(vender => ({
        type: 'Vendor', 
        employee_name: vender.user_name, 
        entry: vender.entry, 
        passengerName: null,
        original: vender
      }));

      const allBookings = [
        ...umrahBookings, ...ticketBookings, ...visaBookings, ...gamcaTokenBookings, ...servicesBookings,
        ...navtccBookings, ...protectorBookings, ...expensesBookings, ...refundedBookings, ...vendorBookings
      ];

      const filtered = allBookings.filter(booking => 
        (booking.passengerName && booking.passengerName.toLowerCase().includes(lowerTerm)) ||
        (booking.employee_name && booking.employee_name.toLowerCase().includes(lowerTerm)) ||
        (booking.entry && booking.entry.toLowerCase().includes(lowerTerm))
      );

      setSearchResults(filtered);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    globalSearch(value);
  };

  const selectItem = (item) => {
    console.log('Selected:', item);
    alert(`Selected: ${item.type} - ${item.passengerName || item.entry || item.employee_name}`);
    setShowSearch(false);
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleSubmit=async(e)=>{
    e.preventDefault();
    setIsSubmitted(true);

    try {
      const response = await axios.post(`${BASE_URL}/customers`,customerForm);
      if(response.status === 201 || response.status === 200){
        alert("Customer Create successfully")
        setCustomerForm({
          name:'',
          mobile_number:'',
          address:'',
          passport_number:''
        })
        setAddCustomer(false);
      }
      else{
        alert('Customer Create failed')
      }
      
    } catch (error) {
      console.error('Error creating customer',error)
    }
    finally{
      setIsSubmitted(false);
    }
  }

  const handleCancel=()=>{
    setCustomerForm({
      name:'',
      mobile_number:'',
      address:'',
      passport_number:''
    })
    setAddCustomer(false);
  }

  return (
    <header className="bg-[#302b63] py-2 md:py-4 px-3 md:px-6 flex justify-between items-center shadow-lg sticky top-0 z-10 border-b-2 border-indigo-100">
      <div className="flex items-center space-x-2">
        <button 
          onClick={toggleSidebar} 
          className="px-3 py-2 rounded-xl bg-[#24243e] text-white hover:bg-[#1f1f33] transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
          title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          <i className={`fas ${isSidebarOpen ? 'fa-chevron-left' : 'fa-bars md:fa-chevron-right'}`}></i>
        </button>
      </div>
      
      <div className="flex items-center space-x-2 md:space-x-4">
        <span className="font-bold text-sm md:hidden bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Booking System</span>
       
        {/* Search Button & Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowSearch(!showSearch)}
            className="p-2.5 rounded-xl bg-[#24243e] text-white hover:bg-[#1f1f33] transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            <i className="fas fa-search"></i> 
          </button>
          
          {showSearch && (
            <div className="absolute right-0 top-12 w-80 bg-white border-2 border-indigo-200 rounded-2xl shadow-2xl z-50">
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-2xl">
                <input
                  type="text"
                  placeholder="Search across all projects..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full p-2.5 border-2 border-indigo-300 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                  autoFocus
                />
              </div>
              
              <div className="max-h-60 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-indigo-600 font-medium">Loading...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => selectItem(item)}
                      className="p-3 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 cursor-pointer border-b border-indigo-100 transition-all duration-200"
                    >
                      <div className="font-semibold text-slate-800">{item.type} - {item.passengerName || item.entry || 'No Name'}</div>
                      <div className="text-sm text-indigo-600">{item.employee_name || item.entry || '--'}</div>
                    </div>
                  ))
                ) : searchTerm ? (
                  <div className="p-4 text-center text-slate-500">No results found</div>
                ) : (
                  <div className="p-4 text-center text-slate-500">Type to search across projects</div>
                )}
              </div>
            </div>
          )}
        </div>

        <button 
          className="flex items-center space-x-2 px-4 py-2 bg-[#24243e] text-white font-semibold rounded-xl hover:bg-[#1f1f33] transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
          onClick={()=>setAddCustomer(!AddCustomer)}
        >
          <i className="fas fa-plus"></i>
          <span>Customer</span>
        </button>
        
        <AnimatePresence>
        {AddCustomer && (
          <>
          <div className='fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40'/>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className='fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-indigo-200 rounded-3xl shadow-2xl z-50 p-6 w-96'
          >
            <h2 className="text-2xl font-bold mb-6 bg-[#24243e] text-white">Add New Customer</h2>
            <form onSubmit={handleSubmit}>
              <div className='space-y-4'>
                <input 
                  type='text' 
                  placeholder='Enter Name' 
                  className='w-full p-3 border-2 border-indigo-200 rounded-xl focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200'
                  value={customerForm.name}
                  name='name'
                  onChange={handleInputChange}
                  required
                />
                <input 
                  type='number' 
                  placeholder='Enter Mobile Number' 
                  className='w-full p-3 border-2 border-indigo-200 rounded-xl focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200'
                  value={customerForm.mobile_number}
                  name='mobile_number'
                  onChange={handleInputChange}
                  required
                />
                <input 
                  type='text' 
                  placeholder='Enter Address' 
                  className='w-full p-3 border-2 border-indigo-200 rounded-xl focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200'
                  value={customerForm.address}
                  name='address'
                  onChange={handleInputChange}
                />
                <input 
                  type='text' 
                  placeholder='Passport Number' 
                  className='w-full p-3 border-2 border-indigo-200 rounded-xl focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all duration-200'
                  value={customerForm.passport_number}
                  name='passport_number'
                  onChange={handleInputChange}
                />
              </div>
              <div className='flex justify-end space-x-3 mt-6'>
                <button
                  type='submit'
                  className={`px-6 py-2.5 font-semibold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 ${
                    isSubmitted
                      ? 'bg-gray-400 cursor-not-allowed text-white' 
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white'
                  }`}
                  disabled={isSubmitted}
                > 
                  {isSubmitted ? 'Submitting...' : 'Submit'}
                </button>
                <button
                  type='button'
                  onClick={handleCancel} 
                  className='px-6 py-2.5 bg-gradient-to-r from-slate-400 to-slate-500 hover:from-slate-500 hover:to-slate-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105'
                > 
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
          </>
        )}
        </AnimatePresence>

        <button 
          onClick={logout} 
          className="flex items-center space-x-2 px-4 py-2 bg-[#24243e] text-white font-semibold rounded-xl hover:bg-[#1f1f33] transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
          title="Logout"
        >
          <i className="fas fa-power-off"></i>
          <span className="hidden md:inline">Logout</span>
        </button>
        
        <button 
          className="flex items-center justify-center w-10 h-10 md:w-auto md:px-4 md:py-2 bg-[#24243e] text-white font-bold rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
        >
          <span className="text-sm md:text-base">{user?.username ? user.username.charAt(0).toUpperCase() : 'U'}</span>
          <span className="hidden md:inline ml-1">{user?.username ? user.username.slice(1) : ''}</span>
        </button>
      </div>
      
      {/* Click outside to close search */}
      {showSearch && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowSearch(false)}
        />
      )}
    </header>
  );
};

export default Header;