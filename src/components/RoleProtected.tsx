'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useUserRoles } from '@/hooks/useUserRoles'
import AccessDenied from '@/components/backoffice/AccessDenied'

type RoleProtectedProps = {
  children: ReactNode
  roles?: string[]
  publicAccess?: boolean
  loadingComponent?: ReactNode
}

/**
 * Composant pour protéger l'accès aux pages en fonction du rôle de l'utilisateur
 * Affiche une erreur 403 si l'utilisateur n'a pas le droit nécessaire
 */
const RoleProtected = ({
  children,
  roles = [],
  publicAccess = false,
  loadingComponent = <div className="flex justify-center items-center p-10">Chargement des autorisations...</div>
}: RoleProtectedProps) => {
  const { roles: userRoles, isConnected, isLoading } = useUserRoles()
  const [accessGranted, setAccessGranted] = useState<boolean | null>(null)
  
  // Obtient le rôle de l'utilisateur
  const userRole = userRoles.length > 0 ? userRoles[0] : null
  
  // Vérifier les droits d'accès
  useEffect(() => {
    if (publicAccess) {
      setAccessGranted(true)
      return
    }
    
    if (isLoading) {
      return
    }
    
    let hasAccess = false
    
    if (userRole === 'admin') {
      hasAccess = true
    }
    else if (!isConnected) {
      hasAccess = false
    }
    else if (roles.length === 0) {
      hasAccess = true
    }
    else if (userRole) {
      hasAccess = roles.includes(userRole)
    }
    
    setAccessGranted(hasAccess)
  }, [isConnected, userRole, roles, publicAccess, isLoading])
  
  if (publicAccess) {
    return <>{children}</>
  }
  
  if (isLoading || accessGranted === null) {
    return <>{loadingComponent}</>
  }
  
  if (accessGranted) {
    return <>{children}</>
  }
  
  return <AccessDenied />
}

export default RoleProtected 