import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';

// ─── CSS Variables & Global Styles ───────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    :root {
      --primary: #6366F1;
      --primary-dark: #4F46E5;
      --primary-glow: rgba(99,102,241,0.25);
      --secondary: #8B5CF6;
      --success: #10B981;
      --warning: #F59E0B;
      --danger: #EF4444;
      --bg-light: #F7F8FC;
      --bg-dark: #12131C;
      --surface-light: #FFFFFF;
      --surface-dark: #1E1F2E;
      --text-primary-light: #1F2937;
      --text-primary-dark: #F1F5F9;
      --text-muted-light: #6B7280;
      --text-muted-dark: #94A3B8;
      --border-light: rgba(0,0,0,0.06);
      --border-dark: rgba(255,255,255,0.08);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
    
    .chat-scrollbar::-webkit-scrollbar { width: 4px; }
    .chat-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .chat-scrollbar::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 99px; }
    .chat-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.5); }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; } to { opacity: 1; }
    }
    @keyframes bounce1 { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
    @keyframes bounce2 { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
    @keyframes bounce3 { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
    @keyframes pulse-ring { 0%{box-shadow:0 0 0 0 rgba(16,185,129,0.4)} 70%{box-shadow:0 0 0 6px rgba(16,185,129,0)} 100%{box-shadow:0 0 0 0 rgba(16,185,129,0)} }
    @keyframes cardIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes urgentPulse { 0%,100%{border-color:rgba(239,68,68,0.4)} 50%{border-color:rgba(239,68,68,1)} }
    @keyframes chipHover { to{transform:scale(1.05)} }

    .msg-anim { animation: slideUp 0.22s ease-out forwards; }
    .card-anim { animation: cardIn 0.3s ease-out forwards; opacity: 0; }
    .task-card:hover { transform: translateY(-2px) !important; }
    .quick-chip:hover { transform: scale(1.05); }
    .send-btn:not(:disabled):hover { transform: scale(1.08); }
    .sidebar-item:hover { background: rgba(99,102,241,0.08); color: #6366F1; }
    .sidebar-item.active { background: rgba(99,102,241,0.12); color: #6366F1; border-left: 3px solid #6366F1; }
  `}</style>
);

// ─── Colour map for subjects ──────────────────────────────────────────────────
const MK_COLORS = {
  'Kriptografi': { bg: '#FDF2F8', text: '#9D174D', dot: '#EC4899' },
  'Kecerdasan Buatan': { bg: '#EFF6FF', text: '#1E40AF', dot: '#3B82F6' },
  'AI': { bg: '#EFF6FF', text: '#1E40AF', dot: '#3B82F6' },
  'Teknik Simulasi': { bg: '#F0FDF4', text: '#166534', dot: '#22C55E' },
  'Pemodelan': { bg: '#F0FDF4', text: '#166534', dot: '#22C55E' },
  'Data Mining': { bg: '#FFF7ED', text: '#9A3412', dot: '#F97316' },
  'Metodologi': { bg: '#F5F3FF', text: '#5B21B6', dot: '#8B5CF6' },
  'KKN': { bg: '#ECFDF5', text: '#065F46', dot: '#10B981' },
  'default': { bg: '#F8FAFC', text: '#475569', dot: '#94A3B8' },
};

function getMKColor(matkul) {
  for (const [key, val] of Object.entries(MK_COLORS)) {
    if (matkul && matkul.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return MK_COLORS.default;
}

// ─── Urgency badge ────────────────────────────────────────────────────────────
function UrgencyBadge({ days }) {
  if (days === null || days === undefined) return null;
  if (days < 1) return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:700, background:'#FEF2F2', color:'#DC2626', border:'1px solid rgba(239,68,68,0.3)', animation:'urgentPulse 1.5s ease-in-out infinite' }}>
      🔴 MENDESAK
    </span>
  );
  if (days <= 3) return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:700, background:'#FFF7ED', color:'#C2410C', border:'1px solid rgba(249,115,22,0.3)' }}>
      🟠 SEGERA
    </span>
  );
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:700, background:'#F0FDF4', color:'#15803D', border:'1px solid rgba(34,197,94,0.3)' }}>
      🟢 AMAN
    </span>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({ task, index, dark }) {
  const mkColor = getMKColor(task.matkul);
  const days = task.days;
  const urgentColor = days < 1 ? '#EF4444' : days <= 3 ? '#F59E0B' : '#10B981';
  const progress = task.progress ?? Math.min(95, Math.max(10, days !== null ? (1 - days/14)*100 : 50));
  const motivasi = days < 1 ? 'Deadline-nya mepet banget, gas sekarang! 💪' : days <= 3 ? 'Segera dikerjakan ya, jangan ditunda!' : 'Masih ada waktu, tapi jangan santai! 😊';

  return (
    <div
      className="task-card card-anim"
      style={{
        animationDelay: `${index * 60}ms`,
        background: dark ? '#1E1F2E' : '#FFFFFF',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
        borderRadius: 16,
        padding: '14px 16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'pointer',
        borderTop: `3px solid ${urgentColor}`,
      }}
    >
      {/* Badges */}
      <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:8 }}>
        <span style={{ padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:600, background:mkColor.bg, color:mkColor.text, display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:mkColor.dot, display:'inline-block' }} />
          {task.matkul || 'Mata Kuliah'}
        </span>
        <UrgencyBadge days={days} />
      </div>

      {/* Title */}
      <p style={{ fontWeight:700, fontSize:14, color: dark ? '#F1F5F9' : '#1F2937', marginBottom:6, lineHeight:1.4 }}>
        {task.title}
      </p>

      {/* Deadline */}
      <p style={{ fontSize:12, color: dark ? '#94A3B8' : '#6B7280', marginBottom:10, display:'flex', alignItems:'center', gap:4 }}>
        🕐 <span>Deadline: <strong style={{color:urgentColor}}>{task.deadline}</strong></span>
      </p>

      {/* Progress bar */}
      <div style={{ marginBottom:8 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
          <span style={{ fontSize:11, color: dark ? '#64748B' : '#9CA3AF' }}>Waktu terpakai</span>
          <span style={{ fontSize:11, fontWeight:600, color:urgentColor }}>{Math.round(progress)}%</span>
        </div>
        <div style={{ height:6, background: dark ? 'rgba(255,255,255,0.08)' : '#F1F5F9', borderRadius:99, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${progress}%`, background:`linear-gradient(90deg, ${urgentColor}88, ${urgentColor})`, borderRadius:99, transition:'width 0.8s ease' }} />
        </div>
      </div>

      {/* Motivasi */}
      <div style={{ padding:'6px 10px', background: dark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.06)', borderLeft:'3px solid #6366F1', borderRadius:'0 8px 8px 0', fontSize:12, color: dark ? '#A5B4FC' : '#6366F1', fontStyle:'italic' }}>
        💬 {motivasi}
      </div>
    </div>
  );
}

// ─── Markdown renderer ────────────────────────────────────────────────────────
function Markdown({ text, dark }) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let i = 0;
  const c = { text: dark ? '#CBD5E1' : '#374151', muted: dark ? '#94A3B8' : '#6B7280', heading: dark ? '#F1F5F9' : '#111827', accent: '#6366F1' };

  while (i < lines.length) {
    const line = lines[i];
    if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={i} style={{ border:'none', borderTop:`1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`, margin:'10px 0' }} />);
      i++; continue;
    }
    if (line.startsWith('### ')) {
      elements.push(<p key={i} style={{ fontWeight:700, fontSize:13, color:c.accent, marginTop:10, marginBottom:4 }}>{line.slice(4)}</p>);
      i++; continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<p key={i} style={{ fontWeight:700, fontSize:15, color:c.heading, marginTop:12, marginBottom:4 }}>{line.slice(3)}</p>);
      i++; continue;
    }
    if (line.startsWith('> ')) {
      elements.push(
        <div key={i} style={{ margin:'8px 0', padding:'8px 12px', borderLeft:'3px solid #6366F1', background: dark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.06)', borderRadius:'0 8px 8px 0' }}>
          <span style={{ fontSize:13, color: dark ? '#A5B4FC' : '#6366F1', fontStyle:'italic' }}>{line.slice(2)}</span>
        </div>
      );
      i++; continue;
    }
    if (line.match(/^\s*[\*\-]\s/)) {
      const bullets = [];
      while (i < lines.length && lines[i].match(/^\s*[\*\-]\s/)) {
        bullets.push(lines[i].replace(/^\s*[\*\-]\s/, ''));
        i++;
      }
      elements.push(
        <ul key={i} style={{ margin:'6px 0', paddingLeft:4 }}>
          {bullets.map((b, bi) => (
            <li key={bi} style={{ display:'flex', gap:8, marginBottom:4, fontSize:13, color:c.text }}>
              <span style={{ color:'#6366F1', marginTop:2, flexShrink:0 }}>•</span>
              <span>{inlineFmt(b, dark)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }
    if (line.match(/^\d+\.\s/)) {
      const items = [];
      let num = 1;
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        items.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol key={i} style={{ margin:'6px 0', paddingLeft:4 }}>
          {items.map((item, ii) => (
            <li key={ii} style={{ display:'flex', gap:8, marginBottom:4, fontSize:13, color:c.text }}>
              <span style={{ color:'#6366F1', fontWeight:700, flexShrink:0, minWidth:16 }}>{ii+1}.</span>
              <span>{inlineFmt(item, dark)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }
    if (line.trim() === '') { elements.push(<div key={i} style={{ height:6 }} />); i++; continue; }
    elements.push(<p key={i} style={{ fontSize:13, color:c.text, lineHeight:1.65, margin:'2px 0' }}>{inlineFmt(line, dark)}</p>);
    i++;
  }
  return <div>{elements}</div>;
}

function inlineFmt(text, dark) {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} style={{ fontWeight:700, color: dark ? '#F1F5F9' : '#111827' }}>{part.slice(2,-2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i} style={{ fontStyle:'italic' }}>{part.slice(1,-1)}</em>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i} style={{ padding:'1px 5px', background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(99,102,241,0.08)', borderRadius:4, fontSize:12, fontFamily:'monospace', color:'#6366F1' }}>{part.slice(1,-1)}</code>;
    return part;
  });
}

// ─── Extract task cards from AI response ─────────────────────────────────────
function extractTasks(text) {
  const tasks = [];
  const blocks = text.split(/\n(?=\d+\.\s|\*\*\d+\.|\n)/);
  
  const lines = text.split('\n');
  let current = null;
  
  lines.forEach(line => {
    const titleMatch = line.match(/(?:\d+\.\s+[⚠️🔴🟠🟡🟢]*\s*)\*\*(.+?)\*\*/);
    const mkMatch = line.match(/[Mm]ata [Kk]uliah[:\s]+(.+?)(?:\s*[•·]|$)/);
    const deadlineMatch = line.match(/[Dd]eadline[:\s]+\*\*(.+?)\*\*/);
    const daysMatch = line.match(/[Tt]inggal\s+\*\*(\d+)\s+hari/);
    const numMatch = line.match(/^(?:\d+|[*\-])\.\s+[⚠️🔴🟠🟡🟢]*\s*(?:\*\*)(.+?)(?:\*\*|$)/);

    if (titleMatch || numMatch) {
      if (current) tasks.push(current);
      current = { title: (titleMatch || numMatch)[1].trim(), matkul: '', deadline: '', days: null };
    } else if (mkMatch && current) {
      current.matkul = mkMatch[1].trim();
    } else if (deadlineMatch && current) {
      current.deadline = deadlineMatch[1].trim();
    } else if (daysMatch && current) {
      current.days = parseInt(daysMatch[1]);
    }
  });
  if (current && current.title) tasks.push(current);
  return tasks.filter(t => t.title && (t.deadline || t.matkul));
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingDots({ dark }) {
  return (
    <div style={{ display:'flex', alignItems:'end', gap:10, marginBottom:16 }}>
      <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>🎓</div>
      <div>
        <p style={{ fontSize:11, color:'#6366F1', fontWeight:600, marginBottom:4, marginLeft:2 }}>YMBot</p>
        <div style={{ background: dark ? '#1E1F2E' : '#FFFFFF', border:`1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`, borderRadius:'18px 18px 18px 4px', padding:'12px 16px', display:'flex', gap:5, alignItems:'center', boxShadow:'0 4px 20px rgba(0,0,0,0.08)' }}>
          {[0,1,2].map(i => (
            <span key={i} style={{ width:7, height:7, borderRadius:'50%', background:'#6366F1', display:'inline-block', animation:`bounce${i+1} 1.2s ease-in-out ${i*0.16}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function Bubble({ msg, dark }) {
  const isUser = msg.role === 'user';
  const tasks = !isUser ? extractTasks(msg.text) : [];
  const hasTasks = tasks.length > 0;

  if (isUser) return (
    <div className="msg-anim" style={{ display:'flex', justifyContent:'flex-end', marginBottom:16, gap:10 }}>
      <div style={{ maxWidth:'72%' }}>
        <div style={{ background:'linear-gradient(135deg, #6366F1, #8B5CF6)', color:'#fff', padding:'11px 16px', borderRadius:'18px 18px 4px 18px', boxShadow:'0 4px 12px rgba(99,102,241,0.25)', fontSize:13, lineHeight:1.6, letterSpacing:0.1 }}>
          {msg.text}
        </div>
        <p style={{ fontSize:11, color: dark ? '#475569' : '#9CA3AF', textAlign:'right', marginTop:4, paddingRight:4 }}>{msg.time}</p>
      </div>
    </div>
  );

  return (
    <div className="msg-anim" style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:16 }}>
      <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0, marginTop:18 }}>🎓</div>
      <div style={{ maxWidth:'78%' }}>
        <p style={{ fontSize:11, color:'#6366F1', fontWeight:600, marginBottom:4 }}>YMBot · {msg.time}</p>
        {hasTasks && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:10, marginBottom:10 }}>
            {tasks.map((t, i) => <TaskCard key={i} task={t} index={i} dark={dark} />)}
          </div>
        )}
        <div style={{ background: dark ? '#1E1F2E' : '#FFFFFF', border:`1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`, borderRadius:'18px 18px 18px 4px', padding:'12px 16px', boxShadow:'0 4px 20px rgba(0,0,0,0.08)' }}>
          <Markdown text={msg.text} dark={dark} />
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onQuick, dark }) {
  const chips = [
    { icon:'📅', label:'Jadwal hari ini', q:'Jadwal kuliah hari ini apa aja?' },
    { icon:'⚠️', label:'Tugas mendesak', q:'Tugas apa yang deadline-nya paling dekat?' },
    { icon:'📝', label:'Semua tugas', q:'Tampilkan semua tugas yang belum dikerjakan' },
  ];
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:32, textAlign:'center', gap:20 }}>
      <svg width="120" height="100" viewBox="0 0 120 100" fill="none">
        <circle cx="60" cy="38" r="30" fill="url(#grad1)" opacity="0.15"/>
        <text x="60" y="48" textAnchor="middle" fontSize="32">🎓</text>
        <rect x="20" y="72" width="80" height="10" rx="5" fill="#6366F1" opacity="0.15"/>
        <rect x="30" y="84" width="60" height="8" rx="4" fill="#8B5CF6" opacity="0.1"/>
        <defs><linearGradient id="grad1" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#6366F1"/><stop offset="1" stopColor="#8B5CF6"/></linearGradient></defs>
      </svg>
      <div>
        <h2 style={{ fontSize:22, fontWeight:800, color: dark ? '#F1F5F9' : '#1F2937', marginBottom:8 }}>Halo! Gue YMBot 👋</h2>
        <p style={{ fontSize:13, color: dark ? '#94A3B8' : '#6B7280', lineHeight:1.7, maxWidth:300 }}>
          Asisten akademik kamu di UYM. Gue bisa bantu cek jadwal kuliah, deadline tugas, dan info akademik lainnya.
        </p>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:10, justifyContent:'center' }}>
        {chips.map((c, i) => (
          <button key={i} onClick={() => onQuick(c.q)} className="quick-chip"
            style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 18px', background: dark ? 'rgba(99,102,241,0.12)' : '#FFFFFF', border:`1px solid ${dark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)'}`, borderRadius:99, fontSize:13, color:'#6366F1', fontWeight:600, cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', transition:'transform 0.15s ease, box-shadow 0.15s ease' }}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ open, onClose, onQuick, onNew, dark, active, setActive }) {
  const items = [
    { icon:'📅', label:'Jadwal Hari Ini', q:'Jadwal kuliah hari ini apa aja?' },
    { icon:'⚠️', label:'Tugas Mendesak', q:'Tugas apa yang deadline-nya paling dekat?' },
    { icon:'📝', label:'Semua Tugas', q:'Tampilkan semua tugas yang belum dikerjakan' },
    { icon:'📊', label:'Jadwal Minggu Ini', q:'Jadwal kuliah minggu ini apa aja?' },
  ];

  const s = {
    sidebar: { position:'fixed', top:0, left:0, height:'100%', width:240, background: dark ? '#0F1117' : '#FFFFFF', borderRight:`1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}`, zIndex:40, display:'flex', flexDirection:'column', transition:'transform 0.28s cubic-bezier(0.4,0,0.2,1)', transform: open ? 'translateX(0)' : 'translateX(-100%)' },
    overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', zIndex:39, display: open ? 'block' : 'none', backdropFilter:'blur(2px)' },
  };

  return (
    <>
      <div style={s.overlay} onClick={onClose} />
      <div style={s.sidebar}>
        <div style={{ padding:'16px 12px 12px', borderBottom:`1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
          <button onClick={onNew} style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.12))', border:'1px dashed rgba(99,102,241,0.35)', borderRadius:12, fontSize:13, color:'#6366F1', fontWeight:600, cursor:'pointer', transition:'background 0.15s' }}>
            <span style={{ fontSize:16 }}>+</span> Percakapan Baru
          </button>
        </div>
        <div style={{ padding:'12px 8px', flex:1, overflowY:'auto' }}>
          <p style={{ fontSize:10, fontWeight:700, color: dark ? '#475569' : '#9CA3AF', textTransform:'uppercase', letterSpacing:'0.08em', padding:'0 8px', marginBottom:6 }}>Akses Cepat</p>
          {items.map((item, i) => (
            <button key={i} onClick={() => { onQuick(item.q); setActive(i); onClose(); }} className={`sidebar-item ${active===i ? 'active' : ''}`}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:10, border:'none', background:'transparent', fontSize:13, color: dark ? '#94A3B8' : '#4B5563', cursor:'pointer', textAlign:'left', transition:'all 0.15s', marginBottom:2 }}>
              <span>{item.icon}</span><span>{item.label}</span>
            </button>
          ))}
        </div>
        <div style={{ padding:'12px 16px', borderTop:`1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
          <p style={{ fontSize:11, color: dark ? '#475569' : '#9CA3AF', textAlign:'center' }}>YMBot v1.0 · UYM 2025/2026</p>
        </div>
      </div>
    </>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function Chat({ username, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const now = () => new Date().toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages, loading]);

  const send = useCallback(async (customMsg) => {
    const pesan = (customMsg || input).trim();
    if (!pesan || loading) return;
    setInput('');
    setMessages(p => [...p, { role:'user', text:pesan, time:now() }]);
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:3001/api/chat', { username, pesan });
      setMessages(p => [...p, { role:'bot', text:res.data.jawaban, time:now() }]);
    } catch {
      setMessages(p => [...p, { role:'bot', text:'❌ Gagal konek ke server. Pastikan backend jalan ya!', time:now() }]);
    }
    setLoading(false);
    inputRef.current?.focus();
  }, [input, loading, username]);

  const chips = [
    { icon:'⚠️', label:'Tugas terdekat', q:'Tugas apa yang deadline-nya paling dekat?' },
    { icon:'📅', label:'Jadwal minggu ini', q:'Jadwal kuliah minggu ini apa aja?' },
    { icon:'📝', label:'Belum dikerjakan', q:'Tampilkan semua tugas yang belum dikerjakan' },
  ];

  const bg = dark
    ? 'linear-gradient(135deg, #12131C 0%, #0B0C14 100%)'
    : `radial-gradient(ellipse at 10% 0%, rgba(99,102,241,0.07) 0%, transparent 60%), #F7F8FC`;

  const dotGrid = dark
    ? `radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)`
    : `radial-gradient(rgba(99,102,241,0.06) 1px, transparent 1px)`;

  return (
    <>
      <GlobalStyles />
      <div style={{ display:'flex', height:'100vh', overflow:'hidden', fontFamily:"'Inter',-apple-system,sans-serif" }}>

        {/* Sidebar */}
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onQuick={send} onNew={() => setMessages([])} dark={dark} active={activeNav} setActive={setActiveNav} />

        {/* Main */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, height:'100%', overflow:'hidden' }}>

          {/* Header */}
          <header style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 20px', background: dark ? '#0F1117' : '#FFFFFF', borderBottom:`1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}`, boxShadow:`0 1px 12px ${dark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.06)'}`, zIndex:10, flexShrink:0 }}>
            <button onClick={() => setSidebarOpen(true)} style={{ padding:'7px 9px', borderRadius:10, border:'none', background: dark ? 'rgba(255,255,255,0.06)' : '#F3F4F6', cursor:'pointer', fontSize:16, color: dark ? '#94A3B8' : '#6B7280', flexShrink:0 }}>☰</button>

            <div style={{ width:38, height:38, borderRadius:12, background:'linear-gradient(135deg,#6366F1,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, boxShadow:'0 4px 12px rgba(99,102,241,0.3)', flexShrink:0 }}>🎓</div>

            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontWeight:800, fontSize:15, color: dark ? '#F1F5F9' : '#1F2937' }}>YMBot</span>
                <div style={{ display:'flex', alignItems:'center', gap:5, padding:'2px 8px', background:'rgba(16,185,129,0.1)', borderRadius:99 }}>
                  <span style={{ width:7, height:7, borderRadius:'50%', background:'#10B981', display:'inline-block', animation:'pulse-ring 2s ease-in-out infinite' }} />
                  <span style={{ fontSize:11, fontWeight:600, color:'#10B981' }}>Online</span>
                </div>
              </div>
              <p style={{ fontSize:11, color: dark ? '#475569' : '#9CA3AF', marginTop:1 }}>Asisten Akademik UYM</p>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <button onClick={() => setDark(!dark)} style={{ padding:'7px', borderRadius:10, border:'none', background: dark ? 'rgba(255,255,255,0.06)' : '#F3F4F6', cursor:'pointer', fontSize:15 }}>{dark ? '☀️' : '🌙'}</button>
              <div style={{ display:'flex', alignItems:'center', gap:8, paddingLeft:8, borderLeft:`1px solid ${dark ? 'rgba(255,255,255,0.08)' : '#E5E7EB'}` }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:12, fontWeight:700 }}>
                  {username?.slice(0,2).toUpperCase()}
                </div>
                <div style={{ display:'flex', flexDirection:'column', lineHeight:1.3 }}>
                  <span style={{ fontSize:12, fontWeight:600, color: dark ? '#E2E8F0' : '#374151' }}>{username}</span>
                  <span style={{ fontSize:10, color: dark ? '#475569' : '#9CA3AF' }}>Mahasiswa</span>
                </div>
                <button onClick={onLogout} title="Logout" style={{ padding:'5px 7px', borderRadius:8, border:'none', background: dark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.06)', cursor:'pointer', fontSize:13, color:'#EF4444' }}>⏏</button>
              </div>
            </div>
          </header>

          {/* Chat area */}
          <div className="chat-scrollbar" style={{ flex:1, overflowY:'auto', background:bg, backgroundSize:'20px 20px', backgroundImage:`${dotGrid}, ${bg}`, padding:'20px 20px 8px', display:'flex', flexDirection:'column' }}>
            {messages.length === 0 ? (
              <EmptyState onQuick={send} dark={dark} />
            ) : (
              <div style={{ maxWidth:760, width:'100%', margin:'0 auto', flex:1 }}>
                {messages.map((msg, i) => <Bubble key={i} msg={msg} dark={dark} />)}
                {loading && <TypingDots dark={dark} />}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Input area */}
          <div style={{ background: dark ? '#0F1117' : '#FFFFFF', borderTop:`1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}`, boxShadow:`0 -4px 20px ${dark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.06)'}`, padding:'12px 20px 16px', flexShrink:0 }}>
            <div style={{ maxWidth:760, margin:'0 auto' }}>
              {/* Quick chips */}
              <div style={{ display:'flex', gap:8, marginBottom:10, overflowX:'auto', paddingBottom:2 }}>
                {chips.map((c, i) => (
                  <button key={i} onClick={() => send(c.q)} className="quick-chip"
                    style={{ flexShrink:0, display:'flex', alignItems:'center', gap:5, padding:'6px 14px', background: dark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.06)', border:`1px solid ${dark ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.2)'}`, borderRadius:99, fontSize:12, color:'#6366F1', fontWeight:600, cursor:'pointer', transition:'transform 0.15s ease, background 0.15s ease', whiteSpace:'nowrap' }}>
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>

              {/* Input box */}
              <div style={{ display:'flex', alignItems:'center', gap:10, background: dark ? 'rgba(255,255,255,0.05)' : '#F8F9FC', border:`1.5px solid ${dark ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.2)'}`, borderRadius:24, padding:'8px 8px 8px 18px', boxShadow:`0 2px 12px ${dark ? 'rgba(0,0,0,0.2)' : 'rgba(99,102,241,0.08)'}`, transition:'border-color 0.2s, box-shadow 0.2s' }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                  disabled={loading}
                  placeholder="Tanya jadwal atau tugas kamu..."
                  style={{ flex:1, background:'transparent', border:'none', outline:'none', fontSize:13, color: dark ? '#E2E8F0' : '#374151', lineHeight:1.5 }}
                />
                <button
                  onClick={() => send()}
                  disabled={loading || !input.trim()}
                  className="send-btn"
                  style={{ width:38, height:38, borderRadius:'50%', border:'none', background: (!loading && input.trim()) ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : dark ? 'rgba(255,255,255,0.08)' : '#E5E7EB', cursor: (!loading && input.trim()) ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow: (!loading && input.trim()) ? '0 4px 12px rgba(99,102,241,0.35)' : 'none', transition:'all 0.2s ease' }}>
                  {loading
                    ? <span style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#6366F1', borderRadius:'50%', display:'inline-block', animation:'bounce1 0.8s linear infinite' }} />
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={(!loading && input.trim()) ? '#fff' : '#9CA3AF'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  }
                </button>
              </div>
              <p style={{ textAlign:'center', fontSize:11, color: dark ? '#374151' : '#9CA3AF', marginTop:8 }}>Enter untuk kirim · YMBot bisa salah, selalu cek info resmi kampus</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}