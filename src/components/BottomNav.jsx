const tabs = [
  { id: 'today', icon: '📊', label: 'Today' },
  { id: 'food', icon: '🍽️', label: 'Food' },
  { id: 'gym', icon: '🏋️', label: 'Gym' },
  { id: 'journey', icon: '🗺️', label: 'Journey' },
  { id: 'stats', icon: '📈', label: 'Stats' },
  { id: 'settings', icon: '⚙️', label: 'More' },
];

export function BottomNav({ active, onChange }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40
        bg-[#0f1117]/97 backdrop-blur-2xl border-t border-white/[0.08]
        flex justify-around max-w-lg mx-auto"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
    >
      {tabs.map(t => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className="bg-transparent border-none cursor-pointer flex flex-col items-center
              justify-center gap-1 px-2 pt-2 pb-1 min-w-[60px] min-h-[56px]
              transition-all duration-150 active:opacity-60 relative"
          >
            {isActive && (
              <span className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-8
                bg-blue-500/15 rounded-xl" />
            )}
            <span className="text-2xl leading-none relative z-10">{t.icon}</span>
            <span className={`text-[11px] font-semibold relative z-10
              ${isActive ? 'text-blue-400' : 'text-white/40'}`}>
              {t.label}
            </span>
            {isActive && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5
                bg-blue-500 rounded-full" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
