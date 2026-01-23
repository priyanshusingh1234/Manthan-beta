export default function Features() {
  const items = [
    {
      title: 'Clear comparisons',
      text: 'Side-by-side layouts to evaluate options quickly with visual cues.',
    },
    {
      title: 'Smart insights',
      text: 'Summaries and highlights that surface what matters most first.',
    },
    {
      title: 'Responsive by default',
      text: 'Beautiful on desktop and mobile with fluid, accessible UI.',
    },
  ]

  return (
    <section className="section" id="features">
      <div className="container">
        <h2 className="section__title">Features</h2>
        <p className="section__subtitle">
          Thoughtful building blocks that feel fast, clear, and modern.
        </p>
        <div className="features">
          {items.map((f) => (
            <article key={f.title} className="feature">
              <div className="feature__icon" aria-hidden="true">★</div>
              <h3 className="feature__title">{f.title}</h3>
              <p className="feature__text">{f.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
