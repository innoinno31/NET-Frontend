'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { QueryObserverResult, RefetchOptions } from '@tanstack/react-query'
import UserService from '@/services/userService'
import { useToast } from "@/hooks/use-toast"
import { useUserRoles } from '@/hooks/useUserRoles'
import RoleProtected from '@/components/RoleProtected'
import SelectPlant from '@/components/backoffice/SelectPlant'
import SelectEquipment from '@/components/backoffice/SelectEquipment'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CertificationSteps, EquipmentStatus } from '@/lib/enums'
import type { Equipment } from '@/lib/interfaces'

// --- Interfaces & Enums ---

const formatStep = (step: CertificationSteps): string => {
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
const formatStatus = (status: EquipmentStatus): string => {
    const statuses: Record<EquipmentStatus, string> = {
      [EquipmentStatus.Registered]: 'Enregistré',
      [EquipmentStatus.Pending]: 'En attente de certification',
      [EquipmentStatus.Certified]: 'Certifié',
      [EquipmentStatus.Rejected]: 'Rejeté',
      [EquipmentStatus.Deprecated]: 'Déprécié'
    }
    return statuses[status] ?? `Statut ${status}`
}
const formatDate = (timestamp?: bigint): string => {
    if (timestamp === undefined || timestamp === null) return '—'
    try {
        const timestampNumber = Number(timestamp);
        if (isNaN(timestampNumber) || timestampNumber <= 0) return '—';
        return new Date(timestampNumber * 1000).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric'})
    } catch (e) {
        console.error("Error formatting date:", e, "Original timestamp:", timestamp);
        return 'Date invalide'
    }
}

// Définir le type de la fonction refetch qu'on attend de SelectEquipment
type RefetchEquipmentsFn = (options?: RefetchOptions | undefined) => Promise<QueryObserverResult<unknown, unknown>>;

// --- Composant Page ---

export default function CertificationRequestsPage() {
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null)
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null)
  const [selectedEquipmentDetails, setSelectedEquipmentDetails] = useState<Equipment | null>(null)

  const [isLoadingPlants, setIsLoadingPlants] = useState(true)
  const [isLoadingEquipments, setIsLoadingEquipments] = useState(false)
  const [isLoadingComponent, setIsLoadingComponent] = useState(true)

  // Réintroduire useRef pour stocker la fonction refetch de SelectEquipment
  const refetchEquipmentsRef = useRef<RefetchEquipmentsFn | null>(null);

  const { isConnected } = useAccount()
  const { toast } = useToast()
  const { isLoading: isLoadingRoles } = useUserRoles()

  const allowedRoles = ['exploitant']

  const { data: reviewRequestData, writeContract: writeRequestReview, isPending: isReviewRequestPending, error: reviewRequestWriteError } = useWriteContract()
  const { isLoading: isReviewRequestConfirming, isSuccess: isReviewRequestConfirmed, error: reviewRequestConfirmError } = useWaitForTransactionReceipt({ hash: reviewRequestData })

  useEffect(() => {
    const isBlockchainLoading = isReviewRequestPending || isReviewRequestConfirming
    setIsLoadingComponent(isLoadingRoles || isLoadingPlants || isLoadingEquipments || isBlockchainLoading)
  }, [isLoadingRoles, isLoadingPlants, isLoadingEquipments, isReviewRequestPending, isReviewRequestConfirming])

  useEffect(() => {
    if (isReviewRequestConfirmed && reviewRequestData) {
      console.log("[Debug] Transaction confirmed! reviewRequestData:", reviewRequestData, "Attempting toast and list refetch...");
      toast({ 
        title: "Demande Envoyée !", 
        description: `La demande de revue a été soumise (Tx: ${reviewRequestData.substring(0, 10)}...). Statut mis à Pending, Étape mise à ReadyForReview.`,
        variant: "default" 
      })

      // Appeler la fonction refetch stockée
      if (refetchEquipmentsRef.current) {
        console.log("[Debug] Calling refetchEquipmentsRef.current()...");
        refetchEquipmentsRef.current()?.catch(err => {
          console.error("Error during equipment list refetch:", err);
          toast({ title: "Erreur Rafraîchissement", description: "Impossible de rafraîchir automatiquement la liste des équipements.", variant: "destructive" })
        });
      } else {
        console.warn("[Debug] refetchEquipmentsRef.current is not available for refetch.");
      }
    }
  }, [isReviewRequestConfirmed, reviewRequestData, toast])

  useEffect(() => {
    const error = reviewRequestWriteError || reviewRequestConfirmError
    if (error) {
      toast({ title: "Erreur Blockchain", description: (error as any)?.shortMessage || (error as Error)?.message || "La soumission de la demande a échoué.", variant: "destructive" })
    }
  }, [reviewRequestWriteError, reviewRequestConfirmError, toast])

  // Handler pour recevoir refetch de SelectEquipment
  const handleRefetchReady = useCallback((refetchFn: RefetchEquipmentsFn) => {
    console.log("[Debug] Received refetch function from SelectEquipment.");
    refetchEquipmentsRef.current = refetchFn;
  }, []);

  const handlePlantSelection = useCallback((plantId: string | null) => {
    setSelectedPlantId(plantId)
    setSelectedEquipmentId(null)
    setSelectedEquipmentDetails(null)
  }, [])

  // Renommer : Gère la sélection MANUELLE de l'ID par l'utilisateur
  const handleEquipmentIdChange = useCallback((equipmentId: string | null) => {
    console.log("[Debug] handleEquipmentIdChange (received ID):", equipmentId);
    setSelectedEquipmentId(equipmentId);
    // Important: Ne pas réinitialiser les détails ici, car onRefetchComplete s'en chargera
    if (!equipmentId) {
      setSelectedEquipmentDetails(null);
    }
  }, [])

  const handleRefetchComplete = useCallback((equipment: Equipment | null) => {
    console.log("[Debug] handleRefetchComplete (received object):", equipment)
    setSelectedEquipmentDetails(equipment)
  }, [])

  const handleRequestReview = useCallback(() => {
    if (!selectedEquipmentDetails || selectedEquipmentDetails.status !== EquipmentStatus.Registered) {
        toast({ 
          title: "Action impossible", 
          description: `L\'équipement doit avoir le statut '${formatStatus(EquipmentStatus.Registered)}' pour initier la revue.`,
          variant: "destructive"
        })
        return
    }
    toast({ title: "Transaction en cours", description: "Demande de revue ASN en cours de soumission...", variant: "default"})
    writeRequestReview({
        address: UserService.CONTRACTS.IMPLEMENTATION as `0x${string}`,
        abi: UserService.ABI.IMPLEMENTATION,
        functionName: 'equipmentIsReadyForReview',
        args: [BigInt(selectedEquipmentDetails.id)],
    })
  }, [selectedEquipmentDetails, writeRequestReview, toast])

  if (!isConnected) {
    return <div className="p-4 text-center text-red-600">Connexion requise.</div>
  }

  const canRequestReview = selectedEquipmentDetails?.status === EquipmentStatus.Registered;

  return (
    <RoleProtected roles={allowedRoles}>
      <div className="space-y-6 p-4">
        <h1 className="text-2xl font-bold mb-4">Demander une Revue de Certification ASN</h1>
         <p className="text-sm text-gray-600">
           Sélectionnez un équipement dont le statut est "{formatStatus(EquipmentStatus.Registered)}" pour initier le processus de revue par l'ASN.
           Cette action passera le statut à "{formatStatus(EquipmentStatus.Pending)}" et l'étape à "{formatStep(CertificationSteps.ReadyForReview)}".
        </p>

        {isLoadingComponent && (
           <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-md shadow-lg">Chargement...</div>
          </div>
        )}

        {/* Sélection Centrale */}
        <div className="bg-white rounded-lg shadow p-6">
          <Label className="text-lg font-semibold mb-4 block">Étape 1 : Sélectionner la Centrale</Label>
          <SelectPlant
            selectedPlantId={selectedPlantId}
            onPlantSelected={handlePlantSelection}
            onLoadingChange={setIsLoadingPlants}
            disabled={isLoadingComponent}
            triggerWidth="w-full"
          />
        </div>

        {/* Sélection Équipement */}
        {selectedPlantId && (
          <div className="bg-white rounded-lg shadow p-6">
            <Label className="text-lg font-semibold mb-4 block">Étape 2 : Sélectionner l'Équipement</Label>
            <SelectEquipment
              selectedPlantId={selectedPlantId}
              selectedEquipmentId={selectedEquipmentId}
              onValueChange={handleEquipmentIdChange}
              onRefetchComplete={handleRefetchComplete}
              onLoadingChange={setIsLoadingEquipments}
              disabled={isLoadingComponent || !selectedPlantId}
              triggerWidth="w-full"
              onRefetchReady={handleRefetchReady}
            />
          </div>
        )}

         {/* Affichage Détails et Actions */} 
         {selectedEquipmentDetails && (
             <div className="bg-white rounded-lg shadow p-6 space-y-4">
                 <h2 className="text-xl font-semibold mb-4">
                    Équipement : {selectedEquipmentDetails.name} (ID: {selectedEquipmentDetails.id.toString()})
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                     <div>
                         <span className="font-medium text-gray-500 block">Statut Actuel</span>
                         <Badge
                            variant={selectedEquipmentDetails.status === EquipmentStatus.Registered ? "outline" : "secondary"}
                            className={`${selectedEquipmentDetails.status === EquipmentStatus.Registered ? 'border-green-500 text-green-700' : ''}`}
                         >
                            {formatStatus(selectedEquipmentDetails.status)}
                         </Badge>
                     </div>
                      <div>
                         <span className="font-medium text-gray-500 block">Étape Certification</span>
                          <Badge
                            variant={selectedEquipmentDetails.currentStep === CertificationSteps.Registered ? "default" : "secondary"}
                            className={`${selectedEquipmentDetails.currentStep === CertificationSteps.Registered ? 'bg-gray-100 text-gray-800' : ''}`}
                         >
                            {formatStep(selectedEquipmentDetails.currentStep)}
                         </Badge>
                     </div>
                      <div>
                         <span className="font-medium text-gray-500 block">Enregistré le</span>
                         <span>{formatDate(selectedEquipmentDetails.registeredAt)}</span>
                     </div>
                      {/* Afficher la raison du rejet si applicable */}
                      {selectedEquipmentDetails.status === EquipmentStatus.Rejected && selectedEquipmentDetails.rejectionReason && (
                          <div className="md:col-span-3">
                             <span className="font-medium text-gray-500 block">Raison du Rejet</span>
                             <span className="text-red-700">{selectedEquipmentDetails.rejectionReason}</span>
                         </div>
                      )}
                      {/* Afficher le hash si applicable */}
                       {selectedEquipmentDetails.status === EquipmentStatus.Certified && selectedEquipmentDetails.finalCertificationHash && (
                          <div className="md:col-span-3">
                             <span className="font-medium text-gray-500 block">Hash Certification</span>
                             <span className="font-mono text-xs break-all">{selectedEquipmentDetails.finalCertificationHash}</span>
                         </div>
                      )}
                 </div>
                  <div className="border-t pt-4 flex justify-end">
                      <Button
                        onClick={handleRequestReview}
                        disabled={!canRequestReview || isLoadingComponent}
                        title={!canRequestReview ? `Action impossible. Statut doit être '${formatStatus(EquipmentStatus.Registered)}'` : "Initier la revue par l'ASN (Statut -> Pending, Étape -> ReadyForReview)"}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        {isReviewRequestPending || isReviewRequestConfirming ? 'Demande en cours...' : 'Initier la Revue ASN'}
                      </Button>
                  </div>
             </div>
         )}

         {/* Message si aucun équipement */}
         {selectedPlantId && !selectedEquipmentId && !isLoadingEquipments && (
            <div className="text-center text-gray-500 py-6">
                 Veuillez sélectionner un équipement pour voir son statut et initier la revue.
             </div>
         )}

      </div>
    </RoleProtected>
  )
}
