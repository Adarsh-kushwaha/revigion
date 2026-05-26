// Revigion — minimal revision-tracker prototype
// Screens: Login, Home, Subject, Question
// Modals: Add Subject, Add Question, Profile

const { useState, useEffect, useMemo, useRef } = React;

// ─────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────
const T = {
  bg: '#FAFAF6',
  surface: '#FFFFFF',
  fg: '#111110',
  muted: '#6B6A65',
  faint: '#9C9B95',
  hair: 'rgba(17,17,16,0.08)',
  hairStrong: 'rgba(17,17,16,0.14)',
  // states
  blue: 'oklch(0.58 0.12 250)',
  blueSoft: 'oklch(0.96 0.02 250)',
  blueLine: 'oklch(0.86 0.04 250)',
  amber: 'oklch(0.78 0.12 80)',
  amberSoft: 'oklch(0.96 0.04 85)',
  amberLine: 'oklch(0.86 0.07 80)',
  green: 'oklch(0.62 0.12 150)',
  greenSoft: 'oklch(0.95 0.03 150)',
  greenLine: 'oklch(0.84 0.05 150)',
};

const F_SANS = '"Geist", -apple-system, system-ui, sans-serif';
const F_MONO = '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

// ─────────────────────────────────────────────────────────────
// Tiny icons (line, 1.5 stroke)
// ─────────────────────────────────────────────────────────────
const Ic = {
  plus: (s=18,c='currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  chevL: (s=18,c='currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M15 6l-6 6 6 6" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  chevR: (s=14,c='currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M9 6l6 6-6 6" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  check: (s=12,c='#fff') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M5 12l4.5 4.5L19 7" stroke={c} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  more: (s=18,c='currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="5" cy="12" r="1.6" fill={c}/>
      <circle cx="12" cy="12" r="1.6" fill={c}/>
      <circle cx="19" cy="12" r="1.6" fill={c}/>
    </svg>
  ),
  link: (s=14,c='currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M10 14a4 4 0 005.66 0l3-3a4 4 0 10-5.66-5.66l-1 1M14 10a4 4 0 00-5.66 0l-3 3a4 4 0 105.66 5.66l1-1" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  bell: (s=18,c='currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6zM10 19a2 2 0 004 0" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  warn: (s=14,c='currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 9v4M12 17h.01M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.7 3.86a2 2 0 00-3.4 0z" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  trash: (s=16,c='currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  edit: (s=16,c='currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M11 4H5a2 2 0 00-2 2v13a2 2 0 002 2h13a2 2 0 002-2v-6M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  google: (s=18) => (
    <svg width={s} height={s} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z"/>
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 015.5 12c0-.73.13-1.44.34-2.1V7.07H2.18a11 11 0 000 9.87l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 002.18 7.07l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/>
    </svg>
  ),
  close: (s=18,c='currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6l12 12" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
};

// ─────────────────────────────────────────────────────────────
// Seed data
// ─────────────────────────────────────────────────────────────
const today = new Date('2026-05-26');
const daysAgo = (d) => new Date(today.getTime() - d * 86400000);
const fmtDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const REV_SCHEDULE = [0, 3, 8, 18, 33]; // cumulative days from creation: rev1 day0, +3, +5, +10, +15
const REV_GAPS = [3, 5, 10, 15];

function mkQuestion(opts) {
  // status: 'normal' | 'due' | 'missed' | 'done'
  const { id, title, link='', desc='', createdDaysAgo=0, completedCount=1, status='normal', history=[] } = opts;
  return { id, title, link, desc, created: daysAgo(createdDaysAgo), completed: completedCount, status, history };
}

const SEED_SUBJECTS = [
  {
    id: 's1', name: 'DSA', desc: 'Data Structures and Algorithms',
    questions: [
      mkQuestion({ id:'q1', title:'Two Sum — hash map approach', link:'leetcode.com/two-sum', desc:'Iterate once, store complement in map.', createdDaysAgo:33, completedCount:5, status:'done',
        history:[{n:1,d:daysAgo(33)},{n:2,d:daysAgo(30)},{n:3,d:daysAgo(25)},{n:4,d:daysAgo(15)},{n:5,d:daysAgo(0)}] }),
      mkQuestion({ id:'q2', title:'Reverse linked list iteratively', link:'leetcode.com/reverse-ll', desc:'Three pointers: prev, curr, next.', createdDaysAgo:18, completedCount:3, status:'due',
        history:[{n:1,d:daysAgo(18)},{n:2,d:daysAgo(15)},{n:3,d:daysAgo(10)}] }),
      mkQuestion({ id:'q3', title:'Binary tree level-order traversal', link:'', desc:'BFS using a queue.', createdDaysAgo:8, completedCount:2, status:'normal',
        history:[{n:1,d:daysAgo(8)},{n:2,d:daysAgo(5)}] }),
      mkQuestion({ id:'q4', title:'Kadane\u2019s algorithm', link:'wikipedia.org/kadane', desc:'Track running max and global max.', createdDaysAgo:11, completedCount:2, status:'missed',
        history:[{n:1,d:daysAgo(11)},{n:2,d:daysAgo(8)}] }),
      mkQuestion({ id:'q5', title:'Quickselect for kth largest', link:'', desc:'Partition like quicksort, recurse one side.', createdDaysAgo:2, completedCount:1, status:'normal',
        history:[{n:1,d:daysAgo(2)}] }),
    ],
  },
  {
    id: 's2', name: 'System Design', desc: 'Distributed systems patterns',
    questions: [
      mkQuestion({ id:'q6', title:'Consistent hashing fundamentals', link:'', desc:'Ring with virtual nodes for balance.', createdDaysAgo:7, completedCount:2, status:'due',
        history:[{n:1,d:daysAgo(7)},{n:2,d:daysAgo(4)}] }),
      mkQuestion({ id:'q7', title:'CAP theorem trade-offs', link:'', desc:'', createdDaysAgo:3, completedCount:1, status:'normal',
        history:[{n:1,d:daysAgo(3)}] }),
    ],
  },
  {
    id: 's3', name: 'SQL', desc: 'Queries, indexes, joins',
    questions: [
      mkQuestion({ id:'q8', title:'Window functions vs GROUP BY', link:'', desc:'Window keeps rows; GROUP BY collapses.', createdDaysAgo:5, completedCount:1, status:'normal',
        history:[{n:1,d:daysAgo(5)}] }),
    ],
  },
];

const trim = (s, n=20) => (s && s.length > n ? s.slice(0, n).trimEnd() + '\u2026' : (s || ''));

// ─────────────────────────────────────────────────────────────
// Shared atoms
// ─────────────────────────────────────────────────────────────
function Screen({ children, bg=T.bg }) {
  return (
    <div style={{
      position:'absolute', inset:0, background:bg, overflow:'hidden',
      fontFamily:F_SANS, color:T.fg, display:'flex', flexDirection:'column',
    }}>
      {children}
    </div>
  );
}

function TopBar({ left, title, right, sub }) {
  return (
    <div style={{ padding: '54px 20px 14px', flexShrink:0 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', minHeight:32 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>{left}</div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>{right}</div>
      </div>
      {title && (
        <div style={{ marginTop:18 }}>
          <div style={{ fontSize:28, fontWeight:600, letterSpacing:-0.6, lineHeight:1.1 }}>{title}</div>
          {sub && <div style={{ marginTop:6, color:T.muted, fontSize:13, fontFamily:F_MONO, letterSpacing:-0.2 }}>{sub}</div>}
        </div>
      )}
    </div>
  );
}

function IconBtn({ children, onClick, style }) {
  return (
    <button onClick={onClick} style={{
      width:36, height:36, borderRadius:10, border:`1px solid ${T.hair}`,
      background:T.surface, color:T.fg, display:'flex', alignItems:'center', justifyContent:'center',
      cursor:'pointer', padding:0, ...style,
    }}>{children}</button>
  );
}

function PrimaryBtn({ children, onClick, disabled, style }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      height:48, borderRadius:12, border:'none', background: disabled? '#E5E4DE' : T.fg,
      color: disabled? T.faint : T.bg, fontFamily:F_SANS, fontSize:15, fontWeight:500, letterSpacing:-0.2,
      width:'100%', cursor: disabled? 'default':'pointer', ...style,
    }}>{children}</button>
  );
}

function GhostBtn({ children, onClick, style }) {
  return (
    <button onClick={onClick} style={{
      height:44, borderRadius:10, border:`1px solid ${T.hair}`, background:'transparent',
      color:T.fg, fontFamily:F_SANS, fontSize:14, padding:'0 14px', cursor:'pointer', ...style,
    }}>{children}</button>
  );
}

// 5 revision pips
function RevPips({ done=1, total=5, status='normal', size=14 }) {
  let fill = T.blue, ring = T.blueLine;
  if (status === 'missed') { fill = T.amber; ring = T.amberLine; }
  if (status === 'done') { fill = T.green; ring = T.greenLine; }
  return (
    <div style={{ display:'flex', gap:5 }}>
      {Array.from({length:total}).map((_,i)=>{
        const filled = i < done;
        return (
          <div key={i} style={{
            width:size, height:size, borderRadius:999,
            background: filled ? fill : 'transparent',
            border: filled ? `1px solid ${fill}` : `1px solid ${T.hairStrong}`,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            {filled && Ic.check(Math.round(size*0.6), '#fff')}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Modal shell
// ─────────────────────────────────────────────────────────────
function Sheet({ open, onClose, title, children, height='auto' }) {
  return (
    <>
      <div onClick={onClose} style={{
        position:'absolute', inset:0, background:'rgba(17,17,16,0.32)',
        opacity: open?1:0, pointerEvents: open?'auto':'none',
        transition:'opacity 220ms ease', zIndex:50,
      }}/>
      <div style={{
        position:'absolute', left:0, right:0, bottom:0,
        background:T.surface, borderTopLeftRadius:24, borderTopRightRadius:24,
        transform: open? 'translateY(0)':'translateY(105%)',
        transition:'transform 280ms cubic-bezier(.2,.8,.2,1)',
        zIndex:51, paddingBottom:28, maxHeight:'88%',
        boxShadow:'0 -10px 40px rgba(17,17,16,0.08)',
        display:'flex', flexDirection:'column',
      }}>
        <div style={{ display:'flex', justifyContent:'center', paddingTop:10 }}>
          <div style={{ width:38, height:4, borderRadius:2, background:T.hairStrong }}/>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px 6px' }}>
          <div style={{ fontSize:17, fontWeight:600, letterSpacing:-0.3 }}>{title}</div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', color:T.muted, cursor:'pointer', padding:4 }}>
            {Ic.close(18)}
          </button>
        </div>
        <div style={{ padding:'8px 20px 0', overflow:'auto' }}>{children}</div>
      </div>
    </>
  );
}

function Field({ label, value, onChange, placeholder, multiline, optional }) {
  const Comp = multiline ? 'textarea' : 'input';
  return (
    <label style={{ display:'block', marginBottom:14 }}>
      <div style={{
        display:'flex', justifyContent:'space-between', alignItems:'baseline',
        fontSize:12, color:T.muted, marginBottom:6, fontFamily:F_MONO, letterSpacing:-0.2,
      }}>
        <span>{label}</span>
        {optional && <span style={{ color:T.faint }}>optional</span>}
      </div>
      <Comp
        value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder}
        rows={multiline? 4 : undefined}
        style={{
          width:'100%', boxSizing:'border-box',
          border:`1px solid ${T.hair}`, borderRadius:10, padding: multiline? '12px 14px':'0 14px',
          height: multiline? 'auto':46, fontFamily:F_SANS, fontSize:15, color:T.fg,
          background:T.bg, outline:'none', resize:'none',
        }}
      />
    </label>
  );
}

// ─────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  return (
    <Screen>
      <div style={{ flex:1, padding:'0 28px', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
        <div style={{ paddingTop:120 }}>
          <div style={{
            width:56, height:56, borderRadius:16, border:`1px solid ${T.hair}`,
            background:T.surface, display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:F_MONO, fontWeight:600, fontSize:22, letterSpacing:-1,
          }}>R</div>
          <div style={{ marginTop:32, fontSize:36, fontWeight:600, letterSpacing:-1.2, lineHeight:1.05 }}>
            Revigion
          </div>
          <div style={{ marginTop:14, fontSize:16, color:T.muted, lineHeight:1.5, maxWidth:260 }}>
            A quiet revision tracker. Add questions, get nudged when it's time to revisit them.
          </div>

          <div style={{ marginTop:48, display:'flex', flexDirection:'column', gap:14 }}>
            {[
              ['3d','First revision'],
              ['5d','Second'],
              ['10d','Third'],
              ['15d','Final'],
            ].map(([k,v],i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{
                  width:44, fontFamily:F_MONO, fontSize:13, color:T.muted, letterSpacing:-0.3,
                }}>+{k}</div>
                <div style={{ flex:1, height:1, background:T.hair }}/>
                <div style={{ fontSize:13, color:T.fg }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ paddingBottom:60 }}>
          <button onClick={onLogin} style={{
            width:'100%', height:52, borderRadius:14,
            border:`1px solid ${T.hairStrong}`, background:T.surface,
            display:'flex', alignItems:'center', justifyContent:'center', gap:12,
            fontFamily:F_SANS, fontSize:15, fontWeight:500, color:T.fg, cursor:'pointer',
          }}>
            {Ic.google(18)} Continue with Google
          </button>
          <div style={{ marginTop:14, fontSize:11, color:T.faint, textAlign:'center', fontFamily:F_MONO, letterSpacing:-0.1 }}>
            BY CONTINUING YOU AGREE TO THE TERMS
          </div>
        </div>
      </div>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// HOME
// ─────────────────────────────────────────────────────────────
function HomeScreen({ subjects, onOpenSubject, onAdd, onProfile, dueCount }) {
  return (
    <Screen>
      <TopBar
        left={<div style={{ fontFamily:F_MONO, fontSize:13, letterSpacing:-0.3, color:T.muted }}>revigion</div>}
        right={<>
          <IconBtn onClick={onAdd}>{Ic.plus(18)}</IconBtn>
          <button onClick={onProfile} style={{
            width:36, height:36, borderRadius:999, border:`1px solid ${T.hair}`,
            background:'#EFEDE5', cursor:'pointer', padding:0, color:T.fg,
            fontFamily:F_MONO, fontSize:13, fontWeight:600,
          }}>A</button>
        </>}
        title="Subjects"
        sub={`${subjects.length} subjects · ${dueCount} due today`}
      />

      <div style={{ flex:1, overflow:'auto', padding:'4px 20px 40px' }}>
        {subjects.map((s) => {
          const due = s.questions.filter(q => q.status === 'due').length;
          const missed = s.questions.filter(q => q.status === 'missed').length;
          const done = s.questions.filter(q => q.status === 'done').length;
          return (
            <button key={s.id} onClick={()=>onOpenSubject(s.id)} style={{
              width:'100%', textAlign:'left', background:T.surface,
              border:`1px solid ${T.hair}`, borderRadius:16, padding:'18px 18px',
              marginBottom:10, cursor:'pointer', fontFamily:F_SANS, color:T.fg,
              display:'flex', flexDirection:'column', gap:14,
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontSize:18, fontWeight:600, letterSpacing:-0.4 }}>{s.name}</div>
                  <div style={{ fontSize:13, color:T.muted, marginTop:3 }}>{trim(s.desc,28)}</div>
                </div>
                <div style={{ color:T.faint, marginTop:4 }}>{Ic.chevR(16)}</div>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:10, fontFamily:F_MONO, fontSize:12, color:T.muted, letterSpacing:-0.2 }}>
                <span style={{ color:T.fg }}>{String(s.questions.length).padStart(2,'0')}</span>
                <span>questions</span>
                {due > 0 && <Dot color={T.blue} label={`${due} due`} />}
                {missed > 0 && <Dot color={T.amber} label={`${missed} missed`} />}
                {done > 0 && <Dot color={T.green} label={`${done} done`} />}
              </div>
            </button>
          );
        })}

        {/* Add new subject ghost card */}
        <button onClick={onAdd} style={{
          width:'100%', background:'transparent', border:`1px dashed ${T.hairStrong}`,
          borderRadius:16, padding:'22px', cursor:'pointer', color:T.muted,
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          fontFamily:F_SANS, fontSize:14,
        }}>
          {Ic.plus(16, T.muted)} New subject
        </button>
      </div>
    </Screen>
  );
}

function Dot({ color, label }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:6, marginLeft:4 }}>
      <span style={{ width:6, height:6, borderRadius:999, background:color }}/>
      <span>{label}</span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// SUBJECT
// ─────────────────────────────────────────────────────────────
function SubjectScreen({ subject, onBack, onOpenQuestion, onAddQuestion, onMore }) {
  const qs = subject.questions;
  return (
    <Screen>
      <TopBar
        left={<IconBtn onClick={onBack} style={{ width:34, height:34 }}>{Ic.chevL(18)}</IconBtn>}
        right={<>
          <IconBtn onClick={onMore}>{Ic.more(18)}</IconBtn>
          <IconBtn onClick={onAddQuestion}>{Ic.plus(18)}</IconBtn>
        </>}
        title={subject.name}
        sub={`${qs.length} questions · ${subject.desc}`}
      />

      <div style={{ flex:1, overflow:'auto', padding:'4px 20px 40px' }}>
        {qs.map(q => <QuestionCard key={q.id} q={q} onClick={()=>onOpenQuestion(q.id)} />)}
      </div>
    </Screen>
  );
}

function QuestionCard({ q, onClick }) {
  const status = q.status;
  let bg = T.surface, border = T.hair;
  if (status === 'missed') { bg = T.amberSoft; border = T.amberLine; }
  if (status === 'done')   { bg = T.greenSoft; border = T.greenLine; }
  if (status === 'due')    { bg = T.blueSoft;  border = T.blueLine; }

  const remaining = 5 - q.completed;
  return (
    <button onClick={onClick} style={{
      width:'100%', textAlign:'left', background:bg, border:`1px solid ${border}`,
      borderRadius:14, padding:'14px 14px 14px 16px', marginBottom:8, cursor:'pointer',
      fontFamily:F_SANS, color:T.fg, display:'flex', alignItems:'center', gap:12,
    }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {status==='missed' && <span style={{ color:'oklch(0.45 0.13 60)', display:'flex' }}>{Ic.warn(13)}</span>}
          <div style={{ fontSize:15, fontWeight:500, letterSpacing:-0.2, lineHeight:1.25 }}>
            {trim(q.title, 26)}
          </div>
        </div>
        <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:8, fontFamily:F_MONO, fontSize:11, color:T.muted, letterSpacing:-0.2 }}>
          <span>{fmtDate(q.created)}</span>
          <span style={{ color:T.faint }}>·</span>
          <span>{status==='done' ? 'complete' : `${remaining} left`}</span>
        </div>
      </div>
      <RevPips done={q.completed} status={status} size={13} />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// QUESTION
// ─────────────────────────────────────────────────────────────
function QuestionScreen({ subject, question, onBack, onUpdate, onMore }) {
  const [title, setTitle] = useState(question.title);
  const [link, setLink] = useState(question.link);
  const [desc, setDesc] = useState(question.desc);
  const [revPhase, setRevPhase] = useState('idle'); // idle | waiting | ready
  const dirty = title.trim() !== question.title || link !== question.link || desc !== question.desc;

  useEffect(() => { setTitle(question.title); setLink(question.link); setDesc(question.desc); setRevPhase('idle'); }, [question.id]);

  useEffect(() => {
    if (revPhase === 'waiting') {
      const t = setTimeout(() => setRevPhase('ready'), 5000);
      return () => clearTimeout(t);
    }
  }, [revPhase]);

  const save = () => onUpdate(question.id, { title: title.trim() || question.title, link, desc });

  const complete = q => 5 - q.completed;
  const status = question.status;
  const isDue = status === 'due';
  const isMissed = status === 'missed';
  const isDone = status === 'done';

  // What's the next gap?
  const nextGap = REV_GAPS[Math.min(question.completed - 1, REV_GAPS.length - 1)];

  return (
    <Screen>
      <TopBar
        left={<IconBtn onClick={onBack} style={{ width:34, height:34 }}>{Ic.chevL(18)}</IconBtn>}
        right={<IconBtn onClick={onMore}>{Ic.more(18)}</IconBtn>}
      />

      <div style={{ flex:1, overflow:'auto', padding:'0 20px 32px' }}>
        <div style={{ fontFamily:F_MONO, fontSize:11, color:T.muted, letterSpacing:0.4, textTransform:'uppercase' }}>
          {subject.name}
        </div>
        <textarea
          value={title}
          onChange={e=>setTitle(e.target.value)}
          rows={2}
          style={{
            marginTop:8, width:'100%', boxSizing:'border-box',
            fontFamily:F_SANS, fontSize:24, fontWeight:600, letterSpacing:-0.6, lineHeight:1.2,
            color:T.fg, background:'transparent', border:'none', outline:'none', resize:'none',
            padding:0,
          }}
        />

        {/* progress strip */}
        <div style={{
          marginTop:18, padding:'14px 14px', borderRadius:14,
          border:`1px solid ${T.hair}`, background:T.surface,
          display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <div>
            <div style={{ fontFamily:F_MONO, fontSize:11, color:T.muted, letterSpacing:-0.2 }}>PROGRESS</div>
            <div style={{ marginTop:6, fontSize:14, color:T.fg }}>
              <span style={{ fontWeight:600 }}>{question.completed}</span>
              <span style={{ color:T.muted }}> of 5 revisions</span>
            </div>
          </div>
          <RevPips done={question.completed} status={status} size={15} />
        </div>

        {/* missed banner */}
        {isMissed && (
          <div style={{
            marginTop:12, padding:'14px', borderRadius:12,
            background: T.amberSoft, border:`1px solid ${T.amberLine}`,
            display:'flex', gap:10, alignItems:'flex-start',
          }}>
            <span style={{ color:'oklch(0.45 0.13 60)', flexShrink:0, marginTop:2 }}>{Ic.warn(14)}</span>
            <div style={{ fontSize:13, color:'oklch(0.32 0.08 60)', lineHeight:1.45 }}>
              You missed this revision. Complete it now, or the next cycle won't start and you may forget this question.
            </div>
          </div>
        )}

        {/* link */}
        <div style={{ marginTop:22 }}>
          <FieldRow label="LINK">
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ color:T.faint }}>{Ic.link(14, T.muted)}</span>
              <input value={link} onChange={e=>setLink(e.target.value)} placeholder="paste a URL"
                style={{ flex:1, border:'none', background:'transparent', outline:'none', fontFamily:F_SANS, fontSize:15, color:T.fg }}/>
            </div>
          </FieldRow>

          <FieldRow label="NOTES">
            <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Notes, hints, gotchas…"
              rows={4}
              style={{ width:'100%', border:'none', background:'transparent', outline:'none', resize:'none',
                fontFamily:F_SANS, fontSize:15, color:T.fg, lineHeight:1.5 }}/>
          </FieldRow>
        </div>

        {/* Revision flow */}
        {(isDue || isMissed) && !isDone && (
          <div style={{ marginTop:22 }}>
            {revPhase === 'idle' && (
              <button onClick={()=>setRevPhase('waiting')} style={{
                width:'100%', height:52, borderRadius:14, border:'none',
                background: isMissed ? 'oklch(0.45 0.13 60)' : T.fg, color:'#fff',
                fontFamily:F_SANS, fontSize:15, fontWeight:500, cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:10,
              }}>
                Start revision
                <span style={{ fontFamily:F_MONO, fontSize:12, opacity:0.7 }}>
                  #{question.completed + 1}
                </span>
              </button>
            )}
            {revPhase === 'waiting' && (
              <div style={{
                height:52, borderRadius:14, background:'#EFEDE5',
                display:'flex', alignItems:'center', justifyContent:'center', gap:12,
                fontFamily:F_MONO, fontSize:13, color:T.muted, letterSpacing:-0.2,
              }}>
                <Spinner/> revising… 5s minimum
              </div>
            )}
            {revPhase === 'ready' && (
              <button onClick={()=>{ onUpdate(question.id, { complete:true }); setRevPhase('idle'); }} style={{
                width:'100%', height:52, borderRadius:14, border:'none',
                background:T.green, color:'#fff',
                fontFamily:F_SANS, fontSize:15, fontWeight:500, cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:10,
              }}>
                {Ic.check(15,'#fff')} Complete revision
              </button>
            )}
          </div>
        )}

        {!isDue && !isMissed && !isDone && (
          <div style={{
            marginTop:22, padding:'16px', borderRadius:14, background:T.surface,
            border:`1px solid ${T.hair}`, textAlign:'center',
          }}>
            <div style={{ fontFamily:F_MONO, fontSize:11, color:T.muted, letterSpacing:0.4 }}>NEXT REVISION</div>
            <div style={{ marginTop:6, fontSize:15, color:T.fg }}>in {nextGap} days</div>
          </div>
        )}

        {isDone && (
          <div style={{
            marginTop:22, padding:'16px', borderRadius:14, background:T.greenSoft,
            border:`1px solid ${T.greenLine}`, textAlign:'center',
          }}>
            <div style={{ fontSize:14, color:'oklch(0.32 0.1 150)', fontWeight:500 }}>All revisions complete</div>
            <div style={{ marginTop:4, fontSize:12, color:T.muted, fontFamily:F_MONO, letterSpacing:-0.2 }}>
              this question is locked in
            </div>
          </div>
        )}

        {/* History */}
        <div style={{ marginTop:28 }}>
          <div style={{ fontFamily:F_MONO, fontSize:11, color:T.muted, letterSpacing:0.4, marginBottom:10 }}>
            HISTORY
          </div>
          <div style={{ borderTop:`1px solid ${T.hair}` }}>
            {question.history.map((h,i)=>(
              <div key={i} style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'12px 2px', borderBottom:`1px solid ${T.hair}`,
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{
                    width:22, height:22, borderRadius:999, background:T.green,
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>{Ic.check(11,'#fff')}</div>
                  <div style={{ fontSize:14 }}>Revision {h.n}</div>
                </div>
                <div style={{ fontFamily:F_MONO, fontSize:12, color:T.muted, letterSpacing:-0.2 }}>
                  {fmtDate(h.d)}
                </div>
              </div>
            ))}
            {Array.from({length: 5 - question.history.length}).map((_,i)=>{
              const n = question.history.length + i + 1;
              return (
                <div key={'p'+i} style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'12px 2px', borderBottom:`1px solid ${T.hair}`,
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{
                      width:22, height:22, borderRadius:999, border:`1px solid ${T.hairStrong}`,
                    }}/>
                    <div style={{ fontSize:14, color:T.faint }}>Revision {n}</div>
                  </div>
                  <div style={{ fontFamily:F_MONO, fontSize:12, color:T.faint, letterSpacing:-0.2 }}>
                    pending
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Save bar */}
      <div style={{
        flexShrink:0, padding:'12px 20px 28px',
        borderTop:`1px solid ${T.hair}`, background:T.bg,
        display:'flex', gap:10, alignItems:'center',
        transform: dirty? 'translateY(0)' : 'translateY(0)',
      }}>
        <div style={{ flex:1, fontSize:12, color: dirty? T.fg : T.faint, fontFamily:F_MONO, letterSpacing:-0.2 }}>
          {dirty ? 'unsaved changes' : 'all changes saved'}
        </div>
        <button onClick={save} disabled={!dirty} style={{
          height:40, padding:'0 18px', borderRadius:10, border:'none',
          background: dirty? T.fg : '#E5E4DE',
          color: dirty? T.bg : T.faint,
          fontFamily:F_SANS, fontSize:14, fontWeight:500, cursor: dirty?'pointer':'default',
        }}>Save</button>
      </div>
    </Screen>
  );
}

function FieldRow({ label, children }) {
  return (
    <div style={{
      padding:'12px 0', borderTop:`1px solid ${T.hair}`,
    }}>
      <div style={{ fontFamily:F_MONO, fontSize:11, color:T.muted, letterSpacing:0.4, marginBottom:8 }}>{label}</div>
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <span style={{
      width:14, height:14, borderRadius:999,
      border:`2px solid ${T.hairStrong}`, borderTopColor:T.fg,
      display:'inline-block', animation:'spin 700ms linear infinite',
    }}/>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────
function App() {
  const [route, setRoute] = useState({ name:'login' }); // login | home | subject | question
  const [subjects, setSubjects] = useState(SEED_SUBJECTS);
  const [modal, setModal] = useState(null); // 'addSubject' | 'addQuestion' | 'profile' | 'moreSubject' | 'moreQuestion'

  // form state
  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjDesc, setNewSubjDesc] = useState('');
  const [newQTitle, setNewQTitle] = useState('');
  const [newQLink, setNewQLink] = useState('');
  const [newQDesc, setNewQDesc] = useState('');

  // edit-subject form state
  const [editSubjName, setEditSubjName] = useState('');
  const [editSubjDesc, setEditSubjDesc] = useState('');

  // notification toast
  const [toast, setToast] = useState(null);

  const dueCount = useMemo(() =>
    subjects.flatMap(s=>s.questions).filter(q=>q.status==='due' || q.status==='missed').length, [subjects]);

  const currentSubject = route.subjectId ? subjects.find(s=>s.id===route.subjectId) : null;
  const currentQuestion = currentSubject && route.questionId ? currentSubject.questions.find(q=>q.id===route.questionId) : null;

  // ─── Notification deep-link demo
  useEffect(() => {
    if (route.name === 'home') {
      const t = setTimeout(() => {
        setToast({ subject: 'DSA', title: 'Reverse linked list iteratively', subjectId:'s1', questionId:'q2' });
      }, 1400);
      return () => clearTimeout(t);
    } else {
      setToast(null);
    }
  }, [route.name]);

  // ─── Actions
  const addSubject = () => {
    if (!newSubjName.trim()) return;
    const id = 's' + Date.now();
    setSubjects(prev => [...prev, { id, name:newSubjName.trim(), desc:newSubjDesc.trim() || 'New subject', questions:[] }]);
    setNewSubjName(''); setNewSubjDesc(''); setModal(null);
  };

  const addQuestion = () => {
    if (!newQTitle.trim() || !route.subjectId) return;
    const id = 'q' + Date.now();
    const q = mkQuestion({
      id, title:newQTitle.trim(), link:newQLink.trim(), desc:newQDesc.trim(),
      createdDaysAgo:0, completedCount:1, status:'normal',
      history:[{n:1, d: today }],
    });
    setSubjects(prev => prev.map(s => s.id === route.subjectId ? { ...s, questions:[q, ...s.questions] } : s));
    setNewQTitle(''); setNewQLink(''); setNewQDesc(''); setModal(null);
  };

  const updateQuestion = (qid, patch) => {
    setSubjects(prev => prev.map(s => ({
      ...s,
      questions: s.questions.map(q => {
        if (q.id !== qid) return q;
        if (patch.complete) {
          const newCompleted = Math.min(5, q.completed + 1);
          const newHistory = [...q.history, { n: newCompleted, d: today }];
          const newStatus = newCompleted >= 5 ? 'done' : 'normal';
          return { ...q, completed:newCompleted, history:newHistory, status:newStatus };
        }
        return { ...q, ...patch };
      }),
    })));
  };

  const deleteQuestion = (qid) => {
    setSubjects(prev => prev.map(s => ({ ...s, questions: s.questions.filter(q=>q.id!==qid) })));
    setRoute({ name:'subject', subjectId: route.subjectId });
    setModal(null);
  };

  const updateSubject = (sid, patch) => {
    setSubjects(prev => prev.map(s => s.id === sid ? { ...s, ...patch } : s));
  };

  const openEditSubject = () => {
    if (!currentSubject) return;
    setEditSubjName(currentSubject.name);
    setEditSubjDesc(currentSubject.desc);
    setModal('editSubject');
  };

  const saveEditSubject = () => {
    if (!currentSubject || !editSubjName.trim()) return;
    updateSubject(currentSubject.id, { name: editSubjName.trim(), desc: editSubjDesc.trim() });
    setModal(null);
  };

  const deleteSubject = (sid) => {
    setSubjects(prev => prev.filter(s => s.id !== sid));
    setRoute({ name:'home' });
    setModal(null);
  };

  // ─── Renders
  let screen;
  if (route.name === 'login') {
    screen = <LoginScreen onLogin={()=>setRoute({ name:'home' })}/>;
  } else if (route.name === 'home') {
    screen = <HomeScreen
      subjects={subjects} dueCount={dueCount}
      onOpenSubject={(id)=>setRoute({ name:'subject', subjectId:id })}
      onAdd={()=>setModal('addSubject')}
      onProfile={()=>setModal('profile')}
    />;
  } else if (route.name === 'subject' && currentSubject) {
    screen = <SubjectScreen subject={currentSubject}
      onBack={()=>setRoute({ name:'home' })}
      onOpenQuestion={(qid)=>setRoute({ name:'question', subjectId:currentSubject.id, questionId:qid })}
      onAddQuestion={()=>setModal('addQuestion')}
      onMore={()=>setModal('moreSubject')}
    />;
  } else if (route.name === 'question' && currentQuestion) {
    screen = <QuestionScreen subject={currentSubject} question={currentQuestion}
      onBack={()=>setRoute({ name:'subject', subjectId:currentSubject.id })}
      onUpdate={updateQuestion}
      onMore={()=>setModal('moreQuestion')}
    />;
  } else {
    screen = <HomeScreen subjects={subjects} dueCount={dueCount}
      onOpenSubject={(id)=>setRoute({ name:'subject', subjectId:id })}
      onAdd={()=>setModal('addSubject')} onProfile={()=>setModal('profile')}/>;
  }

  return (
    <div style={{ position:'absolute', inset:0 }}>
      {screen}

      {/* Notification toast — deep links to Question screen */}
      {toast && route.name === 'home' && (
        <button onClick={()=>{ setRoute({ name:'question', subjectId:toast.subjectId, questionId:toast.questionId }); setToast(null); }}
          style={{
            position:'absolute', left:12, right:12, top:56, zIndex:30,
            background:'rgba(20,20,18,0.92)', color:'#fff', borderRadius:18,
            border:'none', textAlign:'left', padding:'12px 14px',
            display:'flex', alignItems:'center', gap:12, cursor:'pointer',
            backdropFilter:'blur(20px)', fontFamily:F_SANS,
            animation:'slideDown 360ms cubic-bezier(.2,.8,.2,1) both',
            boxShadow:'0 6px 24px rgba(0,0,0,0.2)',
          }}>
          <div style={{
            width:34, height:34, borderRadius:8, background:'#fff', color:'#111',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:F_MONO, fontWeight:600, fontSize:13,
          }}>R</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.65)', fontFamily:F_MONO, letterSpacing:-0.2 }}>
                Revigion · now
              </span>
              <span onClick={(e)=>{ e.stopPropagation(); setToast(null); }} style={{ color:'rgba(255,255,255,0.5)' }}>{Ic.close(14,'rgba(255,255,255,0.6)')}</span>
            </div>
            <div style={{ fontSize:14, fontWeight:500, marginTop:2 }}>Revision due — {toast.subject}</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.7)', marginTop:1 }}>{trim(toast.title, 32)}</div>
          </div>
        </button>
      )}

      {/* Modals */}
      <Sheet open={modal==='addSubject'} onClose={()=>setModal(null)} title="New subject">
        <Field label="Subject name" value={newSubjName} onChange={setNewSubjName} placeholder="e.g. DSA" />
        <Field label="Description" value={newSubjDesc} onChange={setNewSubjDesc} placeholder="What's this subject about?" multiline optional/>
        <div style={{ paddingTop:6, paddingBottom:10 }}>
          <PrimaryBtn onClick={addSubject} disabled={!newSubjName.trim()}>Create subject</PrimaryBtn>
        </div>
      </Sheet>

      <Sheet open={modal==='addQuestion'} onClose={()=>setModal(null)} title="New question">
        <Field label="Question title" value={newQTitle} onChange={setNewQTitle} placeholder="e.g. Reverse a linked list" />
        <Field label="Link URL" value={newQLink} onChange={setNewQLink} placeholder="https://…" optional/>
        <Field label="Notes" value={newQDesc} onChange={setNewQDesc} placeholder="Hints, gotchas, approach…" multiline optional/>

        <div style={{
          padding:'12px 14px', borderRadius:10, background:T.bg,
          border:`1px solid ${T.hair}`, marginBottom:14,
          display:'flex', gap:10, alignItems:'flex-start',
        }}>
          <div style={{ color:T.muted, marginTop:1 }}>{Ic.bell(15, T.muted)}</div>
          <div style={{ fontSize:12, color:T.muted, lineHeight:1.5, fontFamily:F_MONO, letterSpacing:-0.2 }}>
            Schedule: rev 1 now, then +3d, +5d, +10d, +15d
          </div>
        </div>

        <div style={{ paddingBottom:10 }}>
          <PrimaryBtn onClick={addQuestion} disabled={!newQTitle.trim()}>Add question</PrimaryBtn>
        </div>
      </Sheet>

      <Sheet open={modal==='profile'} onClose={()=>setModal(null)} title="Account">
        <div style={{ display:'flex', alignItems:'center', gap:14, padding:'4px 0 16px' }}>
          <div style={{
            width:48, height:48, borderRadius:999, background:'#EFEDE5',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:F_MONO, fontSize:18, fontWeight:600, color:T.fg,
          }}>A</div>
          <div>
            <div style={{ fontSize:16, fontWeight:500 }}>Aarav</div>
            <div style={{ fontSize:13, color:T.muted, fontFamily:F_MONO, letterSpacing:-0.2 }}>aarav@gmail.com</div>
          </div>
        </div>
        <MenuRow label="Notifications" detail="Every 4h" />
        <MenuRow label="Quiet hours" detail="22:00 – 08:00" />
        <MenuRow label="Theme" detail="System" />
        <div style={{ paddingTop:18, paddingBottom:10 }}>
          <button onClick={()=>{ setRoute({ name:'login' }); setModal(null); }} style={{
            width:'100%', height:48, borderRadius:12, border:`1px solid ${T.hair}`,
            background:'transparent', color:'oklch(0.5 0.15 25)', fontFamily:F_SANS,
            fontSize:15, cursor:'pointer',
          }}>Sign out</button>
        </div>
      </Sheet>

      <Sheet open={modal==='moreSubject'} onClose={()=>setModal(null)} title={currentSubject?.name || ''}>
        <MenuAction icon={Ic.edit(16, T.fg)} label="Edit subject" onClick={openEditSubject}/>
        <MenuAction icon={Ic.trash(16, 'oklch(0.5 0.15 25)')} label="Delete subject" danger onClick={()=>currentSubject && deleteSubject(currentSubject.id)}/>
      </Sheet>

      <Sheet open={modal==='editSubject'} onClose={()=>setModal(null)} title="Edit subject">
        <Field label="Subject name" value={editSubjName} onChange={setEditSubjName} placeholder="e.g. DSA" />
        <Field label="Description" value={editSubjDesc} onChange={setEditSubjDesc} placeholder="What's this subject about?" multiline optional/>
        <div style={{ paddingTop:6, paddingBottom:10 }}>
          <PrimaryBtn onClick={saveEditSubject} disabled={!editSubjName.trim() || (currentSubject && editSubjName.trim()===currentSubject.name && editSubjDesc.trim()===currentSubject.desc)}>Save changes</PrimaryBtn>
        </div>
      </Sheet>

      <Sheet open={modal==='moreQuestion'} onClose={()=>setModal(null)} title="Question">
        <MenuAction icon={Ic.trash(16, 'oklch(0.5 0.15 25)')} label="Delete question" danger onClick={()=>currentQuestion && deleteQuestion(currentQuestion.id)}/>
      </Sheet>
    </div>
  );
}

function MenuRow({ label, detail }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'14px 0', borderTop:`1px solid ${T.hair}`,
    }}>
      <div style={{ fontSize:15 }}>{label}</div>
      <div style={{ display:'flex', alignItems:'center', gap:8, fontFamily:F_MONO, fontSize:13, color:T.muted, letterSpacing:-0.2 }}>
        {detail} <span style={{ color:T.faint }}>{Ic.chevR(12, T.faint)}</span>
      </div>
    </div>
  );
}

function MenuAction({ icon, label, danger, onClick }) {
  return (
    <button onClick={onClick} style={{
      width:'100%', display:'flex', alignItems:'center', gap:12,
      padding:'14px 4px', background:'transparent', border:'none', borderTop:`1px solid ${T.hair}`,
      cursor:'pointer', fontFamily:F_SANS, fontSize:15,
      color: danger ? 'oklch(0.5 0.15 25)' : T.fg, textAlign:'left',
    }}>
      {icon} {label}
    </button>
  );
}

window.App = App;
