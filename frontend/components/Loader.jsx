import React from 'react';

const Loader = ({ fullScreen = false, message = 'Loading...' }) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-600 font-medium">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-75">
        {content}
      </div>
    );
  }

  return (
    <div className="flex w-full h-full items-center justify-center min-h-[300px]">
      {content}
    </div>
  );
};

export default Loader;
