import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
        <svg className="w-14 h-14 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>
      
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Page introuvable</h1>
      
      <div className="text-center max-w-lg">
        <p className="text-gray-700 mb-6">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        
        <Link href="/" className="inline-block py-2 px-6 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  )
} 