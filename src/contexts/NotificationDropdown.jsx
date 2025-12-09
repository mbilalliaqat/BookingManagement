// NotificationDropdown.jsx - Notification UI Component
import React, { useState } from 'react';
import { useNotifications } from './NotificationContext';
import { useNavigate } from 'react-router-dom';

const NotificationDropdown = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearAll,
    refreshNotifications 
  } = useNotifications();
  
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    
    // Navigate to respective module with highlight
    const moduleRoutes = {
      'Ticket': '/tickets',
      'Umrah': '/umrah',
      'Visa Processing': '/visa-processing',
      'GAMCA Token': '/gamca-token'
    };

    const route = moduleRoutes[notification.module];
    if (route) {
      navigate(route, { 
        state: { 
          highlightEntry: notification.reference || notification.moduleId.toString()
        } 
      });
    }
    
    setShowDropdown(false);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short'
    });
  };

  const getModuleIcon = (module) => {
    const icons = {
      'Ticket': 'fa-ticket-alt',
      'Umrah': 'fa-kaaba',
      'Visa Processing': 'fa-passport',
      'GAMCA Token': 'fa-clipboard-check'
    };
    return icons[module] || 'fa-bell';
  };

  const getModuleColor = (module) => {
    const colors = {
      'Ticket': 'bg-blue-500',
      'Umrah': 'bg-green-500',
      'Visa Processing': 'bg-purple-500',
      'GAMCA Token': 'bg-orange-500'
    };
    return colors[module] || 'bg-gray-500';
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative text-black hover:text-indigo-600 transition-colors"
      >
        <i className="fa-solid fa-bell text-xl"></i>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-[998]"
          onClick={() => setShowDropdown(false)}
        />
      )}

      {/* Dropdown Panel */}
      {showDropdown && (
        <div className="fixed right-3 top-16 md:absolute md:right-0 md:top-12 w-[calc(100vw-1.5rem)] md:w-[420px] bg-white border-2 border-indigo-200 rounded-2xl shadow-2xl z-[999] max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-2xl border-b border-indigo-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-slate-800">
                Notifications
              </h3>
              <button
                onClick={refreshNotifications}
                className="text-indigo-600 hover:text-indigo-800 text-sm"
                title="Refresh"
              >
                <i className="fas fa-sync-alt"></i>
              </button>
            </div>
            
            {notifications.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </span>
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={clearAll}
                    className="text-xs text-red-600 hover:text-red-800 font-medium"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mb-3">
                  <i className="fas fa-bell-slash text-4xl text-slate-300"></i>
                </div>
                <p className="text-slate-500 font-medium">No notifications</p>
                <p className="text-xs text-slate-400 mt-1">
                  Payment reminders will appear here
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b border-slate-100 cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`${getModuleColor(notification.module)} w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0`}>
                      <i className={`fas ${getModuleIcon(notification.module)} text-white text-sm`}></i>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-slate-800 text-sm">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></span>
                        )}
                      </div>
                      
                      <p className="text-sm text-slate-600 mb-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-3">
                          <span className="bg-slate-100 px-2 py-0.5 rounded">
                            {notification.module}
                          </span>
                          {notification.reference && (
                            <span>#{notification.reference}</span>
                          )}
                        </div>
                        
                        {notification.amount > 0 && (
                          <span className="font-semibold text-red-600">
                            Rs. {notification.amount}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                        <i className="far fa-calendar text-xs"></i>
                        <span>Due: {formatDate(notification.dueDate)}</span>
                        <span className="mx-1">•</span>
                        <span>{notification.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;