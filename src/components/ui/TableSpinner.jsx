// TableSpinner.jsx
import React from 'react';

const TableSpinner = () => {
  return (
    <div className="flex items-center justify-center w-full h-64">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-purple-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 font-medium">Loading data...</p>
      </div>
    </div>
  );
};

export default TableSpinner;