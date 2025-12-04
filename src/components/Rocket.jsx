import { motion } from 'motion/react';

export function Rocket({ color }) {
  return (
    <div className='relative w-[80px] h-[120px]'>
      <svg
        width='80'
        height='120'
        viewBox='0 0 60 100'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        className='absolute inset-0'
      >
        {/* FLAME GROUP: Tucked behind the body */}
        <g>
          <motion.g
            initial={{ y: 0 }}
            animate={{ y: [0, 2, 0], scaleY: [1, 1.3, 1] }}
            transition={{
              duration: 0.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ transformOrigin: '50% 80%' }}
          >
            {/* Outer Flame (Orange) - Centered at 30, base at y=80 */}
            <path
              d='M30 100 C 40 100 45 80 30 75 C 15 80 20 100 30 100 Z'
              fill='#f97316'
            />
            {/* Inner Flame (Yellow) - Centered at 30, base at y=80 */}
            <path
              d='M30 95 C 35 95 38 82 30 78 C 22 82 25 95 30 95 Z'
              fill='#fbbf24'
            />
          </motion.g>
        </g>
        {/* ROCKET BODY: Draws on top of the flame */}
        {/* Main Fuselage - Centered at 30 */}
        <path
          d='M30 0 C 45 0 50 30 50 60 L 50 80 L 10 80 L 10 60 C 10 30 15 0 30 0 Z'
          fill={color}
          stroke='#1f2937'
          strokeWidth='1.5'
        />
        {/* Fins */}
        <path
          d='M10 60 L 0 90 L 10 80 Z'
          fill='#64748b'
          stroke='#1f2937'
          strokeWidth='1.5'
        />{' '}
        {/* Left Fin */}
        <path
          d='M50 60 L 60 90 L 50 80 Z'
          fill='#64748b'
          stroke='#1f2937'
          strokeWidth='1.5'
        />{' '}
        {/* Right Fin */}
        {/* Window - Centered at 30 */}
        <circle
          cx='30'
          cy='30'
          r='12'
          fill='#e2e8f0'
          stroke='#334155'
          strokeWidth='1.5'
        />
        <circle cx='30' cy='30' r='9' fill='#38bdf8' opacity='0.8' />
      </svg>
    </div>
  );
}
