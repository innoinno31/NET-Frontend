'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Hash, Address } from 'viem'
import { QueryObserverResult, RefetchOptions } from '@tanstack/react-query'
import UserService from '@/services/userService'
import { useToast } from "@/hooks/use-toast"
import { useUserRoles } from '@/hooks/useUserRoles'
import RoleProtected from '@/components/RoleProtected'
import SelectPlant from '@/components/backoffice/SelectPlant'
import SelectEquipment from '@/components/backoffice/SelectEquipment'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog"
import { CertificationSteps, EquipmentStatus, DocumentType, DocumentStatus } from '@/lib/enums'
import { formatCertificationStep, formatEquipmentStatus, formatDate } from '@/lib/formatters'
import type { Equipment, Document } from '@/lib/interfaces'

type RefetchEquipmentsFn = (options?: RefetchOptions | undefined) => Promise<QueryObserverResult<unknown, unknown>>;

// --- Composant Page ---

export default function AsnCertificationPage() {
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null)
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null)
  const [selectedEquipmentDetails, setSelectedEquipmentDetails] = useState<Equipment | null>(null)
  const [equipmentDocuments, setEquipmentDocuments] = useState<Document[]>([])

  // États de chargement
  const [isLoadingPlants, setIsLoadingPlants] = useState(true)
  const [isLoadingEquipments, setIsLoadingEquipments] = useState(false)
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  const [isLoadingComponent, setIsLoadingComponent] = useState(true)

  // États pour la modale
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [finalizationDecision, setFinalizationDecision] = useState<'approve' | 'reject' | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [finalHash, setFinalHash] = useState<Hash | null>(null)
  const [isGeneratingHash, setIsGeneratingHash] = useState(false)

  // Ref pour stocker la fonction refetch de SelectEquipment
  const refetchEquipmentsRef = useRef<RefetchEquipmentsFn | null>(null);

  const { address, isConnected } = useAccount()
  const { toast } = useToast()
  const { roles, hasRole, isLoading: isLoadingRoles } = useUserRoles()

  const allowedRoles = ['asn'] // REGULATORY_AUTHORITY

  // --- Hooks Lecture ---

  const {
    data: documentsData,
    isLoading: isLoadingDocsHook,
    refetch: refetchEquipmentDocuments,
    error: documentsError,
  } = useReadContract({
    address: UserService.CONTRACTS.IMPLEMENTATION as `0x${string}`,
    abi: UserService.ABI.IMPLEMENTATION,
    functionName: 'getAllDocumentsForEquipment',
    args: selectedEquipmentId ? [BigInt(selectedEquipmentId)] : undefined,
    query: { enabled: isConnected && !!selectedEquipmentId },
  });

  // --- Hooks Écriture ---

  const { data: reviewData, writeContract: writeReviewEquipment, isPending: isReviewEquipmentPending, error: reviewEquipmentWriteError } = useWriteContract()
  const { isLoading: isReviewEquipmentConfirming, isSuccess: isReviewEquipmentConfirmed, error: reviewEquipmentConfirmError } = useWaitForTransactionReceipt({ hash: reviewData })

  const { data: finalizeData, writeContract: writeFinalize, isPending: isFinalizePending, error: finalizeWriteError } = useWriteContract()
  const { isLoading: isFinalizeConfirming, isSuccess: isFinalizeConfirmed, error: finalizeConfirmError } = useWaitForTransactionReceipt({ hash: finalizeData })


  // --- Effets ---

  useEffect(() => {
    setIsLoadingDocuments(isLoadingDocsHook)
    if (selectedEquipmentId && documentsData && Array.isArray(documentsData)) {
      // Mapper vers la nouvelle interface Document
      const formattedDocs: Document[] = documentsData.map((doc: any) => ({
        id: doc.id?.toString() ?? '',
        name: doc.name ?? 'Document sans nom',
        description: doc.description ?? '',
        docType: Number(doc.docType ?? DocumentType.Certification) as DocumentType,
        status: Number(doc.status ?? DocumentStatus.Submitted) as DocumentStatus,
        submitter: doc.submitter ?? '0x0000000000000000000000000000000000000000',
        submittedAt: Number(doc.submittedAt ?? 0),
        rejectedAt: doc.rejectedAt && BigInt(doc.rejectedAt) > 0 ? Number(doc.rejectedAt) : undefined,
        pendingAt: doc.pendingAt && BigInt(doc.pendingAt) > 0 ? Number(doc.pendingAt) : undefined,
        deprecatedAt: doc.deprecatedAt && BigInt(doc.deprecatedAt) > 0 ? Number(doc.deprecatedAt) : undefined,
        ipfsHash: doc.ipfsHash ?? '',
      }));
      setEquipmentDocuments(formattedDocs);
    } else if (selectedEquipmentId && documentsError) {
      setEquipmentDocuments([]);
      toast({ title: "Erreur Documents", description: "Impossible de charger les documents de l'équipement.", variant: "destructive" });
    } else if (!selectedEquipmentId) {
      setEquipmentDocuments([]); // Vider si pas d'équipement sélectionné
    }
  }, [selectedEquipmentId, documentsData, documentsError, isLoadingDocsHook, toast]);

  // Gestion chargement global
  useEffect(() => {
    setIsLoadingComponent(
        isLoadingRoles ||
        isLoadingPlants ||
        isLoadingEquipments ||
        isLoadingDocuments ||
        isGeneratingHash ||
        isReviewEquipmentPending || isReviewEquipmentConfirming ||
        isFinalizePending || isFinalizeConfirming
    )
  }, [
      isLoadingRoles, isLoadingPlants, isLoadingEquipments, isLoadingDocuments, isGeneratingHash,
      isReviewEquipmentPending, isReviewEquipmentConfirming,
      isFinalizePending, isFinalizeConfirming
  ])

  useEffect(() => {
    if (isReviewEquipmentConfirmed && reviewData) {
      toast({ title: "Revue Démarrée !", description: `L'équipement est passé en revue (Tx: ${reviewData.substring(0, 10)}...).`, variant: "default" })
      refetchEquipmentsRef.current?.();
      refetchEquipmentDocuments();
    }

    if (isFinalizeConfirmed && finalizeData) {
      toast({ title: "Certification Finalisée !", description: `La décision pour l'équipement a été enregistrée (Tx: ${finalizeData.substring(0, 10)}...).`, variant: "default" })
      setIsModalOpen(false)
      setFinalizationDecision(null)
      setRejectionReason('')
      setFinalHash(null)
      refetchEquipmentsRef.current?.();
      refetchEquipmentDocuments();
    }
  }, [isReviewEquipmentConfirmed, reviewData, isFinalizeConfirmed, finalizeData, toast, refetchEquipmentDocuments])

  useEffect(() => {
    const error = reviewEquipmentWriteError || reviewEquipmentConfirmError || finalizeWriteError || finalizeConfirmError
    if (error) {
      toast({ title: "Erreur Blockchain", description: (error as any)?.shortMessage || (error as Error)?.message || "L'opération a échoué.", variant: "destructive" })
    }
  }, [reviewEquipmentWriteError, reviewEquipmentConfirmError, finalizeWriteError, finalizeConfirmError, toast])


  // --- Handlers ---

  const handlePlantSelection = useCallback((plantId: string | null) => {
    setSelectedPlantId(plantId)
    setSelectedEquipmentId(null)
    setSelectedEquipmentDetails(null)
    setEquipmentDocuments([])
  }, [])

  const handleEquipmentIdChange = useCallback((equipmentId: string | null) => {
    setSelectedEquipmentId(equipmentId)
    setSelectedEquipmentDetails(null)
    setEquipmentDocuments([])
  }, [])

  const handleRefetchComplete = useCallback((equipment: Equipment | null) => {
    setSelectedEquipmentDetails(equipment);
  }, [])

  const handleRefetchReady = useCallback((refetchFn: RefetchEquipmentsFn) => {
    refetchEquipmentsRef.current = refetchFn;
  }, []);

  const handleOpenModal = () => {
    setFinalizationDecision(null)
    setRejectionReason('')
    setFinalHash(null)
    setIsModalOpen(true)
  }

  const handleGenerateHash = useCallback(async () => {
      if (!selectedEquipmentId) return;
      setIsGeneratingHash(true)
      setFinalHash(null)
      toast({ title: "Génération du hash en cours..."})

      try {
          const response = await fetch('/api/generate-final-hash', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ equipmentId: selectedEquipmentId })
          })
          const result = await response.json()

          if (!response.ok || result.error) {
              throw new Error(result.error || `Erreur serveur: ${response.statusText}`)
          }
          if (!result.finalHash || !result.finalHash.startsWith('0x')) {
               throw new Error("Hash invalide reçu du serveur.")
          }

          setFinalHash(result.finalHash as Hash)
          toast({ title: "Hash final généré !", description: "Prêt pour l'approbation."})

      } catch (error) {
          toast({ title: "Erreur Génération Hash", description: (error as Error)?.message || "Impossible de générer le hash.", variant: "destructive" })
          setFinalHash(null)
      } finally {
          setIsGeneratingHash(false)
      }
  }, [selectedEquipmentId, toast])

  const handleConfirmFinalization = useCallback(() => {
    if (!selectedEquipmentDetails || !finalizationDecision) return

    let approveArg: boolean
    let hashArg: Hash
    let reasonArg: string

    if (finalizationDecision === 'approve') {
        if (!finalHash) {
            toast({ title: "Hash manquant", description: "Veuillez générer le hash final avant d'approuver.", variant: "destructive"})
            return;
        }
        approveArg = true
        hashArg = finalHash
        reasonArg = ""
    } else {
        if (!rejectionReason.trim()) {
            toast({ title: "Raison manquante", description: "Veuillez fournir une raison pour le rejet.", variant: "destructive"})
            return;
        }
        approveArg = false
        hashArg = '0x0000000000000000000000000000000000000000000000000000000000000000'
        reasonArg = rejectionReason.trim()
    }

    toast({ title: "Transaction en cours", description: `Enregistrement de la décision (${finalizationDecision})...`, variant: "default"})

    writeFinalize({
        address: UserService.CONTRACTS.IMPLEMENTATION as `0x${string}`,
        abi: UserService.ABI.IMPLEMENTATION,
        functionName: 'finalizeCertification',
        args: [
            BigInt(selectedEquipmentDetails.id),
            approveArg,
            hashArg,
            reasonArg
        ],
    })

  }, [selectedEquipmentDetails, finalizationDecision, finalHash, rejectionReason, writeFinalize, toast])

  const handleStartReview = useCallback(() => {
    if (!selectedEquipmentDetails || selectedEquipmentDetails.currentStep !== CertificationSteps.ReadyForReview) {
       toast({ title: "Action impossible", description: `L\'équipement doit être à l\'étape "${formatCertificationStep(CertificationSteps.ReadyForReview)}".`, variant: "default"})
       return
    }
    toast({ title: "Transaction en cours", description: "Démarrage de la revue en cours...", variant: "default"})
    writeReviewEquipment({
        address: UserService.CONTRACTS.IMPLEMENTATION as `0x${string}`,
        abi: UserService.ABI.IMPLEMENTATION,
        functionName: 'reviewEquipment',
        args: [BigInt(selectedEquipmentDetails.id)],
    })
  }, [selectedEquipmentDetails, writeReviewEquipment, toast])


  // --- Rendu ---

  if (!isConnected) {
    return <div className="p-4 text-center text-red-600">Connexion requise.</div>
  }

  return (
    <RoleProtected roles={allowedRoles}>
      <div className="space-y-6 p-4">
        <h1 className="text-2xl font-bold mb-4">Certification ASN des Équipements</h1>

        {isLoadingComponent && (
           <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-md shadow-lg">Chargement...</div>
          </div>
        )}

        {/* Étape 1: Sélectionner la Centrale */}
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

        {/* Étape 2: Sélectionner l'Équipement */}
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

         {/* Étape 3: Affichage Détails et Actions */}
         {selectedEquipmentDetails && (
             <div className="bg-white rounded-lg shadow p-6 space-y-4">
                 <h2 className="text-xl font-semibold mb-4">
                    Détails de l'Équipement : {selectedEquipmentDetails.name} (ID: {selectedEquipmentDetails.id})
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                     <div>
                         <span className="font-medium text-gray-500 block">Enregistré le</span>
                         <span>{formatDate(selectedEquipmentDetails.registeredAt)}</span>
                     </div>
                     <div>
                         <span className="font-medium text-gray-500 block">Statut Actuel</span>
                         <Badge
                            variant={selectedEquipmentDetails.status === EquipmentStatus.Certified ? "default" : selectedEquipmentDetails.status === EquipmentStatus.Rejected || selectedEquipmentDetails.status === EquipmentStatus.Deprecated ? "destructive" : "secondary"}
                            className={`${selectedEquipmentDetails.status === EquipmentStatus.Certified ? 'bg-green-100 text-green-800' : ''}`}
                         >
                            {formatEquipmentStatus(selectedEquipmentDetails.status)}
                         </Badge>
                     </div>
                      <div>
                         <span className="font-medium text-gray-500 block">Étape Certification</span>
                          <Badge
                            variant={selectedEquipmentDetails.currentStep === CertificationSteps.Certified ? "default" : selectedEquipmentDetails.currentStep === CertificationSteps.Rejected ? "destructive" : selectedEquipmentDetails.currentStep === CertificationSteps.UnderReview ? "outline" : "secondary"}
                            className={`${selectedEquipmentDetails.currentStep === CertificationSteps.Certified ? 'bg-green-100 text-green-800' : selectedEquipmentDetails.currentStep === CertificationSteps.UnderReview ? 'border-yellow-500 text-yellow-700' : ''}`}
                         >
                            {formatCertificationStep(selectedEquipmentDetails.currentStep)}
                         </Badge>
                     </div>
                 </div>

                 {/* Documents Associés */} 
                 <div className="border-t pt-4">
                     <h3 className="text-lg font-semibold mb-2">Documents Associés</h3>
                     {isLoadingDocuments && <p className="text-sm text-gray-500">Chargement des documents...</p>}
                     {!isLoadingDocuments && equipmentDocuments.length === 0 && selectedEquipmentId && (
                         <p className="text-sm text-gray-500">Aucun document trouvé pour cet équipement.</p>
                     )}
                     {!isLoadingDocuments && equipmentDocuments.length > 0 && (
                         <ul className="list-disc pl-5 space-y-1 text-sm">
                             {equipmentDocuments.map(doc => (
                                 <li key={doc.id}>
                                     <a
                                         href={`https://ipfs.io/ipfs/${doc.ipfsHash}`}
                                         target="_blank"
                                         rel="noopener noreferrer"
                                         className="text-blue-600 hover:underline hover:text-blue-800"
                                         title={`IPFS Hash: ${doc.ipfsHash} - Ajouté le: ${formatDate(doc.submittedAt)}`}
                                     >
                                         {doc.name}
                                     </a>
                                 </li>
                             ))}
                         </ul>
                     )}
                 </div>

                  <div className="border-t pt-4 flex justify-end space-x-2">
                       {/* Bouton Démarrer Revue (Conditionnel) */}
                       {selectedEquipmentDetails.currentStep === CertificationSteps.ReadyForReview && (
                          <Button
                            onClick={handleStartReview}
                            disabled={isLoadingComponent}
                            title="Passer l'équipement à l'étape 'En révision (ASN)'"
                            variant="secondary"
                          >
                            {isReviewEquipmentPending || isReviewEquipmentConfirming ? 'Démarrage...' : 'Démarrer la Revue'}
                          </Button>
                       )}

                       {/* Bouton Finaliser (Conditionnel) */}
                       {selectedEquipmentDetails.currentStep === CertificationSteps.UnderReview && (
                          <Button
                            onClick={handleOpenModal}
                            disabled={isLoadingComponent}
                            title="Finaliser la certification (Approuver/Rejeter)"
                          >
                            Finaliser la Certification
                          </Button>
                       )}
                  </div>
                  {/* Message explicatif si aucun bouton d'action n'est pertinent */}
                  {selectedEquipmentDetails &&
                   selectedEquipmentDetails.currentStep !== CertificationSteps.ReadyForReview &&
                   selectedEquipmentDetails.currentStep !== CertificationSteps.UnderReview &&
                   !isLoadingComponent && (
                    <p className="text-sm text-gray-500 mt-2 text-right pr-1">
                      Aucune action requise de l'ASN à cette étape ({formatCertificationStep(selectedEquipmentDetails.currentStep)}).
                    </p>
                  )}
             </div>
         )}

        {/* Modale de Finalisation */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>Finaliser la Certification de l'Équipement</DialogTitle>
                    <DialogDescription>
                        Équipement : {selectedEquipmentDetails?.name} (ID: {selectedEquipmentDetails?.id})
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                     {/* Sélection Approve / Reject */}
                     <Label>Décision :</Label>
                     <RadioGroup
                         value={finalizationDecision || undefined}
                         onValueChange={(value: 'approve' | 'reject') => {
                             setFinalizationDecision(value);
                             if (value === 'approve') setRejectionReason('');
                             if (value === 'reject') setFinalHash(null);
                         }}
                         className="flex space-x-4"
                     >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="approve" id="approve" />
                            <Label htmlFor="approve">Approuver</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="reject" id="reject" />
                            <Label htmlFor="reject">Rejeter</Label>
                        </div>
                     </RadioGroup>

                     {/* Champs conditionnels */}
                     {finalizationDecision === 'approve' && (
                         <div className="space-y-2 pt-4 border-t">
                             <Label>Hash de Certification Final</Label>
                              <div className="flex items-center space-x-2">
                                  <Input
                                      type="text"
                                      value={finalHash || ''}
                                      readOnly
                                      placeholder="Générez le hash..."
                                      className="font-mono text-xs flex-grow"
                                  />
                                  <Button
                                      onClick={handleGenerateHash}
                                      disabled={isGeneratingHash || !!finalHash}
                                      variant="outline"
                                  >
                                      {isGeneratingHash ? 'Génération...' : finalHash ? 'Généré' : 'Générer Hash'}
                                  </Button>
                              </div>
                              <p className="text-xs text-gray-500">
                                  Génère un hash basé sur les documents et un sel secret du serveur.
                              </p>
                         </div>
                     )}

                     {finalizationDecision === 'reject' && (
                          <div className="space-y-2 pt-4 border-t">
                              <Label htmlFor="rejectionReason">Raison du Rejet <span className="text-red-500">*</span></Label>
                              <Textarea
                                  id="rejectionReason"
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                  placeholder="Expliquez pourquoi l'équipement est rejeté..."
                                  required
                                  rows={3}
                                  disabled={isLoadingComponent}
                              />
                          </div>
                     )}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline" disabled={isLoadingComponent}>Annuler</Button>
                    </DialogClose>
                    <Button
                        type="button"
                        onClick={handleConfirmFinalization}
                        disabled={
                            !finalizationDecision ||
                            isLoadingComponent ||
                            (finalizationDecision === 'approve' && !finalHash) ||
                            (finalizationDecision === 'reject' && !rejectionReason.trim())
                        }
                    >
                        {isLoadingComponent ? 'Confirmation...' : 'Confirmer la Décision'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    </RoleProtected>
  )
}
