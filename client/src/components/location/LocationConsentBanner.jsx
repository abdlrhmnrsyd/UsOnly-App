import React from 'react';
import { ShieldCheck, ShieldAlert, Navigation, RefreshCw } from 'lucide-react';

export const LocationConsentBanner = ({
  isSharingEnabled,
  onToggleConsent,
  onRefreshLocation,
  isRefreshing,
  lastUpdated,
}) => {
  return (
    <div className="p-4 rounded-3xl glass-card border border-charcoal-700/70 bg-charcoal-900/60 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Consent Info */}
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-2xl ${
              isSharingEnabled
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-charcoal-800 text-slate-400 border border-charcoal-700'
            }`}
          >
            {isSharingEnabled ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <ShieldAlert className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-slate-100 text-sm">
                Berbagi Lokasi Saling Rela (Mutual Consent)
              </h4>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  isSharingEnabled
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50'
                    : 'bg-charcoal-800 text-slate-400 border border-charcoal-700'
                }`}
              >
                {isSharingEnabled ? 'Aktif' : 'Nonaktif (Privat)'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xl leading-relaxed">
              Lokasi hanya dibagikan secara mutual saat kamu menyalakan sakelar ini. Tidak ada pelacakan tersembunyi di latar belakang. Kamu bebas mematikan kapan saja.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {/* Refresh GPS Button */}
          {isSharingEnabled && (
            <button
              onClick={onRefreshLocation}
              disabled={isRefreshing}
              className="px-3 py-2 rounded-xl text-xs font-medium bg-charcoal-800 hover:bg-charcoal-750 text-slate-200 border border-charcoal-700 flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
              title="Perbarui GPS sekarang"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline">Perbarui</span>
            </button>
          )}

          {/* Toggle Consent Switch */}
          <button
            onClick={onToggleConsent}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
              isSharingEnabled ? 'bg-gradient-to-r from-romantic-600 to-rose-600' : 'bg-charcoal-700'
            }`}
            title="Nyalakan/Matikan Izin Berbagi Lokasi"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                isSharingEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
