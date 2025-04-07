'use client'

import React, { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import UserService from '@/services/userService'
import { Hash } from 'viem'
import { useToast } from "@/hooks/use-toast"
import { useUserRoles } from '@/hooks/useUserRoles'
import RoleProtected from '@/components/RoleProtected'
import { formatDateTime } from '@/lib/formatters'
import type { Plant, Actor } from '@/lib/interfaces'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrateur',
  PLANT_OPERATOR: 'Exploitant',
  MANUFACTURER: 'Constructeur',
  LABORATORY: 'Laboratoire',
  AUTHORITY: 'Autorité ASN',
  CERTIFIER: 'Agent de certification'
}

const roleColors: Record<string, { bg: string, text: string }> = {
  ADMIN: { bg: 'bg-purple-100', text: 'text-purple-800' },
  PLANT_OPERATOR: { bg: 'bg-blue-100', text: 'text-blue-800' },
  MANUFACTURER: { bg: 'bg-green-100', text: 'text-green-800' },
  LABORATORY: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  AUTHORITY: { bg: 'bg-red-100', text: 'text-red-800' },
  CERTIFIER: { bg: 'bg-indigo-100', text: 'text-indigo-800' }
}

const roleMapping: Record<string, string> = {
  'constructeur': 'MANUFACTURER',
  'labo': 'LABORATORY',
  'asn': 'AUTHORITY',
  'certifieur': 'CERTIFIER'
}

