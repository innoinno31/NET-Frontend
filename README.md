![License](https://img.shields.io/badge/license-MIT-blue)

# NET - Système de Traçabilité et Certification Blockchain pour Équipements Nucléaires

## Vue d'ensemble

NET est une application web qui utilise la technologie blockchain pour assurer la traçabilité et la certification des équipements nucléaires. Elle permet la gestion complète du cycle de vie des équipements, depuis leur enregistrement jusqu'à leur certification, en impliquant différents acteurs du secteur (exploitants, autorités de sûreté, constructeurs, laboratoires).

## 🔑 Fonctionnalités principales

- **Gestion des centrales nucléaires**
- **Gestion des équipements par centrale**
- **Processus de certification transparent et immuable**
- **Vérification d'intégrité des équipements**
- **Gestion des documents (upload IPFS)**
- **Système de rôles avec autorisations spécifiques**
- **Traçabilité complète des actions sur la blockchain**

## 🛠️ Technologies

- **Frontend**: Next.js 14+, React 18, TypeScript
- **Styling**: Tailwind CSS, ShadcnUI
- **Blockchain**: Wagmi, Viem, Hardhat
- **Stockage**: IPFS pour les documents
- **Authentification**: Web3 (connexion par wallet)
- **Déploiement**: Vercel

## 📂 Structure du projet

```
/
├── public/                # Ressources statiques
├── src/
│   ├── app/               # Pages et routes (App Router)
│   │   ├── backoffice/    # Interface administrateur
│   │   ├── verify/        # Page de vérification publique
│   │   └── team/          # Page équipe
│   ├── components/        # Composants React réutilisables
│   │   ├── backoffice/    # Composants spécifiques au backoffice
│   │   ├── layout/        # Composants de mise en page
│   │   └── ui/            # Composants d'interface utilisateur
│   ├── contracts/         # ABIs et adresses des smart contracts
│   ├── hooks/             # Hooks React personnalisés
│   ├── lib/               # Utilitaires, interfaces et enums centralisés
│   │   ├── interfaces.ts  # Types et interfaces TypeScript
│   │   ├── enums.ts       # Énumérations centralisées
│   │   └── formatters.ts  # Fonctions de formatage
│   ├── services/          # Services pour interagir avec APIs/blockchain
│   └── providers.tsx      # Fournisseurs de contexte React
```

## ⚙️ Installation & Configuration

### Installation

```bash
# Cloner le repository
git clone https://github.com/innoinno31/NET-Frontend.git

# Installer les dépendances
npm install

### Variables d'environnement
# Configurer les variables d'environnement en copiant le .env.example
.env.example
```

### Démarrer en développement

```bash
# Démarrer le serveur de développement
npm run dev
```

## 🚀 Déploiement avec Vercel

Le projet est configuré pour être déployé facilement sur Vercel:

1. Connectez votre dépôt GitHub à Vercel
2. Configurez les variables d'environnement dans l'interface Vercel
3. Déployez!

### Configuration Vercel recommandée

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Node.js Version**: 18.x

## 🔐 Rôles utilisateurs

- **Admin**: Accès complet au système, gestion des centrales et exploitants
- **Exploitant**: Gestion des équipements d'une centrale spécifique
- **Constructeur**: Enregistrement et documentation des équipements
- **Laboratoire**: Vérification technique et tests d'équipements
- **ASN**: Autorité de certification et validation réglementaire
- **Certifieur**: Émission des certificats de conformité

## 🙏 Contribution

Les contributions sont les bienvenues! Veuillez suivre le processus standard:
1. Fork du projet
2. Création d'une branche de fonctionnalité
3. Commit des modifications
4. Push vers la branche
5. Ouverture d'une Pull Request
