export default function Privacy() {
  return (
    <div className="min-h-screen bg-white text-gray-900 p-6">
      <main className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
        <p className="mb-4 text-sm text-slate-700">Your privacy is important to us. This page outlines what data we collect, how we use it, and your choices.</p>
        <section className="mb-6">
          <h2 className="text-xl font-semibold">Data We Collect</h2>
          <p className="text-sm text-slate-700">We collect account information you provide when signing up (email, name, school) and any profile data you add.</p>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-semibold">How We Use Data</h2>
          <p className="text-sm text-slate-700">We use your data to authenticate you, personalize your experience, and power leaderboards and matches.</p>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-semibold">Third Parties</h2>
          <p className="text-sm text-slate-700">We use Supabase for authentication and database services. Review Supabase's privacy policy for details.</p>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-semibold">Your Choices</h2>
          <p className="text-sm text-slate-700">You can request account deletion by contacting the site administrator. You can also remove personal profile data in your account settings.</p>
        </section>
        <p className="text-sm text-slate-600">Last updated: Jan 2026</p>
      </main>
    </div>
  )
}
