import { motion } from 'motion/react';
import { Rocket } from './Rocket.jsx';

export function RocketDisplay() {
  const rockets = [
    { id: 1, color: '#ef4444', label: 'Rocket 1' },
    { id: 2, color: '#3b82f6', label: 'Rocket 2' },
    { id: 3, color: '#22c55e', label: 'Rocket 3' },
    { id: 4, color: '#eab308', label: 'Rocket 4' },
  ];

  return (
    <div className='relative bg-slate-950 p-6 overflow-hidden'>
      {/* Space background with stars */}
      <div className='absolute inset-0 overflow-hidden'>
        {/* Gradient background */}
        <div className='absolute inset-0 bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950' />
        {/* Stars */}
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className='absolute w-1 h-1 bg-white rounded-full'
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.8 + 0.2,
            }}
            animate={{
              opacity: [Math.random() * 0.5 + 0.3, 1, Math.random() * 0.5 + 0.3],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
        {/* Planets/Nebula effect */}
        <div className='absolute top-10 right-20 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl' />
        <div className='absolute bottom-20 left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl' />
      </div>

      <div className='relative grid grid-cols-4 gap-6'>
        {rockets.map((rocket) => (
          <div key={rocket.id} className='relative h-[400px] flex flex-col items-center'>
            {/* Finish line */}
            <div className='absolute top-0 w-full h-1 bg-yellow-400 rounded-full mb-4 shadow-lg shadow-yellow-400/50' />
            <div className='text-white text-sm mb-2 mt-2 tracking-wide'>{rocket.label}</div>
            {/* Rocket track */}
            <div className='relative flex-1 w-full flex items-end justify-center'>
              <motion.div
                initial={{ y: 0 }}
                className='absolute bottom-0'
              >
                <Rocket color={rocket.color} />
              </motion.div>
              {/* Launch pad */}
              <div className='absolute bottom-0 w-32 h-2 bg-gray-600 rounded-full shadow-lg' />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom border accent */}
      <div className='absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent' />
    </div>
  );
}
