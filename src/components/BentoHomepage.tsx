import Image from "next/image"

function BentoHomepage() {
    return (
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
          <h2 className="text-base/7 font-semibold text-indigo-600">Solution innovante</h2>
          <div className="mt-2">
            <p className="text-pretty text-4xl font-semibold tracking-tight text-gray-950 sm:text-5xl">
              Certification nucléaire sécurisée par
            </p>
            <div className="relative mt-2 inline-block">
              <span className="relative z-10 text-pretty text-4xl font-bold tracking-tight text-white sm:text-5xl px-4 py-2 bg-gradient-to-r from-indigo-900 to-blue-600 rounded-lg shadow-lg">
                <span className="relative">
                  BLOCKCHAIN
                  <span className="absolute -inset-1 -z-10 opacity-20">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className="absolute text-xs font-mono opacity-80 text-white"
                        style={{
                          top: `${Math.random() * 100}%`,
                          left: `${Math.random() * 100}%`,
                          transform: `rotate(${Math.random() * 360}deg)`
                        }}>
                        10110
                      </span>
                    ))}
                  </span>
                </span>
              </span>
            </div>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-16 lg:grid-cols-6 lg:grid-rows-2">

            {/* Immutabilité */}
            <div className="relative lg:col-span-3">
              <div className="absolute inset-px rounded-lg bg-white max-lg:rounded-t-[2rem] lg:rounded-tl-[2rem]" />
              <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] max-lg:rounded-t-[calc(2rem+1px)] lg:rounded-tl-[calc(2rem+1px)]">
                <div className="h-80 relative overflow-hidden">
                  <Image
                    alt="Immutabilité des données"
                    src="/blockchain.png"
                    fill
                    style={{ 
                      objectFit: "cover",
                      objectPosition: "center"
                    }}
                  />
                </div>
                <div className="p-10 pt-4">
                  <h3 className="text-sm/4 font-semibold text-indigo-600">Immutabilité</h3>
                  <p className="mt-2 text-lg font-medium tracking-tight text-gray-950">Données inaltérables</p>
                  <p className="mt-2 max-w-lg text-sm/6 text-gray-600">
                    Les certifications stockées sur la blockchain sont immuables et ne peuvent être modifiées, garantissant ainsi l'intégrité des documents tout au long de leur cycle de vie.
                  </p>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 max-lg:rounded-t-[2rem] lg:rounded-tl-[2rem]" />
            </div>

            {/* Transparence */}
            <div className="relative lg:col-span-3">
              <div className="absolute inset-px rounded-lg bg-white lg:rounded-tr-[2rem]" />
              <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] lg:rounded-tr-[calc(2rem+1px)]">
                <div className="h-80 relative overflow-hidden">
                  <Image
                    alt="Transparence des processus"
                    src="/traceability.webp"
                    fill
                    style={{ 
                      objectFit: "cover",
                      objectPosition: "center"
                    }}
                  />
                </div>
                <div className="p-10 pt-4">
                  <h3 className="text-sm/4 font-semibold text-indigo-600">Transparence</h3>
                  <p className="mt-2 text-lg font-medium tracking-tight text-gray-950">Traçabilité complète</p>
                  <p className="mt-2 max-w-lg text-sm/6 text-gray-600">
                    Notre solution offre une transparence totale sur l'origine, les validations et les modifications des certificats, tout en respectant les niveaux d'accès de chaque partie prenante.
                  </p>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 lg:rounded-tr-[2rem]" />
            </div>

            {/* Efficacité */}
            <div className="relative lg:col-span-2">
              <div className="absolute inset-px rounded-lg bg-white lg:rounded-bl-[2rem]" />
              <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] lg:rounded-bl-[calc(2rem+1px)]">
                <div className="h-80 relative overflow-hidden">
                  <Image
                    alt="Rapidité d'accès"
                    src="/qrCode.jpg"
                    fill
                    style={{ 
                      objectFit: "cover",
                      objectPosition: "center"
                    }}
                  />
                </div>
                <div className="p-10 pt-4">
                  <h3 className="text-sm/4 font-semibold text-indigo-600">Efficacité</h3>
                  <p className="mt-2 text-lg font-medium tracking-tight text-gray-950">Vérification instantanée</p>
                  <p className="mt-2 max-w-lg text-sm/6 text-gray-600">
                    Accès immédiat et vérification en temps réel de l'authenticité des certifications nucléaires pour tous les acteurs autorisés.
                  </p>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 lg:rounded-bl-[2rem]" />
            </div>

            {/* Confidentialité */}
            <div className="relative lg:col-span-2">
              <div className="absolute inset-px rounded-lg bg-white" />
              <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)]">
                <div className="h-80 relative overflow-hidden">
                  <Image
                    alt="Confidentialité des données"
                    src="/ipfs.jpg"
                    fill
                    style={{ 
                      objectFit: "cover",
                      objectPosition: "center"
                    }}
                  />
                </div>
                <div className="p-10 pt-4">
                  <h3 className="text-sm/4 font-semibold text-indigo-600">Confidentialité</h3>
                  <p className="mt-2 text-lg font-medium tracking-tight text-gray-950">IPFS crypté</p>
                  <p className="mt-2 max-w-lg text-sm/6 text-gray-600">
                    Protection des données sensibles grâce au stockage IPFS avec chiffrement de bout en bout, assurant la confidentialité tout en maintenant l'accessibilité aux utilisateurs autorisés.
                  </p>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5" />
            </div>

            {/* Conformité */}
            <div className="relative lg:col-span-2">
              <div className="absolute inset-px rounded-lg bg-white max-lg:rounded-b-[2rem] lg:rounded-br-[2rem]" />
              <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] max-lg:rounded-b-[calc(2rem+1px)] lg:rounded-br-[calc(2rem+1px)]">
                <div className="h-80 relative overflow-hidden">
                  <Image
                    alt="Conformité réglementaire"
                    src="/iso.jpg"
                    fill
                    style={{ 
                      objectFit: "cover",
                      objectPosition: "center"
                    }}
                  />
                </div>
                <div className="p-10 pt-4">
                  <h3 className="text-sm/4 font-semibold text-indigo-600">Conformité</h3>
                  <p className="mt-2 text-lg font-medium tracking-tight text-gray-950">Normes réglementaires</p>
                  <p className="mt-2 max-w-lg text-sm/6 text-gray-600">
                    Notre solution respecte les exigences réglementaires strictes du secteur nucléaire tout en simplifiant les processus d'audit et de vérification pour les autorités.
                  </p>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 max-lg:rounded-b-[2rem] lg:rounded-br-[2rem]" />
            </div>

          </div>
        </div>
      </div>
    )
  }

export default BentoHomepage
  