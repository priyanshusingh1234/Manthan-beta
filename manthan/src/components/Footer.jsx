export default function Footer() {
  return (
    <footer className="footer" id="about">
      <div className="container footer__inner">
        <div className="footer__brand">© {new Date().getFullYear()} Manthan</div>
        <nav className="footer__links" aria-label="Footer">
          <a href="#features">Features</a>
          <a href="#showcase">Showcase</a>
          <a href="#home">Top</a>
        </nav>
      </div>
    </footer>
  )
}
