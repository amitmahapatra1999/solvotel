import React from "react";

const Preloader = ({ text }) => {
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
          <div class="loader"></div>
          <span className="mt-4 text-gray-700">{text}</span>
        </div>
      </div>
    </>
  );
};

export default Preloader;
