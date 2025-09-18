

import React from 'react';

const Modal = ({ isOpen, onClose, title, children, actions, width }) => {
  if (!isOpen) return null;

  // Determine the width class based on the prop
  const widthClass = width ? `max-w-${width}` : 'max-w-md';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto bg-gray-600 bg-opacity-70">
      <div className={`relative w-full ${widthClass} mx-auto bg-[#161925] rounded-lg shadow-lg`}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white z-10"
          aria-label="Close"
        >
          <i className="fas fa-times text-xl"></i>
        </button>
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