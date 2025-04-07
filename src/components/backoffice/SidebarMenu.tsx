import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUserRoles } from '@/hooks/useUserRoles'
import {
  DocumentDuplicateIcon,
  HomeIcon,
  BuildingOfficeIcon,
  WrenchIcon,
  DocumentCheckIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

// Définition des types pour les éléments de navigation
type NavigationItem = {
  name: string
  href: string
  icon: React.ForwardRefExoticComponent<any>
  count?: string
  current?: boolean
  roles?: string[]
}

const commonNavigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/backoffice', icon: HomeIcon }
]

// Navigation spécifique par rôle
const allRoleSpecificNavigation: NavigationItem[] = [
  { name: 'Gestion des Centrales', href: '/backoffice/plants', icon: BuildingOfficeIcon, roles: ['admin'] },
  { name: 'Gestion des équipements', href: '/backoffice/equipment', icon: BuildingOfficeIcon, roles: ['exploitant'] },
  { name: 'Gestion des Utilisateurs', href: '/backoffice/users', icon: UserGroupIcon, roles: ['admin', 'exploitant','asn'] },
  { name: 'Envoyer un Document', href: '/backoffice/documents', icon: WrenchIcon, roles: ['constructeur', 'labo', 'certifieur'] },
  { name: 'Tous les certificats', href: '/backoffice/certificates', icon: DocumentCheckIcon, roles: ['admin', 'exploitant', 'asn'] },
  { name: 'Demandes de certification', href: '/backoffice/certification-requests', icon: DocumentDuplicateIcon, roles: ['exploitant'] },
  { name: 'Certification des Equipements', href: '/backoffice/asn-certification', icon: DocumentCheckIcon, roles: ['asn'] },
]

// Traduction des noms de rôles pour l'affichage
const roleLabels: Record<string, string> = {
  admin: 'Administrateur',
  exploitant: 'Exploitant',
  constructeur: 'Constructeur',
  labo: 'Laboratoire',
  asn: 'Autorité ASN',
  certifieur: 'Agent de certification'
}

const classNames = (...classes: string[]) => {
  return classes.filter(Boolean).join(' ')
}

const SidebarMenu: React.FC = () => {
  const { roles, hasAnyRole, isConnected, isLoading: isLoadingRoles } = useUserRoles()
  const pathname = usePathname()
  
  const allowedRolesForDisplay = ['admin', 'exploitant', 'labo', 'constructeur', 'certifieur', 'asn']
  const displayRole = roles.find(role => allowedRolesForDisplay.includes(role))

  const buildFilteredNavigation = () => {
    const nav = [...commonNavigation]
    
    allRoleSpecificNavigation.forEach(item => {
      // Vérifie si l'utilisateur a au moins un des rôles requis pour cet item
      if (item.roles && hasAnyRole(item.roles) && !nav.some(navItem => navItem.href === item.href)) {
        nav.push(item)
      }
    })
    
    return nav
  }
  
  const navigation = buildFilteredNavigation()

  if (!isConnected || isLoadingRoles || !displayRole) {
    return null
  }

  return (
    <div className="bg-white border-r border-gray-200 h-full">
      <div className="flex flex-col h-16 items-start justify-center px-6 border-b border-gray-200">
        <span className="text-lg font-semibold text-indigo-700">
          Administration
        </span>
          <div className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
            {roleLabels[displayRole] || displayRole}
          </div>
      </div>
      <nav className="p-4">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={classNames(
                  pathname === item.href 
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600',
                  'group flex items-center gap-x-3 rounded-md p-2 text-sm font-medium',
                )}
              >
                <item.icon
                  className={classNames(
                    pathname === item.href ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600',
                    'h-5 w-5 shrink-0',
                  )}
                  aria-hidden="true"
                />
                {item.name}
                {item.count && (
                  <span className="ml-auto rounded-full bg-white px-2.5 py-0.5 text-xs text-gray-500 ring-1 ring-inset ring-gray-200">
                    {item.count}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

export default SidebarMenu