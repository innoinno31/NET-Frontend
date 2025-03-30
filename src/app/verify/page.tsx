import { useState } from "react"
import InputWithLabel from "@/components/inputWithLabel"
import PrimaryButton from "@/components/PrimaryButton"
import { DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline'

function Verify() {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-indigo-900 mb-3">Vérification de Certificat</h1>
        
        <p className="text-gray-600 mb-8 max-w-2xl">
          Notre outil de vérification blockchain permet d'authentifier instantanément la validité d'un certificat ou d'un équipement nucléaire et d'accéder à son historique complet, garantissant transparence et conformité réglementaire.
        </p>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <form className="flex flex-col md:flex-row items-end space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-grow">
              <InputWithLabel
                label="Vérifier une certification ou un équipement"
                name="certification"
                type="text"
                placeholder="Entrez l'identifiant unique"
                required
              />
            </div>
            
            <PrimaryButton 
              type="submit"
              size="lg"
              icon={<DocumentMagnifyingGlassIcon className="h-5 w-5" />}
            >
              Vérifier
            </PrimaryButton>
          </form>
        </div>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-indigo-50 rounded-lg">
            <h3 className="font-semibold text-indigo-800 mb-2">Authentification Sécurisée</h3>
            <p className="text-sm text-gray-600">
              Validation instantanée de l'authenticité des documents grâce à la technologie blockchain immuable.
            </p>
          </div>
          
          <div className="p-4 bg-indigo-50 rounded-lg">
            <h3 className="font-semibold text-indigo-800 mb-2">Traçabilité Complète</h3>
            <p className="text-sm text-gray-600">
              Accédez à l'historique complet et aux détails des certifications pour un suivi transparent.
            </p>
          </div>
          
          <div className="p-4 bg-indigo-50 rounded-lg">
            <h3 className="font-semibold text-indigo-800 mb-2">Conformité Réglementaire</h3>
            <p className="text-sm text-gray-600">
              Assurez-vous que les équipements et certifications respectent toutes les exigences légales du secteur nucléaire.
            </p>
          </div>
        </div>
      </div>
    )
  }

export default Verify
  