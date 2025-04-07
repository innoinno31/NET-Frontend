import { NextRequest, NextResponse } from 'next/server'
import { formidable, File } from 'formidable'
import fs from 'fs'
import { create, Client } from '@web3-storage/w3up-client'
import { Blob } from 'buffer'
import { Readable } from 'stream'

const ensureSpace = async (client: Client, email: string): Promise<`did:key:${string}`> => {
  let currentSpace = client.currentSpace()
  if (currentSpace) return currentSpace.did()

  const spaces = await client.spaces()
  if (spaces.length > 0) {
    await client.setCurrentSpace(spaces[0].did())
    return spaces[0].did()
  } else {

    const accounts = client.accounts()
    let account = Object.values(accounts).find((acc) => {
        const typedAcc = acc as { email?: string }
        return typedAcc.email === email
      })
      

    
    if (!account) {
         try {
             account = await client.login(email as `${string}@${string}`)
         } catch (e) {
             throw new Error("Impossible de lier l'espace au compte email via l'API.")
         }
    }
    const newSpace = await client.createSpace(`MyAPIDocs-${Date.now()}`, { account })
    await client.setCurrentSpace(newSpace.did())
    return newSpace.did()
  }
}

async function parseFormData(req: NextRequest): Promise<{ fields: any; files: any }> {
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
                resolve({ fields, files });
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
    const { fields, files } = await parseFormData(req);

    const uploadedFile = files.file?.[0] as File | undefined

    if (!uploadedFile) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 })
    }

    const fileContent = fs.readFileSync(uploadedFile.filepath)

    let client: Client
    try {
        client = await create()
        if (!client.identity) {
            await client.login(storachaLoginEmail as `${string}@${string}`)
            await ensureSpace(client, storachaLoginEmail)
        } else {
            if (!client.currentSpace()) {
                 await ensureSpace(client, storachaLoginEmail)
            }
        }
    } catch (initError: any) {
         const message = initError.message || ''
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
        fs.unlinkSync(uploadedFile.filepath)
        return NextResponse.json({ cid: cidString }, { status: 200 })

    } catch (uploadError) {
        fs.unlinkSync(uploadedFile.filepath)
        return NextResponse.json({ error: 'Failed to upload file to IPFS.' }, { status: 500 })
    }

  } catch (err: any) {
      if (err.code === 'LIMIT_FILE_SIZE' || err.httpCode === 413) { 
          return NextResponse.json({ error: `File size exceeds the ${10}MB limit.` }, { status: 413 })
      }
      return NextResponse.json({ error: 'Error processing file upload.' }, { status: 500 })
  }
}
