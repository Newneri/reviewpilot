import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b max-w-6xl mx-auto">
        <span className="font-bold text-lg">ReviewPilot</span>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-sm text-gray-600 hover:text-gray-900">Connexion</Link>
          <Link href="/sign-up" className="text-sm bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800">
            Commencer
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full mb-6">
          Conçu pour les restaurants français
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6 leading-tight">
          Répondez à vos avis Google<br />en quelques secondes
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          ReviewPilot surveille vos avis Google 24h/24, génère des réponses personnalisées par IA
          et vous alerte immédiatement en cas d'avis négatif.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/sign-up" className="bg-black text-white px-8 py-3 rounded-lg text-base font-medium hover:bg-gray-800">
            Commencer
          </Link>
          <Link href="/sign-in" className="text-gray-600 text-base hover:text-gray-900">
            Déjà client ? →
          </Link>
        </div>
      </section>

      {/* Problem */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Combien d'avis restent sans réponse dans votre établissement ?
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Un restaurateur passe en moyenne 3h par semaine à gérer ses avis Google —
            quand il y pense. La plupart des avis négatifs restent sans réponse pendant des jours.
            Chaque heure compte.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
          Tout ce dont vous avez besoin, rien de superflu
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="text-3xl mb-4">⭐</div>
            <h3 className="font-semibold text-lg mb-2">Synchronisation automatique</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Vos avis Google sont importés toutes les heures, sans aucune action de votre part.
            </p>
          </div>
          <div>
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="font-semibold text-lg mb-2">Réponses générées par IA</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              L'IA rédige une réponse personnalisée pour chaque avis. Vous relisez, ajustez si besoin,
              et publiez en un clic.
            </p>
          </div>
          <div>
            <div className="text-3xl mb-4">🚨</div>
            <h3 className="font-semibold text-lg mb-2">Alerte avis 1 étoile</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Dès qu'un avis négatif arrive, vous recevez un email immédiat pour réagir
              avant que ça se propage.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Tarifs simples et transparents</h2>
          <p className="text-center text-gray-500 mb-14">Sans engagement. Prix HT.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Solo',
                price: '29',
                desc: '1 établissement',
                features: ['Synchronisation toutes les heures', 'Réponses IA illimitées', 'Alertes avis négatifs', 'Support email'],
              },
              {
                name: 'Business',
                price: '69',
                desc: 'Jusqu\'à 5 établissements',
                features: ['Tout Solo', '5 établissements', 'Publication automatique', 'Support prioritaire'],
                highlight: true,
              },
              {
                name: 'Agency',
                price: '199',
                desc: 'Jusqu\'à 20 établissements',
                features: ['Tout Business', '20 établissements', 'Tableau de bord multi-sites', 'Onboarding dédié'],
              },
            ].map(({ name, price, desc, features, highlight }) => (
              <div
                key={name}
                className={`rounded-2xl p-8 border ${highlight ? 'bg-black text-white border-black' : 'bg-white border-gray-200'}`}
              >
                <p className={`font-semibold text-lg mb-1 ${highlight ? 'text-white' : 'text-gray-900'}`}>{name}</p>
                <p className={`text-4xl font-bold mb-1 ${highlight ? 'text-white' : 'text-gray-900'}`}>{price}€<span className="text-base font-normal">/mois</span></p>
                <p className={`text-sm mb-6 ${highlight ? 'text-gray-400' : 'text-gray-500'}`}>{desc}</p>
                <ul className="space-y-2 mb-8">
                  {features.map(f => (
                    <li key={f} className={`text-sm flex items-start gap-2 ${highlight ? 'text-gray-300' : 'text-gray-600'}`}>
                      <span className="mt-0.5">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/sign-up"
                  className={`block text-center py-2.5 rounded-lg text-sm font-medium ${
                    highlight
                      ? 'bg-white text-black hover:bg-gray-100'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  Commencer
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Prêt à ne plus jamais rater un avis ?
        </h2>
        <p className="text-gray-500 mb-8">
          Connectez votre Google Business Profile en 2 minutes et laissez ReviewPilot faire le reste.
        </p>
        <Link href="/sign-up" className="bg-black text-white px-8 py-3 rounded-lg text-base font-medium hover:bg-gray-800">
          Créer mon compte
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} ReviewPilot — Fait avec ❤️ en France
      </footer>
    </div>
  )
}
