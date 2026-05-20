const tabs = [
  { id: 'today', icon: '📊', label: 'Today' },
  { id: 'food', icon: '🍽️', label: 'Food' },
  { id: 'gym', icon: '🏋️', label: 'Gym' },
  { id: 'stats', icon: '📈', label: 'Stats' },
];

export function BottomNav({ active, onChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40
      bg-[#0f1117]/95 backdrop-blur-xl border-t border-white/[0.08]
      flex justify-around max-w-lg mx-auto
      pb-[env(safe-area-inset-bottom,12px)] pt-2">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`bg-transparent border-none cursor-pointer flex flex-col items-center
            gap-0.5 px-4 py-1 transition-colors duration-150
            ${active === t.id ? 'text-blue-500' : 'text-white/40'}`}
        >
          <span className="text-xl leading-none">{t.icon}</span>
          <span className={`text-[10px] ${active === t.id ? 'font-bold' : 'font-medium'}`}>
            {t.label}
          </span>
        </button>
      ))}
    </nav>
  );
}
