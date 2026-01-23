export default function Navbar() {
  return (
    <header className="nav">
      <div className="container nav__inner">
        <div className="brand">
          <div className="brand__logo" aria-hidden="true">M</div>
          <span className="brand__name">Manthan</span>
        </div>
        <nav className="nav__links" aria-label="Primary">
          <a href="#features">Features</a>
          <a href="#showcase">Showcase</a>
          <a href="#about">About</a>
        </nav>
        <div className="nav__actions">
          <button className="btn btn--ghost">Sign in</button>
          <button className="btn btn--primary">Get started</button>
        </div>
      </div>
    </header>
  )
}
