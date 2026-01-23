export default function Hero() {
  return (
    <section className="hero" id="home">
      <div className="hero__bg" aria-hidden="true" />
      <div className="container hero__inner">
        <div className="hero__copy">
          <div className="hero__eyebrow">New • Powerful comparisons</div>
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
          <div className="hero__stats">
            <div className="stat">
              <div className="stat__value">10k+</div>
              <div className="stat__label">Comparisons made</div>
            </div>
            <div className="stat">
              <div className="stat__value">98%</div>
              <div className="stat__label">User satisfaction</div>
            </div>
            <div className="stat">
              <div className="stat__value"><span aria-hidden>⚡</span> Fast</div>
              <div className="stat__label">No sign up</div>
            </div>
          </div>
        </div>
        {/* Visual handled by background */}
      </div>
    </section>
  )
}
