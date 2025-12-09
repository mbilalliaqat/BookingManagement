// useNotifications.js - Simple Custom Hook
import { useState, useEffect } from 'react';
import axios from 'axios';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const BASE_URL = import.meta.env.VITE_LIVE_API_BASE_URL;

  const isTomorrow = (dateString) => {
    if (!dateString) return false;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const checkDate = new Date(dateString);
    checkDate.setHours(0, 0, 0, 0);
    
    return checkDate.getTime() === tomorrow.getTime();
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/ticket`);
      const tickets = response.data.ticket || [];
      
      const dueTomorrow = tickets.filter(ticket => 
        isTomorrow(ticket.remaining_date) && parseFloat(ticket.remaining_amount) > 0
      );
      
      setNotifications(dueTomorrow);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 3600000); // 1 hour
    return () => clearInterval(interval);
  }, []);

  return { notifications, count: notifications.length, refresh: fetchNotifications };
};