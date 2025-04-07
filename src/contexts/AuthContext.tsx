'use client'

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react'

type AuthContextType = {
  isAlertOpen: boolean
  alertMessage: string
  redirectUrl: string
  showAuthAlert: (message: string, redirectUrl: string) => void
  closeAlert: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [redirectUrl, setRedirectUrl] = useState('')

  // Affiche une alerte avec un message et une URL de redirection
  const showAuthAlert = useCallback((message: string, url: string) => {
    // Éviter d'afficher des alertes multiples ou de redéfinir l'alerte existante
    if (isAlertOpen) {
      console.log(`⚠️ ${new Date().toISOString()} - AuthContext: Alerte déjà ouverte, ignoré nouvelle alerte`)
      return
    }
    
    console.log(`📢 ${new Date().toISOString()} - AuthContext: Affichage alerte "${message}" avec redirection vers ${url}`)
    setAlertMessage(message)
    setRedirectUrl(url)
    setIsAlertOpen(true)
  }, [isAlertOpen])

  // Ferme l'alerte
  const closeAlert = useCallback(() => {
    console.log(`❌ ${new Date().toISOString()} - AuthContext: Fermeture alerte`)
    setIsAlertOpen(false)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        isAlertOpen,
        alertMessage,
        redirectUrl,
        showAuthAlert,
        closeAlert
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé avec AuthProvider')
  }
  return context
} 