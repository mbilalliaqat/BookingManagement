// Header.jsx
import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { motion,AnimatePresence } from 'framer-motion';
import axios from 'axios';

const Header = () => {
  const { user, logout, toggleSidebar, isSidebarOpen } = useAppContext();
  const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;

  const[AddCustomer,setAddCustomer] = useState(false);

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

  const handleSubmit=async(e)=>{
    e.preventDefault();
    setIsSubmitted(true);

    // Add customer to the list
    // setCustomerList([...customerList, customerForm]);

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
    <header className="bg-white py-2 md:py-4 px-3 md:px-6 flex justify-between items-center shadow-md sticky top-0 z-10">
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
       
        <button className="p-2 rounded-lg hover:bg-red-400 font-medium bg-gray-200"
        onClick={()=>setAddCustomer(!AddCustomer)}
        >
          <i className="fas fa-plus mr-1"></i> Add Customer  
        </button>
        <AnimatePresence>
        {AddCustomer && (
          <>
          <div className='fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm'/>
          <motion.div 
           initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          className='absolute top-50 right-100 bg-white border rounded-2xl shadow-lg z-100 p-4 w-80'
          >
            <form onSubmit={handleSubmit}>

              <div className='space-y-3'>
              <input type='text' placeholder='Enter Name' className='w-full p-1 border-0 border-b-2 border-gray-400 focus:border-blue-500 focus:outline-none'
              value={customerForm.name}
              name='name'
              onChange={handleInputChange}
              />
              <input type='number' placeholder='Enter Mobile Number' className='w-full p-1 border-0 border-b-2 border-gray-400 focus:border-blue-500 focus:outline-none '
              value={customerForm.mobile_number}
              name='mobile_number'
              onChange={handleInputChange}
              />
              <input type='text' placeholder='Enter Address' className='w-full p-1 border-0 border-b-2 border-gray-400 focus:border-blue-500 focus:outline-none'
              value={customerForm.address}
              name='address'
              onChange={handleInputChange}
              />
              <input type='text' placeholder='Passport Number' className='w-full p-1 border-0 border-b-2 border-gray-400 focus:border-blue-500 focus:outline-none'
              value={customerForm.passport_number}
              name='passport_number'
              onChange={handleInputChange}
              />
              </div>
              <div className='flex justify-end space-x-3 mt-4'>

                  <button
                type='submit'
                className={`px-4 py-2 bg-gray-800 rounded hover:bg-gray-400 transition ${
                  isSubmitted? 'bg-gray-400 cursor-not-allowed' : 
                  'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                  disabled={isSubmitted}

                > 
                {isSubmitted?'Submitted':'Submit'}
                
                </button>

                 <button
                type='button'
                onClick={handleCancel} className='px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition'
                  
                  > 
                  Cancel
                </button>
              </div>
            </form>
            
          </motion.div>
          </>
        )}

        </AnimatePresence>
        {/* Logout Button with Power Icon */}
        <button 
          onClick={logout} 
          className="flex items-center space-x-1 md:space-x-2 p-2 bg-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-colors duration-200"
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