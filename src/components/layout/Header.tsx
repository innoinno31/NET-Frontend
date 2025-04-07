'use client'

import WalletConnection from '@/components/blockchain/WalletConnection'
import CompanyLogo from '@/components/CompanyLogo'
import { useRouter } from 'next/navigation'
import { useUserRoles } from '@/hooks/useUserRoles'

type NavigationItem = {
  name: string
  href: string
  public?: boolean
  roles?: string[]
}

const navigation: NavigationItem[] = [
    { name: 'Vérifier un certificat', href: '/verify', public: true },
    {
      name: 'Administration',
      href: '/backoffice',
      roles: [
        'asn',
        'exploitant',
        'labo',
        'constructeur',
        'certifieur',
        'admin'
      ]
    },
    { name: 'Notre équipe', href: '/team', public: true },
  ]

function Header() {
    const router = useRouter()
    const { isConnected, roles } = useUserRoles()
    
    // Vérifie si l'utilisateur a accès à un élément de navigation
    const hasAccess = (item: NavigationItem): boolean => {
      // Pages publiques accessibles par tous
      if (item.public) return true
      
      // Si l'utilisateur n'est pas connecté ou n'a pas de rôles définis, pas d'accès
      if (!isConnected || !item.roles) return false
      
      const userRole = roles.length > 0 ? roles[0] : null
      if (!userRole) return false
      
      // Vérifier si l'utilisateur a le rôle requis
      return item.roles.includes(userRole)
    }
  
  return (
    <header className="flex flex-col mx-auto lg:w-3/4 2xl:w-2/3">
      <nav aria-label="Global" className="flex items-center justify-between gap-x-6 px-6 py-2 lg:px-8">        
        <CompanyLogo />
        {/* Links */}
        <div className="flex flex-1 min-w-0 max-w-4xl items-center justify-center gap-x-4 lg:gap-x-8 text-sm lg:text-base">
          {navigation.filter(hasAccess).map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="font-semibold text-gray-900"
              onClick={(e) => {
                e.preventDefault()
                router.push(item.href)
              }}
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