import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Tooltip, ResponsiveContainer, LabelList
} from 'recharts';
import { Calendar as CalendarIcon, RotateCcw } from 'lucide-react'; 
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import TableSpinner from '../ui/TableSpinner'; 

// Premium, high-contrast color palette
const BAR_CHART_COLORS = {
  Ticket: '#1e40af',    // Deep Blue
  Umrah: '#059669',     // Dark Green
  Visa: '#dc2626',      // Bright Red
  Gamca: '#fb923c',     // Orange
  NAVTCC: '#8b5cf6',    // Purple
  Services: '#14b8a6',   // Turquoise
  Vendor: '#4b5563',    // Slate Gray
  Banks: '#285d1b',     // Fresh Green
};

// Function to render the custom tooltip for the chart
const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const totalCount = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);

    return (
      <div className="p-3 bg-white border border-indigo-200 rounded-xl shadow-2xl text-xs font-inter space-y-1 transition-all duration-150">
        <p className="font-bold text-gray-900 border-b pb-1 mb-1">{label}</p>
        {payload.filter(entry => entry.value > 0).map((entry, index) => (
          <div key={`item-${index}`} className="flex justify-between items-center space-x-4">
            <span style={{ color: entry.color }} className="font-medium">{entry.name}:</span>
            <span className="font-bold text-gray-800">{entry.value.toLocaleString()}</span>
          </div>
        ))}
        <div className="pt-1 border-t border-gray-200 mt-1 flex justify-between font-bold text-sm text-indigo-600">
            <span>TOTAL:</span>
            <span>{totalCount.toLocaleString()}</span>
        </div>
      </div>
    );
  }
  return null;
};

