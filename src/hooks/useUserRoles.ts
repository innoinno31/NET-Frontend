import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import blockchainService from '@/services/blockchainService'

// Définition des rôles blockchain selon le contrat
export const ROLES = {
  DEFAULT_ADMIN_ROLE: 'DEFAULT_ADMIN_ROLE',
  PLANT_OPERATOR_ADMIN: 'PLANT_OPERATOR_ADMIN',
  PLANT_OPERATOR: 'PLANT_OPERATOR',
  MANUFACTURER: 'MANUFACTURER', 
  LABORATORY: 'LABORATORY',
  REGULATORY_AUTHORITY: 'REGULATORY_AUTHORITY',
  CERTIFICATION_OFFICER: 'CERTIFICATION_OFFICER'
}

// Mapping des rôles blockchain vers les rôles frontend
export const ROLE_MAPPING: Record<string, string> = {
  [ROLES.DEFAULT_ADMIN_ROLE]: 'admin',
  [ROLES.PLANT_OPERATOR_ADMIN]: 'exploitant',
  [ROLES.MANUFACTURER]: 'constructeur',
  [ROLES.LABORATORY]: 'labo',
  [ROLES.REGULATORY_AUTHORITY]: 'asn',
  [ROLES.CERTIFICATION_OFFICER]: 'certifieur'
}

/**
 * Hook personnalisé pour récupérer les rôles de l'utilisateur connecté
 * @returns Les rôles de l'utilisateur et des méthodes pour vérifier les permissions
 */
export const useUserRoles = () => {
  const { address, isConnected, status } = useAccount()
  const [roles, setRoles] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserRoles = async () => {
      if (status !== 'connected' || !address) {
        setRoles([])
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const userRoles = await blockchainService.getUserRoles(address)
        setRoles(userRoles)
      } catch (err) {
        console.error('Erreur lors de la récupération des rôles utilisateur:', err)
        setError('Impossible de récupérer les rôles utilisateur')
        setRoles([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserRoles()
  }, [address, isConnected, status])

  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   * @param role Le rôle à vérifier (format frontend)
   * @returns true si l'utilisateur a le rôle, false sinon
   */
  const hasRole = (role: string): boolean => {
    return roles.includes(role)
  }

  /**
   * Vérifie si l'utilisateur a au moins un des rôles spécifiés
   * @param requiredRoles Les rôles à vérifier (format frontend)
   * @returns true si l'utilisateur a au moins un des rôles, false sinon
   */
  const hasAnyRole = (requiredRoles: string[]): boolean => {
    if (!isConnected) {
      return false
    }
    if (!requiredRoles || requiredRoles.length === 0) {
      return false
    }
    
    return requiredRoles.some(role => roles.includes(role))
  }

  return {
    roles,
    isLoading,
    error,
    hasRole,
    hasAnyRole,
    isConnected,
    connectionStatus: status
  }
} 