import Link from 'next/link'

/**
 * Page 403 - Accès refusé
 * Cette page est affichée lorsqu'un utilisateur tente d'accéder à une ressource 
 * pour laquelle il n'a pas les droits nécessaires.
 */
export default function Forbidden() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <svg className="w-14 h-14 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
      </div>
      
      <h1 className="text-3xl font-bold text-red-600 mb-4">Accès refusé</h1>
      
      <div className="text-center max-w-lg">
        <p className="text-gray-700 mb-6">
          Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
        </p>
        
        <Link href="/" className="inline-block py-2 px-6 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  )
} 