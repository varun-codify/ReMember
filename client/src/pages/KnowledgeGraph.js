import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import EmptyState from '../components/EmptyState';
import api from '../api';

const TYPE_META = {
  video: { icon: '▶', label: 'Video', color: 'var(--accent-green)' },
  website: { icon: '🔗', label: 'Link', color: 'var(--accent-blue)' },
  note: { icon: '📝', label: 'Note', color: 'var(--accent-yellow)' },
};

const TYPE_HREF = { video: '/videos', website: '/websites', note: '/notes' };

// A small homegrown force simulation: repulsion between all pairs, springs
// along links, gentle centering, velocity damping. Runs synchronously on the
// client — no external d3 dependency needed.
function simulate(nodes, links, iterations = 280) {
  const N = nodes.length;
  const W = 640;
  const H = 460;
  const positions = nodes.map((_, i) => {
    const angle = (i / Math.max(1, N)) * Math.PI * 2;
    return { x: W / 2 + Math.cos(angle) * (W / 4), y: H / 2 + Math.sin(angle) * (H / 4) };
  });
  const vels = positions.map(() => ({ x: 0, y: 0 }));
  const k = 90; // spring rest length

  for (let iter = 0; iter < iterations; iter++) {
    // Repulsion
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        let dx = positions[i].x - positions[j].x;
        let dy = positions[i].y - positions[j].y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) {
          positions[j].x += (Math.random() - 0.5) * 4;
          positions[j].y += (Math.random() - 0.5) * 4;
          d2 = 1;
        }
        const d = Math.sqrt(d2);
        const force = 14000 / d2;
        const fx = (dx / d) * force;
        const fy = (dy / d) * force;
        vels[i].x += fx;
        vels[i].y += fy;
        vels[j].x -= fx;
        vels[j].y -= fy;
      }
    }
    // Springs
    for (const link of links) {
      const a = positions[link.source];
      const b = positions[link.target];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const d = Math.max(0.01, Math.sqrt(dx * dx + dy * dy));
      const force = (d - k) * 0.02;
      const fx = (dx / d) * force;
      const fy = (dy / d) * force;
      vels[link.source].x -= fx;
      vels[link.source].y -= fy;
      vels[link.target].x += fx;
      vels[link.target].y += fy;
    }
    // Center + damp, with a per-iteration displacement cap so degenerate
    // starting positions (overlapping nodes) can't scatter the graph out of view.
    for (let i = 0; i < N; i++) {
      vels[i].x += (W / 2 - positions[i].x) * 0.004;
      vels[i].y += (H / 2 - positions[i].y) * 0.004;
      vels[i].x *= 0.82;
      vels[i].y *= 0.82;
      const maxStep = 24;
      positions[i].x += Math.max(-maxStep, Math.min(maxStep, vels[i].x));
      positions[i].y += Math.max(-maxStep, Math.min(maxStep, vels[i].y));
    }
  }
  return positions;
}

