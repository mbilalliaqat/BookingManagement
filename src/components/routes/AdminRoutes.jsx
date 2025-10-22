import React from 'react'
import AdminLayout from '../layouts/AdminLayout'
import { Route, Routes } from 'react-router-dom'
import Dashboard from '../admin/dashboard/Dashboard'
import Tickets from '../user/tickets/Tickets'
import Services from '../user/services/Services'
import OfficeAccounts from '../admin/officeAcount/OfficeAccounts'
import Umrah from '../user/umrah/Umrah'
import Visa from '../user/visa/Visa'
import GamcaToken from '../user/gamcaToken/GamcaToken'
import Protector from '../user/protector/Protector'
import Expense from '../user/expense/Expense'
import Refunded from '../user/refundedCaseMCB/Refunded'
import Vender from '../admin/vendor/Vender'
import Employee from '../admin/employee/Employee'
import Agent from '../user/agent/Agent'
import RefundCustomer from '../user/refundCustomer/RefundCustomer'
import Navtcc from '../user/navtcc/Navtcc'
import RemainingPay from '../user/paymentHistory/RemainingPay'
import RemainingAmounts from '../user/paymentHistory/RemainingAmounts'
import Profit from '../user/paymentHistory/Profit'



const AdminRoutes = () => {
  return (
    <div>
        <AdminLayout>
          <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/umrah" element={<Umrah />} />
          <Route path="/visa" element={<Visa />} />
          <Route path="/gamcaToken" element={<GamcaToken />} />
          <Route path="/navtcc" element={<Navtcc />} />
          <Route path="/services" element={<Services />} />
          <Route path="/protector" element={<Protector />} />
          <Route path="/expense" element={<Expense />} />
          <Route path="/refunded" element={<Refunded />} />
          <Route path="/refundCustomer" element={<RefundCustomer />} />
          <Route path="/officeAccount" element={<OfficeAccounts />} />
          <Route path="/vender" element={<Vender />} />
          <Route path="/employee" element={<Employee />} />
          <Route path="/agent" element={<Agent />} />
            <Route path="/remainingPay" element={<RemainingPay />} />
            <Route path="/remaining-amounts" element={<RemainingAmounts />} />
            <Route path="/profit" element={<Profit />} />


          </Routes>
        </AdminLayout>
    </div>
  )
}

export default AdminRoutes