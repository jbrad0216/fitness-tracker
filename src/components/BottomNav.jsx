const tabs = [
  { id: 'home', icon: '🏠', label: 'Home' },
  { id: 'log', icon: '➕', label: 'Log' },
  { id: 'gym', icon: '🏋️', label: 'Gym' },
  { id: 'more', icon: '···', label: 'More' },
];

export function BottomNav({ active, onChange }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40
        bg-[#0f1117]/97 backdrop-blur-2xl border-t border-white/[0.08]
        flex justify-around max-w-lg mx-auto"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)', height: 'calc(64px + max(env(safe-area-inset-bottom), 8px))' }}
    >
      {tabs.map(t => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className="flex-1 bg-transparent border-none cursor-pointer flex flex-col items-center
              justify-center gap-1 py-2 min-h-[56px]
              transition-all duration-150 active:opacity-60 relative"
          >
            {isActive && (
              <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-12 h-9
                bg-blue-500/20 rounded-2xl" />
            )}
            <span className={`text-[26px] leading-none relative z-10 ${isActive ? '' : 'opacity-50'}`}>
              {t.icon}
            </span>
            <span className={`text-[12px] font-semibold relative z-10 leading-none
              ${isActive ? 'text-blue-400' : 'text-white/40'}`}>
              {t.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
