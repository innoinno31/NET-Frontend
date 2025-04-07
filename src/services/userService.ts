import { 
  NUCLEAR_CERTIFICATION_STORAGE_ADDRESS, 
  NUCLEAR_CERTIFICATION_STORAGE_ABI,
  NUCLEAR_CERTIFICATION_IMPL_ADDRESS,
  NUCLEAR_CERTIFICATION_IMPL_ABI
} from '../contracts/NuclearContracts'

// Types
export type NuclearPlant = {
  id: string
  name: string
  location: string
  description: string
  status: 'active' | 'inactive' | 'maintenance'
  registeredAt?: number;
}

export type UserRole = 'PLANT_OPERATOR' | 'MANUFACTURER' | 'LABORATORY' | 'REGULATORY_AUTHORITY' | 'CERTIFICATION_OFFICER'

export type User = {
  address: string
  role: UserRole
  plantId?: string // Référence à la centrale (pour les exploitants)
}

// Service pour les utilisateurs et centrales
export const UserService = {
  // Constantes pour les rôles
  // Ces constantes devraient idéalement être récupérées directement depuis le contrat
  ROLES: {
    PLANT_OPERATOR: 'PLANT_OPERATOR',
    MANUFACTURER: 'MANUFACTURER',
    LABORATORY: 'LABORATORY',
    REGULATORY_AUTHORITY: 'REGULATORY_AUTHORITY',
    CERTIFICATION_OFFICER: 'CERTIFICATION_OFFICER'
  },
  
  // Les adresses des contrats pour un accès facile
  CONTRACTS: {
    STORAGE: NUCLEAR_CERTIFICATION_STORAGE_ADDRESS,
    IMPLEMENTATION: NUCLEAR_CERTIFICATION_IMPL_ADDRESS
  },
  
  // Les ABIs pour un accès facile
  ABI: {
    STORAGE: NUCLEAR_CERTIFICATION_STORAGE_ABI,
    IMPLEMENTATION: NUCLEAR_CERTIFICATION_IMPL_ABI
  }
}

export default UserService 