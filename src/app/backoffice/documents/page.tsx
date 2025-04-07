'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { useUserRoles } from '@/hooks/useUserRoles'
import RoleProtected from '@/components/RoleProtected'
import DocumentUploader from '@/components/DocumentUploader'
import SelectPlant from '@/components/backoffice/SelectPlant'
import SelectEquipment from '@/components/backoffice/SelectEquipment'

// --- Composant Page ---

export default function ManufacturingPage() {
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null)
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null)

  const [isLoadingPlants, setIsLoadingPlants] = useState(true)
  const [isLoadingEquipments, setIsLoadingEquipments] = useState(false)
  const [isLoadingComponent, setIsLoadingComponent] = useState(true)

  const { isConnected } = useAccount()
  const { isLoading: isLoadingRoles } = useUserRoles()

  // Assurer que les rôles autorisés sont corrects
  const allowedRoles = ['constructeur', 'labo', 'certifieur']

  // --- Effets ---

  useEffect(() => {
    setIsLoadingComponent(
      isLoadingRoles ||
      isLoadingPlants ||
      isLoadingEquipments
    )
  }, [isLoadingRoles, isLoadingPlants, isLoadingEquipments])

  const handlePlantSelection = useCallback((plantId: string | null) => {
    if(plantId !== selectedPlantId) {
        setSelectedEquipmentId(null)
    }
    setSelectedPlantId(plantId)
  }, [selectedPlantId])

  const handleEquipmentSelection = useCallback((equipmentId: string | null) => {
      setSelectedEquipmentId(equipmentId)
  }, [])

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

  return (
    <RoleProtected roles={allowedRoles}>
      <div className="space-y-6 p-4">
        <h1 className="text-2xl font-bold mb-4">Enregistrement Document Fabrication</h1>
        <p className="text-sm text-gray-600">
           En tant que constructeur, vous pouvez enregistrer ici les documents relatifs à un équipement spécifique.
        </p>

        {isLoadingComponent && (
           <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-md shadow-lg">Chargement...</div>
          </div>
        )}

        {/* Étape 1: Sélectionner la Centrale via le composant */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Étape 1 : Sélectionner la Centrale</h2>
           <SelectPlant
              selectedPlantId={selectedPlantId}
              onPlantSelected={handlePlantSelection}
              onLoadingChange={setIsLoadingPlants}
              disabled={isLoadingComponent && !isLoadingPlants}
           />
        </div>

        {/* Étape 2: Sélectionner l'Équipement via le composant (visible si centrale sélectionnée) */}
        {selectedPlantId && (
           <div className="bg-white rounded-lg shadow p-6">
             <h2 className="text-xl font-semibold mb-4">Étape 2 : Sélectionner l'Équipement</h2>
              <SelectEquipment
                  selectedPlantId={selectedPlantId}
                  selectedEquipmentId={selectedEquipmentId}
                  onValueChange={handleEquipmentSelection}
                  onLoadingChange={setIsLoadingEquipments}
                  disabled={(isLoadingComponent && !isLoadingEquipments) || !selectedPlantId}
              />
           </div>
        )}

        {/* Étape 3: Upload du Document (visible si équipement sélectionné) */}
        {selectedEquipmentId && (
           <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h2 className="text-xl font-semibold mb-4">
                Étape 3 : Ajouter un Document pour l'Équipement (ID: {selectedEquipmentId})
             </h2>
             <DocumentUploader equipmentId={selectedEquipmentId} />
           </div>
        )}

      </div>
    </RoleProtected>
  )
}