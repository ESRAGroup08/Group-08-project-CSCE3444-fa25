import React, { useMemo } from 'react';
import './AnimatedBackground.css';
import rocketImg from '../images/rocket.svg';
import planet1Img from '../images/planet1.svg';
import planet2Img from '../images/planet2.svg';
import planet3Img from '../images/planet3.svg';

const AnimatedBackground = () => {
  // Generate random stars for 3 layers of parallax
  const starLayers = useMemo(() => {
    const layers = [
      { count: 400, size: '1px', duration: '100s', speed: 'slow' },
      { count: 150, size: '2px', duration: '70s', speed: 'medium' },
      { count: 50, size: '3px', duration: '40s', speed: 'fast' },
    ];

    return layers.map((layer, index) => {
      const generatedStars = [];
      for (let i = 0; i < layer.count; i++) {
        generatedStars.push({
          id: `${index}-${i}`,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          size: layer.size,
          twinkleDuration: `${Math.random() * 3 + 1.5}s`,
        });
      }
      return { ...layer, stars: generatedStars };
    });
  }, []);

  return (
    <div className="animated-background">
      {/* Parallax Star Layers */}
      {starLayers.map((layer, index) => (
        <div key={index} className={`star-layer ${layer.speed}`}>
          {layer.stars.map((star) => (
            <div
              key={star.id}
              className="star"
              style={{
                left: star.left,
                top: star.top,
                width: star.size,
                height: star.size,
                '--duration': star.twinkleDuration,
              }}
            />
          ))}
        </div>
      ))}

      {/* Moving Images */}
      <img 
        src={rocketImg} 
        alt="" 
        className="floating-element rocket-float" 
        style={{ width: '80px', top: '0', left: '0' }}
      />
      <img 
        src={planet1Img} 
        alt="" 
        className="floating-element move-diagonal-1" 
        style={{ width: '100px', top: '10%', left: '0', animationDelay: '0s' }} 
      />
      <img 
        src={planet2Img} 
        alt="" 
        className="floating-element move-diagonal-2" 
        style={{ width: '120px', top: '0', right: '0', animationDelay: '5s' }} 
      />
      <img 
        src={planet3Img} 
        alt="" 
        className="floating-element move-horizontal" 
        style={{ width: '60px', bottom: '20%', left: '0', animationDelay: '2s' }} 
      />
      <img 
        src={planet1Img} 
        alt="" 
        className="floating-element move-vertical" 
        style={{ width: '40px', bottom: '0', left: '20%', opacity: 0.5, animationDelay: '10s' }} 
      />
    </div>
  );
};

export default AnimatedBackground;