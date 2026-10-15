import React from 'react';

export const BackgroundOrbs = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Top Left Rose Glow */}
      <div 
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-romantic-500/10 blur-[100px] animate-float-slow"
      />

      {/* Top Right Plum Glow */}
      <div 
        className="absolute top-1/4 -right-40 w-[30rem] h-[30rem] rounded-full bg-plum-500/12 blur-[120px] animate-float"
        style={{ animationDelay: '-2s' }}
      />

      {/* Center-Bottom Soft Amethyst Glow */}
      <div 
        className="absolute bottom-10 left-1/3 w-80 h-80 rounded-full bg-rose-600/8 blur-[110px] animate-float-slow"
        style={{ animationDelay: '-4s' }}
      />

      {/* Subtle fine stars / sparkles overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />
    </div>
  );
};
