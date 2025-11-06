import React from 'react';

const Login = () => {

  return (
    <div className="w-full h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold mb-8">Galactic Typer</h1>
      <div className="bg-gray-800/50 backdrop-blur border border-cyan-500/30 rounded-lg p-8">
        <h2 className="text-3xl font-bold mb-6 text-center">Login</h2>
        <div className="flex flex-col gap-4">
          <input 
            type="text" 
            placeholder="Username" 
            className="bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button 
            className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xl px-12 py-3 rounded-lg mt-4">
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;