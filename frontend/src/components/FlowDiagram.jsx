import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ACTOR_COLORS = {
  Client: 'bg-blue-600 border-blue-400',
  Server: 'bg-emerald-700 border-emerald-500',
  AuthServer: 'bg-purple-700 border-purple-500',
};

const ARROW_COLORS = {
  Client: '#60a5fa',
  Server: '#34d399',
  AuthServer: '#a78bfa',
};

export default function FlowDiagram({ steps, actors = ['Client', 'Server'] }) {
  const [current, setCurrent] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setCurrent(c => {
          if (c >= steps.length - 1) { setPlaying(false); return c; }
          return c + 1;
        });
      }, 1800);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, steps.length]);

  const reset = () => { setCurrent(-1); setPlaying(false); };
  const prev = () => setCurrent(c => Math.max(-1, c - 1));
  const next = () => setCurrent(c => Math.min(steps.length - 1, c + 1));

  const actorIndex = a => actors.indexOf(a);
  const colWidth = 100 / actors.length;

  const step = current >= 0 ? steps[current] : null;

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 p-4 select-none">
      <div className="flex gap-4">
        {/* Diagram */}
        <div className="flex-1 min-w-0">
          <div className="relative" style={{ minHeight: `${steps.length * 72 + 80}px` }}>
            {/* Actor headers */}
            <div className="flex mb-4">
              {actors.map(a => (
                <div key={a} className="flex-1 flex justify-center">
                  <div className={`px-4 py-2 rounded-lg border text-sm font-semibold text-white ${ACTOR_COLORS[a] ?? 'bg-slate-700 border-slate-500'}`}>
                    {a === 'AuthServer' ? 'Auth Server' : a}
                  </div>
                </div>
              ))}
            </div>

            {/* Vertical lifelines */}
            {actors.map((a, i) => (
              <div
                key={a}
                className="absolute top-14 bottom-0 border-l-2 border-dashed border-slate-600"
                style={{ left: `${colWidth * i + colWidth / 2}%` }}
              />
            ))}

            {/* Steps */}
            {steps.map((s, i) => {
              const fromIdx = actorIndex(s.from);
              const toIdx = actorIndex(s.to);
              const fromPct = colWidth * fromIdx + colWidth / 2;
              const toPct = colWidth * toIdx + colWidth / 2;
              const top = 60 + i * 68;
              const isActive = i === current;
              const isPast = i < current;
              const color = ARROW_COLORS[s.from] ?? '#94a3b8';

              return (
                <div key={i} className="absolute w-full" style={{ top }}>
                  {/* Arrow line */}
                  <motion.div
                    className="absolute h-0.5 origin-left"
                    style={{
                      left: `${Math.min(fromPct, toPct)}%`,
                      width: `${Math.abs(toPct - fromPct)}%`,
                      backgroundColor: color,
                      opacity: isPast ? 0.4 : isActive ? 1 : 0.15,
                      top: 10,
                    }}
                    animate={{ scaleX: isActive ? [0, 1] : 1 }}
                    transition={{ duration: 0.4 }}
                  />
                  {/* Arrowhead */}
                  <div
                    className="absolute w-0 h-0"
                    style={{
                      top: 4,
                      left: toPct > fromPct ? `calc(${toPct}% - 10px)` : `calc(${toPct}%)`,
                      borderTop: '7px solid transparent',
                      borderBottom: '7px solid transparent',
                      ...(toPct > fromPct
                        ? { borderLeft: `10px solid ${color}` }
                        : { borderRight: `10px solid ${color}` }),
                      opacity: isPast ? 0.4 : isActive ? 1 : 0.15,
                    }}
                  />
                  {/* Label */}
                  <div
                    className={`absolute text-xs font-mono text-center px-2 py-0.5 rounded transition-all duration-300 ${
                      isActive ? 'text-white font-bold' : isPast ? 'text-slate-500' : 'text-slate-600'
                    }`}
                    style={{
                      left: `${Math.min(fromPct, toPct) + Math.abs(toPct - fromPct) / 2}%`,
                      transform: 'translateX(-50%)',
                      top: -16,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {s.label}
                  </div>
                  {/* Step number bubble */}
                  <div
                    className={`absolute w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border transition-all duration-300 ${
                      isActive ? 'bg-yellow-400 border-yellow-300 text-black scale-125' :
                      isPast ? 'bg-slate-600 border-slate-500 text-slate-300' :
                      'bg-slate-800 border-slate-600 text-slate-500'
                    }`}
                    style={{ left: `calc(${fromPct}% - 10px)`, top: 2 }}
                  >
                    {i + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail panel — right side */}
        <div className="w-72 shrink-0 flex flex-col">
          <AnimatePresence mode="wait">
            {step ? (
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm flex-1"
              >
                <div className="text-yellow-300 font-semibold mb-1 text-xs">Step {current + 1} / {steps.length}</div>
                <div className="text-white text-xs font-medium mb-2">{step.label}</div>
                <div className="text-slate-300 text-xs leading-relaxed">{step.detail}</div>
                {step.code && (
                  <pre className="mt-2 bg-slate-950 text-emerald-300 text-xs p-2 rounded overflow-x-auto whitespace-pre-wrap">{step.code}</pre>
                )}
              </motion.div>
            ) : (
              <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-3 flex-1 flex items-center justify-center">
                <span className="text-slate-600 text-xs text-center">Press Play or Next to walk through the flow</span>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 mt-4">
        <button onClick={reset} className="px-3 py-1.5 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors">Reset</button>
        <button onClick={prev} disabled={current < 0} className="px-3 py-1.5 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-300 disabled:opacity-30 transition-colors">← Prev</button>
        <button onClick={next} disabled={current >= steps.length - 1} className="px-3 py-1.5 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-300 disabled:opacity-30 transition-colors">Next →</button>
        <button
          onClick={() => setPlaying(p => !p)}
          className={`px-4 py-1.5 text-xs rounded font-semibold transition-colors ${playing ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
        >
          {playing ? 'Pause' : 'Play All'}
        </button>
        <span className="ml-auto text-xs text-slate-500">{Math.max(0, current + 1)} / {steps.length}</span>
      </div>
    </div>
  );
}
