// Placeholder for screens that land in follow-up branches.
export function ComingSoonPage({ title, note }: { title: string; note: string }) {
  return (
    <>
      <div className="top">
        <div>
          <h2>{title}</h2>
          <p>{note}</p>
        </div>
      </div>
      <div className="glass empty">This screen is being built.</div>
    </>
  )
}
