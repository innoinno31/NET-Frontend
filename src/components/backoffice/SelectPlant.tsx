'use client'

import React, { useState, useEffect } from 'react'
import { useReadContract } from 'wagmi'
import UserService from '@/services/userService'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import type { Plant } from '@/lib/interfaces'

// Props du composant
interface SelectPlantProps {
  selectedPlantId: string | null
  onPlantSelected: (plantId: string | null) => void
  disabled?: boolean
  className?: string
  triggerWidth?: string
  onLoadingChange?: (isLoading: boolean) => void
}

const SelectPlant: React.FC<SelectPlantProps> = ({
  selectedPlantId,
  onPlantSelected,
  disabled = false,
  className,
  triggerWidth = "w-full md:w-[320px]", // Valeur par défaut
  onLoadingChange
}) => {
  const [plants, setPlants] = useState<Plant[]>([])
  const { toast } = useToast()

  // --- Hook Lecture des Centrales ---
  const {
    data: plantsData,
    isLoading: isLoadingPlants,
    error: plantsError,
  } = useReadContract({
    address: UserService.CONTRACTS.IMPLEMENTATION as `0x${string}`,
    abi: UserService.ABI.IMPLEMENTATION,
    functionName: 'getAllPlants',
  })

   // Informer le parent du changement d'état de chargement
   useEffect(() => {
    onLoadingChange?.(isLoadingPlants)
  }, [isLoadingPlants, onLoadingChange])


  // --- Effet pour traiter les données des centrales ---
  useEffect(() => {
    if (plantsData && Array.isArray(plantsData)) {
      const formattedPlants: Plant[] = plantsData.map((plant: any): Plant => ({
        id: BigInt(plant.id?.toString() || '0'),
        name: plant.name || 'Sans nom',
        description: plant.description || '',
        location: plant.location || 'Lieu inconnu',
        registeredAt: BigInt(plant.registeredAt || 0),
        isActive: plant.isActive === true // Conversion explicite en booléen
      }))
      setPlants(formattedPlants)
    } else if (plantsError) {
      console.error("💥 [SelectPlant] Error loading plants:", plantsError)
      setPlants([])
      toast({
          title: "Erreur Composant SelectPlant",
          description: "Impossible de charger la liste des centrales.",
          variant: "destructive"
      })
    }
  }, [plantsData, plantsError, toast])

  // Handler pour le changement de sélection
  const handleValueChange = (value: string) => {
    console.log("🏭 [SelectPlant] Value changed:", value)
    onPlantSelected(value || null)
  }

  return (
    <Select
      onValueChange={handleValueChange}
      value={selectedPlantId || undefined} // Utiliser undefined si null pour le placeholder
      disabled={disabled || isLoadingPlants || plants.length === 0}
    >
      <SelectTrigger className={`${triggerWidth} ${className || ''}`}>
        <SelectValue placeholder={isLoadingPlants ? "Chargement..." : "Choisir une centrale"} />
      </SelectTrigger>
      <SelectContent>
        {plants.map((plant) => (
          <SelectItem key={plant.id.toString()} value={plant.id.toString()} disabled={!plant.isActive}>
            {plant.name} ({plant.location}) {!plant.isActive ? '(Inactive)' : ''}
          </SelectItem>
        ))}
        {plants.length === 0 && !isLoadingPlants && (
          <div className="p-2 text-sm text-gray-500">Aucune centrale trouvée.</div>
        )}
      </SelectContent>
    </Select>
  )
}

export default SelectPlant
