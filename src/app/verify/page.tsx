'use client'

import RoleProtected from '@/components/RoleProtected'
import { useState, useCallback, useEffect } from "react"
import InputWithLabel from "@/components/inputWithLabel"
import PrimaryButton from "@/components/PrimaryButton"
import { DocumentMagnifyingGlassIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline'
import { useWriteContract, useAccount, useWatchContractEvent } from 'wagmi'
import { config } from '@/wagmi'
import { parseAbiItem, type Hash } from 'viem' 
import { NUCLEAR_CERTIFICATION_IMPL_ABI, NUCLEAR_CERTIFICATION_IMPL_ADDRESS } from '@/contracts/NuclearContracts'

type VerificationStatus = 'idle' | 'apiLoading' | 'contractLoading' | 'watching' | 'success' | 'error'

interface VerificationState {
  status: VerificationStatus
  message: string
  isValid?: boolean | null
  transactionHash?: Hash | null
}

const integrityVerifiedEventAbi = [parseAbiItem('event IntegrityVerified(uint256 indexed equipmentId, bytes32 calculatedHash, bool isValid, address checker, uint256 timestamp)')] as const 

function VerifyPage() {
  const { isConnected } = useAccount()
  const [verificationState, setVerificationState] = useState<VerificationState>({ status: 'idle', message: '' })
  const [watchedTxHash, setWatchedTxHash] = useState<Hash | null>(null)

  const { 
      data: writeContractHash, 
      writeContract, 
      error: writeContractError, 
      reset: resetWriteContract 
  } = useWriteContract()

  useWatchContractEvent({ 
      address: NUCLEAR_CERTIFICATION_IMPL_ADDRESS as `0x${string}`,
      abi: integrityVerifiedEventAbi,
      eventName: 'IntegrityVerified',
      config: config,
      onLogs(logs) {
          const relevantLog = logs.find(log => 
              log.transactionHash === watchedTxHash && 
              log.eventName === 'IntegrityVerified'
          )

          if (relevantLog && watchedTxHash) {
              const { isValid } = relevantLog.args as { isValid: boolean }
              
              setVerificationState({
                  status: 'success',
                  message: isValid 
                      ? "L'intégrité de l'équipement est VÉRIFIÉE." 
                      : "L'intégrité de l'équipement est COMPROMISE.",
                  isValid: isValid,
                  transactionHash: relevantLog.transactionHash
              })
              setWatchedTxHash(null)
          }
      },
      onError() {
          // Fonction intentionnellement vide
      }
  })

  const handleVerify = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    resetWriteContract()
    setWatchedTxHash(null)
    setVerificationState({ status: 'apiLoading', message: "Appel de l'API pour calculer le hash..." })

    const formData = new FormData(event.currentTarget)
    const equipmentIdInput = formData.get('equipmentId') as string

    if (!isConnected) {
        setVerificationState({ status: 'error', message: "Veuillez connecter votre portefeuille." })
        return
    }
    
    if (!equipmentIdInput || !equipmentIdInput.trim()) {
       setVerificationState({ status: 'error', message: "Veuillez entrer un ID d'équipement valide." })
       return
    }

    let equipmentIdBigInt: bigint
    try {
      equipmentIdBigInt = BigInt(equipmentIdInput.trim())
      if (equipmentIdBigInt < 0) throw new Error("L'ID doit être un nombre positif ou zéro.") 
    } catch (error: any) {
      setVerificationState({ status: 'error', message: `ID de l'équipement invalide: ${error.message || 'Veuillez entrer un nombre entier positif ou zéro.'}` })
      return
    }

    try {
      const response = await fetch('/api/generate-final-hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipmentId: equipmentIdInput.trim() })
      })
      
      const apiResult = await response.json()
      if (!response.ok) throw new Error(apiResult.error || `Erreur API (${response.status})`)
      
      const calculatedHash: Hash = apiResult.finalHash
      if (!calculatedHash || !calculatedHash.startsWith('0x')) throw new Error("Hash invalide reçu de l'API.")

      setVerificationState(prev => ({ ...prev, status: 'contractLoading', message: 'Préparation de la transaction...' }))
      
      writeContract({
          address: NUCLEAR_CERTIFICATION_IMPL_ADDRESS as `0x${string}`,
          abi: NUCLEAR_CERTIFICATION_IMPL_ABI,
          functionName: 'checkAndLogEquipmentIntegrity',
          args: [equipmentIdBigInt, calculatedHash],
      })

    } catch (error: any) {
      setVerificationState({ status: 'error', message: error.message || "Erreur avant l'appel contrat." })
    }
  }, [isConnected, writeContract, resetWriteContract])

  useEffect(() => {
    if (writeContractHash) {
        setWatchedTxHash(writeContractHash)
        setVerificationState(prev => ({ 
            ...prev, 
            status: 'watching', 
            message: "Transaction envoyée, en attente de l'événement de confirmation...", 
            transactionHash: writeContractHash 
        }))
    }
  }, [writeContractHash])

  useEffect(() => {
     if (writeContractError) {
         setVerificationState({
            status: 'error',
            message: (writeContractError.cause as any)?.shortMessage || writeContractError.message || "Erreur lors de l'appel contrat.",
            isValid: null
        })
        setWatchedTxHash(null)
    }
  }, [writeContractError])

  const isLoading = verificationState.status === 'apiLoading' || verificationState.status === 'contractLoading' || verificationState.status === 'watching'

  return (
    <RoleProtected publicAccess={true}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-indigo-900 mb-3">Vérification d'Intégrité d'Équipement</h1>

        <p className="text-gray-600 mb-8 max-w-2xl">
          Vérifiez instantanément si le hash calculé des documents correspond à celui enregistré via <code className="text-sm bg-gray-100 px-1 rounded">checkAndLogEquipmentIntegrity</code>.
        </p>

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <form className="flex flex-col md:flex-row items-end space-y-4 md:space-y-0 md:space-x-4" onSubmit={handleVerify}>
            <div className="flex-grow">
              <InputWithLabel
                label="Vérifier l'intégrité d'un équipement"
                name="equipmentId" 
                type="text"
                placeholder="Entrez l'ID numérique de l'équipement"
                required
              />
            </div>

            <PrimaryButton
              type="submit"
              size="lg"
              icon={isLoading ? <ClockIcon className="h-5 w-5 animate-spin" /> : <DocumentMagnifyingGlassIcon className="h-5 w-5" />}
              disabled={isLoading || !isConnected}
            >
              {isLoading ? (verificationState.status === 'watching' ? 'En attente événement...' : 'Vérification...') : !isConnected ? 'Connectez Wallet' : "Vérifier l'Intégrité"}
            </PrimaryButton>
          </form>
           {!isConnected && <p className="text-xs text-red-600 mt-2">Connexion portefeuille requise.</p>}
        </div>

        {verificationState.status !== 'idle' && verificationState.status !== 'apiLoading' && (
          <div className={`p-6 rounded-lg shadow-md border ${ 
              verificationState.status === 'watching' ? 'bg-blue-50 border-blue-200' :
              verificationState.status === 'success' && verificationState.isValid === true ? 'bg-green-50 border-green-200' : 
              verificationState.status === 'success' && verificationState.isValid === false ? 'bg-red-50 border-red-200' : 
              verificationState.status === 'success' && verificationState.isValid === null ? 'bg-yellow-50 border-yellow-200' : 
              verificationState.status === 'error' ? 'bg-red-50 border-red-200' : 
              'bg-gray-50'
            }`}>
            
            <div className="flex items-start space-x-3">
              <div>
                 {(verificationState.status === 'contractLoading' || verificationState.status === 'watching') && <ClockIcon className="h-6 w-6 text-blue-500 animate-spin" />}
                 {verificationState.status === 'success' && verificationState.isValid === true && <CheckCircleIcon className="h-6 w-6 text-green-500" />}
                 {verificationState.status === 'success' && verificationState.isValid === false && <XCircleIcon className="h-6 w-6 text-red-500" />}
                 {verificationState.status === 'success' && verificationState.isValid === null && <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />} 
                 {verificationState.status === 'error' && <XCircleIcon className="h-6 w-6 text-red-500" />} 
              </div>
              <div className="flex-1">
                <h2 className={`text-lg font-semibold ${ 
                    verificationState.status === 'watching' ? 'text-blue-800' :
                    verificationState.status === 'success' && verificationState.isValid === true ? 'text-green-800' : 
                    verificationState.status === 'success' && verificationState.isValid === false ? 'text-red-800' : 
                    verificationState.status === 'success' && verificationState.isValid === null ? 'text-yellow-800' :
                    verificationState.status === 'error' ? 'text-red-800' : 
                    'text-gray-700'
                  }`}> 
                  {verificationState.status === 'contractLoading' ? 'Envoi Transaction...' : 
                   verificationState.status === 'watching' ? 'En attente Confirmation...' :
                   verificationState.status === 'success' && verificationState.isValid === true ? 'Intégrité Vérifiée' : 
                   verificationState.status === 'success' && verificationState.isValid === false ? 'Intégrité Compromise' : 
                   verificationState.status === 'success' && verificationState.isValid === null ? 'Résultat Indéterminé' : 
                   'Erreur'} 
                </h2>
                <p className="text-sm text-gray-600 mt-1">{verificationState.message}</p>

                {verificationState.transactionHash && (() => {
                     const explorerUrl = config.chains.find(c => c.id === config.state.chainId)?.blockExplorers?.default.url
                     if (explorerUrl) {
                         return (
                             <p className="mt-2 text-xs">
                                <a 
                                   href={`${explorerUrl}/tx/${verificationState.transactionHash}`}
                                   target="_blank" 
                                   rel="noopener noreferrer"
                                   className="text-indigo-600 hover:text-indigo-800 underline"
                                >
                                   Voir la transaction ({verificationState.transactionHash.slice(0,6)}...{verificationState.transactionHash.slice(-4)})
                                </a>
                             </p>
                         )
                     }
                     return <p className="mt-2 text-xs text-gray-500">Tx: {verificationState.transactionHash.slice(0,10)}...</p>
                 })()}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="p-4 bg-indigo-50 rounded-lg">
             <h3 className="font-semibold text-indigo-800 mb-2">Vérification On-Chain</h3>
             <p className="text-sm text-gray-600">
               Le contrat intelligent compare lui-même le hash calculé avec la référence stockée de manière immuable.
             </p>
           </div>
           <div className="p-4 bg-indigo-50 rounded-lg">
             <h3 className="font-semibold text-indigo-800 mb-2">Événement Public</h3>
             <p className="text-sm text-gray-600">
               Chaque vérification émet un événement public enregistrant le résultat, l'équipement et le vérificateur.
             </p>
           </div>
           <div className="p-4 bg-indigo-50 rounded-lg">
             <h3 className="font-semibold text-indigo-800 mb-2">Confiance Accrue</h3>
             <p className="text-sm text-gray-600">
               Assurez la conformité et l'intégrité des données critiques grâce à la transparence de la blockchain.
             </p>
           </div>
        </div>
      </div>
    </RoleProtected>
  )
}

export default VerifyPage
  