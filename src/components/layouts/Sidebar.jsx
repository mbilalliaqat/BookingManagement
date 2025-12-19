// Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import logo from '../../assets/LogoF.jpeg';

const Sidebar = ({ isAdmin }) => {
  const { isSidebarOpen, toggleSidebar } = useAppContext();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkScreenSize();
    
    // Set up listener for window resize
    window.addEventListener('resize', checkScreenSize);
    
    // Clean up
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const adminLinks = [
    { path: '/admin/dashboard', icon: 'fa-home', label: 'Dashboard' },
    { path: '/admin/tickets', icon: 'fa-ticket-alt', label: 'Tickets' },
    { path: '/admin/umrah', icon: 'fa-mosque', label: 'Umrah' },
    { path: '/admin/visa', icon: 'fa-passport', label: 'Visa' },
    { path: '/admin/gamcaToken', icon: 'fa-medkit', label: 'Gamca Token' },
    {path:'/admin/navtcc',icon:'fa-graduation-cap',label:'Navtcc'},
    { path: '/admin/services', icon: 'fa-cogs', label: 'Services' },
    { path: '/admin/protector', icon: 'fa-shield-alt', label: 'Protector' },
    { path: '/admin/expense', icon: 'fa-money-bill-wave', label: 'Cash Expense' },
    { path: '/admin/refunded', icon: 'fa-undo', label: 'MCB Paid/Refund' },
    // { path: '/admin/refundCustomer', icon: 'fa-undo', label: 'Refund Customer' },
    { path: '/admin/officeAccount', icon: 'fa-building', label: 'Office Accounts' },
    { path: '/admin/vender', icon: 'fa-store', label: 'Vender' },
    { path: '/admin/agent', icon: 'fa-user-tie', label: 'Agent' },
     { path: '/admin/archive', icon: 'fa-user-check', label: 'Archive' },
    { path: '/admin/employee', icon: 'fa-user-check', label: 'Employees' },
    // {path:'/admin/remainingPay',icon:'fa-money-bill-wave',label:'Remaining Pay'},
    //  { path: '/admin/payment', icon: 'fa-store', label: 'Payment' }
    


   
  ];

  const userLinks = [
    { path: '/dashboard', icon: 'fa-home', label: 'Dashboard' },
    { path: '/tickets', icon: 'fa-ticket-alt', label: 'Tickets' },
    { path: '/umrah', icon: 'fa-mosque', label: 'Umrah' },
    { path: '/visa', icon: 'fa-passport', label: 'Visa' },
    { path: '/gamcaToken', icon: 'fa-medkit', label: 'Gamca Token' },
    {path:'/navtcc',icon:'fa-graduation-cap',label:'Navtcc'},
    { path: '/services', icon: 'fa-cogs', label: 'Services' },
    { path: '/protector', icon: 'fa-shield-alt', label: 'Protector' },
    { path: '/expense', icon: 'fa-money-bill-wave', label: 'Expense' },
    { path: '/refunded', icon: 'fa-undo', label: 'Refunded MCB' },
    { path: '/refundCustomer', icon: 'fa-undo', label: 'Refund Customer' },
    { path: '/agent', icon: 'fa-user-tie', label: 'Agent' },
  ];

  // If mobile and sidebar is closed, hide it completely
  if (isMobile && !isSidebarOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile overlay when sidebar is open */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-20"
          onClick={toggleSidebar}
        ></div>
      )}
      
      <div 
        className={`bg-[#111827] text-white fixed md:sticky top-0 z-30  h-screen transition-all duration-300
                    ${isMobile ? 
                      (isSidebarOpen ? 'left-0 w-56' : '-left-64') : 
                      (isSidebarOpen ? 'w-53' : 'w-20')}`}
      >
        {/* Logo */}
        <div className="flex justify-start items-center py-4 px-4">
          <div className="rounded">
            <img
              src={logo}
              alt="Logo"
              className="w-50 h-12 object-cover rounded-2xl"
            />
          </div>
          {/* {(isSidebarOpen || isMobile) && <span className='pl-2 font-bold'>Booking System</span>} */}
        </div>
        
        <nav className="flex-1 px-2 text-sm">
        <ul className="space-y-1">
          {(isAdmin ? adminLinks : userLinks).map((link, index) => (
            <li key={link.path} className="relative">
              <NavLink
                to={link.path}
                className={({ isActive }) =>
                  `flex items-center ${(isSidebarOpen || isMobile) ? 'justify-start px-4 py-1 mx-3' : 'justify-center p-2 mx-4 my-1'}  rounded-md transition-all duration-400 ${
                    isActive
                      ? 'rounded-md bg-gray-200  text-[#151A2D] font-bold text-[17px]'
                      : 'text-white hover:bg-white hover:text-black'
                  }`
                }
                onClick={isMobile ? toggleSidebar : undefined}
                onMouseEnter={() => !isSidebarOpen && !isMobile  && setHoveredItem(index)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <i className={`fas ${link.icon} text-[21px]`}></i>
                {isSidebarOpen && <span className="ml-3">{link.label}</span>}
                
                {/* Tooltip for collapsed sidebar */}
                {!isSidebarOpen && !isMobile && hoveredItem === index && (
                  <div className="absolute left-19 bg-gray-800 text-white px-3 py-1 rounded z-50 whitespace-nowrap">
                    {link.label}
                  </div>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      </div>
    </>
  );
};

export default Sidebar;