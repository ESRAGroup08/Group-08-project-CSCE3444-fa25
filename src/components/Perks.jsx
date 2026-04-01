import React from 'react';
import { Sun, Rocket, Magnet, Cpu } from 'lucide-react';
import './Perks.css';

const perks = [
  {
    name: 'Solar Flare',
    icon: Sun,
    color: 'text-yellow-400',
    borderColor: 'border-yellow-500/50',
    hoverColor: 'group-hover:shadow-yellow-500/20',
    description: "Emits a burst of radiation that blinds the opponent's text sensors for 5 seconds.",
  },
  {
    name: 'Hyperdrive',
    icon: Rocket,
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/50',
    hoverColor: 'group-hover:shadow-cyan-500/20',
    description: "Engages FTL drives to instantly auto-complete the next word sequence.",
  },
  {
    name: 'Tractor Beam',
    icon: Magnet,
    color: 'text-purple-400',
    borderColor: 'border-purple-500/50',
    hoverColor: 'group-hover:shadow-purple-500/20',
    description: "Locks onto opponent's ship and pulls them back by one word sequence.",
  },
  {
    name: 'System Hack',
    icon: Cpu,
    color: 'text-red-400',
    borderColor: 'border-red-500/50',
    hoverColor: 'group-hover:shadow-red-500/20',
    description: "Injects a virus that locks the opponent's input terminal for 3 seconds.",
  },
];

const Perks = ({ onSelectPerk, countdown }) => {
  return (
    <div className="absolute inset-0 z-50 bg-gray-900/95 backdrop-blur-md flex flex-col items-center justify-center p-8">
      <div className="max-w-5xl w-full space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 tracking-wider">
            SELECT LOADOUT
          </h2>
          {countdown !== null ? (
              <div className="text-yellow-400 font-mono text-2xl animate-pulse">
                AUTO-ASSIGN IN: 00:0{countdown}
              </div>
          ) : (
              <p className="text-slate-400 text-lg tracking-widest uppercase">
                Choose your tactical advantage
              </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {perks.map((perk) => {
            const Icon = perk.icon;
            return (
              <button
                key={perk.name}
                onClick={() => onSelectPerk(perk)}
                className={`group relative bg-slate-900 border-2 ${perk.borderColor} rounded-xl p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${perk.hoverColor} flex flex-col items-center text-center gap-6 overflow-hidden`}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className={`p-4 rounded-full bg-slate-800 ${perk.color} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={48} strokeWidth={1.5} />
                </div>

                <div className="space-y-3 relative z-10">
                  <h3 className={`text-xl font-bold ${perk.color} uppercase tracking-wider`}>
                    {perk.name}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {perk.description}
                  </p>
                </div>

                <div className={`absolute bottom-0 left-0 w-full h-1 bg-current opacity-20 ${perk.color}`} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Perks;