// Header.jsx
import React from 'react';
import { useAppContext } from '../contexts/AppContext';

const Header = () => {
  const { user, logout, toggleSidebar, isSidebarOpen } = useAppContext();

  return (
    <header className="bg-gray-300 py-2 md:py-4 px-3 md:px-6 flex justify-between items-center shadow-md sticky top-0 z-10">
      <div className="flex items-center space-x-2">
        {/* Toggle Sidebar Button */}
        <button 
          onClick={toggleSidebar} 
          className="px-2 py-1 md:px-3 md:py-1 rounded-lg hover:bg-gray-200 bg-white transition-colors duration-200"
          title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          <i className={`fas ${isSidebarOpen ? 'fa-chevron-left' : 'fa-bars md:fa-chevron-right'} text-gray-600`}></i>
        </button>
      </div>
      
      {/* Right Side - Icons */}
      <div className="flex items-center space-x-2 md:space-x-4">
        {/* Mobile title */}
        <span className="font-semibold text-sm md:hidden">Booking System</span>
       
        <button className="p-1 md:p-2 rounded-lg hover:bg-gray-200">
          <i className="far fa-bell text-gray-600 text-sm md:text-base"></i>
        </button>
        
        {/* Logout Button with Power Icon */}
        <button 
          onClick={logout} 
          className="flex items-center space-x-1 md:space-x-2 px-2 py-1 md:px-3 md:py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors duration-200"
          title="Logout"
        >
          <i className="fas fa-power-off text-xs md:text-sm"></i>
          <span className="text-xs md:text-sm font-medium hidden md:inline">Logout</span>
        </button>
         <button 
                   className="flex items-center space-x-1 md:space-x-2 px-2 py-1 md:px-3 md:py-2 bg-gray-800 font-semibold text-white rounded-lg "

         >
          {user?.username? user.username : 'U'}
         </button>
      </div>
    </header>
  );
};

export default Header;