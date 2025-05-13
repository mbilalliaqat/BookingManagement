

import React from 'react';

const Modal = ({ isOpen, onClose, title, children, actions }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto bg-gray-600 bg-opacity-70">
      <div className="relative w-full max-w-md mx-auto bg-[#161925] rounded-lg shadow-lg">
        <div className="p-6">
          {title && (
            <h3 className="mb-5 text-lg font-medium text-center text-white">
              {title}
            </h3>
          )}
          {children}
          {actions && (
            <div className="flex items-center justify-center space-x-4 mt-6">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;