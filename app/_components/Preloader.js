import React from "react";

const Preloader = ({ text }) => {
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
        <div
          className="   shadow-xl flex flex-col items-center"
          style={{
            background: "#607D8B",
            borderRadius: "50%",
            padding: "2.5em",
          }}
        >
          <div className="loader"></div>
          <span className="mt-4 text-white">Loading</span>
        </div>
      </div>
    </>
  );
};

export default Preloader;
