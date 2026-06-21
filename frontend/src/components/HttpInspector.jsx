import { useState } from 'react';

function JsonView({ data }) {
  if (data === null || data === undefined) return <span className="text-slate-500">null</span>;
  if (typeof data === 'string') {
    // Try to parse as JSON for nested display
    try {
      const parsed = JSON.parse(data);
      return <JsonView data={parsed} />;
    } catch { /* not JSON */ }
    return <span className="text-emerald-300">"{data}"</span>;
  }
  if (typeof data === 'number') return <span className="text-yellow-300">{data}</span>;
  if (typeof data === 'boolean') return <span className="text-purple-300">{String(data)}</span>;
  if (Array.isArray(data)) {
    return (
      <span>
        {'['}<div className="ml-4">{data.map((v, i) => <div key={i}><JsonView data={v} />{i < data.length - 1 ? ',' : ''}</div>)}</div>{']'}
      </span>
    );
  }
  if (typeof data === 'object') {
    const entries = Object.entries(data);
    return (
      <span>
        {'{'}<div className="ml-4">
          {entries.map(([k, v], i) => (
            <div key={k}>
              <span className="text-blue-300">"{k}"</span>
              <span className="text-slate-400">: </span>
              <JsonView data={v} />
              {i < entries.length - 1 ? ',' : ''}
            </div>
          ))}
        </div>{'}'}
      </span>
    );
  }
  return <span>{String(data)}</span>;
}

function HeadersView({ headers }) {
  if (!headers || Object.keys(headers).length === 0) return <span className="text-slate-500 italic">none</span>;
  return (
    <div>
      {Object.entries(headers).map(([k, v]) => (
        <div key={k}>
          <span className="text-blue-300">{k}</span>
          <span className="text-slate-400">: </span>
          <span className="text-emerald-300 break-all">{v}</span>
        </div>
      ))}
    </div>
  );
}

export default function HttpInspector({ request, response, loading }) {
  const [tab, setTab] = useState('response');

  if (!request && !response && !loading) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 text-center text-slate-500 text-sm">
        HTTP traffic will appear here when you run the demo
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
      <div className="flex border-b border-slate-700">
        {['request', 'response'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
              tab === t ? 'bg-slate-800 text-white border-b-2 border-blue-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t}
          </button>
        ))}
        {loading && <span className="ml-auto px-4 py-2 text-xs text-yellow-400 animate-pulse">Sending...</span>}
      </div>

      <div className="p-4 font-mono text-xs overflow-auto max-h-80">
        {tab === 'request' && request && (
          <div>
            <div className="text-yellow-300 font-bold mb-2">
              {request.method} {request.url}
            </div>
            <div className="text-slate-400 mb-1">Headers:</div>
            <HeadersView headers={request.headers} />
            {request.body && (
              <>
                <div className="text-slate-400 mt-2 mb-1">Body:</div>
                <JsonView data={request.body} />
              </>
            )}
          </div>
        )}

        {tab === 'response' && response && (
          <div>
            <div className={`font-bold mb-2 ${response.status < 300 ? 'text-emerald-400' : response.status < 400 ? 'text-yellow-400' : 'text-red-400'}`}>
              {response.status} {response.statusText}
            </div>
            <div className="text-slate-400 mb-1">Headers:</div>
            <HeadersView headers={response.headers} />
            {response.body !== undefined && (
              <>
                <div className="text-slate-400 mt-2 mb-1">Body:</div>
                <JsonView data={response.body} />
              </>
            )}
          </div>
        )}

        {!request && tab === 'request' && <span className="text-slate-600 italic">No request yet</span>}
        {!response && tab === 'response' && !loading && <span className="text-slate-600 italic">No response yet</span>}
      </div>
    </div>
  );
}
