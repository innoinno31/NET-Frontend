import { NextRequest, NextResponse } from 'next/server'
import { formidable } from 'formidable'
import fs from 'fs'
import * as W3Client from '@web3-storage/w3up-client'
import { Blob } from 'buffer'
import { Readable } from 'stream'

// Interface pour le résultat de formidable
interface FormidableFile {
  filepath: string
  originalFilename: string
  mimetype?: string
  size: number
}

interface FormidableResult {
  fields: Record<string, string[]>
  files: Record<string, FormidableFile[]>
}

/**
 * Assure qu'un espace est disponible pour l'upload IPFS
 */
const ensureSpace = async (client: ReturnType<typeof W3Client.create>, email: string): Promise<string> => {
  const currentSpace = client.currentSpace()
  if (currentSpace) return currentSpace.did()

  // Vérifier si des espaces existent déjà
  const spaces = await client.spaces()
  if (spaces.length > 0) {
    await client.setCurrentSpace(spaces[0].did())
    return spaces[0].did()
  } 
  
  // Aucun espace disponible, il faut en créer un nouveau
  try {
    // Si aucun compte n'est configuré, faire login
    if (!Object.keys(client.accounts()).length) {
      // Attendre que l'utilisateur clique sur le lien dans l'email pour vérifier son identité
      const account = await client.login(email as `${string}@${string}`)
      
      // Créer un nouvel espace pour les uploads
      const space = await client.createSpace(`Storcha-${Date.now()}`)
      
      // Sauvegarder l'espace et le définir comme "courant"
      await space.save()
      
      // Associer cet espace au compte
      await account.provision(space.did())
      
      return space.did()
    } else {
      // Il y a des comptes mais pas d'espace, créer un nouvel espace
      const accounts = Object.values(client.accounts())
      const account = accounts[0] as { provision: (did: string) => Promise<void> }
      
      // Créer un nouvel espace pour les uploads
      const space = await client.createSpace(`Storcha-${Date.now()}`)
      
      // Sauvegarder l'espace et le définir comme "courant"
      await space.save()
      
      // Associer cet espace au compte
      await account.provision(space.did())
      
      return space.did()
    }
  } catch (e) {
    console.error("Erreur lors de la configuration de l'espace:", e)
    throw new Error("Impossible de lier l'espace au compte email via l'API.")
  }
}

async function parseFormData(req: NextRequest): Promise<FormidableResult> {
    const contentType = req.headers.get('content-type')
    if (!contentType || !contentType.includes('multipart/form-data')) {
        throw new Error('Invalid Content-Type');
    }

    const chunks: Uint8Array[] = [];
    const reader = req.body?.getReader();
    if (!reader) {
        throw new Error('Request body is not readable');
    }
    let result;
    while (!(result = await reader.read()).done) {
        chunks.push(result.value);
    }
    const buffer = Buffer.concat(chunks);
    
    const bufferStream = new Readable();
    bufferStream.push(buffer);
    bufferStream.push(null);

    (bufferStream as any).headers = {}; 
    req.headers.forEach((value, key) => {
        (bufferStream as any).headers[key] = value;
    });
    (bufferStream as any).headers['content-type'] = contentType;

    const form = formidable({
        maxFileSize: 10 * 1024 * 1024,
        keepExtensions: true,
    });

    return new Promise((resolve, reject) => {
        form.parse(bufferStream as any, (err, fields, files) => {
            if (err) {
                reject(err);
            } else {
                resolve({ fields, files } as unknown as FormidableResult);
            }
        });
    });
}

export async function POST(req: NextRequest) {
  const storachaLoginEmail = process.env.STORACHA_LOGIN_EMAIL
  if (!storachaLoginEmail) {
      return NextResponse.json({ error: 'Server configuration error: Storacha email missing.' }, { status: 500 })
  }

  try {
    const { files } = await parseFormData(req);

    const uploadedFile = files.file?.[0]

    if (!uploadedFile) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 })
    }

    const fileContent = fs.readFileSync(uploadedFile.filepath)

    let client;
    try {
        client = await W3Client.create()
        
        // Assurer qu'un espace est disponible
        await ensureSpace(client, storachaLoginEmail)
        
    } catch (initError: unknown) {
         const message = (initError as Error)?.message || ''
         const isVerificationError = message.includes('Verification email') || message.includes('expired') || message.includes('Account not verified')
         const specificErrorMessage = isVerificationError
            ? `Échec initialisation IPFS. Vérifiez l'email (${storachaLoginEmail}) pour un lien de validation Storacha (ou contactez l'admin).`
            : 'Échec initialisation IPFS client serveur.'
         return NextResponse.json({ error: specificErrorMessage }, { status: 500 })
    }

    try {
        const fileBlob = new Blob([fileContent])
        const fileCid = await client.uploadFile(fileBlob)
        const cidString = fileCid.toString()
        try {
            fs.unlinkSync(uploadedFile.filepath)
          } catch (e) {
            console.warn('Temp file not deleted:', e)
          }
        return NextResponse.json({ cid: cidString }, { status: 200 })

    } catch (err: unknown) {
        try {
            console.error('Error uploading file to IPFS:', err)
            fs.unlinkSync(uploadedFile.filepath)
        } catch (e) {
            console.warn('Temp file not deleted after upload error:', e)
        }
        return NextResponse.json({ error: 'Failed to upload file to IPFS.' }, { status: 500 })
    }

  } catch (err: unknown) {
      if ((err as any).code === 'LIMIT_FILE_SIZE' || (err as any).httpCode === 413) { 
          return NextResponse.json({ error: `File size exceeds the ${10}MB limit.` }, { status: 413 })
      }
      return NextResponse.json({ error: 'Error processing file upload.' }, { status: 500 })
  }
}
