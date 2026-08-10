export function Skeleton({ width = '100%', height = 16, radius = 8, style }) {
  return <div className="skeleton" style={{ width, height, borderRadius: radius, ...style }} />
}

export function SkeletonCards({ count = 3 }) {
  return (
    <div className="summary-cards">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card">
          <Skeleton width={100} height={11} />
          <Skeleton width={130} height={26} style={{ marginTop: 10 }} />
        </div>
      ))}
    </div>
  )
}

export function SkeletonList({ rows = 4 }) {
  return (
    <ul className="transaction-list">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="transaction-item">
          <Skeleton width={36} height={36} radius={999} />
          <div style={{ flex: 1 }}>
            <Skeleton width="55%" height={13} />
            <Skeleton width="30%" height={11} style={{ marginTop: 6 }} />
          </div>
          <Skeleton width={64} height={15} />
        </li>
      ))}
    </ul>
  )
}

export function SkeletonChart({ height = 280 }) {
  return (
    <div className="empty-chart" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height }}>
      <Skeleton width={height * 0.55} height={height * 0.55} radius={999} />
    </div>
  )
}
