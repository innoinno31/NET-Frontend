'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuth } from '@/contexts/AuthContext'
import { useUserRoles } from '@/hooks/useUserRoles'

export function AlertDialogAuth() {
  const { isAlertOpen, alertMessage, closeAlert, redirectUrl } = useAuth()
  const { roles, isConnected } = useUserRoles()
  const router = useRouter()
  
  // Fonction pour gérer la redirection immédiate
  const handleRedirect = () => {
    console.log(`🔄 ${new Date().toISOString()} - AlertDialogAuth: redirection immédiate vers ${redirectUrl}`)
    closeAlert()
    router.push(redirectUrl)
  }
  
  // Annuler la redirection (rester sur la page)
  const handleCancel = () => {
    console.log(`🛑 ${new Date().toISOString()} - AlertDialogAuth: redirection annulée par l'utilisateur`)
    closeAlert()
  }
  
  // Logging lorsque l'alerte est ouverte
  useEffect(() => {
    if (isAlertOpen) {
      console.log(`🔔 ${new Date().toISOString()} - AlertDialogAuth: alerte ouverte avec message: "${alertMessage}"`)
      console.log(`👤 ${new Date().toISOString()} - AlertDialogAuth: rôles de l'utilisateur:`, roles)
      console.log(`🌐 ${new Date().toISOString()} - AlertDialogAuth: état de connexion: ${isConnected ? 'connecté' : 'déconnecté'}`)
    }
  }, [isAlertOpen, alertMessage, roles, isConnected])

  if (!isAlertOpen) return null

  return (
    <AlertDialog open={isAlertOpen} onOpenChange={closeAlert}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center text-amber-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
              <path d="M12 9v4"></path>
              <path d="M12 17h.01"></path>
            </svg>
            Accès limité
          </AlertDialogTitle>
          <AlertDialogDescription className="mt-2 text-base">
            {alertMessage}
            
            <div className="mt-4 p-2 rounded border border-gray-200">
              <div className="font-medium text-sm mb-1">Informations de débogage:</div>
              <div className="text-xs space-y-1">
                <p><span className="font-semibold">État de connexion:</span> {isConnected ? 'Connecté' : 'Non connecté'}</p>
                <p><span className="font-semibold">Vos rôles actuels:</span> {roles.length > 0 ? roles.join(', ') : 'Aucun rôle'}</p>
                <p><span className="font-semibold">Redirection vers:</span> {redirectUrl}</p>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex space-x-2">
          <button 
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Annuler
          </button>
          <AlertDialogAction onClick={handleRedirect} className="bg-indigo-600 hover:bg-indigo-700">
            Rediriger maintenant
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 