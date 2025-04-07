import { 
  NUCLEAR_CERTIFICATION_STORAGE_ADDRESS, 
  NUCLEAR_CERTIFICATION_STORAGE_ABI,
} from '@/contracts/NuclearContracts'
import {
    http,
    keccak256,
    stringToBytes,
    createPublicClient as viemCreatePublicClient
} from 'viem'
import { hardhat } from 'viem/chains'

// Client blockchain public pour les lectures
const createClient = () => {
  return viemCreatePublicClient({
    chain: hardhat,
    transport: http(process.env.NEXT_PUBLIC_HARDHAT_RPC_URL || 'http://127.0.0.1:8545') 
  })
}

const publicClient = createClient()

// Valeurs keccak256 des rôles - Ces valeurs doivent correspondre exactement à celles du contrat
const ROLE_VALUES = {
  DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000', // Valeur fixe selon OpenZeppelin
  PLANT_OPERATOR_ADMIN: keccak256(stringToBytes('PLANT_OPERATOR_ADMIN')),
  PLANT_OPERATOR: keccak256(stringToBytes('PLANT_OPERATOR')),
  MANUFACTURER: keccak256(stringToBytes('MANUFACTURER')),
  LABORATORY: keccak256(stringToBytes('LABORATORY')),
  REGULATORY_AUTHORITY: keccak256(stringToBytes('REGULATORY_AUTHORITY')),
  CERTIFICATION_OFFICER: keccak256(stringToBytes('CERTIFICATION_OFFICER'))
}

// Mapping des valeurs de rôles blockchain vers les noms de rôles internes
const ROLE_MAPPING = {
  'DEFAULT_ADMIN_ROLE': 'admin',
  'PLANT_OPERATOR': 'exploitant',
  'PLANT_OPERATOR_ADMIN': 'exploitant',
  'MANUFACTURER': 'constructeur',
  'LABORATORY': 'labo',
  'REGULATORY_AUTHORITY': 'asn',
  'CERTIFICATION_OFFICER': 'certifieur'
}

// Ordre de priorité des rôles (du plus prioritaire au moins prioritaire)
const ROLE_PRIORITY = [
  'DEFAULT_ADMIN_ROLE',
  'PLANT_OPERATOR_ADMIN',
  'CERTIFICATION_OFFICER',
  'REGULATORY_AUTHORITY',
  'MANUFACTURER',
  'LABORATORY',
  'PLANT_OPERATOR'
]

/**
 * Service pour interagir avec les contrats blockchain
 */
class BlockchainService {
  /**
   * Vérifie si un utilisateur a un rôle spécifique
   * @param roleName Nom du rôle à vérifier (constante du contrat)
   * @param address Adresse de l'utilisateur
   * @returns True si l'utilisateur a le rôle
   */
  async hasRole(roleName: string, address: string): Promise<boolean> {
    try {
      if (!publicClient) {
        return false
      }
      
      const roleValue = this.getRoleValue(roleName)
      if (!roleValue) {
        return false
      }

      const result = await publicClient.readContract({
        address: NUCLEAR_CERTIFICATION_STORAGE_ADDRESS as `0x${string}`,
        abi: NUCLEAR_CERTIFICATION_STORAGE_ABI,
        functionName: 'hasRole',
        args: [roleValue, address as `0x${string}`]
      })
      
      return result as boolean
    } catch (error) {
      return false
    }
  }

  /**
   * Obtient la valeur bytes32 d'un rôle à partir de son nom
   * @param roleName Nom du rôle (ex: "PLANT_OPERATOR")
   * @returns La valeur bytes32 du rôle
   */
  getRoleValue = (roleName: string): `0x${string}` | null => {
    const value = ROLE_VALUES[roleName as keyof typeof ROLE_VALUES]
    return value ? value as `0x${string}` : null
  }

  /**
   * Récupère le rôle principal d'un utilisateur
   * @param address Adresse de l'utilisateur
   * @returns Le rôle prioritaire au format frontend, dans un tableau pour compatibilité
   */
  async getUserRoles(address: string): Promise<string[]> {
    try {      
      if (!address || !publicClient) {
        return []
      }
      
      for (const roleName of ROLE_PRIORITY) {
        const hasRoleResult = await this.hasRole(roleName, address)
        
        if (hasRoleResult) {
          const frontendRole = ROLE_MAPPING[roleName as keyof typeof ROLE_MAPPING]          
          return frontendRole ? [frontendRole] : []
        }
      }
      
      return []
    } catch (error) {
      return []
    }
  }

  /**
   * Vérifie un certificat
   * @param certificateId ID du certificat
   * @returns Données du certificat ou null si non trouvé
   */
  async verifyCertificate(certificateId: string): Promise<any> {
    try {
      if (!certificateId || !publicClient) return null
      
      const data = await publicClient.readContract({
        address: NUCLEAR_CERTIFICATION_STORAGE_ADDRESS as `0x${string}`,
        abi: NUCLEAR_CERTIFICATION_STORAGE_ABI,
        functionName: 'getEquipmentCertification',
        args: [BigInt(certificateId)]
      })
      
      return data
    } catch (error) {
      return null
    }
  }
}

const blockchainService = new BlockchainService()
export default blockchainService 