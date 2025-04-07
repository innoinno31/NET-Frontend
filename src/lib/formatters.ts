import { CertificationSteps, DocumentType, DocumentStatus, EquipmentStatus } from './enums'
import { Address } from 'viem'

export const formatCertificationStep = (step?: CertificationSteps): string => {
    if (step === undefined) return 'Inconnue'
    const steps: Record<CertificationSteps, string> = {
      [CertificationSteps.Registered]: 'Enregistré',
      [CertificationSteps.DocumentsPending]: 'Docs en attente',
      [CertificationSteps.ReadyForReview]: 'Prêt pour révision',
      [CertificationSteps.UnderReview]: 'En révision (ASN)',
      [CertificationSteps.Certified]: 'Certifié',
      [CertificationSteps.Rejected]: 'Rejeté'
    }
    return steps[step] ?? `Étape ${step}`
}

export const formatEquipmentStatus = (status?: EquipmentStatus): string => {
    if (status === undefined) return 'Inconnu'
    const statuses: Record<EquipmentStatus, string> = {
      [EquipmentStatus.Registered]: 'Enregistré',
      [EquipmentStatus.Pending]: 'En attente',
      [EquipmentStatus.Certified]: 'Certifié',
      [EquipmentStatus.Rejected]: 'Rejeté',
      [EquipmentStatus.Deprecated]: 'Déprécié'
    }
    return statuses[status] ?? `Statut ${status}`
}

export const formatDocumentType = (docType?: DocumentType): string => {
    if (docType === undefined) return 'Inconnu'
    const types: Record<DocumentType, string> = {
      [DocumentType.Certification]: 'Certification',
      [DocumentType.LabReport]: 'Rapport Labo',
      [DocumentType.TechFile]: 'Fichier Tech',
      [DocumentType.Compliance]: 'Conformité',
      [DocumentType.RegulatoryReview]: 'Revue Réglementaire'
    }
    return types[docType] ?? `Type ${docType}`
}

export const formatDocumentStatus = (status?: DocumentStatus): string => {
    if (status === undefined) return 'Inconnu'
    const statuses: Record<DocumentStatus, string> = {
      [DocumentStatus.Submitted]: 'Soumis',
      [DocumentStatus.Pending]: 'En attente (ASN)',
      [DocumentStatus.Rejected]: 'Rejeté (ASN)',
      [DocumentStatus.Deprecated]: 'Déprécié'
    }
    return statuses[status] ?? `Statut ${status}`
}

/**
 * Formate un timestamp Unix (secondes) ou un bigint en date lisible fr-FR.
 * Retourne '—' si le timestamp est undefined, null, 0 ou invalide.
 */
export const formatDate = (timestamp?: number | bigint | null): string => {
  if (!timestamp || BigInt(timestamp) === BigInt(0)) return '—'
  try {
    const tsNumber = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp
    return new Date(tsNumber * 1000).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch {
    return 'Date invalide'
  }
}

/**
 * Formate un timestamp Unix (secondes) ou un bigint en date et heure lisibles fr-FR.
 * Retourne '—' si le timestamp est undefined, null, 0 ou invalide.
 */
export const formatDateTime = (timestamp?: number | bigint | null): string => {
  if (!timestamp || BigInt(timestamp) === BigInt(0)) return '—'
  try {
    const tsNumber = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp
    return new Date(tsNumber * 1000).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return 'Date/Heure invalide'
  }
}

/**
 * Tronque une adresse Ethereum pour l'affichage si elle est trop longue.
 */
export const formatAddress = (address?: Address | string | null): string => {
  if (!address) return 'N/A'
  if (address.length < 10) return address
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}
