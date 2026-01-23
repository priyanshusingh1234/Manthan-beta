export default function Showcase() {
  return (
    <section className="section" id="showcase">
      <div className="container">
        <h2 className="section__title">Showcase</h2>
        <p className="section__subtitle">A quick peek at the UI patterns.</p>
        <div className="showcase">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="showcase__item" aria-label={`Showcase item ${i}`}/>
          ))}
        </div>
      </div>
    </section>
  )
}