const MonthlyBookingsChart = ({ 
  isLoading, 
  monthlySummaryData, 
  currentMonthName, 
  selectedMonth, 
  selectedMonthEnd, // Added missing prop
  setSelectedMonth, 
  setSelectedMonthEnd 
}) => {
  const [isCalendarOpen, setCalendarOpen] = React.useState(false);
  const [range, setRange] = React.useState({ from: selectedMonth, to: selectedMonthEnd });

  React.useEffect(() => {
    setRange({ from: selectedMonth, to: selectedMonthEnd });
  }, [selectedMonth, selectedMonthEnd]);

  const showPartialData = !isLoading && monthlySummaryData.length > 0;

  // Create a complete dataset with all days 1-31
  const completeMonthData = useMemo(() => {
    // Create array with all 31 days initialized with 0 values for each category
    const allDays = Array.from({ length: 31 }, (_, i) => {
      const day = i + 1;
      return { 
        date: day.toString(),
        Ticket: 0,
        Umrah: 0,
        Visa: 0,
        Gamca: 0,
        NAVTCC: 0,
        Services: 0,
        Vendor: 0,
        Banks: 0
      };
    });

    // Merge with actual data
    monthlySummaryData.forEach(item => {
      // Handle different date formats - extract day number
      let dayNum;
      
      if (typeof item.date === 'number') {
        dayNum = item.date;
      } else if (typeof item.date === 'string') {
        // Try to parse the date string
        // Could be "12", "12/12/2025", "2025-12-12", etc.
        const parsed = parseInt(item.date);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 31) {
          dayNum = parsed;
        } else {
          // Try to extract day from date string
          const dateMatch = item.date.match(/\b(\d{1,2})\b/);
          if (dateMatch) {
            dayNum = parseInt(dateMatch[1]);
          }
        }
      }
      
      if (dayNum >= 1 && dayNum <= 31) {
        allDays[dayNum - 1] = { 
          date: dayNum.toString(),
          Ticket: item.Ticket || 0,
          Umrah: item.Umrah || 0,
          Visa: item.Visa || 0,
          Gamca: item.Gamca || 0,
          NAVTCC: item.NAVTCC || 0,
          Services: item.Services || 0,
          Vendor: item.Vendor || 0,
          Banks: item.Banks || 0
        };
      }
    });

    return allDays;
  }, [monthlySummaryData]);

  // Calculate the total number of bookings for the entire month
  const totalMonthlyBookings = useMemo(() => {
    return monthlySummaryData.reduce((monthlySum, dailyData) => {
      const dailyTotal = Object.keys(dailyData)
        .filter(k => k !== 'date' && k !== 'Total')
        .reduce((sum, key) => sum + (dailyData[key] || 0), 0);
      return monthlySum + dailyTotal;
    }, 0);
  }, [monthlySummaryData]);

  // Adjust Y-axis scale for clean look
  const maxCount = monthlySummaryData.reduce((max, item) => {
    const dailyTotal = Object.keys(item).filter(k => k !== 'date').reduce((sum, key) => sum + (item[key] || 0), 0);
    return Math.max(max, dailyTotal);
  }, 0);
  const domainMax = maxCount > 0 ? maxCount + Math.ceil(maxCount * 0.15) : 10; // 15% buffer

  return (
    <div className="bg-white p-4 rounded-xl shadow-lg border border-indigo-100 transition-shadow duration-300 hover:shadow-2xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b pb-2">
        
        {/* Contextual Header with Total Bookings */}
        <div>
          <h2 className="font-bold text-lg text-indigo-700 font-inter leading-tight">
             {totalMonthlyBookings.toLocaleString()}
          </h2>
          <p className="text-xs text-gray-500">Total Bookings in {currentMonthName}</p>
        </div>
        
        {/* Professional Date Picker and Reset Button Group */}
        <div className='flex space-x-2 items-center mt-2 sm:mt-0'>
          <div className="relative">
            <button 
              onClick={() => setCalendarOpen(!isCalendarOpen)}
              className="px-3 py-1.5 text-xs border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-150 flex items-center"
            >
              <CalendarIcon size={16} className="text-indigo-600 mr-2" />
              {range?.from ? (
                <>
                  {format(range.from, 'dd/MM/yyyy')}
                  {range.to ? ` - ${format(range.to, 'dd/MM/yyyy')}` : ''}
                </>
              ) : (
                <span>Select a date range</span>
              )}
            </button>
            {isCalendarOpen && (
              <div className="absolute z-10 top-full right-0 mt-2 bg-white border rounded-lg shadow-lg">
                <DayPicker
                  mode="range"
                  selected={range}
                  onSelect={(selectedRange) => {
                    setRange(selectedRange);
                    if (selectedRange?.from) {
                      setSelectedMonth(selectedRange.from);
                      setSelectedMonthEnd(selectedRange.to || selectedRange.from);
                    } else {
                      setSelectedMonth(undefined);
                      setSelectedMonthEnd(undefined);
                    }
                    if (selectedRange?.from && selectedRange?.to) {
                      setCalendarOpen(false);
                    }
                  }}
                  initialFocus
                  captionLayout="dropdown-buttons"
                  fromYear={2020}
                  toYear={new Date().getFullYear()}
                />
              </div>
            )}
          </div>
          <button 
            onClick={() => { 
              setSelectedMonth(new Date()); 
              setSelectedMonthEnd(new Date()); 
            }} 
            className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors" 
            title="Reset to Current Month"
          > 
            <RotateCcw size={14} /> 
          </button>
        </div>
      </div>
      
      {isLoading && !showPartialData ? (
        <div className="flex justify-center items-center h-[240px]">
          <TableSpinner />
        </div>
      ) : monthlySummaryData.length > 0 ? (
        <div style={{ width: '100%', height: 240 }}> {/* Optimal height */}
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={completeMonthData} 
              margin={{ top: 20, right: 10, left: 10, bottom: 5 }} 
              barGap={2} 
              barCategoryGap="20%"
               barSize={80}
            >
              {/* Extreme Minimalist Grid: Only faint horizontal lines */}
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} /> 
              
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 'bold' }} // Show day numbers clearly
                axisLine={false} 
                tickLine={false} 
                height={30} // Provide space for labels
              />
              
              <YAxis 
                tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 'bold' }} // Show Y-axis numbers
                axisLine={false} // Removed Y-axis line
                tickLine={false} // Removed Y-axis tick marks
                domain={[0, domainMax]}
                width={40} // Give space for numbers
              />
              
              <Tooltip content={<CustomChartTooltip />} />
              
              {/* Clean Horizontal Legend at the bottom */}
              <Legend 
                wrapperStyle={{ paddingTop: '15px' }} 
                iconType="rect" 
                iconSize={8} 
                formatter={(value) => <span style={{ color: '#4b5563', fontSize: '9px', fontWeight: 500 }}>{value}</span>}
                layout="horizontal" 
                align="center" 
                verticalAlign="bottom" 
              />
              
              {/* Bars - Grouped */}
              <Bar dataKey="Ticket" fill={BAR_CHART_COLORS.Ticket} radius={[4, 4, 0, 0]}>
                <LabelList dataKey="Ticket" position="top" style={{ fontSize: '20px',fontWeight: 'bold', fill: '#1e40af' }} formatter={(value) => value > 0 ? value : ''} />
              </Bar>
              <Bar dataKey="Umrah" fill={BAR_CHART_COLORS.Umrah} radius={[4, 4, 0, 0]}>
                <LabelList dataKey="Umrah" position="top" style={{ fontSize: '20px',fontWeight: 'bold', fill: '#059669' }} formatter={(value) => value > 0 ? value : ''} />
              </Bar>
              <Bar dataKey="Visa" fill={BAR_CHART_COLORS.Visa} radius={[4, 4, 0, 0]}>
                <LabelList dataKey="Visa" position="top" style={{ fontSize: '20px',fontWeight: 'bold', fill: '#dc2626' }} formatter={(value) => value > 0 ? value : ''} />
              </Bar>
              <Bar dataKey="Gamca" fill={BAR_CHART_COLORS.Gamca} radius={[4, 4, 0, 0]}>
                <LabelList dataKey="Gamca" position="top" style={{fontSize: '20px',fontWeight: 'bold', fill: '#fb923c' }} formatter={(value) => value > 0 ? value : ''} />
              </Bar>
              <Bar dataKey="NAVTCC" fill={BAR_CHART_COLORS.NAVTCC} radius={[4, 4, 0, 0]}>
                <LabelList dataKey="NAVTCC" position="top" style={{ fontSize: '20px',fontWeight: 'bold', fill: '#8b5cf6' }} formatter={(value) => value > 0 ? value : ''} />
              </Bar>
              <Bar dataKey="Services" fill={BAR_CHART_COLORS.Services} radius={[4, 4, 0, 0]}>
                <LabelList dataKey="Services" position="top" style={{ fontSize: '20px',fontWeight: 'bold', fill: '#14b8a6' }} formatter={(value) => value > 0 ? value : ''} />
              </Bar>
              <Bar dataKey="Vendor" fill={BAR_CHART_COLORS.Vendor} radius={[4, 4, 0, 0]}>
                <LabelList dataKey="Vendor" position="top" style={{ fontSize: '20px',fontWeight: 'bold', fill: '#4b5563' }} formatter={(value) => value > 0 ? value : ''} />
              </Bar>
              <Bar dataKey="Banks" fill={BAR_CHART_COLORS.Banks} radius={[4, 4, 0, 0]}>
                <LabelList dataKey="Banks" position="top" style={{ fontSize: '20px',fontWeight: 'bold', fill: '#285d1b' }} formatter={(value) => value > 0 ? value : ''} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-center text-sm text-gray-500 p-4 h-[240px] flex items-center justify-center">
          No daily transaction data available for {currentMonthName}.
        </div>
      )}
    </div>
  );
};

export default MonthlyBookingsChart;