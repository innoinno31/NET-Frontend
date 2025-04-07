'use client'

import React, { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import UserService from '@/services/userService'
import { Hash } from 'viem'
import { useToast } from "@/hooks/use-toast"
import { formatDateTime } from '@/lib/formatters'
import type { Plant } from '@/lib/interfaces'

export default function PlantsPage() {
  const [plants, setPlants] = useState<Plant[]>([])
  
  // État pour les formulaires
  const [newPlantName, setNewPlantName] = useState('')
  const [newPlantLocation, setNewPlantLocation] = useState('')
  const [newPlantDescription, setNewPlantDescription] = useState('') 
  const [newPlantIsActive, setNewPlantIsActive] = useState(true) 
  
  // État pour les modales et chargement
  const [isAddPlantModalOpen, setIsAddPlantModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentAction, setCurrentAction] = useState<'addPlant' | null>(null)
  
  // Connexion au portefeuille
  const { isConnected } = useAccount()
  
  // Système de notification toast
  const { toast } = useToast()

  // --- Hook Lecture Centrales --- 
  const { 
    data: plantsData,
    refetch: refetchPlants,
    isLoading: isLoadingPlants 
  } = useReadContract({
    address: UserService.CONTRACTS.IMPLEMENTATION as `0x${string}`,
    abi: UserService.ABI.IMPLEMENTATION,
    functionName: 'getAllPlants',
  })

  // --- Gestion Ajout Centrale --- 
  const { 
    data: addPlantWriteData, 
    writeContract: writeAddPlant, 
    isPending: isAddPlantWritePending, 
    error: addPlantWriteError
  } = useWriteContract()

  const { 
    isLoading: isAddPlantConfirming, 
    isSuccess: isAddPlantConfirmed,
    error: addPlantConfirmError
  } = useWaitForTransactionReceipt({
    hash: addPlantWriteData as Hash | undefined,
  })

  useEffect(() => {
    if (isAddPlantConfirmed && addPlantWriteData && currentAction === 'addPlant') {
      console.log('Transaction ajout centrale confirmée:', addPlantWriteData)
      refetchPlants()
      setNewPlantName('')
      setNewPlantLocation('')
      setNewPlantDescription('')
      setNewPlantIsActive(true)
      setCurrentAction(null)
      
      toast({
        title: "Centrale ajoutée avec succès",
        description: `La centrale "${newPlantName}" a été ajoutée.`,
        variant: "default",
      })
    }
  }, [isAddPlantConfirmed, addPlantWriteData, newPlantName, refetchPlants, toast, currentAction])

  // Afficher un toast d'erreur générique
  useEffect(() => {
    const error = addPlantWriteError || addPlantConfirmError
    if (error) {
      toast({
        title: "Erreur de transaction",
        description: (error as any)?.shortMessage || (error as Error)?.message || "Une erreur inconnue est survenue",
        variant: "destructive",
      })
      if (isAddPlantConfirming) {
          setCurrentAction(null)
      }
    }
  }, [addPlantWriteError, addPlantConfirmError, toast, isAddPlantConfirming])
  
  // Mettre à jour les centrales lorsque les données changent
  useEffect(() => {
    if (plantsData) {
      console.log('Centrales récupérées:', plantsData)
      if (Array.isArray(plantsData)) {
        const formattedPlants: Plant[] = plantsData.map((item: any) => ({
          id: BigInt(item.id?.toString() || '0'),
          name: item.name || 'Sans nom',
          location: item.location || 'Lieu inconnu',
          description: item.description || '',
          isActive: item.isActive === true,
          registeredAt: BigInt(item.registeredAt || 0)
        }))
        
        setPlants(formattedPlants)
      }
    } 
  }, [plantsData])
  
  // Fonctions pour ajouter des centrales
  const handleAddPlant = async () => {
    if (!newPlantName || !newPlantLocation || !isConnected) {
       toast({ title: "Erreur", description: "Veuillez remplir tous les champs obligatoires.", variant: "destructive" })
       return
    }
    
    try {
      setCurrentAction('addPlant')
      setIsAddPlantModalOpen(false)
      
      toast({ title: "Transaction en cours", description: "Ajout de la centrale...", variant: "default" })
      
      writeAddPlant({
        address: UserService.CONTRACTS.IMPLEMENTATION as `0x${string}`,
        abi: UserService.ABI.IMPLEMENTATION,
        functionName: 'registerPlant',
        args: [newPlantName, newPlantDescription, newPlantLocation, newPlantIsActive] 
      })
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la centrale:', error)
      setCurrentAction(null)
      toast({ title: "Erreur", description: (error as Error)?.message || "Erreur lors de la préparation de l'ajout.", variant: "destructive" })
    }
  }
  
  // Gérer l'état de chargement global
  useEffect(() => {
    setIsLoading(isAddPlantWritePending || isAddPlantConfirming || isLoadingPlants)
  }, [isAddPlantWritePending, isAddPlantConfirming, isLoadingPlants])
  
  // Si l'utilisateur n'est pas connecté, afficher un message
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
  
  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold mb-4">Gestion des Centrales Nucléaires</h1>
      
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-md">Chargement en cours...</div>
        </div>
      )}
      
      {/* Section Centrales Nucléaires */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Centrales Nucléaires</h2>
          <button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm"
            onClick={() => setIsAddPlantModalOpen(true)}
          >
            Ajouter une Centrale
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lieu</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date d'ajout</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoadingPlants ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                    </div>
                  </td>
                </tr>
              ) : plants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">
                    Aucune centrale nucléaire trouvée
                  </td>
                </tr>
              ) : (
                plants.map((plant) => (
                  <tr key={plant.id.toString()}>
                    <td className="px-6 py-4 whitespace-nowrap">{plant.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{plant.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plant.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ 
                        plant.isActive ? 'bg-green-100 text-green-800' : 
                        'bg-gray-100 text-gray-800' 
                      }`}> 
                        {plant.isActive ? 'Actif' : 'Inactif'} 
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(Number(plant.registeredAt))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modal pour ajouter une centrale */}
      {isAddPlantModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Ajouter une Centrale Nucléaire</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la Centrale
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ex: Centrale de Flamanville"
                  value={newPlantName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPlantName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Brève description de la centrale"
                  value={newPlantDescription}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewPlantDescription(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Localisation
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ex: Normandie"
                  value={newPlantLocation}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPlantLocation(e.target.value)}
                />
              </div>

              <div className="flex items-center">
                <input
                  id="isActive"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  checked={newPlantIsActive}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPlantIsActive(e.target.checked)}
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Centrale Active
                </label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button 
                  className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-50"
                  onClick={() => setIsAddPlantModalOpen(false)}
                >
                  Annuler
                </button>
                <button 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm"
                  onClick={handleAddPlant}
                  disabled={isAddPlantWritePending || isAddPlantConfirming}
                >
                  {(isAddPlantWritePending || isAddPlantConfirming) ? 'Transaction en cours...' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}