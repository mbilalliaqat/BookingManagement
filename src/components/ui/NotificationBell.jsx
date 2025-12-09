// NotificationSystem.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// ============= NOTIFICATION HOOK =============
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;

  const checkRemainingDates = async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      // Fetch all data
      const [ticketsRes, umrahRes, visaRes, gamcaRes, navtccRes, servicesRes] = await Promise.all([
        axios.get(`${BASE_URL}/ticket`),
        axios.get(`${BASE_URL}/umrah`),
        axios.get(`${BASE_URL}/visa-processing`),
        axios.get(`${BASE_URL}/gamca-token`),
        axios.get(`${BASE_URL}/navtcc`),
        axios.get(`${BASE_URL}/services`)
      ]);

      const allNotifications = [];

      // Process Tickets
      const tickets = ticketsRes.data.ticket || [];
      tickets.forEach(ticket => {
        if (ticket.remaining_date && ticket.remaining_amount && ticket.remaining_amount > 0) {
          const remainingDate = new Date(ticket.remaining_date);
          remainingDate.setHours(0, 0, 0, 0);
          
          if (remainingDate.getTime() === tomorrow.getTime()) {
            let passengerName = 'Unknown';
            try {
              let parsedDetails = [];
              if (typeof ticket.passport_detail === 'string') {
                parsedDetails = JSON.parse(ticket.passport_detail);
              } else if (Array.isArray(ticket.passport_detail)) {
                parsedDetails = ticket.passport_detail;
              }
              if (parsedDetails.length > 0) {
                const first = parsedDetails[0];
                passengerName = `${first.title || ''} ${first.firstName || ''} ${first.lastName || ''}`.trim();
              }
            } catch (e) {
              passengerName = ticket.customer_add || 'Unknown';
            }

            allNotifications.push({
              id: `ticket-${ticket.id}`,
              type: 'ticket',
              module: 'Tickets',
              title: 'Ticket Payment Reminder',
              message: `Payment due tomorrow for ${passengerName}`,
              amount: ticket.remaining_amount,
              reference: ticket.reference,
              entry: ticket.entry,
              date: ticket.remaining_date,
              read: false
            });
          }
        }
      });

      // Process Umrah
      const umrahBookings = umrahRes.data.umrahBookings || [];
      umrahBookings.forEach(umrah => {
        if (umrah.remaining_date && umrah.remainingAmount && umrah.remainingAmount > 0) {
          const remainingDate = new Date(umrah.remaining_date);
          remainingDate.setHours(0, 0, 0, 0);
          
          if (remainingDate.getTime() === tomorrow.getTime()) {
            allNotifications.push({
              id: `umrah-${umrah.id}`,
              type: 'umrah',
              module: 'Umrah',
              title: 'Umrah Payment Reminder',
              message: `Payment due tomorrow for ${umrah.customerAdd || 'Unknown'}`,
              amount: umrah.remainingAmount,
              reference: umrah.reference,
              entry: umrah.entry,
              date: umrah.remaining_date,
              read: false
            });
          }
        }
      });

      // Process Visa
      const visaProcessing = visaRes.data.visa_processing || [];
      visaProcessing.forEach(visa => {
        if (visa.remaining_date && visa.remaining_amount && visa.remaining_amount > 0) {
          const remainingDate = new Date(visa.remaining_date);
          remainingDate.setHours(0, 0, 0, 0);
          
          if (remainingDate.getTime() === tomorrow.getTime()) {
            let passengerName = 'Unknown';
            try {
              const details = typeof visa.passport_detail === 'string' 
                ? JSON.parse(visa.passport_detail) 
                : visa.passport_detail;
              passengerName = `${details.firstName || ''} ${details.lastName || ''}`.trim();
            } catch (e) {
              passengerName = visa.customer_add || 'Unknown';
            }

            allNotifications.push({
              id: `visa-${visa.id}`,
              type: 'visa',
              module: 'Visa Processing',
              title: 'Visa Payment Reminder',
              message: `Payment due tomorrow for ${passengerName}`,
              amount: visa.remaining_amount,
              reference: visa.reference,
              entry: visa.entry,
              date: visa.remaining_date,
              read: false
            });
          }
        }
      });

      // Process GAMCA Token
      const gamcaTokens = gamcaRes.data.gamcaTokens || [];
      gamcaTokens.forEach(token => {
        if (token.remaining_date && token.remaining_amount && token.remaining_amount > 0) {
          const remainingDate = new Date(token.remaining_date);
          remainingDate.setHours(0, 0, 0, 0);
          
          if (remainingDate.getTime() === tomorrow.getTime()) {
            let passengerName = 'Unknown';
            try {
              const details = typeof token.passport_detail === 'string' 
                ? JSON.parse(token.passport_detail) 
                : token.passport_detail;
              passengerName = `${details.firstName || ''} ${details.lastName || ''}`.trim();
            } catch (e) {
              passengerName = token.customer_add || 'Unknown';
            }

            allNotifications.push({
              id: `gamca-${token.id}`,
              type: 'gamca',
              module: 'GAMCA Token',
              title: 'GAMCA Token Payment Reminder',
              message: `Payment due tomorrow for ${passengerName}`,
              amount: token.remaining_amount,
              reference: token.reference,
              entry: token.entry,
              date: token.remaining_date,
              read: false
            });
          }
        }
      });

      // Process Navtcc
      const navtccData = navtccRes.data.navtcc || [];
      navtccData.forEach(navtcc => {
        if (navtcc.remaining_date && navtcc.remaining_amount && navtcc.remaining_amount > 0) {
          const remainingDate = new Date(navtcc.remaining_date);
          remainingDate.setHours(0, 0, 0, 0);
          
          if (remainingDate.getTime() === tomorrow.getTime()) {
            let passengerName = 'Unknown';
            try {
              const details = typeof navtcc.passport_detail === 'string' 
                ? JSON.parse(navtcc.passport_detail) 
                : navtcc.passport_detail;
              passengerName = `${details.firstName || ''} ${details.lastName || ''}`.trim();
            } catch (e) {
              passengerName = navtcc.customer_add || 'Unknown';
            }

            allNotifications.push({
              id: `navtcc-${navtcc.id}`,
              type: 'navtcc',
              module: 'Navtcc',
              title: 'Navtcc Payment Reminder',
              message: `Payment due tomorrow for ${passengerName}`,
              amount: navtcc.remaining_amount,
              reference: navtcc.reference,
              entry: navtcc.entry,
              date: navtcc.remaining_date,
              read: false
            });
          }
        }
      });

      // Process Services
      const servicesData = servicesRes.data.services || [];
      servicesData.forEach(service => {
        if (service.remaining_date && service.remaining_amount && service.remaining_amount > 0) {
          const remainingDate = new Date(service.remaining_date);
          remainingDate.setHours(0, 0, 0, 0);
          
          if (remainingDate.getTime() === tomorrow.getTime()) {
            allNotifications.push({
              id: `service-${service.id}`,
              type: 'service',
              module: 'Services',
              title: 'Service Payment Reminder',
              message: `Payment due tomorrow for ${service.name || service.customer_add || 'Unknown'}`,
              amount: service.remaining_amount,
              reference: service.specific_detail || service.visa_type,
              entry: service.entry,
              date: service.remaining_date,
              read: false
            });
          }
        }
      });

      setNotifications(allNotifications);
      setUnreadCount(allNotifications.length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    checkRemainingDates();
    const interval = setInterval(checkRemainingDates, 3600000); // Check every hour
    return () => clearInterval(interval);
  }, []);

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return { notifications, unreadCount, markAsRead, clearAll };
};

