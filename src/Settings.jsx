import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Settings = () => {
  const [settings, setSettings] = useState({
    soundEnabled: true,
    musicVolume: 70,
    sfxVolume: 50,
    difficulty: 'normal',
    theme: 'dark',
    textSize: 'medium',
    showParticles: true,
    autoRetry: false,
    vibration: true,
    notifications: true,
    language: 'en'
  });

  const [success, setSuccess] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Apply theme to document
  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  const applyTheme = (theme) => {
    const root = document.documentElement;
    
    switch(theme) {
      case 'light':
        root.style.setProperty('--bg-primary', '#f5f5f5');
        root.style.setProperty('--bg-secondary', '#ffffff');
        root.style.setProperty('--bg-tertiary', '#e0e0e0');
        root.style.setProperty('--text-primary', '#000000');
        root.style.setProperty('--text-secondary', '#333333');
        root.style.setProperty('--accent', '#0066cc');
        document.body.style.backgroundColor = '#f5f5f5';
        document.body.style.color = '#000000';
        break;
      
      case 'neon':
        root.style.setProperty('--bg-primary', '#0a0e27');
        root.style.setProperty('--bg-secondary', '#1a1f3a');
        root.style.setProperty('--bg-tertiary', '#2d3561');
        root.style.setProperty('--text-primary', '#00ff88');
        root.style.setProperty('--text-secondary', '#00ffff');
        root.style.setProperty('--accent', '#ff00ff');
        document.body.style.backgroundColor = '#0a0e27';
        document.body.style.color = '#00ff88';
        break;
      
      default: // dark
        root.style.setProperty('--bg-primary', '#111827');
        root.style.setProperty('--bg-secondary', '#1f2937');
        root.style.setProperty('--bg-tertiary', '#374151');
        root.style.setProperty('--text-primary', '#ffffff');
        root.style.setProperty('--text-secondary', '#d1d5db');
        root.style.setProperty('--accent', '#06b6d4');
        document.body.style.backgroundColor = '#111827';
        document.body.style.color = '#ffffff';
        break;
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setIsDirty(true);
  };

  const saveSettings = () => {
    localStorage.setItem('gameSettings', JSON.stringify(settings));
    setSuccess('✓ Settings saved successfully!');
    setIsDirty(false);
    setTimeout(() => setSuccess(''), 3000);
  };

  const resetSettings = () => {
    const defaultSettings = {
      soundEnabled: true,
      musicVolume: 70,
      sfxVolume: 50,
      difficulty: 'normal',
      theme: 'dark',
      textSize: 'medium',
      showParticles: true,
      autoRetry: false,
      vibration: true,
      notifications: true,
      language: 'en'
    };
    setSettings(defaultSettings);
    localStorage.setItem('gameSettings', JSON.stringify(defaultSettings));
    setSuccess('✓ Settings reset to default!');
    setIsDirty(false);
    setTimeout(() => setSuccess(''), 3000);
  };

  const SettingItem = ({ label, description, children }) => (
    <div className={`${themeClasses.card} p-4 rounded-lg mb-4 border transition-colors duration-300`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold">{label}</h3>
          <p className="text-sm opacity-60">{description}</p>
        </div>
        <div className="ml-4">
          {children}
        </div>
      </div>
    </div>
  );

  const username = localStorage.getItem('username') || 'Player';

  // Determine theme-specific classes
  const getThemeClasses = () => {
    switch(settings.theme) {
      case 'light':
        return {
          container: 'bg-gray-100 text-gray-900',
          card: 'bg-white text-gray-900 border-gray-300',
          button: 'bg-blue-500 hover:bg-blue-600',
          header: 'bg-gradient-to-r from-blue-400 to-blue-600',
          accent: 'text-blue-600'
        };
      case 'neon':
        return {
          container: 'bg-gray-950 text-lime-400',
          card: 'bg-gray-900 text-lime-400 border-lime-500',
          button: 'bg-lime-500 hover:bg-lime-400 text-gray-950',
          header: 'bg-gradient-to-r from-lime-500 to-cyan-500',
          accent: 'text-lime-400'
        };
      default: // dark
        return {
          container: 'bg-gray-900 text-white',
          card: 'bg-gray-700 text-white border-gray-600',
          button: 'bg-cyan-500 hover:bg-cyan-400',
          header: 'bg-gradient-to-r from-cyan-600 to-blue-600',
          accent: 'text-cyan-400'
        };
    }
  };

  const themeClasses = getThemeClasses();

  return (
    <div className={`min-h-screen p-8 transition-colors duration-300 ${themeClasses.container}`}>
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold mb-2">⚙️ Settings</h1>
            <p className={`${themeClasses.accent} opacity-75`}>Customize your gaming experience</p>
          </div>
          <Link to="/menu" className={`${themeClasses.button} text-white px-4 py-2 rounded-md transition`}>
            ← Back to Menu
          </Link>
        </div>

        {success && (
          <div className="bg-green-600 text-white p-4 rounded-lg mb-6 text-center">
            {success}
          </div>
        )}

        {/* User Profile Section */}
        <div className={`${themeClasses.header} p-6 rounded-lg mb-8 text-white`}>
          <h2 className="text-2xl font-bold mb-2">👤 Profile</h2>
          <p className="opacity-90">Logged in as: <span className="font-bold">{username}</span></p>
        </div>

        {/* Audio Settings */}
        <div className="mb-8">
          <h2 className={`text-2xl font-bold mb-4 ${themeClasses.accent}`}>🔊 Audio Settings</h2>
          
          <SettingItem 
            label="Sound Enabled" 
            description="Toggle all sound effects on/off"
          >
            <button
              onClick={() => handleSettingChange('soundEnabled', !settings.soundEnabled)}
              className={`w-14 h-8 rounded-full transition ${
                settings.soundEnabled ? 'bg-cyan-500' : 'bg-gray-500'
              } flex items-center ${settings.soundEnabled ? 'justify-end' : 'justify-start'} px-1`}
            >
              <div className="w-6 h-6 bg-white rounded-full"></div>
            </button>
          </SettingItem>

          <SettingItem 
            label="Music Volume" 
            description="Adjust background music level"
          >
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                value={settings.musicVolume}
                onChange={(e) => handleSettingChange('musicVolume', parseInt(e.target.value))}
                className="w-24 cursor-pointer"
              />
              <span className="text-sm font-bold w-8 text-right">{settings.musicVolume}%</span>
            </div>
          </SettingItem>

          <SettingItem 
            label="SFX Volume" 
            description="Adjust sound effects level"
          >
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                value={settings.sfxVolume}
                onChange={(e) => handleSettingChange('sfxVolume', parseInt(e.target.value))}
                className="w-24 cursor-pointer"
              />
              <span className="text-sm font-bold w-8 text-right">{settings.sfxVolume}%</span>
            </div>
          </SettingItem>
        </div>

        {/* Gameplay Settings */}
        <div className="mb-8">
          <h2 className={`text-2xl font-bold mb-4 ${themeClasses.accent}`}>🎮 Gameplay Settings</h2>
          
          <SettingItem 
            label="Difficulty" 
            description="Choose your challenge level"
          >
            <select
              value={settings.difficulty}
              onChange={(e) => handleSettingChange('difficulty', e.target.value)}
              className="bg-gray-600 text-white px-3 py-2 rounded-md border border-gray-500 focus:ring-2 focus:ring-cyan-500"
            >
              <option value="easy">Easy</option>
              <option value="normal">Normal</option>
              <option value="hard">Hard</option>
              <option value="insane">Insane</option>
            </select>
          </SettingItem>

          <SettingItem 
            label="Text Size" 
            description="Adjust on-screen text size"
          >
            <select
              value={settings.textSize}
              onChange={(e) => handleSettingChange('textSize', e.target.value)}
              className="bg-gray-600 text-white px-3 py-2 rounded-md border border-gray-500 focus:ring-2 focus:ring-cyan-500"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="xlarge">Extra Large</option>
            </select>
          </SettingItem>

          <SettingItem 
            label="Show Particles" 
            description="Display visual effects during gameplay"
          >
            <button
              onClick={() => handleSettingChange('showParticles', !settings.showParticles)}
              className={`w-14 h-8 rounded-full transition ${
                settings.showParticles ? 'bg-cyan-500' : 'bg-gray-500'
              } flex items-center ${settings.showParticles ? 'justify-end' : 'justify-start'} px-1`}
            >
              <div className="w-6 h-6 bg-white rounded-full"></div>
            </button>
          </SettingItem>

          <SettingItem 
            label="Auto Retry" 
            description="Automatically restart after game over"
          >
            <button
              onClick={() => handleSettingChange('autoRetry', !settings.autoRetry)}
              className={`w-14 h-8 rounded-full transition ${
                settings.autoRetry ? 'bg-cyan-500' : 'bg-gray-500'
              } flex items-center ${settings.autoRetry ? 'justify-end' : 'justify-start'} px-1`}
            >
              <div className="w-6 h-6 bg-white rounded-full"></div>
            </button>
          </SettingItem>
        </div>

        {/* Display Settings */}
        <div className="mb-8">
          <h2 className={`text-2xl font-bold mb-4 ${themeClasses.accent}`}>🎨 Display Settings</h2>
          
          <SettingItem 
            label="Theme" 
            description="Choose your visual theme"
          >
            <div className="flex gap-2">
              {['dark', 'light', 'neon'].map(theme => (
                <button
                  key={theme}
                  onClick={() => handleSettingChange('theme', theme)}
                  className={`px-3 py-2 rounded-md capitalize transition ${
                    settings.theme === theme
                      ? 'bg-cyan-500 text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>
          </SettingItem>
        </div>

        {/* Accessibility & Notifications */}
        <div className="mb-8">
          <h2 className={`text-2xl font-bold mb-4 ${themeClasses.accent}`}>♿ Accessibility</h2>
          
          <SettingItem 
            label="Vibration" 
            description="Controller vibration feedback"
          >
            <button
              onClick={() => handleSettingChange('vibration', !settings.vibration)}
              className={`w-14 h-8 rounded-full transition ${
                settings.vibration ? 'bg-cyan-500' : 'bg-gray-500'
              } flex items-center ${settings.vibration ? 'justify-end' : 'justify-start'} px-1`}
            >
              <div className="w-6 h-6 bg-white rounded-full"></div>
            </button>
          </SettingItem>

          <SettingItem 
            label="Notifications" 
            description="Enable game notifications and alerts"
          >
            <button
              onClick={() => handleSettingChange('notifications', !settings.notifications)}
              className={`w-14 h-8 rounded-full transition ${
                settings.notifications ? 'bg-cyan-500' : 'bg-gray-500'
              } flex items-center ${settings.notifications ? 'justify-end' : 'justify-start'} px-1`}
            >
              <div className="w-6 h-6 bg-white rounded-full"></div>
            </button>
          </SettingItem>

          <SettingItem 
            label="Language" 
            description="Choose your preferred language"
          >
            <select
              value={settings.language}
              onChange={(e) => handleSettingChange('language', e.target.value)}
              className="bg-gray-600 text-white px-3 py-2 rounded-md border border-gray-500 focus:ring-2 focus:ring-cyan-500"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="ja">日本語</option>
            </select>
          </SettingItem>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mb-8">
          <button
            onClick={saveSettings}
            disabled={!isDirty}
            className={`px-8 py-3 rounded-lg font-bold text-lg transition ${
              isDirty
                ? 'bg-cyan-500 hover:bg-cyan-400 text-white cursor-pointer'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            💾 Save Settings
          </button>
          <button
            onClick={resetSettings}
            className="px-8 py-3 rounded-lg font-bold text-lg bg-red-600 hover:bg-red-700 text-white transition"
          >
            🔄 Reset to Default
          </button>
        </div>

        {/* Info Box */}
        <div className={`${themeClasses.card} p-6 rounded-lg text-center transition-colors duration-300`}>
          <p className="opacity-75">
            💡 Your settings are saved locally in your browser. They will persist even after closing the app.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
