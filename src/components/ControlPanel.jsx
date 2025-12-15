import { useRef, useEffect } from 'react';
import { Zap, Rocket, Gauge, AlertTriangle, ShieldOff, Wind, CloudFog } from 'lucide-react';
import { motion } from 'framer-motion';

export function ControlPanel({ 
  targetText, 
  inputValue, 
  onInputChange, 
  progress,
  heldPerk, 
  onUsePerk,
  disabled, // New prop for disabling input
  isBlinded,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  const handleActivatePerk = (perkName) => {
    if (onUsePerk) {
      onUsePerk(perkName);
    }
  };

  const perksConfig = {
    'ROCKET_FUEL': {
      name: 'ROCKET FUEL',
      description: 'Completes 5% of the sentence',
      Icon: Rocket,
      color: 'orange',
    },
    'ASTEROID_ATTACK': {
      name: 'ASTEROID ATTACK',
      description: 'Disrupts your opponent',
      Icon: AlertTriangle,
      color: 'red',
    },
    'REPULSOR': {
      name: 'REPULSOR',
      description: 'Push opponent back 2 words',
      Icon: Wind,
      color: 'indigo',
    },
    'NEBULA': {
      name: 'NEBULA',
      description: 'Blind opponent for 3s',
      Icon: CloudFog,
      color: 'fuchsia',
    },
  };

  const renderPerkSlot = () => {
    const config = heldPerk ? perksConfig[heldPerk] : null;

    if (!config) {
      // Render a disabled "No Perk" state
      return (
        <div className="w-full bg-slate-800/30 border-2 border-dashed border-slate-700 rounded-lg p-3 relative h-[76px] flex items-center justify-center">
          <div className="flex items-center gap-3 opacity-40">
            <div className="w-8 h-8 bg-slate-700/50 rounded flex items-center justify-center flex-shrink-0">
              <ShieldOff className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-left flex-1">
              <div className="text-slate-400 text-xs">NO PERK</div>
              <div className="text-slate-500 text-[10px]">Keep typing to earn one!</div>
            </div>
          </div>
        </div>
      );
    }
    
    // Render the active perk button
    const color = config.color;
    return (
      <motion.button
        onClick={() => handleActivatePerk(heldPerk)}
        className={`w-full bg-gradient-to-br from-${color}-900/50 to-${color}-950/50 border-2 border-${color}-700 rounded-lg p-3 transition-all group relative overflow-hidden hover:border-${color}-500 h-[76px]`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className={`absolute inset-0 bg-${color}-500/10 opacity-0 group-hover:opacity-100 transition-opacity`} />
        <div className='relative flex items-center gap-3'>
          <div className={`w-8 h-8 bg-${color}-500/20 rounded flex items-center justify-center flex-shrink-0`}>
            <config.Icon className={`w-4 h-4 text-${color}-400`} />
          </div>
          <div className='text-left flex-1'>
            <div className={`text-${color}-300 text-xs`}>{config.name}</div>
            <div className='text-slate-500 text-[10px]'>{config.description}</div>
          </div>
        </div>
        {/* Activation lights */}
        <div className='absolute top-2 right-2 flex gap-1'>
          <div className={`w-1.5 h-1.5 rounded-full bg-${color}-400 animate-pulse`} />
        </div>
        <div className="absolute bottom-2 right-2 text-xs text-slate-500">
            Press <span className="font-mono bg-slate-900 px-1 rounded">`</span> to use
        </div>
      </motion.button>
    );
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
            <div className='text-slate-400 text-[10px] tracking-widest mb-2'>PERK SLOT</div>
            {renderPerkSlot()}
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
                  
                  if (isBlinded && index >= inputValue.length) {
                    className += ' nebula-blind';
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
                ref={inputRef}
                type='text'
                value={inputValue}
                onChange={onInputChange}
                placeholder='► TYPE HERE TO LAUNCH...'
                className='w-full bg-slate-950 border-2 border-slate-700 rounded-lg px-4 py-3 text-green-400 placeholder-slate-600 focus:outline-none focus:border-green-500 transition-colors tracking-widest'
                autoComplete="off"
                disabled={disabled} // Apply the disabled prop here
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
          </div>
        </div>
      </div>

      {/* Bottom Panel Accent */}
      <div className='h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50' />
    </div>
  );
}