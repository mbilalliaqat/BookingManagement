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

const UserRoutes = () => {
  return (
    <div>
      <UserLayout>
        <Routes>
          <Route path="/dashboard" element={<UserDashboard />} /> {/* Changed from /userDashboard */}
          <Route path="/bookings" element={<Booking />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/umrah" element={<Umrah />} />
          <Route path="/visa" element={<Visa />} />
          <Route path="/gamcaToken" element={<GamcaToken />} />
          <Route path="/services" element={<Services />} />
          <Route path="/protector" element={<Protector />} />
          <Route path="/expense" element={<Expense />} />
          <Route path="/refunded" element={<Refunded />} />
          <Route path='/agent' element={<Agent/>}/>
        </Routes>
      </UserLayout>
    </div>
  );
};

export default UserRoutes;