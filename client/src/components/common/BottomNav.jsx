import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MessageCircleHeart, Camera, MapPin, UserCheck } from 'lucide-react';

export const BottomNav = () => {
  const navItems = [
    { to: '/', label: 'Beranda', icon: Home },
    { to: '/chat', label: 'Obrolan', icon: MessageCircleHeart },
    { to: '/pap', label: 'PAP Kita', icon: Camera },
    { to: '/location', label: 'Lokasi', icon: MapPin },
    { to: '/profile', label: 'Profil', icon: UserCheck },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-charcoal-700/60 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 px-3">
      <div className="grid grid-cols-5 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 transition-all rounded-xl relative ${
                  isActive
                    ? 'text-romantic-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                    {isActive && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-romantic-500 rounded-full" />
                    )}
                  </div>
                  <span className="text-[11px] mt-1 tracking-tight">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
