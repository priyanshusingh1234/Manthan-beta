export default function Hero() {
  return (
    <section className="hero" id="home">
      <div className="hero__bg" aria-hidden="true" />
      <div className="container hero__inner">
        <div className="hero__copy">
          <h1 className="hero__title">
            Discover, Compare, and Decide — all in one place
          </h1>
          <p className="hero__subtitle">
            A clean, modern hub to explore insights, evaluate options, and take action with confidence.
          </p>
          <div className="hero__cta">
            <a className="btn btn--primary btn--lg" href="#features">Explore features</a>
            <a className="btn btn--ghost btn--lg" href="#showcase">View showcase</a>
          </div>
          <div className="hero__meta">
            <div className="badge">No signup needed</div>
            <div className="badge">Free to try</div>
          </div>
        </div>
        {/* Intentionally no right column content; visual handled by background */}
      </div>
    </section>
  )
}
