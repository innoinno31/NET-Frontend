'use client'

import RoleProtected from '@/components/RoleProtected'
import { useState } from 'react'
import { useUserRoles } from '@/hooks/useUserRoles'

function CreateCertificatePage() {
  const { roles } = useUserRoles()
  const [message] = useState(`Vous êtes connecté avec les rôles: ${roles.join(', ') || 'aucun'}`)

  return (
    <RoleProtected roles={['labo', 'constructeur', 'exploitant']}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-indigo-900 mb-3">Création de Certificat</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <p className="text-gray-600 mb-4">
            {message}
          </p>
          
          <p className="text-gray-600">
            Cette page est accessible uniquement aux utilisateurs ayant les rôles suivants: laboratoire, constructeur ou exploitant.
          </p>
        </div>
        
        {/* Ajoutez ici le formulaire de création de certificat */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-indigo-800 mb-4">Nouveau certificat</h2>
          
          <form className="space-y-6">
            {/* Formulaire à implémenter */}
            <div className="flex justify-end">
              <button 
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Créer
              </button>
            </div>
          </form>
        </div>
      </div>
    </RoleProtected>
  )
}

export default CreateCertificatePage 