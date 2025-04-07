'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import UserService from '@/services/userService'
import { useToast } from "@/hooks/use-toast"
import { useUserRoles } from '@/hooks/useUserRoles'
import RoleProtected from '@/components/RoleProtected'
import SelectPlant from '@/components/backoffice/SelectPlant'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Badge } from '@/components/ui/badge'
import { CertificationSteps, EquipmentStatus } from '@/lib/enums'
import { formatCertificationStep, formatEquipmentStatus, formatDateTime, formatAddress } from '@/lib/formatters'
import type { Equipment } from '@/lib/interfaces'

// --- Composant Page ---

export default function ViewAndManageEquipmentPage() {
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null)
  const [equipments, setEquipments] = useState<Equipment[]>([])

  // États pour la modale de création
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newEquipmentName, setNewEquipmentName] = useState('')
  const [newEquipmentDescription, setNewEquipmentDescription] = useState('')

  // États de chargement
  const [isLoadingPlants, setIsLoadingPlants] = useState(true)
  const [isLoadingEquipments, setIsLoadingEquipments] = useState(false)
  const [isLoadingComponent, setIsLoadingComponent] = useState(true)

  const { isConnected } = useAccount()
  const { toast } = useToast()
  const { isLoading: isLoadingRoles } = useUserRoles()

  const allowedRoles = ['exploitant']

  // --- useEffect pour suivre selectedPlantId --- 
  useEffect(() => {
      console.log(`🆔 [EquipmentPage] selectedPlantId changed to: ${selectedPlantId}`)
  }, [selectedPlantId])

  // Préparer les arguments en dehors pour le log
  const equipmentHookArgs = selectedPlantId ? [BigInt(selectedPlantId)] : undefined

  console.log("🔍 [EquipmentPage] equipment args before useReadContract:", equipmentHookArgs)
  const {
    data: equipmentsData,
    refetch: refetchEquipments,
    error: equipmentsError
  } = useReadContract({
    address: UserService.CONTRACTS.IMPLEMENTATION as `0x${string}`,
    abi: UserService.ABI.IMPLEMENTATION,
    functionName: 'getEquipmentByPlant',
    args: equipmentHookArgs,
    query: { enabled: isConnected && !!selectedPlantId },
  })

   // Hook pour appeler registerEquipment (pour la modale)
  const { data: registerData, writeContract: writeRegisterEquipment, isPending: isRegisterPending, error: registerWriteError } = useWriteContract()
  const { isLoading: isRegisterConfirming, isSuccess: isRegisterConfirmed, error: registerConfirmError } = useWaitForTransactionReceipt({ hash: registerData })

  // --- Effets ---

  useEffect(() => {
    setIsLoadingComponent(isLoadingRoles || isLoadingPlants || isLoadingEquipments)
  }, [isLoadingRoles, isLoadingPlants, isLoadingEquipments])

  useEffect(() => {
     setIsLoadingEquipments(!!selectedPlantId && !equipmentsError && !equipmentsData)

    if (selectedPlantId && equipmentsData && Array.isArray(equipmentsData)) {
      const formattedEquipments: Equipment[] = equipmentsData.map((eq: any): Equipment => ({
        id: BigInt(eq.id?.toString() || '0'),
        name: eq.name || 'Sans nom',
        description: eq.description || '',
        currentStep: Number(eq.currentStep ?? 0) as CertificationSteps,
        status: Number(eq.status ?? 0) as EquipmentStatus,
        registeredAt: BigInt(eq.registeredAt || 0),
        certifiedAt: Number(eq.certifiedAt || 0) > 0 ? BigInt(eq.certifiedAt) : BigInt(0),
        rejectedAt: Number(eq.rejectedAt || 0) > 0 ? BigInt(eq.rejectedAt) : BigInt(0),
        pendingAt: Number(eq.pendingAt || 0) > 0 ? BigInt(eq.pendingAt) : BigInt(0),
        deprecatedAt: Number(eq.deprecatedAt || 0) > 0 ? BigInt(eq.deprecatedAt) : BigInt(0),
        finalCertificationHash: eq.finalCertificationHash || "0x0",
        rejectionReason: eq.rejectionReason || ""
      }))
      console.log(`📊 [EquipmentPage] Equipments data received for plant ${selectedPlantId}:`, equipmentsData)
      setEquipments(formattedEquipments)
    } else if (selectedPlantId && equipmentsError) {
        console.error("💥 [EquipmentPage] Error loading equipments:", equipmentsError)
        setEquipments([])
        toast({ title: "Erreur", description: "Impossible de charger les équipements pour cette centrale.", variant: "destructive"})
    } else if (!selectedPlantId) {
        // Vider le tableau si aucune centrale n'est sélectionnée
        setEquipments([])
    }
  }, [selectedPlantId, equipmentsData, equipmentsError, toast])


  // Handler pour la sélection de la centrale
  const handlePlantSelection = (plantId: string | null) => {
    console.log("🏭 [EquipmentPage] Plant selected:", plantId)
    setSelectedPlantId(plantId)
    setEquipments([])
    setIsLoadingEquipments(!!plantId)
  }

  // Handler pour la soumission du formulaire de création (dans la modale)
  const handleRegisterSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault()
    if (!newEquipmentName.trim() || !selectedPlantId) {
      toast({ title: "Formulaire incomplet", description: "Le nom de l'équipement est requis.", variant: "destructive"})
      return
    }

    toast({ title: "Enregistrement en cours", description: "Soumission de la transaction...", variant: "default" })

    try {
    console.log("##### selectedPlantId:", selectedPlantId)
      const args = [
        newEquipmentName.trim(),
        newEquipmentDescription.trim(),
        BigInt(selectedPlantId)
      ]
      console.log("Appel de registerEquipment avec args:", args)
      writeRegisterEquipment({
        address: UserService.CONTRACTS.IMPLEMENTATION as `0x${string}`,
        abi: UserService.ABI.IMPLEMENTATION,
        functionName: 'registerEquipment',
        args: args,
      })
    } catch (error) {
      console.error("Erreur préparation enregistrement:", error)
      toast({ title: "Erreur", description: (error as Error)?.message || "Échec préparation transaction.", variant: "destructive" })
    }
  }, [newEquipmentName, newEquipmentDescription, selectedPlantId, writeRegisterEquipment, toast])

  useEffect(() => {
    if (isRegisterConfirmed && registerData) {
      toast({
        title: "Équipement Enregistré !",
        description: `L'équipement "${newEquipmentName}" a été enregistré (Tx: ${registerData.substring(0, 10)}...).`,
        variant: "default",
      })
      setIsCreateModalOpen(false)
      setNewEquipmentName('')
      setNewEquipmentDescription('')
      refetchEquipments()
    }
  }, [isRegisterConfirmed, registerData, newEquipmentName, toast, refetchEquipments])

  // Effet pour gérer les erreurs de transaction (création)
  useEffect(() => {
    const error = registerWriteError || registerConfirmError
    if (error) {
      console.error("Erreur Transaction Blockchain:", error)
      toast({
        title: "Erreur Blockchain",
        description: (error as any)?.shortMessage || (error as Error)?.message || "L'enregistrement a échoué.",
        variant: "destructive",
      })
    }
  }, [registerWriteError, registerConfirmError, toast])

  const isSubmitting = isRegisterPending || isRegisterConfirming

  // --- Rendu ---

  if (!isConnected) {
     // ... (message connexion requise)
       return (
       <div className="flex items-center justify-center h-full">
         <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
           <h2 className="text-xl font-semibold mb-4 text-red-600">Connexion Requise</h2>
           <p className="mb-4">Vous devez être connecté et avoir le rôle Exploitant pour accéder à cette page.</p>
         </div>
       </div>
     )
  }

  return (
    <RoleProtected roles={allowedRoles}>
      <div className="space-y-6 p-4">
        <h1 className="text-2xl font-bold mb-4">Gestion des Équipements</h1>

        {isLoadingComponent && !isSubmitting && ( // Afficher chargement global sauf si on soumet déjà
           <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-md shadow-lg">Chargement...</div>
          </div>
        )}

        {/* Sélection de la Centrale */}
        <div className="bg-white rounded-lg shadow p-6">
           <Label className="text-lg font-semibold mb-4 block">Sélectionner une Centrale</Label>
           <div className="flex items-center space-x-4">
                <div className="flex-grow">
                     <SelectPlant
                        selectedPlantId={selectedPlantId}
                        onPlantSelected={handlePlantSelection}
                        onLoadingChange={setIsLoadingPlants}
                        disabled={isLoadingComponent} // Désactiver si la page charge
                        triggerWidth="w-full"
                    />
                </div>
                 {/* Bouton pour ouvrir la modale de création */}
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogTrigger asChild>
                         <Button
                            disabled={!selectedPlantId || isLoadingComponent || isSubmitting}
                            title={!selectedPlantId ? "Sélectionnez d'abord une centrale" : "Enregistrer un nouvel équipement"}
                         >
                            Ajouter Équipement
                         </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                        <DialogTitle>Enregistrer un Nouvel Équipement</DialogTitle>
                        <DialogDescription>
                            Saisissez les informations pour le nouvel équipement dans la centrale sélectionnée.
                        </DialogDescription>
                        </DialogHeader>
                        {/* Formulaire dans la modale */}
                        <form onSubmit={handleRegisterSubmit} className="space-y-4 pt-4">
                             <div>
                                <Label htmlFor="newEquipName">Nom <span className="text-red-500">*</span></Label>
                                <Input
                                id="newEquipName"
                                type="text"
                                value={newEquipmentName}
                                onChange={(e) => setNewEquipmentName(e.target.value)}
                                placeholder="Ex: Pompe Primaire PMP-01B"
                                required
                                disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <Label htmlFor="newEquipDesc">Description</Label>
                                <Textarea
                                id="newEquipDesc"
                                value={newEquipmentDescription}
                                onChange={(e) => setNewEquipmentDescription(e.target.value)}
                                placeholder="Détails techniques, N° série..."
                                disabled={isSubmitting}
                                rows={3}
                                />
                            </div>
                             <DialogFooter>
                                 <DialogClose asChild>
                                     <Button type="button" variant="outline" disabled={isSubmitting}>Annuler</Button>
                                 </DialogClose>
                                <Button type="submit" disabled={isSubmitting || !newEquipmentName.trim()}>
                                    {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
           </div>
        </div>

        {/* Tableau des Équipements (visible si centrale sélectionnée) */}
        {selectedPlantId && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Équipements de la Centrale Sélectionnée</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Description</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Étape Certif.</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut Équip.</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Enregistré</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">En attente</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">Certifié</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">Rejeté</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">Déprécié</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden 2xl:table-cell">Hash Certif.</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoadingEquipments && (
                    <tr><td colSpan={11} className="p-4 text-center text-gray-500">Chargement des équipements...</td></tr>
                  )}
                  {!isLoadingEquipments && equipments.length === 0 && (
                    <tr><td colSpan={11} className="p-4 text-center text-gray-500">Aucun équipement enregistré pour cette centrale.</td></tr>
                  )}
                  {!isLoadingEquipments && equipments.map((eq) => (
                    <tr key={eq.id.toString()}>
                      <td className="px-3 py-4 whitespace-nowrap font-mono text-gray-500" title={eq.id.toString()}>
                          {eq.id.toString().substring(0, 8)}...
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap font-medium text-gray-900">{eq.name}</td>
                      <td className="px-3 py-4 whitespace-normal text-gray-500 hidden md:table-cell max-w-xs truncate" title={eq.description}>
                          {eq.description || 'N/A'}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-gray-500">
                        <Badge 
                          variant={eq.currentStep === CertificationSteps.Certified ? "default" : 
                                  eq.currentStep === CertificationSteps.Rejected ? "destructive" : 
                                  eq.currentStep === CertificationSteps.UnderReview ? "outline" : "secondary"}
                          className={`font-normal ${eq.currentStep === CertificationSteps.Certified ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}`}
                        >
                          {formatCertificationStep(eq.currentStep)}
                        </Badge>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-gray-500">
                        <Badge 
                          variant={eq.status === EquipmentStatus.Certified ? "default" : 
                                  eq.status === EquipmentStatus.Rejected ? "destructive" : 
                                  eq.status === EquipmentStatus.Deprecated ? "destructive" : "secondary"}
                          className={`font-normal ${eq.status === EquipmentStatus.Certified ? "bg-green-100 text-green-800 hover:bg-green-100" : 
                                                   eq.status === EquipmentStatus.Deprecated ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" : ""}`}
                        >
                          {formatEquipmentStatus(eq.status)}
                        </Badge>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-gray-500 hidden lg:table-cell">
                          {formatDateTime(Number(eq.registeredAt))}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-gray-500 hidden xl:table-cell">
                          {formatDateTime(Number(eq.pendingAt))} 
                      </td>
                       <td className="px-3 py-4 whitespace-nowrap text-gray-500 hidden xl:table-cell">
                          {formatDateTime(Number(eq.certifiedAt))}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-gray-500 hidden xl:table-cell">
                          {formatDateTime(Number(eq.rejectedAt))}
                      </td>
                       <td className="px-3 py-4 whitespace-nowrap text-gray-500 hidden xl:table-cell">
                          {formatDateTime(Number(eq.deprecatedAt))}
                      </td>
                       <td className="px-3 py-4 whitespace-nowrap font-mono text-gray-500 hidden 2xl:table-cell" title={eq.finalCertificationHash}>
                          {eq.finalCertificationHash && eq.finalCertificationHash !== "0x0" ? formatAddress(eq.finalCertificationHash) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

         {/* Message si aucune centrale n'est sélectionnée */}
         {!selectedPlantId && !isLoadingPlants && (
             <div className="text-center text-gray-500 py-6">
                 Veuillez sélectionner une centrale pour voir et gérer ses équipements.
             </div>
         )}

      </div>
    </RoleProtected>
  )
}
