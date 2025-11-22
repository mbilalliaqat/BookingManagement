import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Calendar, RotateCcw } from 'lucide-react'; 
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
  Banks: '#34d399',     // Fresh Green
};

// Function to render the custom tooltip for the bar chart
const CustomBarTooltip = ({ active, payload, label }) => {
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
  setSelectedMonth, 
  setSelectedMonthEnd 
}) => {
  const showPartialData = !isLoading && monthlySummaryData.length > 0;

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
          <Calendar size={16} className="text-indigo-600" />
          <input 
            type="month" 
            value={`${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`} 
            onChange={(e) => {
              const [year, month] = e.target.value.split('-').map(Number);
              const newStartDate = new Date(year, month - 1, 1);
              const newEndDate = new Date(year, month, 0);
              setSelectedMonth(newStartDate);
              setSelectedMonthEnd(newEndDate);
            }}
            className="px-2 py-1 text-xs border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-150"
          />
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
              data={monthlySummaryData} 
              margin={{ top: 10, right: 10, left: 0, bottom: 5 }} 
              barGap={2} 
              barCategoryGap="10%" 
            >
              {/* Extreme Minimalist Grid: Only faint horizontal lines */}
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} /> 
              
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#6b7280', fontSize: 8.5, angle: -45, textAnchor: 'end' }} // Rotated and smaller for better density
                axisLine={false} 
                tickLine={false} 
                height={40} // Provide space for rotated labels
              />
              
              <YAxis 
                tick={false} // Removed Y-axis ticks for cleaner look
                axisLine={false} // Removed Y-axis line
                tickLine={false} // Removed Y-axis tick marks
                domain={[0, domainMax]} 
              />
              
              <Tooltip content={<CustomBarTooltip />} />
              
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
              
              {/* Bars - Rounded top corners for modern aesthetics */}
              <Bar dataKey="Ticket" stackId="a" fill={BAR_CHART_COLORS.Ticket} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Umrah" stackId="a" fill={BAR_CHART_COLORS.Umrah} />
              <Bar dataKey="Visa" stackId="a" fill={BAR_CHART_COLORS.Visa} />
              <Bar dataKey="Gamca" stackId="a" fill={BAR_CHART_COLORS.Gamca} />
              <Bar dataKey="NAVTCC" stackId="a" fill={BAR_CHART_COLORS.NAVTCC} />
              <Bar dataKey="Services" stackId="a" fill={BAR_CHART_COLORS.Services} />
              <Bar dataKey="Vendor" stackId="a" fill={BAR_CHART_COLORS.Vendor} />
              <Bar dataKey="Banks" stackId="a" fill={BAR_CHART_COLORS.Banks} />
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