'use client'

import React from 'react'
import { useUserRoles } from '@/hooks/useUserRoles'

// Traduction des noms de rôles pour l'affichage
const roleLabels: Record<string, string> = {
  admin: 'Administrateur',
  exploitant: 'Exploitant',
  constructeur: 'Constructeur',
  labo: 'Laboratoire',
  asn: 'Autorité ASN',
  certifieur: 'Agent de certification'
}

const BackofficePage = () => {
  const { roles } = useUserRoles()
  
  return (
    <>
      <h1 className="text-2xl font-bold text-indigo-800 mb-6">Tableau de bord</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-indigo-700 mb-2">Bienvenue dans l'interface d'administration</h2>
            <p className="text-gray-600 max-w-2xl">
              Utilisez le menu de navigation pour accéder aux différentes fonctionnalités disponibles selon vos rôles.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default BackofficePage