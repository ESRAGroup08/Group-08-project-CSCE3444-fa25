import { useRef, useEffect } from 'react';
import { Rocket, Gauge, AlertTriangle, ShieldOff } from 'lucide-react';
import { motion } from 'framer-motion';

export function ControlPanel({ 
  targetText, 
  inputValue, 
  onInputChange, 
  progress,
  selectedPerk, 
  onActivatePerk,
  perkUsed,
  disabled, 
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

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
            <div className={`w-full bg-slate-800/30 border-2 ${perkUsed ? 'border-red-500' : 'border-slate-700'} rounded-lg p-3 relative h-[76px] flex items-center justify-center`}>
              {selectedPerk ? (
                <div className="flex items-center gap-3">
                  <ShieldOff className="w-4 h-4 text-green-400" />
                  <div className="text-left flex-1">
                    <div className="text-green-400 text-xs">{selectedPerk.name}</div>
                    <button 
                      onClick={onActivatePerk} 
                      disabled={perkUsed || disabled}
                      className="text-xs text-blue-400 hover:text-blue-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                      {perkUsed ? 'USED' : 'ACTIVATE'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 opacity-40">
                    <ShieldOff className="w-4 h-4 text-slate-500" />
                    <div className="text-left flex-1">
                    <div className="text-slate-400 text-xs">NO PERK</div>
                    </div>
                </div>
              )}
            </div>
            {selectedPerk && !perkUsed && (
              <div className="text-center text-slate-400 text-xs">
                Press ` to activate
              </div>
            )}
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
                ref={inputRef}
                type='text'
                name="gameInput"
                id="gameInput"
                value={inputValue}
                onChange={onInputChange}
                placeholder='► TYPE HERE TO LAUNCH...'
                className='w-full bg-slate-950 border-2 border-slate-700 rounded-lg px-4 py-3 text-green-400 placeholder-slate-600 focus:outline-none focus:border-green-500 transition-colors tracking-widest'
                autoComplete="off"
                disabled={disabled} 
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