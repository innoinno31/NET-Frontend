import { useState } from 'react'
import InputWithLabel from './inputWithLabel'
import PrimaryButton from './PrimaryButton'
import { DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline'

function Verify() {
  const [certificateId, setCertificateId] = useState('')
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCertificateId(e.target.value)
    setTouched(true)
    
    // Validation simple
    if (!e.target.value.trim()) {
      setError('Veuillez entrer un identifiant de certificat')
    } else if (e.target.value.length < 8) {
      setError('L\'identifiant doit contenir au moins 8 caractères')
    } else {
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!certificateId.trim() || error) {
      setTouched(true)
      return
    }
    
    setLoading(true)
    
    try {
      // Simulation d'une requête de vérification
      await new Promise(resolve => setTimeout(resolve, 1500))
      alert(`Vérification du certificat: ${certificateId}`)
      setLoading(false)
    } catch (error) {
      console.error('Erreur lors de la vérification:', error)
      setError('Une erreur est survenue lors de la vérification')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-indigo-900 mb-6">Vérifier un certificat</h2>
      
      <form onSubmit={handleSubmit}>
        <InputWithLabel 
          label="Identifiant du certificat"
          name="certificateId"
          type="text"
          placeholder="Entrez l'identifiant unique du certificat"
          required
          onChange={handleChange}
          error={error}
          touched={touched}
          className="mb-6"
        />
        
        <div className="flex justify-end">
          <PrimaryButton 
            type="submit"
            size="lg"
            disabled={loading || !!error}
            icon={<DocumentMagnifyingGlassIcon className="h-5 w-5" />}
          >
            {loading ? 'Vérification en cours...' : 'Vérifier'}
          </PrimaryButton>
        </div>
      </form>
      
      <p className="mt-4 text-sm text-gray-600">
        Entrez l'identifiant unique du certificat pour vérifier son authenticité sur la blockchain.
      </p>
    </div>
  )
}

export default Verify 