const KnowledgeGraph = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all'); // all | video | website | note
  const [activeTag, setActiveTag] = useState(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [showLabels, setShowLabels] = useState(true);

  useEffect(() => {
    api.get('/graph')
      .then((res) => setData(res.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const { nodes, links } = useMemo(() => {
    if (!data) return { nodes: [], links: [] };
    let visible = data.nodes.filter(
      (n) =>
        (typeFilter === 'all' || n.type === typeFilter) &&
        (!query || n.label.toLowerCase().includes(query.toLowerCase()))
    );
    if (activeTag) {
      visible = visible.filter((n) => (n.tags || []).some((t) => t.toLowerCase() === activeTag));
    }
    const idSet = new Set(visible.map((n) => n.id));
    const indexMap = new Map(visible.map((n, i) => [n.id, i]));

    const keptLinks = [];
    for (const link of data.links) {
      const srcNode = data.nodes[link.source];
      const tgtNode = data.nodes[link.target];
      if (idSet.has(srcNode.id) && idSet.has(tgtNode.id)) {
        keptLinks.push({ source: indexMap.get(srcNode.id), target: indexMap.get(tgtNode.id), tag: link.tag });
      }
    }
    return { nodes: visible, links: keptLinks };
  }, [data, typeFilter, activeTag, query]);

  const positions = useMemo(() => simulate(nodes, links), [nodes, links]);

  const neighborSet = useMemo(() => {
    const set = new Set();
    if (!selected) return set;
    links.forEach((l) => {
      if (nodes[l.source]?.id === selected) set.add(nodes[l.target]?.id);
      if (nodes[l.target]?.id === selected) set.add(nodes[l.source]?.id);
    });
    return set;
  }, [selected, links, nodes]);

  const degrees = useMemo(() => {
    const d = new Map(nodes.map((n) => [n.id, 0]));
    links.forEach((l) => {
      const a = nodes[l.source]?.id;
      const b = nodes[l.target]?.id;
      if (a) d.set(a, d.get(a) + 1);
      if (b) d.set(b, d.get(b) + 1);
    });
    return d;
  }, [nodes, links]);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="neo-spinner" style={{ width: '48px', height: '48px', borderWidth: '4px' }}></div>
        </div>
      </div>
    );
  }

  const selectedNode = selected ? nodes.find((n) => n.id === selected) : null;
  const connectedNodes = selectedNode
    ? links
        .filter((l) => nodes[l.source]?.id === selected || nodes[l.target]?.id === selected)
        .map((l) => (nodes[l.source]?.id === selected ? nodes[l.target] : nodes[l.source]))
    : [];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Navbar />
      <main className="neo-container py-16">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10 neo-animate-in">
          <div>
            <h1 className="neo-title text-5xl mb-2">Knowledge Graph</h1>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              See how your saved items connect through shared tags
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/assistant" className="neo-btn neo-btn-primary">🤖 Ask the assistant</Link>
            <Link to="/capture" className="neo-btn neo-btn-secondary">＋ Capture</Link>
          </div>
        </div>

        {!data || data.nodes.length === 0 ? (
          <EmptyState
            icon="🕸"
            iconColor="neo-icon-purple"
            title="Nothing to connect yet"
            description="Save videos, links, and notes with tags — ReMember will draw the connections between them automatically."
            actions={[{ label: '⚡ Quick capture', variant: 'primary', to: '/capture' }]}
          />
        ) : nodes.length === 0 ? (
          <div className="neo-card text-center py-12 neo-animate-in">
            <div className="text-5xl mb-3">🔍</div>
            <h2 className="neo-title text-2xl mb-2">No nodes match your filters</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Try a different type, topic, or search term.
            </p>
            <button
              onClick={() => { setTypeFilter('all'); setActiveTag(null); setQuery(''); }}
              className="neo-btn neo-btn-primary"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
            {/* Graph */}
            <div>
              <div className="neo-card mb-4">
                {/* Controls */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <div className="flex gap-2">
                    {[{ key: 'all', label: 'All' }, ...Object.entries(TYPE_META).map(([key, m]) => ({ key, label: `${m.icon} ${m.label}s` }))].map((t) => (
                      <button
                        key={t.key}
                        onClick={() => { setTypeFilter(t.key); setSelected(null); }}
                        className="neo-btn neo-btn-sm"
                        style={typeFilter === t.key
                          ? { background: 'var(--accent-yellow)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)', boxShadow: 'var(--shadow-sm)' }
                          : {}}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
                    placeholder="Filter nodes…"
                    className="neo-input flex-1 min-w-[140px]"
                    aria-label="Filter nodes"
                  />
                  <button
                    onClick={() => setShowLabels(!showLabels)}
                    className="neo-btn neo-btn-sm neo-btn-secondary"
                    title="Toggle labels"
                  >
                    {showLabels ? 'Hide labels' : 'Show labels'}
                  </button>
                </div>

                {/* SVG */}
                <div className="w-full overflow-hidden rounded-lg" style={{ background: 'var(--bg-secondary)', border: '2.5px solid var(--border-primary)' }}>
                  <svg viewBox="0 0 640 460" className="w-full" style={{ minHeight: '340px' }} role="img" aria-label="Knowledge graph">
                    {/* Links */}
                    {links.map((link, i) => {
                      const a = positions[link.source];
                      const b = positions[link.target];
                      const dimmed = selected && !neighborSet.has(nodes[link.source]?.id) && !neighborSet.has(nodes[link.target]?.id) && nodes[link.source]?.id !== selected && nodes[link.target]?.id !== selected;
                      return (
                        <line
                          key={`l-${i}`}
                          x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                          stroke={dimmed ? 'var(--border-light)' : 'var(--border-primary)'}
                          strokeWidth={dimmed ? 1 : 2}
                          opacity={dimmed ? 0.25 : 0.8}
                        />
                      );
                    })}

                    {/* Nodes */}
                    {nodes.map((node, i) => {
                      const pos = positions[i];
                      const degree = degrees.get(node.id) || 0;
                      const radius = Math.min(8 + degree * 1.8, 20);
                      const isSelected = node.id === selected;
                      const isNeighbor = neighborSet.has(node.id);
                      const dimmed = selected && !isSelected && !isNeighbor;
                      const highlight = activeTag && (node.tags || []).some((t) => t.toLowerCase() === activeTag);
                      const color = TYPE_META[node.type]?.color || 'var(--text-secondary)';
                      return (
                        <g key={node.id} onClick={() => setSelected(node.id === selected ? null : node.id)} style={{ cursor: 'pointer' }}>
                          {isSelected && (
                            <circle cx={pos.x} cy={pos.y} r={radius + 6} fill="none" stroke="var(--accent-coral)" strokeWidth={3} />
                          )}
                          <circle
                            cx={pos.x} cy={pos.y} r={radius}
                            fill={highlight ? 'var(--accent-coral)' : color}
                            stroke="var(--text-primary)"
                            strokeWidth={isNeighbor ? 3 : 2}
                            opacity={dimmed ? 0.25 : 1}
                          />
                          {showLabels && (
                            <text
                              x={pos.x} y={pos.y - radius - 5}
                              textAnchor="middle"
                              fontSize="10"
                              fontWeight="700"
                              fill="var(--text-secondary)"
                              opacity={dimmed ? 0.25 : 1}
                              style={{ pointerEvents: 'none' }}
                            >
                              {node.label.length > 22 ? `${node.label.slice(0, 22)}…` : node.label}
                            </text>
                          )}
                          {isSelected && (
                            <text x={pos.x} y={pos.y + radius + 14} textAnchor="middle" fontSize="14" style={{ pointerEvents: 'none' }}>
                              {TYPE_META[node.type]?.icon}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 mt-4 text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                  {Object.entries(TYPE_META).map(([type, m]) => (
                    <span key={type} className="flex items-center gap-1.5">
                      <span className="inline-block w-3 h-3 rounded-full border-2" style={{ background: m.color, borderColor: 'var(--text-primary)' }}></span>
                      {m.label}
                    </span>
                  ))}
                  <span className="ml-auto">Click a node for details</span>
                </div>
              </div>

              {/* Topics */}
              {data.topics.length > 0 && (
                <div className="neo-card">
                  <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>🏷 Top topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {data.topics.map((t) => (
                      <button
                        key={t.tag}
                        onClick={() => { setActiveTag(activeTag === t.tag ? null : t.tag); setSelected(null); }}
                        className="neo-badge text-sm transition-all hover:translate-y-[-1px]"
                        style={
                          activeTag === t.tag
                            ? { background: 'var(--accent-coral)', color: 'white', borderColor: 'var(--border-primary)' }
                            : { cursor: 'pointer' }
                        }
                      >
                        #{t.tag} <strong>{t.count}</strong>
                      </button>
                    ))}
                    {activeTag && (
                      <button onClick={() => setActiveTag(null)} className="neo-link text-sm font-bold">Clear filter ✕</button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Details panel */}
            <div className="space-y-6">
              {selectedNode ? (
                <div className="neo-card-sm neo-animate-in">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl" style={{ color: TYPE_META[selectedNode.type]?.color }}>
                      {TYPE_META[selectedNode.type]?.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                        {TYPE_META[selectedNode.type]?.label.toUpperCase()}
                      </p>
                      <h3 className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>{selectedNode.label}</h3>
                    </div>
                  </div>

                  {selectedNode.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedNode.tags.map((tag) => (
                        <span key={tag} className="neo-badge neo-badge-white text-xs">#{tag}</span>
                      ))}
                    </div>
                  )}

                  {connectedNodes.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>CONNECTED TO</p>
                      <div className="space-y-1.5">
                        {connectedNodes.slice(0, 6).map((n) => (
                          <button
                            key={n.id}
                            onClick={() => setSelected(n.id)}
                            className="block w-full text-left text-sm font-bold truncate neo-link"
                          >
                            {TYPE_META[n.type]?.icon} {n.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2" style={{ borderTop: '2px solid var(--border-light)' }}>
                    <Link to={TYPE_HREF[selectedNode.type]} className="neo-btn neo-btn-sm neo-btn-primary flex-1 text-center">
                      Open {TYPE_META[selectedNode.type]?.label}
                    </Link>
                    <button onClick={() => setSelected(null)} className="neo-btn neo-btn-sm neo-btn-secondary">Close</button>
                  </div>
                </div>
              ) : (
                <div className="neo-card-sm">
                  <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>🕸 Explore</h3>
                  <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <li className="flex gap-2"><span style={{ color: 'var(--accent-coral)' }}>•</span> Lines connect items that share a tag.</li>
                    <li className="flex gap-2"><span style={{ color: 'var(--accent-coral)' }}>•</span> Bigger nodes connect to more things.</li>
                    <li className="flex gap-2"><span style={{ color: 'var(--accent-coral)' }}>•</span> Click a topic chip to spotlight that cluster.</li>
                    <li className="flex gap-2"><span style={{ color: 'var(--accent-coral)' }}>•</span> Click any node to see what it's linked to.</li>
                  </ul>
                  <div className="mt-5 text-center text-4xl">🕸✨</div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default KnowledgeGraph;
