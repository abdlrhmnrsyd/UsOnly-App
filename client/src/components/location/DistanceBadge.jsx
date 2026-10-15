import React from 'react';
import { calculateDistance } from '../../utils/distanceUtils.js';
import { formatRelativeTime } from '../../utils/dateUtils.js';
import { Heart, Battery, BatteryCharging, MapPin, Edit3 } from 'lucide-react';

export const DistanceBadge = ({
  myLocation,
  partnerLocation,
  myUser,
  partnerUser,
  onOpenStatusModal,
}) => {
  const distance =
    myLocation?.latitude &&
    myLocation?.longitude &&
    partnerLocation?.is_sharing_enabled &&
    partnerLocation?.latitude &&
    partnerLocation?.longitude
      ? calculateDistance(
          myLocation.latitude,
          myLocation.longitude,
          partnerLocation.latitude,
          partnerLocation.longitude
        )
      : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* My Status Card */}
      <div className="p-4 rounded-3xl glass-card border border-charcoal-700/60 bg-charcoal-900/40 relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-romantic-500" />
            <span className="text-xs font-semibold text-slate-200">
              Kabar Kamu ({myUser?.nickname || 'Asit'})
            </span>
          </div>

          <button
            onClick={onOpenStatusModal}
            className="p-1 rounded-lg text-slate-400 hover:text-romantic-300 hover:bg-charcoal-800 transition-colors flex items-center gap-1 text-[11px]"
            title="Ubah Kabar Status"
          >
            <Edit3 className="w-3 h-3" />
            Ubah
          </button>
        </div>

        <p className="text-sm font-medium text-slate-100 mb-2">
          {myLocation?.status_note || 'Belum ada kabar status'}
        </p>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-charcoal-800">
          <span className="flex items-center gap-1 truncate max-w-[200px]">
            <MapPin className="w-3 h-3 text-romantic-400 shrink-0" />
            {myLocation?.address_label || 'Lokasi tersimpan'}
          </span>
          <span>{myLocation?.last_updated_at ? formatRelativeTime(myLocation.last_updated_at) : '-'}</span>
        </div>
      </div>

      {/* Partner Status & Mutual Distance Card */}
      <div className="p-4 rounded-3xl glass-card border border-charcoal-700/60 bg-charcoal-900/40">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-plum-400" />
            <span className="text-xs font-semibold text-slate-200">
              Kabar {partnerUser?.nickname || 'Nisya'}
            </span>
          </div>

          {/* Partner Battery */}
          {partnerLocation?.battery_level != null && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
              <Battery className="w-3.5 h-3.5" />
              {partnerLocation.battery_level}%
            </span>
          )}
        </div>

        <p className="text-sm font-medium text-slate-100 mb-2">
          {partnerLocation?.status_note || 'Sedang memikirkanmu ❤️'}
        </p>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-charcoal-800">
          {/* Distance Indicator */}
          {distance ? (
            <span className="flex items-center gap-1 text-romantic-300 font-medium">
              <Heart className="w-3 h-3 fill-romantic-500 text-romantic-500" />
              Jarak kalian: {distance}
            </span>
          ) : (
            <span className="text-slate-500 text-[11px]">
              {partnerLocation?.is_sharing_enabled
                ? 'Menghitung jarak...'
                : 'Berbagi lokasi pasangan nonaktif'}
            </span>
          )}

          <span>
            {partnerLocation?.last_updated_at
              ? formatRelativeTime(partnerLocation.last_updated_at)
              : '-'}
          </span>
        </div>
      </div>
    </div>
  );
};
