import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser } = useOutletContext();

  const SERVER_URL = import.meta.env.MODE === 'production'
    ? 'https://group-08-project-csce3444-fa25.onrender.com'
    : 'http://localhost:3000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const url = isLogin ? `${SERVER_URL}/api/login` : `${SERVER_URL}/api/register`;
    const payload = isLogin ? { email, password } : { name, email, username, password };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'An error occurred.');
      }

      setUser(data.user);
      navigate('/menu');

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="w-full h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold mb-8">Galactic Typer</h1>
      <div className="bg-gray-800/50 backdrop-blur border border-cyan-500/30 rounded-lg p-8 w-full max-w-sm">
        <h2 className="text-3xl font-bold mb-6 text-center">{isLogin ? 'Login' : 'Register'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4">
            {!isLogin && (
              <>
                <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required className="bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required className="bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </>
            )}
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            
            <button type="submit" className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xl w-full py-3 rounded-lg mt-4 transition-all">
              {isLogin ? 'Login' : 'Create Account'}
            </button>
          </div>
        </form>
        <p className="text-center mt-4">
          <button onClick={() => setIsLogin(!isLogin)} className="text-cyan-300 hover:text-cyan-100">
            {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;