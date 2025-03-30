'use client'

import WalletConnection from '@/components/blockchain/WalletConnection'
import CompanyLogo from '@/components/CompanyLogo'
import { useRouter } from 'next/navigation'

const navigation = [
    { name: 'Vérifier un certificat', href: '/verify', public: true },
    { name: 'Créer un certificat', href: '/create', roles: ['labo', 'constructeur', 'exploitant'] },
    { name: 'Tous les certificats', href: '/documents', roles: ['asn', 'exploitant'] },
    { name: 'Mes certificats', href: '/my-documents', roles: ['labo', 'constructeur'] },
    { name: 'Administration', href: '/admin', roles: ['asn', 'exploitant'] },
    { name: 'Contact', href: '/contact', public: true },
  ]

function Header() {
    const router = useRouter()
  
  return (
    <header className="flex flex-col max-w-7xl mx-auto">
      <nav aria-label="Global" className="flex flex-1 items-center justify-between gap-x-6 p-6 lg:px-8">        
        <CompanyLogo />
        {/* Links */}
        <div className="flex flex-1 max-w-4xl items-center justify-center gap-x-4 lg:gap-x-8 text-sm lg:text-base">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="font-semibold text-gray-900"
              onClick={() => router.push(item.href)}
            >
              {item.name}
            </a>
          ))}
        </div>
        <WalletConnection />
      </nav>
    </header>
  )
}

export default Header