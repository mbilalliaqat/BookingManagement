// Header.jsx - Updated with Notification System
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { NotificationBell } from '../ui/NotificationBell'; // Import the notification component
import { useNavigate } from 'react-router-dom';

const Header = ({ isAdmin }) => {
  const { user, logout, toggleSidebar, isSidebarOpen } = useAppContext();
  const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;

  const [AddCustomer, setAddCustomer] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isExpanded = isSidebarOpen || false;

  const [customerForm, setCustomerForm] = useState({
    name: '',
    mobile_number: '',
    address: '',
    passport_number: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const parsePassportDetail = (detail) => {
    try {
      return JSON.parse(detail);
    } catch {
      return {};
    }
  };

  const fetchAllData = async () => {
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
       
       


      const umrahBookings = umrahData.data.umrahBookings.map(umrah => ({
        type: 'Umrah',
        employee_name: umrah.userName || '',
        entry: umrah.entry || '',
        passengerName: umrah.customerAdd || null,
        customerAdd: umrah.customerAdd || '',
        date: umrah.created_at ? new Date(umrah.created_at).toLocaleDateString('en-GB') : '',
        original: umrah
      }));

      const ticketBookings = ticketsData.data.ticket.map(ticket => {
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
          employee_name: ticket.employee_name || '',
          entry: ticket.entry || '',
          passengerName: firstPassengerName || ticket.customer_add || null,
          pnr: ticket.pnr || '',
          airline: ticket.airline || '',
          customerAdd: ticket.customer_add || '',
          date: ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('en-GB') : '',
          original: ticket
        };
      });

      const visaBookings = visaData.data.visa_processing.map(visa => {
        const details = parsePassportDetail(visa.passport_detail);
        const fullName = `${details.firstName || ''} ${details.lastName || ''}`.trim();
        return {
          type: 'Visa Processing',
          employee_name: visa.employee_name || '',
          entry: visa.entry || '',
          passengerName: fullName || null,
          passportNumber: details.documentNo || details.passportNumber || '',
          customerAdd: visa.customer_add || '',
          date: visa.created_at ? new Date(visa.created_at).toLocaleDateString('en-GB') : '',
          original: visa
        };
      });

      const gamcaTokenBookings = gamcaTokenData.data.gamcaTokens.map(token => {
        const details = parsePassportDetail(token.passport_detail);
        const fullName = `${details.firstName || ''} ${details.lastName || ''}`.trim();
        return {
          type: 'GAMCA Token',
          employee_name: token.employee_name || '',
          entry: token.entry || '',
          passengerName: fullName || null,
          reference: token.reference || '',
          passportNumber: details.documentNo || '',
          customerAdd: token.customer_add || '',
          date: token.created_at ? new Date(token.created_at).toLocaleDateString('en-GB') : '',
          original: token
        };
      });

      const servicesBookings = servicesData.data.services.map(services => ({
        type: 'Services',
        employee_name: services.user_name || '',
        entry: services.entry || '',
        passengerName: services.name || null,
        detail: services.detail || '',
        customerAdd: services.customer_add || '',
        date: services.created_at ? new Date(services.created_at).toLocaleDateString('en-GB') : '',
        original: services
      }));

      const navtccBookings = navtccData.data.navtcc.map(navtcc => {
        const details = parsePassportDetail(navtcc.passport_detail);
        const fullName = `${details.firstName || ''} ${details.lastName || ''}`.trim();
        return {
          type: 'Navtcc',
          employee_name: navtcc.employee_name || navtcc.reference || '',
          entry: navtcc.entry || '',
          passengerName: fullName || null,
          reference: navtcc.reference || '',
          customerAdd: navtcc.customer_add || '',
          date: navtcc.created_at ? new Date(navtcc.created_at).toLocaleDateString('en-GB') : '',
          original: navtcc
        };
      });

      const protectorBookings = protectorData.data.protectors.map(protector => ({
        type: 'Protector',
        employee_name: protector.employee || '',
        entry: protector.entry || '',
        passengerName: protector.name || null,
        date: protector.created_at ? new Date(protector.created_at).toLocaleDateString('en-GB') : '',
        original: protector
      }));

      const expensesBookings = expensesData.data.expenses.map(expenses => ({
        type: 'Expenses',
        employee_name: expenses.user_name || '',
        entry: expenses.entry || '',
        passengerName: expenses.name || null,
        detail: expenses.detail || '',
        date: expenses.created_at ? new Date(expenses.created_at).toLocaleDateString('en-GB') : '',
        original: expenses
      }));

      const refundedBookings = (refundedData.data.refunded || []).map(refund => ({
        type: 'Refunded',
        employee_name: refund.employee || '',
        entry: refund.entry || '',
        passengerName: refund.name || null,
        date: refund.created_at ? new Date(refund.created_at).toLocaleDateString('en-GB') : '',
        original: refund
      }));

      const vendorBookings = (vendorData.data.vendors || []).map(vender => ({
        type: 'Vendor',
        employee_name: vender.user_name || '',
        entry: vender.entry || '',
        passengerName: vender.name || null,
        detail: vender.detail || '',
        vendorName: vender.vender_name || '',
        date: vender.created_at ? new Date(vender.created_at).toLocaleDateString('en-GB') : '',
        original: vender
      }));

      const allData = [
        ...umrahBookings, ...ticketBookings, ...visaBookings, ...gamcaTokenBookings,
        ...servicesBookings, ...navtccBookings, ...protectorBookings,
        ...expensesBookings, ...refundedBookings, ...vendorBookings
      ];

      setAllBookings(allData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load search data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showSearch && allBookings.length === 0) {
      fetchAllData();
    }
  }, [showSearch]);

  const filteredResults = searchTerm.trim() 
    ? allBookings.filter((booking) =>
        Object.values(booking).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : [];

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
     
    
   const selectItem = (item) => {
  setShowSearch(false);
  setSearchTerm('');
  
  // Map search result types to dashboard navigation routes
  const typeToRouteMap = {
    'Umrah': '/admin/umrah',
    'Ticket': '/admin/tickets',
    'Visa Processing': '/admin/visa',
    'GAMCA Token': '/admin/gamcaToken',
    'Services': '/admin/services',
    'Navtcc': '/admin/navtcc',
    'Protector': '/admin/protector',
    'Expenses': '/admin/expense',
    'Refunded': '/admin/refunded',
    'Vendor': '/admin/vender',
  };
  
  const route = typeToRouteMap[item.type];
  
  if (route) {
    // Navigate with highlightEntry state, just like the dashboard does
    navigate(route, { 
      state: { highlightEntry: item.entry } 
    });
  } else {
    console.log('Unknown booking type:', item.type);
  }
};
 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitted(true);

    try {
      const response = await axios.post(`${BASE_URL}/customers`, customerForm);
      if (response.status === 201 || response.status === 200) {
        alert("Customer created successfully");
        setCustomerForm({
          name: '',
          mobile_number: '',
          address: '',
          passport_number: ''
        });
        setAddCustomer(false);
      } else {
        alert('Customer creation failed');
      }
    } catch (error) {
      console.error('Error creating customer', error);
      alert('Error creating customer. Please try again.');
    } finally {
      setIsSubmitted(false);
    }
  };

  const handleCancel = () => {
    setCustomerForm({
      name: '',
      mobile_number: '',
      address: '',
      passport_number: ''
    });
    setAddCustomer(false);
  };

  return (
    <header className="py-2 md:py-4 px-3 md:px-6 flex justify-between items-center sticky top-0 z-[100] border-b-2 bg-white">
      <div className="flex items-center space-x-2">
        <button
          onClick={toggleSidebar}
          className=" text-black"
          title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          <i className={`fas ${isSidebarOpen ? 'fa-bars' : 'fa-bars md:fa-chevron-right'}`}></i>
        </button>
      </div>

      <div className="flex items-center space-x-3 md:space-x-6 ">
        <span className="font-bold text-sm md:hidden bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Booking System</span>

        {showSearch && (
          <div
            className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setShowSearch(false);
              setSearchTerm('');
            }}
          />
        )}

        <div className="relative">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="rounded-xl text-black relative z-[1000]"
          >
            <i className="fas fa-search"></i>
          </button>

          {showSearch && (
            <div className="fixed right-3 top-16 md:absolute md:right-0 md:top-12 w-[calc(100vw-1.5rem)] md:w-96 bg-white border-2 border-indigo-200 rounded-2xl shadow-2xl z-[1000] max-h-[80vh] flex flex-col">
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search by name, entry, employee..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="flex-1 p-2.5 border-2 border-indigo-300 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setShowSearch(false);
                      setSearchTerm('');
                    }}
                    className="p-2 text-slate-500 hover:text-slate-700"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className="mt-2 text-xs text-slate-600">
                  {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} found
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                    <div className="mt-2 text-indigo-600 font-medium">Loading...</div>
                  </div>
                ) : filteredResults.length > 0 ? (
                  filteredResults.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => selectItem(item)}
                      className="p-3 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 cursor-pointer border-b border-indigo-100 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                              {item.type}
                            </span>
                            {item.entry && (
                              <span className="text-xs text-slate-500">#{item.entry}</span>
                            )}
                          </div>
                          
                          {item.passengerName ? (
                            <div className="font-semibold text-slate-800">
                              {item.passengerName}
                            </div>
                          ) : item.customerAdd ? (
                            <div className="font-semibold text-slate-800">
                              {item.customerAdd}
                            </div>
                          ) : (
                            <div className="font-semibold text-slate-400">
                              No Name
                            </div>
                          )}
                          
                          {item.employee_name && (
                            <div className="text-sm text-indigo-600 mt-0.5">
                              Employee: {item.employee_name}
                            </div>
                          )}
                          
                          {item.reference && (
                            <div className="text-xs text-slate-500 mt-0.5">
                              Ref: {item.reference}
                            </div>
                          )}
                          {item.pnr && (
                            <div className="text-xs text-slate-500 mt-0.5">
                              PNR: {item.pnr}
                            </div>
                          )}
                          {item.passportNumber && (
                            <div className="text-xs text-slate-500 mt-0.5">
                              Passport: {item.passportNumber}
                            </div>
                          )}
                          {item.vendorName && (
                            <div className="text-xs text-slate-500 mt-0.5">
                              Vendor: {item.vendorName}
                            </div>
                          )}
                          {item.detail && (
                            <div className="text-xs text-slate-500 mt-0.5">
                              {item.detail}
                            </div>
                          )}
                          {item.date && (
                            <div className="text-xs text-slate-400 mt-1">
                              <i className="far fa-calendar mr-1"></i>{item.date}
                            </div>
                          )}
                        </div>
                        <i className="fas fa-chevron-right text-slate-300 mt-2"></i>
                      </div>
                    </div>
                  ))
                ) : searchTerm ? (
                  <div className="p-8 text-center text-slate-500">
                    <i className="fas fa-search text-3xl mb-2 text-slate-300"></i>
                    <div>No results found for "{searchTerm}"</div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    <i className="fas fa-search text-3xl mb-2 text-slate-300"></i>
                    <div>Type to search across all projects</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* REPLACE THE OLD BELL BUTTON WITH NOTIFICATION BELL */}
        <NotificationBell />

        <AnimatePresence>
          {AddCustomer && (
            <>
              <div className='fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40' />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className='fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-indigo-200 rounded-3xl shadow-2xl z-50 p-6 w-96'
              >
                <h2 className="text-2xl font-bold mb-6 text-[#24243e]">Add New Customer</h2>
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
                      className={`px-6 py-2.5 font-semibold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 ${isSubmitted
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
          className="flex items-center text-black "
          title="Logout"
        >
          <i className="fas fa-power-off"></i>
          
        </button>

         <div className={`  ${!isExpanded && 'px-2'}`}>
          <div className={`flex items-center ${!isExpanded && 'justify-center'}`}>
            <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-xs font-bold shadow-lg">
              {isAdmin ? 'A' : 'U'}
            </div>
            {isExpanded && (
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-semibold text-black truncate">
                  {isAdmin ? 'Admin User' : 'User'}
                </p>
                <p className="text-xs text-slate-400 truncate">Online</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;