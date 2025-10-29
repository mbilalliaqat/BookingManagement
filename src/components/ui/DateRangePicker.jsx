import React, { useState, useRef, useEffect } from 'react';
import { Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';

const DateRangePicker = ({ 
  startDate, 
  endDate, 
  onDateChange, 
  placeholder = "Select date range",
  className = "",
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Set current month to start date when it changes
  useEffect(() => {
    if (startDate) {
      setCurrentMonth(new Date(startDate));
    }
  }, [startDate]);

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const isDateInRange = (date) => {
    if (!startDate || !endDate) return false;
    const dateTime = date.getTime();
    const startTime = new Date(startDate).getTime();
    const endTime = new Date(endDate).getTime();
    return dateTime >= startTime && dateTime <= endTime;
  };

  const isDateSelected = (date) => {
    if (!date) return false;
    const dateTime = date.getTime();
    const startTime = startDate ? new Date(startDate).getTime() : null;
    const endTime = endDate ? new Date(endDate).getTime() : null;
    
    return (startTime && dateTime === startTime) || (endTime && dateTime === endTime);
  };

  const isDateHovered = (date) => {
    if (!date || !hoveredDate) return false;
    return date.getTime() === hoveredDate.getTime();
  };

  const handleDateClick = (date) => {
    if (!date) return;

    if (!startDate || (startDate && endDate)) {
      // Start new selection
      onDateChange(date, null);
      setHoveredDate(null);
    } else if (startDate && !endDate) {
      // Complete the selection
      const startTime = new Date(startDate).getTime();
      const clickedTime = date.getTime();
      
      if (clickedTime < startTime) {
        // Clicked date is before start date
        onDateChange(date, startDate);
      } else {
        // Clicked date is after start date
        onDateChange(startDate, date);
      }
      setIsOpen(false);
    }
  };

  const handleDateHover = (date) => {
    if (!date || !startDate || endDate) return;
    setHoveredDate(date);
  };

  const handleDateLeave = () => {
    setHoveredDate(null);
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  const clearDates = () => {
    onDateChange(null, null);
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (startDate && endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    } else if (startDate) {
      return `${formatDate(startDate)} - Select end date`;
    }
    return placeholder;
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Input Field */}
      <div
        className={`
          flex items-center justify-between w-full px-4 py-3 
          bg-white border border-gray-300 rounded-lg shadow-sm
          hover:border-indigo-400 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200
          transition-all duration-200 cursor-pointer
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={`text-sm ${startDate || endDate ? 'text-gray-900' : 'text-gray-500'}`}>
          {getDisplayText()}
        </span>
        <div className="flex items-center space-x-2">
          {(startDate || endDate) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearDates();
              }}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={16} className="text-gray-400" />
            </button>
          )}
          <Calendar size={18} className="text-indigo-500" />
        </div>
      </div>

      {/* Dropdown Calendar */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-[320px]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            
            <h3 className="text-lg font-semibold text-gray-900">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="p-4">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((date, index) => {
                if (!date) {
                  return <div key={index} className="h-8" />;
                }

                const isToday = date.toDateString() === new Date().toDateString();
                const isSelected = isDateSelected(date);
                const inRange = isDateInRange(date);
                const isHovered = isDateHovered(date);
                const isStart = startDate && date.getTime() === new Date(startDate).getTime();
                const isEnd = endDate && date.getTime() === new Date(endDate).getTime();

                return (
                  <button
                    key={index}
                    onClick={() => handleDateClick(date)}
                    onMouseEnter={() => handleDateHover(date)}
                    onMouseLeave={handleDateLeave}
                    className={`
                      h-8 w-8 text-sm rounded-full transition-all duration-200
                      flex items-center justify-center relative
                      ${isSelected 
                        ? 'bg-indigo-600 text-white font-semibold' 
                        : inRange 
                          ? 'bg-indigo-100 text-indigo-700' 
                          : isHovered 
                            ? 'bg-indigo-50 text-indigo-600' 
                            : isToday 
                              ? 'bg-gray-100 text-gray-900 font-medium' 
                              : 'text-gray-700 hover:bg-gray-100'
                      }
                      ${isStart ? 'rounded-l-full' : ''}
                      ${isEnd ? 'rounded-r-full' : ''}
                    `}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={clearDates}
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Clear
            </button>
            <div className="text-xs text-gray-500">
              {startDate && endDate ? `${Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1} days selected` : ''}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
