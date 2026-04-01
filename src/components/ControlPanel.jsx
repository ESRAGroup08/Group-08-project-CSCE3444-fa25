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
    <div className='relative bg-slate-800 overflow-hidden border-x-8 border-b-8 border-slate-600 rounded-b-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]'>
      {/* Control Panel Header */}
      <div className='bg-slate-900/50 border-b-2 border-slate-700 px-6 py-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='w-3 h-3 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)] animate-pulse' />
            <div className='w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.3)]' />
            <div className='w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]' />
            <span className='text-slate-300 text-xs ml-3 tracking-[0.2em] font-black uppercase'>Console Command System</span>
          </div>
          <div className='text-slate-500 text-[10px] tracking-[0.3em] font-black uppercase'>Deck-04 Navigation Module</div>
        </div>
      </div>

      <div className='p-8 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-700/20 via-transparent to-transparent'>
        <div className='grid grid-cols-12 gap-8'>
          {/* Left Side - Power-ups */}
          <div className='col-span-3 space-y-4'>
            <div className='text-slate-400 text-[10px] font-black tracking-widest uppercase ml-1'>Systems Auxiliary</div>
            <div className={`w-full bg-slate-900 border-4 ${perkUsed ? 'border-red-900/50' : 'border-slate-700'} rounded-2xl p-4 relative h-[96px] flex items-center justify-center shadow-inner transition-all`}>
              {selectedPerk ? (
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${perkUsed ? 'bg-slate-800 opacity-50' : 'bg-cyan-500/10'}`}>
                    <ShieldOff className={`w-6 h-6 ${perkUsed ? 'text-slate-600' : 'text-cyan-400'}`} />
                  </div>
                  <div className="text-left flex-1">
                    <div className={`text-xs font-black uppercase tracking-wider ${perkUsed ? 'text-slate-600' : 'text-cyan-400'}`}>{selectedPerk.name}</div>
                    <button 
                      onClick={onActivatePerk} 
                      disabled={perkUsed || disabled}
                      className="text-[10px] font-black text-blue-400 hover:text-white disabled:text-slate-700 disabled:cursor-not-allowed uppercase tracking-widest mt-1 transition-colors"
                    >
                      {perkUsed ? 'OFFLINE' : 'INITIATE'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 opacity-20">
                    <ShieldOff className="w-6 h-6 text-slate-500" />
                    <div className="text-left flex-1">
                    <div className="text-slate-500 text-[10px] font-black uppercase tracking-tighter">SIGNAL LOST</div>
                    </div>
                </div>
              )}
            </div>
            {selectedPerk && !perkUsed && (
              <div className="text-center text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                [`] Key Override
              </div>
            )}
          </div>

          {/* Center - Main Display */}
          <div className='col-span-6 space-y-4'>
            <div className='text-slate-400 text-[10px] font-black tracking-widest uppercase ml-1'>Digital Feed</div>

            {/* Sentence Display */}
            <div className='bg-slate-900 rounded-2xl border-4 border-slate-700 p-6 relative min-h-[120px] flex items-center shadow-inner overflow-hidden'>
              {/* Scanline Effect */}
              <div className='absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_4px,3px_100%] pointer-events-none' />
              
              <p className='text-slate-400 tracking-[0.1em] leading-relaxed relative z-10 font-mono text-xl'>
                {targetText.split('').map((char, index) => {
                  let className = 'text-slate-700';
                  if (index < inputValue.length) {
                    className = inputValue[index] === char ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]' : 'text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.4)]';
                  } else if (index === inputValue.length) {
                    className = 'text-white bg-cyan-500/20 px-1.5 rounded-sm animate-pulse';
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
              <div className='absolute -top-3 left-6 bg-slate-800 px-3 text-slate-500 text-[10px] font-black tracking-widest uppercase z-10 border-x border-slate-700'>
                Manual Input
              </div>
              <input
                ref={inputRef}
                type='text'
                name="gameInput"
                id="gameInput"
                value={inputValue}
                onChange={onInputChange}
                placeholder='► ENTER COMMAND PROTOCOL...'
                className='w-full bg-slate-950 border-4 border-slate-700 rounded-2xl px-8 py-6 text-cyan-400 placeholder-slate-800 focus:outline-none focus:border-cyan-600/50 transition-all tracking-[0.2em] font-mono text-2xl shadow-inner'
                autoComplete="off"
                disabled={disabled} 
              />
            </div>
          </div>

          {/* Right Side - Gauges */}
          <div className='col-span-3 space-y-4'>
            <div className='text-slate-400 text-[10px] font-black tracking-widest uppercase ml-1'>Propulsion Data</div>

            {/* Progress Gauge */}
            <div className='bg-slate-900 border-4 border-slate-700 rounded-2xl p-6 space-y-4 shadow-inner'>
              <div className='flex items-center justify-between'>
                <div className='text-slate-500 text-[10px] font-black tracking-widest uppercase'>Core Thrust</div>
                <Gauge className='w-5 h-5 text-slate-600' />
              </div>
              <div className='text-4xl text-slate-200 font-black tabular-nums tracking-tighter drop-shadow-sm'>{Math.round(progress)}%</div>
              <div className='w-full bg-slate-800 rounded-full h-3 overflow-hidden border-2 border-slate-700'>
                <motion.div
                  className='h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-400 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className='text-slate-600 text-[10px] font-black tracking-widest uppercase text-right'>
                {inputValue.length} / {targetText.length} PKTS
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Panel Accent */}
      <div className='h-2 bg-slate-700 opacity-50 border-t border-slate-600' />
    </div>
  );
}