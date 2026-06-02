
export default function SkeletonCard({ index }: { index: number }) {
  return (
    <div className="sk-card" style={{ animationDelay: `${index * 0.08}s` }}>
      <div className="sk-accent" />
      <div className="sk-body">
        <div className="sk-head">
          <div className="sk-avatar" />
          <div className="sk-meta">
            <div className="sk-line" style={{ width: '42%' }} />
            <div className="sk-line" style={{ width: '28%', height: '8px', marginTop: '5px' }} />
          </div>
          <div className="sk-line" style={{ width: '42px', height: '24px', borderRadius: '6px' }} />
        </div>
        <div className="sk-line" style={{ width: '100%', marginTop: '12px' }} />
        <div className="sk-line" style={{ width: '85%', marginTop: '7px' }} />
        <div className="sk-line" style={{ width: '65%', marginTop: '7px' }} />
      </div>
    </div>
  );
}
