'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import UserService from '@/services/userService'
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DocumentType } from '@/lib/enums'

// Interface Props
interface DocumentUploaderProps {
  equipmentId: string
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ equipmentId }) => {
  const [file, setFile] = useState<File | null>(null)
  const [docType, setDocType] = useState<DocumentType | string>("")
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [ipfsHash, setIpfsHash] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const MAX_FILE_SIZE_MB = 10

  const { toast } = useToast()

  // --- Hooks Contrat Blockchain ---
  const { data: registerData, writeContract: writeRegisterDocument, isPending: isRegisterPending, error: registerWriteError } = useWriteContract()
  const { isLoading: isRegisterConfirming, isSuccess: isRegisterConfirmed, error: registerConfirmError } = useWaitForTransactionReceipt({ hash: registerData })

  // --- Handlers ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0]
      if (!selectedFile) {
          setFile(null)
          return
      };

      const fileSizeMB = selectedFile.size / 1024 / 1024
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
          toast({
              title: "Fichier trop volumineux",
              description: `Le fichier dépasse la limite de ${MAX_FILE_SIZE_MB} Mo.`,
              variant: "destructive"
          })
          setFile(null)
          event.target.value = ''
          return
      }

      setFile(selectedFile)
      setIpfsHash(null)
  }

  const handleUploadAndRegister = useCallback(async () => {
    if (!file || docType === "" || !name.trim() || !description.trim()) {
      toast({ title: "Formulaire incomplet", description: "Veuillez remplir tous les champs et sélectionner un fichier.", variant: "destructive" })
      return
    }

    setIsUploading(true)
    setIpfsHash(null)
    toast({ title: "Étape 1/2 : Envoi du fichier au serveur..." })

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok || result.error) {
          throw new Error(result.error || `Erreur serveur: ${response.statusText}`)
      }

      const cid = result.cid
      if (!cid) {
          throw new Error("Le serveur n'a pas retourné de CID IPFS.")
      }

      console.log("✅ CID reçu du serveur:", cid)
      setIpfsHash(cid)
      toast({ title: "Upload IPFS Terminé via serveur", description: `CID: ${cid.substring(0,10)}...` })

      // 2. Appel Contrat SI upload API/IPFS réussi
      toast({ title: "Étape 2/2 : Enregistrement Blockchain en cours..." })
      const args = [
        BigInt(equipmentId),
        Number(docType),
        name.trim(),
        description.trim(),
        cid
      ]

      writeRegisterDocument({
        address: UserService.CONTRACTS.IMPLEMENTATION as `0x${string}`,
        abi: UserService.ABI.IMPLEMENTATION,
        functionName: 'registerDocument',
        args: args,
      })

    } catch (error) {
      console.error("💥 Upload API ou Blockchain call failed:", error)
      toast({ title: "Erreur", description: (error as Error)?.message || "Échec de l'upload ou de l'enregistrement blockchain.", variant: "destructive" })
      setIpfsHash(null)
    } finally {
      setIsUploading(false)
    }
  }, [file, docType, name, description, equipmentId, writeRegisterDocument, toast])

  // --- Effets Confirmation/Erreur Blockchain --- 
  useEffect(() => {
    if (isRegisterConfirmed && registerData) {
      toast({ title: "Document Enregistré !", description: `Le document a été enregistré sur la blockchain (Tx: ${registerData.substring(0, 10)}...).`, variant: "default" })
      setFile(null)
      setDocType("")
      setName('')
      setDescription('')
      setIpfsHash(null)
    }
  }, [isRegisterConfirmed, registerData, toast])

  useEffect(() => {
    const error = registerWriteError || registerConfirmError
    if (error) {
      console.error("💥 Blockchain transaction error:", error)
      toast({ title: "Erreur Blockchain", description: (error as any)?.shortMessage || (error as Error)?.message || "L'enregistrement blockchain a échoué.", variant: "destructive" })
      setIpfsHash(null) 
    }
  }, [registerWriteError, registerConfirmError, toast])

  const isProcessing = isUploading || isRegisterPending || isRegisterConfirming

  // --- Rendu --- 
  return (
    <div className="space-y-4">
      {/* Le formulaire n'a plus besoin d'être désactivé par isClientReady */}
      <div className={`space-y-4 ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
        <div>
          <Label htmlFor="docType">Type de Document <span className="text-red-500">*</span></Label>
          <Select
            onValueChange={(value) => setDocType(value)}
            value={docType?.toString()}
            disabled={isProcessing}
           >
            <SelectTrigger id="docType">
              <SelectValue placeholder="Sélectionner un type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DocumentType)
                .filter(([key]) => isNaN(Number(key)))
                .map(([key, value]) => (
                  <SelectItem key={value} value={value.toString()}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="docName">Nom du Document <span className="text-red-500">*</span></Label>
          <Input
            id="docName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Rapport de test PMP-01A"
            required
            disabled={isProcessing}
          />
        </div>

        <div>
          <Label htmlFor="docDesc">Description <span className="text-red-500">*</span></Label>
          <Textarea
            id="docDesc"
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            placeholder="Détails sur le contenu du document, version, etc."
            required
            disabled={isProcessing}
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="docFile">Fichier (Max {MAX_FILE_SIZE_MB} Mo) <span className="text-red-500">*</span></Label>
          <Input
            id="docFile"
            type="file"
            onChange={handleFileChange}
            required
            disabled={isProcessing}
          />
           {file && <p className="text-sm text-gray-500 mt-1">Fichier sélectionné: {file.name} ({Math.round(file.size / 1024)} Ko)</p>}
        </div>
      </div>

        {/* Affichage Hash IPFS */}
      {ipfsHash && (
        <div className="bg-green-50 border border-green-200 p-3 rounded-md">
          <p className="text-sm font-medium text-green-800">Hash IPFS (CID) :</p>
          <p className="text-xs font-mono break-all text-green-700">{ipfsHash}</p>
        </div>
      )}

      {/* Bouton d'action */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleUploadAndRegister}
          disabled={isProcessing || !file || docType === "" || !name.trim() || !description.trim() || !!(registerWriteError || registerConfirmError)}
        >
          {isUploading ? 'Envoi serveur...' : (isRegisterPending || isRegisterConfirming) ? 'Enregistrement BC...' : 'Uploader et Enregistrer'}
        </Button>
      </div>
    </div>
  )
}

export default DocumentUploader