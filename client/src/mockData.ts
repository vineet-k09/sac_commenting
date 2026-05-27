

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
