'use client'

import React, { useState, useEffect } from 'react'
import { useReadContract } from 'wagmi'
import { QueryObserverResult, RefetchOptions } from '@tanstack/react-query'
import UserService from '@/services/userService'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { CertificationSteps, EquipmentStatus } from '@/lib/enums'
import type { Equipment } from '@/lib/interfaces'

type RefetchEquipmentsFn = (options?: RefetchOptions | undefined) => Promise<QueryObserverResult<unknown, unknown>>;

interface SelectEquipmentProps {
  selectedPlantId: string | null
  selectedEquipmentId: string | null
  onValueChange: (equipmentId: string | null) => void
  onRefetchComplete?: (equipment: Equipment | null) => void
  disabled?: boolean
  className?: string
  triggerWidth?: string
  onLoadingChange?: (isLoading: boolean) => void
  onRefetchReady?: (refetchFn: RefetchEquipmentsFn) => void
}

const SelectEquipment: React.FC<SelectEquipmentProps> = ({
  selectedPlantId,
  selectedEquipmentId,
  onValueChange,
  onRefetchComplete,
  disabled = false,
  className,
  triggerWidth = "w-full md:w-[320px]",
  onLoadingChange,
  onRefetchReady
}) => {
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const { toast } = useToast()

  const {
    data: equipmentsData,
    isLoading: isLoadingEquipments,
    error: equipmentsError,
    refetch
  } = useReadContract({
    address: UserService.CONTRACTS.IMPLEMENTATION as `0x${string}`,
    abi: UserService.ABI.IMPLEMENTATION,
    functionName: 'getEquipmentByPlant',
    args: selectedPlantId ? [BigInt(selectedPlantId)] : undefined,
    query: { enabled: !!selectedPlantId },
  })

  useEffect(() => {
    if (refetch && typeof onRefetchReady === 'function') {
      onRefetchReady(refetch as RefetchEquipmentsFn);
    }
  }, [refetch, onRefetchReady]);

  useEffect(() => {
    if (selectedPlantId) {
        onLoadingChange?.(isLoadingEquipments)
    } else {
        onLoadingChange?.(false)
        setEquipments([])
    }
  }, [selectedPlantId, isLoadingEquipments, onLoadingChange])

  useEffect(() => {
    if (selectedPlantId && equipmentsData && Array.isArray(equipmentsData)) {
       const tsToBigInt = (ts: any): bigint => ts && BigInt(ts) > BigInt(0) ? BigInt(ts) : BigInt(0)
       const formattedEquipments: Equipment[] = equipmentsData.map((equip: any): Equipment => ({
         id: BigInt(equip.id?.toString() || '0'),
         name: equip.name || 'Équipement sans nom',
         description: equip.description || '',
         currentStep: Number(equip.currentStep ?? 0) as CertificationSteps,
         status: Number(equip.status ?? 0) as EquipmentStatus,
         registeredAt: tsToBigInt(equip.registeredAt),
         certifiedAt: tsToBigInt(equip.certifiedAt),
         rejectedAt: tsToBigInt(equip.rejectedAt),
         pendingAt: tsToBigInt(equip.pendingAt),
         deprecatedAt: tsToBigInt(equip.deprecatedAt),
         finalCertificationHash: equip.finalCertificationHash && equip.finalCertificationHash !== '0x0000000000000000000000000000000000000000000000000000000000000000' ? equip.finalCertificationHash : '0x0',
         rejectionReason: equip.rejectionReason || '',
       }))
       console.log("[SelectEquipment] Formatted detailed equipments:", formattedEquipments);
       setEquipments(formattedEquipments)

       if (selectedEquipmentId) {
          const currentlySelectedEquipment = formattedEquipments.find(eq => eq.id.toString() === selectedEquipmentId);
          if (currentlySelectedEquipment) {
             console.log("[SelectEquipment] Notifying parent with updated details via onRefetchComplete:", currentlySelectedEquipment);
             onRefetchComplete?.(currentlySelectedEquipment);
          } else {
             console.warn(`[SelectEquipment] Previously selected ID ${selectedEquipmentId} not found. Notifying parent with null.`);
             onRefetchComplete?.(null);
          }
       } else {
          onRefetchComplete?.(null);
       }

    } else if (selectedPlantId && equipmentsError) {
        console.error(`💥 [SelectEquipment] Erreur chargement équipements pour centrale ${selectedPlantId}:`, equipmentsError)
        setEquipments([])
        toast({ title: "Erreur SelectEquipment", description: "Impossible de charger les équipements.", variant: "destructive" })
    }
  }, [selectedPlantId, equipmentsData, equipmentsError, toast, selectedEquipmentId, onRefetchComplete])

  const handleShadcnValueChange = (value: string) => {
    console.log("[SelectEquipment] User selected ID via Select component:", value);
    onValueChange(value || null);
  }

  const getPlaceholder = () => {
      if (!selectedPlantId) return "Sélectionnez d'abord une centrale"
      if (isLoadingEquipments) return "Chargement des équipements..."
      if (equipments.length === 0) return "Aucun équipement trouvé"
      return "Choisir un équipement"
  }

  return (
    <Select
      onValueChange={handleShadcnValueChange}
      value={selectedEquipmentId || undefined}
      disabled={disabled || !selectedPlantId || isLoadingEquipments || equipments.length === 0}
    >
      <SelectTrigger className={`${triggerWidth} ${className || ''}`}>
        <SelectValue placeholder={getPlaceholder()} />
      </SelectTrigger>
      <SelectContent>
        {equipments.map((equip) => (
          <SelectItem key={equip.id.toString()} value={equip.id.toString()}>
            {equip.name} (ID: {equip.id.toString()})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default SelectEquipment
