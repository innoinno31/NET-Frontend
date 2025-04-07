'use client'

import React, { ReactNode, useEffect } from 'react'
import { useUserRoles } from '@/hooks/useUserRoles'
import SidebarMenu from '@/components/backoffice/SidebarMenu'
import RoleProtected from '@/components/RoleProtected'

interface BackofficeLayoutProps {
  children: ReactNode
}

const BackofficeLayout: React.FC<BackofficeLayoutProps> = ({ children }) => {
  const { roles, isLoading } = useUserRoles() 
  
  // Afficher un indicateur de chargement pendant le chargement des rôles
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-indigo-600">Chargement des autorisations...</p>
        </div>
      </div>
    )
  }
  
  const allowedRoles = ['admin', 'exploitant', 'labo', 'constructeur', 'certifieur', 'asn']
  
  return (
    <RoleProtected roles={allowedRoles}>
      <div className="flex h-screen">
        {/* Sidebar fixe */}
        <aside className="w-64 flex-shrink-0 h-full overflow-y-auto">
          <SidebarMenu />
        </aside>
        
        {/* Contenu principal avec défilement */}
        <main className="flex-grow p-8 overflow-auto">
          {children}
        </main>
      </div>
    </RoleProtected>
  )
}

export default BackofficeLayout 