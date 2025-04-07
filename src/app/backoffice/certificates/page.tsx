'use client'

import React, { useState, useEffect } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import UserService from '@/services/userService'
import { useToast } from "@/hooks/use-toast"
import { useUserRoles } from '@/hooks/useUserRoles'
import RoleProtected from '@/components/RoleProtected'
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DocumentType, DocumentStatus } from '@/lib/enums'
import { formatDocumentType, formatDocumentStatus, formatDate, formatAddress } from '@/lib/formatters'
import type { Document, Plant } from '@/lib/interfaces'

// --- Composant ---

export default function CertificatesPage() {
  const [plants, setPlants] = useState<Plant[]>([])
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null)

  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoadingComponent, setIsLoadingComponent] = useState(false)

  const { address, isConnected } = useAccount()
  const { toast } = useToast()
  const { roles, hasRole, isLoading: isLoadingRoles } = useUserRoles()

  const isExploitant = hasRole('exploitant')
  const isAsn = hasRole('asn')

  // --- Hook Lecture des Centrales (pour le Select) ---
  const {
    data: plantsData,
    isLoading: isLoadingPlants,
    error: plantsError
  } = useReadContract({
    address: UserService.CONTRACTS.IMPLEMENTATION as `0x${string}`,
    abi: UserService.ABI.IMPLEMENTATION,
    functionName: 'getAllPlants', // Confirmez ce nom
    query: { enabled: isConnected },
  })

  // --- Hook Lecture des Documents pour la CENTRALE SÉLECTIONNÉE ---
  const {
    data: documentsData,
    refetch: refetchDocuments,
    isLoading: isLoadingDocuments,
    error: documentsError
  } = useReadContract({
    address: UserService.CONTRACTS.IMPLEMENTATION as `0x${string}`,
    abi: UserService.ABI.IMPLEMENTATION,
    functionName: 'getDocumentsByPlant',
    args: selectedPlantId ? [BigInt(selectedPlantId)] : undefined,
    query: { enabled: isConnected && !!selectedPlantId },
  })

  // --- Effets ---

  useEffect(() => {
    if (plantsData && Array.isArray(plantsData)) {
      const formattedPlants: Plant[] = plantsData.map((plant: any) => ({
        id: BigInt(plant.id?.toString() || '0'),
        name: plant.name || 'Sans nom',
        location: plant.location || 'Lieu inconnu',
        description: '',
        registeredAt: BigInt(0),
        isActive: true
      }))
      setPlants(formattedPlants)
    } else if (plantsError) {
      console.error("Erreur lors de la récupération des centrales:", plantsError)
      setPlants([])
      toast({ title: "Erreur", description: "Impossible de charger les centrales.", variant: "destructive" })
    }
  }, [plantsData, plantsError, toast])

  // Mise à jour de la liste des documents (dépend de selectedPlantId maintenant)
  useEffect(() => {
    // Si une centrale est sélectionnée et que les données sont arrivées
    if (selectedPlantId && documentsData && Array.isArray(documentsData)) {
      const formattedDocs: Document[] = documentsData.map((doc: any): Document => {
         const convertTimestampToBigInt = (timestamp: any): bigint => {
            try {
                const num = Number(timestamp)
                return num > 0 ? BigInt(num) : BigInt(0)
            } catch { return BigInt(0) }
         }
         return {
           id: BigInt(doc.id?.toString() || '0'),
           name: doc.name || 'Sans nom',
           description: doc.description || '',
           docType: Number(doc.docType) as DocumentType ?? DocumentType.Certification,
           status: Number(doc.status) as DocumentStatus ?? DocumentStatus.Submitted,
           submitter: doc.submitter || '0x0',
           submittedAt: convertTimestampToBigInt(doc.submittedAt),
           rejectedAt: convertTimestampToBigInt(doc.rejectedAt),
           pendingAt: convertTimestampToBigInt(doc.pendingAt),
           deprecatedAt: convertTimestampToBigInt(doc.deprecatedAt),
           ipfsHash: doc.ipfsHash || '',
         }
      })
      setDocuments(formattedDocs)
    } else if (selectedPlantId && documentsError) {
       console.error(`Erreur documents pour centrale ${selectedPlantId}:`, documentsError)
       setDocuments([])
       toast({ title: "Erreur", description: "Impossible de charger les documents pour cette centrale.", variant: "destructive" })
    } else if (!selectedPlantId) {
        setDocuments([])
    }
  }, [selectedPlantId, documentsData, documentsError, toast])

  // Gestion de l'état de chargement global (simplifié)
  useEffect(() => {
    setIsLoadingComponent(
      isLoadingRoles ||
      isLoadingPlants ||
      (!!selectedPlantId && isLoadingDocuments)
    )
  }, [
      isLoadingRoles, isLoadingPlants, selectedPlantId, isLoadingDocuments
  ])

  // --- Rendu ---

  if (!isConnected) {
      return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-xl font-semibold mb-4 text-red-600">Connexion Requise</h2>
          <p className="mb-4">Vous devez être connecté pour accéder à cette page.</p>
        </div>
      </div>
    )
  }

  const allowedRoles = ['admin', 'exploitant', 'asn', 'constructeur', 'labo', 'certifieur']

  return (
    <RoleProtected roles={allowedRoles}>
      <div className="space-y-6 p-4">
        <h1 className="text-2xl font-bold mb-4">Gestion des Documents</h1>

        {isLoadingComponent && (
           <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-md shadow-lg">Chargement...</div>
          </div>
        )}

        {/* Section Sélection de la Centrale */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Sélectionner une Centrale</h2>
          <Select
            onValueChange={(value) => {
              setSelectedPlantId(value)
              setDocuments([])
            }}
            disabled={isLoadingPlants || plants.length === 0}
            value={selectedPlantId || undefined}
          >
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder={isLoadingPlants ? "Chargement..." : "Choisir une centrale"} />
            </SelectTrigger>
            <SelectContent>
              {plants.map((plant) => (
                <SelectItem key={plant.id.toString()} value={plant.id.toString()}>
                  {plant.name} ({plant.location})
                </SelectItem>
              ))}
              {plants.length === 0 && !isLoadingPlants && (
                <div className="p-2 text-sm text-gray-500">Aucune centrale trouvée.</div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Section Liste des Documents (Conditionnée par la sélection) */}
        {selectedPlantId && (
          <div className="bg-white rounded-lg shadow p-6">
            {/* Affichage du nom de la centrale sélectionnée */}
             <div className="flex items-center mb-4">
                 <h2 className="text-xl font-semibold mr-3">Documents de la Centrale</h2>
                 <span className="px-3 py-1 inline-flex text-sm font-medium rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                    {plants.find(p => p.id.toString() === selectedPlantId)?.name || 'Sélectionnée'}
                 </span>
             </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                {/* ... (thead inchangé) */}
                 <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Soumis le</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Soumissionnaire</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IPFS</th>
                </tr>
              </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Message de chargement spécifique aux documents */}
                  {isLoadingDocuments && (
                    <tr><td colSpan={6} className="p-4 text-center text-gray-500">Chargement des documents...</td></tr>
                  )}
                  {/* Message si aucun document trouvé pour CETTE centrale */}
                  {!isLoadingDocuments && documents.length === 0 && (
                    <tr><td colSpan={6} className="p-4 text-center text-gray-500">Aucun document trouvé pour cette centrale.</td></tr>
                  )}
                  {/* Mapping des documents (inchangé) */}
                  {!isLoadingDocuments && documents.map((doc: Document) => (
                    <tr key={doc.id.toString()}>
                    <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                        <div className="text-sm text-gray-500 lg:hidden">{formatDocumentType(doc.docType) || 'Type Inconnu'}</div>
                        <div className="text-sm text-gray-500 md:hidden" title={doc.submitter}>{doc.submitter.substring(0,6)}...</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{formatDocumentType(doc.docType) || 'Inconnu'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                       <Badge className={doc.status === DocumentStatus.Pending ? 'bg-yellow-100 text-yellow-800' : 
                                        doc.status === DocumentStatus.Rejected ? 'bg-red-100 text-red-800' : 
                                        doc.status === DocumentStatus.Deprecated ? 'bg-gray-100 text-gray-800' : 
                                        'bg-green-100 text-green-800'}>
                         {formatDocumentStatus(doc.status)}
                       </Badge>
                    </td>
                     <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">{formatDate(Number(doc.submittedAt))}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell font-mono" title={doc.submitter}>
                        {formatAddress(doc.submitter)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <a href={`https://gateway.pinata.cloud/ipfs/${doc.ipfsHash}`}
                         target="_blank" rel="noopener noreferrer"
                         className="text-indigo-600 hover:text-indigo-900 hover:underline"
                         title={doc.ipfsHash}>
                         Lien IPFS
                      </a>
                    </td>
                  </tr>
                  ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </RoleProtected>
  )
}

