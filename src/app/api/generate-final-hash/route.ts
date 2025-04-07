import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, keccak256, encodePacked, Hash } from 'viem'
import { hardhat } from 'viem/chains'
import {
  NUCLEAR_CERTIFICATION_IMPL_ABI,
  NUCLEAR_CERTIFICATION_IMPL_ADDRESS
} from '@/contracts/NuclearContracts'

// Créer un client public VIEM pour les lectures serveur
const publicClient = createPublicClient({
  chain: hardhat,
  transport: http(process.env.NEXT_PUBLIC_HARDHAT_RPC_URL || 'http://127.0.0.1:8545')
})

export async function POST(req: NextRequest) {
    const finalHashSalt = process.env.FINAL_HASH_SALT
    
    if (!finalHashSalt) {
        return NextResponse.json({ error: 'Server configuration error: Hash salt missing.' }, { status: 500 })
    }

    try {
        const { equipmentId } = await req.json()
        if (!equipmentId || typeof equipmentId !== 'string') {
             return NextResponse.json({ error: 'Missing or invalid equipmentId' }, { status: 400 })
        }
        let equipmentIdBigInt: bigint
        
        try {
            equipmentIdBigInt = BigInt(equipmentId.trim())
            if (equipmentIdBigInt < 0) throw new Error("L'ID doit être un nombre positif ou zéro.")
        } catch (error: any) {
             return NextResponse.json({ error: 'Invalid equipmentId format. Must be a non-negative integer.' }, { status: 400 })
        }

        // Récupérer les IDs des documents
        const documentIds = await publicClient.readContract({
            address: NUCLEAR_CERTIFICATION_IMPL_ADDRESS as `0x${string}`,
            abi: NUCLEAR_CERTIFICATION_IMPL_ABI,
            functionName: 'getEquipmentDocuments',
            args: [equipmentIdBigInt],
        }) as readonly bigint[]

        if (!documentIds || documentIds.length === 0) {
            return NextResponse.json({ error: 'No documents found for this equipment to generate hash.' }, { status: 404 })
        }

        // Récupérer les hashs IPFS pour chaque ID
        const docDetailsPromises = documentIds.map(docId =>
            publicClient.readContract({
                address: NUCLEAR_CERTIFICATION_IMPL_ADDRESS as `0x${string}`,
                abi: NUCLEAR_CERTIFICATION_IMPL_ABI,
                functionName: 'getDocument',
                args: [docId],
            }).then(doc => {
                const ipfsHash = (doc as any)?.ipfsHash
                return { id: docId, ipfsHash: typeof ipfsHash === 'string' ? ipfsHash : null }
            }).catch(() => {
                return { id: docId, ipfsHash: null }
            })
        );
        const documentsResults = await Promise.all(docDetailsPromises)

        // Filtrer les hashs valides
        const ipfsHashes: string[] = documentsResults
            .map(doc => doc.ipfsHash)
            .filter((hash): hash is string => !!hash);

        if (ipfsHashes.length === 0 && documentIds.length > 0) {
             return NextResponse.json({ error: 'Failed to retrieve IPFS hashes for linked documents.' }, { status: 500 })
        }

        // Trier les hashs IPFS en ordre alphabétique
        const sortedHashes = [...ipfsHashes].sort((a, b) => a.localeCompare(b))

        // Concaténer avec le sel et calculer le hash Keccak256
        const dataToPack: (string | Hash)[] = [finalHashSalt, ...sortedHashes]
        const typesToPack: string[] = ['string', ...sortedHashes.map(() => 'string' as const)]
        const packedData = encodePacked(typesToPack, dataToPack)
        const finalHash = keccak256(packedData)

        return NextResponse.json({ finalHash }, { status: 200 })

    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error during hash generation.', details: error.message }, { status: 500 })
    }
}
