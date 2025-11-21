import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();

  // --- TEMPORARY BYPASS FOR DEVELOPMENT ---
  // This useEffect hook automatically "logs in" a user and redirects to the menu.
  // This allows testing other parts of the app without needing a working login.
  // REMEMBER TO REMOVE OR COMMENT THIS OUT before merging your feature.
  useEffect(() => {
    // We'll generate a random username to make testing with two windows easier.
    const testUsername = `TestPlayer_${Math.floor(Math.random() * 1000)}`;
    console.log(`Bypassing login. Setting username to: ${testUsername}`);
    localStorage.setItem('username', testUsername);
    navigate('/menu');
  }, [navigate]);

  // The original login form is not rendered while the bypass is active.
  // You can restore the original code here when you're done testing.
  return (
    <div className="w-full h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold mb-8">Galactic Typer</h1>
      <p className="text-xl animate-pulse">Bypassing login for development...</p>
    </div>
  );

  /*
  // --- ORIGINAL LOGIN CODE ---
  // To restore, delete the temporary bypass code above and uncomment this block.

  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if the user is already logged in via a session
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth/status');
        const data = await response.json();
        if (data.loggedIn) {
          localStorage.setItem('username', data.user.username);
          navigate('/menu');
        }
      } catch (err) {
        console.error("Could not check auth status", err);
      }
    };

    checkAuthStatus();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Username is required.');
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to log in.');
      }

      localStorage.setItem('username', data.username);
      navigate("/menu");

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="w-full h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold mb-8">Galactic Typer</h1>
      <div className="bg-gray-800/50 backdrop-blur border border-cyan-500/30 rounded-lg p-8 w-full max-w-sm">
        <h2 className="text-3xl font-bold mb-6 text-center">Login or Sign Up</h2>
        <form onSubmit={handleLogin}>
          <div className="flex flex-col gap-4">
            <input 
              type="text" 
              placeholder="Enter your username" 
              aria-label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button 
              type="submit"
              className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xl w-full py-3 rounded-lg mt-4">
              Continue
            </button>
          </div>
        </form>
        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-gray-600"></div>
          <span className="flex-shrink mx-4 text-gray-400">OR</span>
          <div className="flex-grow border-t border-gray-600"></div>
        </div>
        <a 
          href="/auth/google"
          className="bg-red-600 hover:bg-red-500 text-white font-bold text-xl w-full py-3 rounded-lg mt-2 flex items-center justify-center gap-2">
          <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s[...]
          Sign in with Google
        </a>
      </div>
    </div>
  );
  */
};

export default Login;