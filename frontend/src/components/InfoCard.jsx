export default function InfoCard({ title, children, color = 'blue' }) {
  const border = { blue: 'border-blue-500/40', emerald: 'border-emerald-500/40', purple: 'border-purple-500/40', orange: 'border-orange-500/40', yellow: 'border-yellow-500/40', rose: 'border-rose-500/40' };
  const text = { blue: 'text-blue-300', emerald: 'text-emerald-300', purple: 'text-purple-300', orange: 'text-orange-300', yellow: 'text-yellow-300', rose: 'text-rose-300' };
  return (
    <div className={`bg-slate-800/60 border ${border[color]} rounded-lg p-4 mb-4`}>
      {title && <div className={`text-xs font-semibold uppercase tracking-widest mb-2 ${text[color]}`}>{title}</div>}
      <div className="text-slate-300 text-sm leading-relaxed">{children}</div>
    </div>
  );
}
