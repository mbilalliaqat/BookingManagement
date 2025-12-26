import React from 'react';
import UserLayout from '../layouts/UserLayout';
import { Route, Routes } from 'react-router-dom';
import Tickets from '../user/tickets/Tickets';
import Booking from '../user/booking/Booking';
import Umrah from '../user/umrah/Umrah';
import Visa from '../user/visa/Visa';
import UserDashboard from '../user/dashboard/UserDashboard';
import GamcaToken from '../user/gamcaToken/GamcaToken';
import Protector from '../user/protector/Protector';
import Expense from '../user/expense/Expense';
import Refunded from '../user/refundedCaseMCB/Refunded';
import Services from '../user/services/Services';
import Agent from '../user/agent/Agent';
import RefundCustomer from '../user/refundCustomer/RefundCustomer';
import Navtcc from '../user/navtcc/Navtcc';
import E_Number from '../user/e_number/E_Number';
import Banks_Detail from '../user/User_Banks_Details/Banks_Detail';

const UserRoutes = () => {
  return (
    <div>
      <UserLayout>
        <Routes>
          <Route path="/dashboard" element={<UserDashboard />} /> 
          <Route path="/bookings" element={<Booking />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/umrah" element={<Umrah />} />
          <Route path="/visa" element={<Visa />} />
          <Route path="/gamcaToken" element={<GamcaToken />} />
          <Route path="/navtcc" element={<Navtcc />} />
          <Route path="/services" element={<Services />} />
          <Route path="/protector" element={<Protector />} />
          <Route path="/expense" element={<Expense />} />
          <Route path="/refunded" element={<Refunded />} />
          <Route path='/refundCustomer' element={<RefundCustomer/>}/>
          <Route path='/agent' element={<Agent/>}/>
          <Route path='/e-number' element={<E_Number/>}/>
          <Route path='/banks-details' element={<Banks_Detail/>}/>
        </Routes>
      </UserLayout>
    </div>
  );
};

export default UserRoutes;