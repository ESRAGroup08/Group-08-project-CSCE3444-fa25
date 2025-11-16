import { motion } from 'motion/react';

export function Rocket({ color }) {
  return (
    <div className='relative'>
      <svg
        width='80'
        height='120'
        viewBox='0 0 80 120'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
      >
        {/* Rocket body */}
        <path
          d='M40 10 L60 50 L60 90 L50 90 L50 100 L40 110 L30 100 L30 90 L20 90 L20 50 Z'
          fill={color}
          stroke='#1f2937'
          strokeWidth='2'
        />
        {/* Rocket nose cone */}
        <path
          d='M40 0 L60 50 L20 50 Z'
          fill='#94a3b8'
          stroke='#1f2937'
          strokeWidth='2'
        />
        {/* Window */}
        <circle cx='40' cy='40' r='8' fill='#1e293b' />
        <circle cx='40' cy='40' r='6' fill='#38bdf8' opacity='0.8' />
        {/* Fins */}
        <path
          d='M20 70 L5 90 L20 90 Z'
          fill='#64748b'
          stroke='#1f2937'
          strokeWidth='2'
        />
        <path
          d='M60 70 L75 90 L60 90 Z'
          fill='#64748b'
          stroke='#1f2937'
          strokeWidth='2'
        />
      </svg>
      {/* Rocket flames */}
      <motion.div
        className='absolute -bottom-8 left-1/2 -translate-x-1/2'
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 0.3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <svg
          width='60'
          height='40'
          viewBox='0 0 60 40'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
        >
          {/* Orange flame */}
          <ellipse cx='30' cy='10' rx='20' ry='25' fill='#f97316' opacity='0.9' />
          {/* Yellow flame */}
          <ellipse cx='30' cy='8' rx='12' ry='18' fill='#fbbf24' opacity='0.9' />
          {/* White hot center */}
          <ellipse cx='30' cy='5' rx='6' ry='10' fill='#fef9c3' opacity='0.9' />
        </svg>
      </motion.div>
    </div>
  );
}
