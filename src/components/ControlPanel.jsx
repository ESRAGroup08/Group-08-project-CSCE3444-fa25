import { Zap, Rocket, Gauge } from 'lucide-react';
import { motion } from 'motion/react';

export function ControlPanel({ 
  targetText, 
  inputValue, 
  onInputChange, 
  progress, 
  accuracy 
}) {

  const handleActivatePerk = (perkName) => {
    console.log(`Activated perk: ${perkName}`);
    // TODO: Implement perk activation logic
  };

  return (
    <div className='relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden'>
      {/* Control Panel Header */}
      <div className='bg-slate-950/80 border-y border-slate-700 px-6 py-2.5'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div className='w-2 h-2 rounded-full bg-red-500 animate-pulse' />
            <div className='w-2 h-2 rounded-full bg-yellow-500' />
            <div className='w-2 h-2 rounded-full bg-green-500' />
            <span className='text-green-400 text-xs ml-3 tracking-wider'>SYSTEMS ONLINE</span>
          </div>
          <div className='text-slate-500 text-xs tracking-wider'>MISSION CONTROL</div>
        </div>
      </div>

      <div className='p-6'>
        <div className='grid grid-cols-12 gap-4'>
          {/* Left Side - Power-ups */}
          <div className='col-span-3 space-y-3'>
            <div className='text-slate-400 text-[10px] tracking-widest mb-2'>POWER-UPS</div>

            {/* Speed Boost */}
            <motion.button
              onClick={() => handleActivatePerk('Speed Boost')}
              className='w-full bg-gradient-to-br from-blue-900/50 to-blue-950/50 border-2 border-blue-700 rounded-lg p-3 hover:border-blue-500 transition-all group relative overflow-hidden'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className='absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity' />
              <div className='relative flex items-center gap-3'>
                <div className='w-8 h-8 bg-blue-500/20 rounded flex items-center justify-center flex-shrink-0'>
                  <Zap className='w-4 h-4 text-blue-400' />
                </div>
                <div className='text-left flex-1'>
                  <div className='text-blue-300 text-xs'>SPEED BOOST</div>
                  <div className='text-slate-500 text-[10px]'>x2 Speed</div>
                </div>
              </div>
              {/* Activation lights */}
              <div className='absolute top-2 right-2 flex gap-1'>
                <div className='w-1 h-1 rounded-full bg-blue-500' />
                <div className='w-1 h-1 rounded-full bg-blue-500' />
                <div className='w-1 h-1 rounded-full bg-blue-500' />
              </div>
            </motion.button>

            {/* Rocket Fuel */}
            <motion.button
              onClick={() => handleActivatePerk('Rocket Fuel')}
              className='w-full bg-gradient-to-br from-orange-900/50 to-orange-950/50 border-2 border-orange-700 rounded-lg p-3 hover:border-orange-500 transition-all group relative overflow-hidden'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className='absolute inset-0 bg-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity' />
              <div className='relative flex items-center gap-3'>
                <div className='w-8 h-8 bg-orange-500/20 rounded flex items-center justify-center flex-shrink-0'>
                  <Rocket className='w-4 h-4 text-orange-400' />
                </div>
                <div className='text-left flex-1'>
                  <div className='text-orange-300 text-xs'>ROCKET FUEL</div>
                  <div className='text-slate-500 text-[10px]'>+25% Jump</div>
                </div>
              </div>
              {/* Activation lights */}
              <div className='absolute top-2 right-2 flex gap-1'>
                <div className='w-1 h-1 rounded-full bg-orange-500' />
                <div className='w-1 h-1 rounded-full bg-orange-500' />
                <div className='w-1 h-1 rounded-full bg-orange-500' />
              </div>
            </motion.button>
          </div>

          {/* Center - Main Display */}
          <div className='col-span-6 space-y-3'>
            <div className='text-slate-400 text-[10px] tracking-widest mb-2'>TARGET SEQUENCE</div>

            {/* Sentence Display */}
            <div className='bg-slate-950 rounded-lg border-2 border-slate-700 p-4 relative'>
              <div className='absolute inset-0 bg-gradient-to-b from-transparent via-green-500/5 to-transparent pointer-events-none' />

              <p className='text-slate-300 tracking-wide leading-relaxed relative z-10'>
                {targetText.split('').map((char, index) => {
                  let className = 'text-slate-500';
                  if (index < inputValue.length) {
                    className = inputValue[index] === char ? 'text-green-400' : 'text-red-400';
                  } else if (index === inputValue.length) {
                    className = 'text-white bg-green-500/30 px-0.5 rounded animate-pulse';
                  }
                  return (
                    <span key={index} className={className}>
                      {char}
                    </span>
                  );
                })}
              </p>
            </div>

            {/* Input Terminal */}
            <div className='relative'>
              <div className='absolute -top-2 left-3 bg-slate-800 px-2 text-slate-500 text-[10px] tracking-widest'>
                INPUT TERMINAL
              </div>
              <input
                type='text'
                value={inputValue}
                onChange={onInputChange}
                placeholder='► TYPE HERE TO LAUNCH...'
                className='w-full bg-slate-950 border-2 border-slate-700 rounded-lg px-4 py-3 text-green-400 placeholder-slate-600 focus:outline-none focus:border-green-500 transition-colors tracking-wide'
                autoFocus
              />
            </div>
          </div>

          {/* Right Side - Gauges */}
          <div className='col-span-3 space-y-3'>
            <div className='text-slate-400 text-[10px] tracking-widest mb-2'>TELEMETRY</div>

            {/* Progress Gauge */}
            <div className='bg-slate-950/50 border-2 border-slate-700 rounded-lg p-3 space-y-2'>
              <div className='flex items-center justify-between'>
                <div className='text-slate-400 text-[10px]'>PROGRESS</div>
                <Gauge className='w-3 h-3 text-slate-500' />
              </div>
              <div className='text-xl text-white tabular-nums'>{Math.round(progress)}%</div>
              <div className='w-full bg-slate-800 rounded-full h-1.5 overflow-hidden'>
                <motion.div
                  className='h-full bg-gradient-to-r from-blue-500 to-cyan-400'
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className='text-slate-500 text-[10px]'>
                {inputValue.length} / {targetText.length} CHARS
              </div>
            </div>

            {/* Accuracy Gauge */}
            <div className='bg-slate-950/50 border-2 border-slate-700 rounded-lg p-3 space-y-2'>
              <div className='flex items-center justify-between'>
                <div className='text-slate-400 text-[10px]'>ACCURACY</div>
                <div className={`w-1.5 h-1.5 rounded-full ${accuracy >= 90 ? 'bg-green-500' : accuracy >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`} />
              </div>
              <div className={`text-xl tabular-nums ${accuracy >= 90 ? 'text-green-400' : accuracy >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                {accuracy}%
              </div>
              <div className='w-full bg-slate-800 rounded-full h-1.5 overflow-hidden'>
                <motion.div
                  className={`h-full ${accuracy >= 90 ? 'bg-gradient-to-r from-green-500 to-emerald-400' : accuracy >= 70 ? 'bg-gradient-to-r from-yellow-500 to-amber-400' : 'bg-gradient-to-r from-red-500 to-rose-400'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${accuracy}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className='text-slate-500 text-[10px]'>
                {accuracy >= 90 ? 'OPTIMAL' : accuracy >= 70 ? 'NOMINAL' : 'CRITICAL'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Panel Accent */}
      <div className='h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50' />
    </div>
  );
}