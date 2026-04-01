import { Rocket } from './Rocket.jsx';

const ROCKET_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308'];

export function RocketDisplay({ players }) {
  // Defensive check
  if (!players) return null;

  // Convert map to array with ID, then SORT by ID/Username to ensure stable lanes
  const playerList = Object.entries(players)
    .map(([id, p]) => ({ ...p, id }))
    .sort((a, b) => {
        const nameCompare = (a.username || '').localeCompare(b.username || '');
        if (nameCompare !== 0) return nameCompare;
        return a.id.localeCompare(b.id);
    });

  return (
    <div className='relative bg-transparent p-6 overflow-hidden rounded-t-3xl border-x-8 border-t-8 border-slate-600 flex flex-col shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.5)]'>
      {/* Background (Removed indigo gradient) */}
      <div className='absolute inset-0 overflow-hidden'>
        <div className='absolute inset-0 bg-black/40 backdrop-blur-sm' />
      </div>

      {/* Grid for Rockets (Fixed 4 lanes) */}
      <div className='relative grid grid-cols-4 gap-6 h-[60vh] min-h-[500px] flex-1'>
        {[0, 1, 2, 3].map((i) => {
          const player = playerList[i];
          const progress = player ? Number(player.progress) : 0;

          return (
            <div key={i} className={`relative h-full flex flex-col items-center ${!player ? 'opacity-30' : ''}`}>
               {/* Lane Marker */}
              <div className='absolute top-0 w-full h-1 bg-yellow-400 rounded-full mb-4 opacity-50' />
              
              <div className='text-white text-sm mb-2 mt-2 font-mono'>
                {player ? (player.username || "Player") : `Slot ${i+1}`}
              </div>

              <div className='relative flex-1 w-full flex justify-center'>
                {/* Rocket Container with Transition */}
                <div
                  className='absolute'
                  style={{ 
                      bottom: `${progress}%`,
                      transition: 'bottom 0.2s ease-out' 
                  }}
                >
                    {/* Debug Label */}
                    {player && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-white bg-black/50 px-1 rounded">
                            {progress.toFixed(0)}%
                        </div>
                    )}
                  <Rocket color={ROCKET_COLORS[i]} />
                </div>
                
                {/* Launch Pad */}
                <div className='absolute bottom-0 w-32 h-2 bg-gray-600 rounded-full' />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}