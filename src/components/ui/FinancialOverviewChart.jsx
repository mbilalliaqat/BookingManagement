import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import TableSpinner from '../ui/TableSpinner'; // Assuming this path is correct

const PIE_CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']; 

// Function to render the custom tooltip for the pie chart
const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 bg-white border border-gray-300 rounded-lg shadow-xl text-xs font-inter">
        <p className="font-semibold text-gray-800">{data.name}</p>
        <p className="text-gray-600">Amount: {data.value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

const FinancialOverviewChart = ({ isLoading, financialOverviewData }) => {
  const showPartialData = !isLoading && financialOverviewData.length > 0;
  const totalValue = financialOverviewData.reduce((sum, entry) => sum + entry.value, 0);

  // Custom label function for outside positioning
  const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent, index }) => {
    // Positioning logic to put the label slightly outside the chart
    const radius = outerRadius * 1.1; 
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="#4b5563" // Dark gray for readability
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central" 
        style={{ fontSize: '10px', fontWeight: 600 }}
      >
        {/* Only display label if percent is visible */}
        {percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''} 
      </text>
    );
  };
  
  return (
    <div className="bg-white p-3 rounded-xl shadow-lg border border-indigo-100 transition-shadow duration-300 hover:shadow-2xl">
      <h2 className="font-bold text-sm text-black font-inter mb-4 border-b pb-2">📊 Financial Overview</h2>
      
      {isLoading && !showPartialData ? (
        <div className="flex justify-center items-center h-[200px]">
          <TableSpinner />
        </div>
      ) : financialOverviewData.length > 0 ? (
        <div style={{ width: '100%', height: 200 }}> {/* DECREASED HEIGHT */}
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={financialOverviewData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50} // DECREASED RADIUS
                outerRadius={75} // DECREASED RADIUS
                paddingAngle={3} 
                fill="#8884d8"
                labelLine={false}
                label={renderCustomizedLabel} // Using external label function
              >
                {financialOverviewData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} 
                    strokeWidth={1} 
                    stroke="#ffffff"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
              <Legend 
                wrapperStyle={{ paddingLeft: '15px' }} 
                iconType="circle" 
                iconSize={8}
                layout="vertical"
                verticalAlign="middle"
                align="right"
                formatter={(value, entry) => {
                    const percentage = totalValue > 0 ? ((entry.payload.value / totalValue) * 100).toFixed(0) : 0;
                    return (
                        <div style={{ color: '#374151', fontSize: '10px', fontWeight: 500, lineHeight: '1.4' }}>
                            <span className="font-bold">{`${entry.payload.name}`}</span> 
                            <br />
                            <span className="text-gray-500 font-medium text-[9px]">{`(${entry.payload.value.toLocaleString()} | ${percentage}%)`}</span>
                        </div>
                    );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-center text-sm text-gray-500 p-4 h-[200px] flex items-center justify-center">
          No financial data available for this range.
        </div>
      )}
    </div>
  );
};

export default FinancialOverviewChart;