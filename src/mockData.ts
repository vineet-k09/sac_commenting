import type { Comment } from './types';

/* ─── Sample / seed data ────────────────────────────────── */
export const SAMPLE_COMMENTS: Comment[] = [
  {
    id: 'c1', user: 'Sarah Mitchell', level: 'page', filter: 'Dashboard',
    timestamp: new Date(Date.now() - 7_200_000).toISOString(),
    content: '<p>The Q3 revenue figures are <strong>significantly above projection</strong> — primarily driven by the EMEA enterprise contracts signed in July. The new logistics partnership is also contributing positively.</p>',
  },
  {
    id: 'c2', user: 'James Okonkwo', level: 'page', filter: 'Dashboard',
    timestamp: new Date(Date.now() - 3_600_000).toISOString(),
    content: '<p>Gross margin dipped slightly. This is <em>attributable to higher freight costs</em> in Q3. We expect normalisation by Q4 as revised supplier contracts take effect.</p>',
  },
  {
    id: 'c3', user: 'Priya Nair', level: 'page', filter: 'Dashboard',
    timestamp: new Date(Date.now() - 900_000).toISOString(),
    content: '<p>The <strong>APAC segment</strong> is the standout performer. Headcount-adjusted revenue is up <u>18%</u> YoY. Recommend doubling down on the expansion plan.</p>',
  },
  {
    id: 'c4', user: 'Lars Bergmann', level: 'row', filter: 'Row:EMEA',
    timestamp: new Date(Date.now() - 10_800_000).toISOString(),
    content: '<p>EMEA row variance of <strong>€2.3M</strong> is explained by delayed shipments from the Frankfurt DC. This will reconcile in the next period close.</p>',
  },
  {
    id: 'c5', user: 'Amy Chen', level: 'row', filter: 'Row:APAC',
    timestamp: new Date(Date.now() - 1_800_000).toISOString(),
    content: '<ul><li>APAC headcount stable</li><li>Revenue per head up 12%</li><li>Churn risk flagged in two accounts</li></ul>',
  },
];

/* ─── AI word-improvement map ───────────────────────────── */
export const WORD_MAP: Record<string, string[]> = {
  good:     ['strong', 'robust', 'solid'],
  bad:      ['concerning', 'adverse', 'suboptimal'],
  high:     ['elevated', 'heightened', 'accelerated'],
  low:      ['subdued', 'compressed', 'constrained'],
  show:     ['indicate', 'demonstrate', 'reflect'],
  see:      ['observe', 'note', 'identify'],
  increase: ['growth', 'uplift', 'acceleration'],
  decrease: ['decline', 'contraction', 'compression'],
  big:      ['substantial', 'considerable', 'material'],
  small:    ['marginal', 'modest', 'limited'],
  many:     ['numerous', 'multiple', 'a significant number of'],
  also:     ['additionally', 'furthermore', 'moreover'],
  but:      ['however', 'nevertheless', 'that said'],
  get:      ['achieve', 'attain', 'realise'],
  make:     ['generate', 'produce', 'deliver'],
  think:    ['believe', 'assess', 'project'],
  help:     ['support', 'drive', 'facilitate'],
  use:      ['leverage', 'utilise', 'deploy'],
  numbers:  ['figures', 'metrics', 'data points'],
  results:  ['outcomes', 'performance', 'indicators'],
  because:  ['owing to', 'as a result of', 'driven by'],
};

/* ─── Avatar gradient palette ───────────────────────────── */
export const AVATAR_COLORS = [
  'linear-gradient(135deg,#1e3a8a,#dc2626)',
  'linear-gradient(135deg,#dc2626,#1e56c8)',
  'linear-gradient(135deg,#0f1f6e,#ef4444)',
  'linear-gradient(135deg,#b91c1c,#1e56c8)',
  'linear-gradient(135deg,#1e3a8a,#f87171)',
  'linear-gradient(135deg,#991b1b,#2563eb)',
];

export const CARD_ACCENT = 'linear-gradient(180deg,#0f1f6e,#1e56c8)';

export const AI_SUMMARY_THEMES = [
  'performance metrics', 'variance analysis', 'regional trends', 'budget alignment',
];

export const AI_FEATURES = [
  { icon: '📊', title: 'Data Q&A',         desc: 'Ask natural language questions about the numbers on screen' },
  { icon: '🔍', title: 'Trend Analysis',    desc: 'Identify patterns, outliers, and variances automatically' },
  { icon: '📝', title: 'Comment Insights',  desc: 'Summarise and cross-reference all comments on this page' },
] as const;
