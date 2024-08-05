import React from "react";
import logo from "../assets/logo.png"; // Replace with your logo

const LandingPage = () => {

  return (
    <div className="flex flex-col h-screen items-center justify-center bg-gray-100 p-6">
      <div className="text-center mb-8">
        <img src={logo} alt="Logo" className="w-32 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Welcome to DexKor</h1>
        <p className="text-lg text-gray-600">Your smart assistant is here to help you.</p>
      </div>
    </div>
  );
};

export default LandingPage;