export default function UsersPage() {
  const [plants, setPlants] = useState<Plant[]>([])
  const [users, setUsers] = useState<Actor[]>([])
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null)
  
  // État pour le formulaire d'ajout utilisateur
  const [newUserAddress, setNewUserAddress] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('constructeur')
  
  // État pour la modale et chargement
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [isLoadingComponent, setIsLoadingComponent] = useState(false)
  const [currentAction, setCurrentAction] = useState<'addUser' | null>(null)
  
  // Connexion au portefeuille
  const { address, isConnected } = useAccount()
  
  // Système de notification toast
  const { toast } = useToast()

  // Utilisation du hook pour les rôles
  const { roles: userRoles, hasRole, isLoading: isLoadingRoles } = useUserRoles()
  const isAdmin = hasRole('admin')
  const isExploitant = hasRole('exploitant')

  // --- Hook Lecture de TOUTES les Centrales (pour le Select) --- 
  const { 
    data: plantsData,
    isLoading: isLoadingPlants 
  } = useReadContract({
    address: UserService.CONTRACTS.IMPLEMENTATION as `0x${string}`,
    abi: UserService.ABI.IMPLEMENTATION,
    functionName: 'getAllPlants',
    query: { enabled: isConnected },
  })

  // --- Hook Lecture des Utilisateurs pour la CENTRALE SÉLECTIONNÉE --- 
  const { 
    data: usersData,
    refetch: refetchUsers,
    isLoading: isLoadingUsers 
  } = useReadContract({
    address: UserService.CONTRACTS.IMPLEMENTATION as `0x${string}`,
    abi: UserService.ABI.IMPLEMENTATION,
    functionName: 'getAllActorsWithRolesByPlant',
    args: selectedPlantId ? [BigInt(selectedPlantId)] : undefined,
    query: { enabled: isConnected && !!selectedPlantId },
  })

  // --- Gestion Ajout Utilisateur à une Centrale --- 
  const { 
    data: addUserWriteData, 
    writeContract: writeAddUser, 
    isPending: isAddUserWritePending, 
    error: addUserWriteError
  } = useWriteContract()

  const { 
    isLoading: isAddUserConfirming, 
    isSuccess: isAddUserConfirmed,
    error: addUserConfirmError
  } = useWaitForTransactionReceipt({
    hash: addUserWriteData as Hash | undefined,
  })

  // Effet pour peupler le Select des centrales
  useEffect(() => {
    if (plantsData) {
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

  // Effet pour mettre à jour la liste des utilisateurs de la centrale sélectionnée
  useEffect(() => {
    // Log pour voir quand ce hook s'exécute et avec quelles données
    console.log(`🔄 [Users Effect] Processing usersData for plant ${selectedPlantId}. isLoading: ${isLoadingUsers}`, usersData);
    if (usersData) {
      console.log(`Utilisateurs récupérés pour la centrale ${selectedPlantId}:`, usersData)
      if (Array.isArray(usersData)) {
        const formattedUsers: Actor[] = usersData.map((item: any) => {
          // Débogage pour voir la structure réelle des données
          console.log("Structure d'un utilisateur:", item)
          
          let role = 'UNKNOWN';
          // Déterminer le rôle à partir des données
          if (item.role) {
            role = item.role;
          } else if (item.isAdmin) {
            role = 'ADMIN';
          } else if (item.isPlantOperator) {
            role = 'PLANT_OPERATOR';
          } else if (item.isManufacturer) {
            role = 'MANUFACTURER';
          } else if (item.isLaboratory) {
            role = 'LABORATORY';
          } else if (item.isAuthority) {
            role = 'AUTHORITY';
          } else if (item.isCertifier) {
            role = 'CERTIFIER';
          }
          
          return {
            id: BigInt(item.id?.toString() || '0'),
            name: item.name || 'Sans nom',
            actorAddress: item.actorAddress || item.actor || item.userAddress || item.address || '0x0',
            role: item.roleHash || `0x${Buffer.from(role).toString('hex')}` as `0x${string}`,
            registeredAt: BigInt(item.registeredAt || 0),
            plantId: BigInt(selectedPlantId || '0')
          }
        })
        console.log("   => Formatted users:", formattedUsers);
        setUsers(formattedUsers)
      } else {
        console.warn("   => usersData is not an array?")
      }
    } else if (!isLoadingUsers) {
      console.log("   => No usersData and not loading, setting users to [].")
      setUsers([])
    }
  }, [usersData, selectedPlantId, isLoadingUsers])

  // Fonction pour ajouter un utilisateur à la centrale sélectionnée
  const handleAddUser = async () => {
    if (!newUserAddress || !newUserName || !selectedPlantId) {
      toast({ 
        title: "Erreur", 
        description: isAdmin 
          ? "Veuillez renseigner l'adresse, le nom de l'exploitant et sélectionner une centrale."
          : "Veuillez renseigner l'adresse, le nom de l'utilisateur, son rôle et sélectionner une centrale.", 
        variant: "destructive" 
      })
      return
    }

    if (!newUserAddress.startsWith('0x') || newUserAddress.length !== 42) {
      toast({ 
        title: "Format d'adresse invalide", 
        description: "Veuillez entrer une adresse Ethereum valide (format 0x...)", 
        variant: "destructive" 
      })
      return
    }

    try {
      setCurrentAction('addUser')
      
      // Si admin, toujours ajouter un exploitant
      if (isAdmin) {
        toast({ title: "Transaction en cours", description: "Enregistrement de l'exploitant...", variant: "default" })
        
        writeAddUser({
          address: UserService.CONTRACTS.IMPLEMENTATION as `0x${string}`,
          abi: UserService.ABI.IMPLEMENTATION,
          functionName: 'registerPlantOperator',
          args: [newUserAddress, selectedPlantId, newUserName]
        })
      } 
      // Si exploitant, ajouter selon le rôle sélectionné
      else if (isExploitant) {
        if (!selectedRole) {
            toast({ title: "Erreur", description: "Veuillez sélectionner un rôle pour l'utilisateur.", variant: "destructive" });
            return;
        }
        
        toast({ title: "Transaction en cours", description: `Enregistrement du ${roleLabels[roleMapping[selectedRole]].toLowerCase()}...`, variant: "default" })

        // Détermine la fonction à appeler selon le rôle sélectionné
        let functionName = '';
        switch(selectedRole) {
          case 'constructeur':
            functionName = 'registerManufacturer';
            break;
          case 'labo':
            functionName = 'registerLaboratory';
            break;
          case 'asn':
            functionName = 'registerRegulatoryAuthority';
            break;
          case 'certifieur':
            functionName = 'registerCertificationOfficer';
            break;
          default:
            throw new Error(`Rôle non supporté: ${selectedRole}`);
        }

        // Ajouter un log pour déboguer
        console.log(`Appel de la fonction '${functionName}' avec les arguments:`, [newUserAddress, selectedPlantId, newUserName])

        writeAddUser({
          address: UserService.CONTRACTS.IMPLEMENTATION as `0x${string}`,
          abi: UserService.ABI.IMPLEMENTATION,
          functionName,
          args: [newUserAddress, selectedPlantId, newUserName]
        })
      } else {
        toast({ 
          title: "Erreur d'autorisation", 
          description: "Vous n'avez pas les droits nécessaires pour ajouter des utilisateurs.", 
          variant: "destructive" 
        })
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'utilisateur:", error)
      setCurrentAction(null)
      toast({ title: "Erreur", description: (error as Error)?.message || "Erreur lors de la préparation de l'ajout.", variant: "destructive" })
    }
  }

  // Effet pour gérer la confirmation de l'ajout d'utilisateur
  useEffect(() => {
    if (isAddUserConfirmed && addUserWriteData && currentAction === 'addUser') {
      console.log("✅ [Confirmation Effect] Add user transaction confirmed:", addUserWriteData)
      
      if (typeof refetchUsers === 'function') {
        console.log("🔄 [Confirmation Effect] Calling refetchUsers()...");
        refetchUsers()
          .then(() => console.log("   => refetchUsers() completed."))
          .catch(err => console.error("   => refetchUsers() failed:", err));
      } else {
        console.warn("⚠️ [Confirmation Effect] refetchUsers function is not available!")
      }
      
      setNewUserAddress('') 
      setNewUserName('')
      setCurrentAction(null) 
      setIsAddUserModalOpen(false)

      // Toast de succès...
      if (isAdmin) {
        toast({
          title: "Exploitant ajouté avec succès",
          description: `L'exploitant (${addUserWriteData}) a été ajouté.`, // Simplifié, car les noms pourraient ne plus être dans l'état
          variant: "default",
        })
      } else if (isExploitant) {
        toast({
          title: "Utilisateur ajouté avec succès",
          description: `L'utilisateur (${addUserWriteData}) a été ajouté.`, // Simplifié
          variant: "default",
        })
      }
    }
  }, [isAddUserConfirmed, addUserWriteData, currentAction, refetchUsers, toast, selectedRole, isAdmin, isExploitant])

  // Effet pour gérer les erreurs d'ajout d'utilisateur
  useEffect(() => {
    const error = addUserWriteError || addUserConfirmError
    if (error) {
      toast({
        title: "Erreur de transaction",
        description: (error as any)?.shortMessage || (error as Error)?.message || "Une erreur inconnue est survenue lors de l'ajout de l'utilisateur",
        variant: "destructive",
      })
      if (isAddUserConfirming) {
          setCurrentAction(null)
      }
    }
  }, [addUserWriteError, addUserConfirmError, toast, isAddUserConfirming])

  // Gérer l'état de chargement global
  useEffect(() => {
    setIsLoadingComponent(isLoadingRoles || isAddUserWritePending || isAddUserConfirming || isLoadingPlants || (!!selectedPlantId && isLoadingUsers) )
  }, [isLoadingRoles, isAddUserWritePending, isAddUserConfirming, isLoadingPlants, selectedPlantId, isLoadingUsers])
  
  // Si l'utilisateur n'est pas connecté
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
  
  // Rôles requis pour cette page spécifique
  const requiredRolesForPage = ['admin', 'exploitant','asn']

  return (
    <RoleProtected roles={requiredRolesForPage}>
      <div className="space-y-6 p-4">
        <h1 className="text-2xl font-bold mb-4">Gestion des Utilisateurs par Centrale</h1>
        
        {isLoadingComponent && (
          <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-md">Chargement en cours...</div>
          </div>
        )}
        
        {/* Sélection de la Centrale */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Sélectionner une Centrale</h2>
          <Select 
            onValueChange={(value) => setSelectedPlantId(value)} 
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

        {/* Section Utilisateurs (affichée seulement si une centrale est sélectionnée) */}
        {selectedPlantId && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <h2 className="text-xl font-semibold mr-3">Utilisateurs de la Centrale</h2>
                <span className="px-3 py-1 inline-flex text-sm font-medium rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                  {plants.find(p => p.id.toString() === selectedPlantId)?.name || 'Sélectionnée'}
                </span>
              </div>
              {(isAdmin || isExploitant) && (
                <Button 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => setIsAddUserModalOpen(true)}
                  disabled={!selectedPlantId || isLoadingComponent} // Désactivé si aucune centrale ou chargement
                >
                  {isAdmin ? 'Ajouter un Exploitant' : 'Ajouter un Utilisateur'}
                </Button>
              )}
            </div>
            
            {/* Tableau des Utilisateurs */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adresse</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date d'ajout</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoadingUsers && (
                     <tr><td colSpan={4} className="p-4 text-center text-gray-500">Chargement des utilisateurs...</td></tr>
                  )}
                  {!isLoadingUsers && users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                        Aucun utilisateur trouvé pour cette centrale.
                      </td>
                    </tr>
                  ) : (
                    users.map((user, index) => (
                      <tr key={`${user.id.toString()}-${index}`}> 
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{user.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-600">{user.actorAddress}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            roleColors[user.role]?.bg || 'bg-gray-100'
                          } ${
                            roleColors[user.role]?.text || 'text-gray-800'
                          }`}> 
                            {roleLabels[user.role] || user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDateTime(Number(user.registeredAt))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Modale pour ajouter un utilisateur */}
        {isAddUserModalOpen && (
           <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
              <h2 className="text-xl font-semibold mb-4">
                {isAdmin ? 'Ajouter un Exploitant' : 'Ajouter un Utilisateur'}
                {selectedPlantId && plants.find(p => p.id.toString() === selectedPlantId) 
                  ? ` à ${plants.find(p => p.id.toString() === selectedPlantId)?.name}` 
                  : ''}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
                    {isAdmin ? 'Nom de l\'Exploitant' : 'Nom de l\'Utilisateur'}
                  </label>
                  <Input
                    id="userName"
                    type="text"
                    placeholder="Ex: Jean Dupont"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                  />
                </div>
                
                <div>
                  <label htmlFor="userAddress" className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse Ethereum {isAdmin ? 'de l\'Exploitant' : 'de l\'Utilisateur'}
                  </label>
                  <Input
                    id="userAddress"
                    type="text"
                    placeholder="0x..."
                    value={newUserAddress}
                    onChange={(e) => setNewUserAddress(e.target.value)}
                  />
                </div>

                {/* Sélection du rôle uniquement pour l'exploitant */}
                {isExploitant && (
                  <div>
                    <label htmlFor="userRole" className="block text-sm font-medium text-gray-700 mb-1">
                      Rôle de l'Utilisateur
                    </label>
                    <Select
                      onValueChange={(value) => setSelectedRole(value)}
                      value={selectedRole}
                    >
                      <SelectTrigger id="userRole" className="w-full">
                        <SelectValue placeholder="Sélectionner un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="constructeur">Constructeur</SelectItem>
                        <SelectItem value="labo">Laboratoire</SelectItem>
                        <SelectItem value="asn">Autorité ASN</SelectItem>
                        <SelectItem value="certifieur">Agent de Certification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline"
                    onClick={() => setIsAddUserModalOpen(false)}
                    disabled={isAddUserWritePending || isAddUserConfirming}
                  >
                    Annuler
                  </Button>
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={handleAddUser}
                    disabled={!newUserAddress || !newUserName || (isExploitant && !selectedRole) || isAddUserWritePending || isAddUserConfirming}
                  >
                    {(isAddUserWritePending || isAddUserConfirming) 
                      ? 'Ajout en cours...' 
                      : (isAdmin ? 'Ajouter Exploitant' : 'Ajouter Utilisateur')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleProtected>
  )
}
