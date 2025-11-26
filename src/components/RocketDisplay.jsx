import { motion } from 'framer-motion';
import { Rocket } from './Rocket.jsx'; // FIXED: Added .jsx extension explicitly

const ROCKET_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308'];

export function RocketDisplay({ players }) {
  return (
    <div className='relative bg-slate-950 p-6 overflow-hidden rounded-t-xl border-x border-t border-slate-700 flex flex-col'>
      {/* Background */}
      <div className='absolute inset-0 overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950' />
        <div className='absolute top-10 right-20 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl' />
        <div className='absolute bottom-20 left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl' />
      </div>

      {/* Grid for Rockets */}
      <div className='relative grid grid-cols-4 gap-6 h-[60vh] min-h-[500px] flex-1'>
        {[...Array(4)].map((_, i) => {
          const playerId = `player${i + 1}`;
          // Safely get the player. If players is undefined, default to null.
          const player = (players && players[playerId]) ? players[playerId] : null;
          
          // Use 0 progress if player doesn't exist
          const progress = player ? player.progress : 0;
          
          // Ghost mode if player doesn't exist
          const isGhost = !player;

          return (
            <div key={i} className={`relative h-full flex flex-col items-center ${isGhost ? 'opacity-30' : ''}`}>
              <div className='absolute top-0 w-full h-1 bg-yellow-400 rounded-full mb-4 shadow-lg shadow-yellow-400/50' />
              
              <div className='text-white text-sm mb-2 mt-2 tracking-wide font-mono'>
                {/* CRITICAL FIX: Check if player exists before reading name */}
                {player ? (player.name || player.username || `Player ${i + 1}`) : `Player ${i+1}`}
              </div>

              <div className='relative flex-1 w-full flex items-end justify-center'>
                <motion.div
                  className='absolute'
                  initial={{ bottom: '0%' }}
                  animate={{ bottom: `${progress}%` }}
                  transition={{ duration: 0.2, ease: 'linear' }}
                >
                  <Rocket color={ROCKET_COLORS[i]} />
                </motion.div>

                <div className='absolute bottom-0 w-32 h-2 bg-gray-600 rounded-full shadow-lg' />
              </div>
            </div>
          );
        })}
      </div>
      <div className='absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent' />
    </div>
  );
}