// ============= NOTIFICATION BELL COMPONENT =============
export const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, clearAll } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    setShowDropdown(false);
    
    // Navigate based on type
    const routes = {
      ticket: '/admin/tickets',
      umrah: '/admin/umrah',
      visa: '/admin/visa',
      gamca: '/admin/gamca-token',
      navtcc: '/admin/navtcc',
      service: '/admin/services'
    };
    
    const route = routes[notification.type];
    if (route) {
      navigate(route, {
        state: { highlightEntry: notification.entry }
      });
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative text-black"
      >
        <i className="fa-solid fa-bell text-lg"></i>
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-[998]"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border-2 border-indigo-100 z-[999] max-h-96 overflow-hidden flex flex-col">
            <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800">Notifications</h3>
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <i className="fas fa-bell-slash text-3xl mb-2 text-slate-300"></i>
                  <div className="text-sm">No notifications</div>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3 border-b border-slate-100 cursor-pointer hover:bg-indigo-50 transition-colors ${
                      !notif.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-exclamation text-red-600 text-sm"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                            {notif.module}
                          </span>
                        </div>
                        <div className="font-semibold text-sm text-slate-800">
                          {notif.title}
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          {notif.message}
                        </div>
                        <div className="flex gap-2 mt-2 text-xs text-slate-500">
                          {notif.entry && (
                            <span className="px-2 py-0.5 bg-slate-100 rounded">
                              Entry: {notif.entry}
                            </span>
                          )}
                          {notif.reference && (
                            <span className="px-2 py-0.5 bg-slate-100 rounded">
                              Ref: {notif.reference}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-red-600 font-semibold mt-1">
                          Amount: {notif.amount}
                        </div>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1"></div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;