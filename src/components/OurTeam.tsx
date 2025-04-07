function OurTeam() {

    const people = [
        {
        name: 'Franck RIEU-PATEY',
        role: 'Co-Fondateur / Développeur',
        imageUrl:
            'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        },
        {
        name: 'Alexis René',
        role: 'Co-Fondateur / Consultant Blockchain',
        imageUrl:
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        },
        {
        name: 'Gaspar Ravet',
        role: 'Co-Fondateur / Consultant Blockchain',
        imageUrl:
            'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        },
        {
        name: 'Pascal Marquez',
        role: 'Co-Fondateur / Consultant Blockchain',
        imageUrl:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        },
    ]


    return (
      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto grid max-w-7xl gap-20 px-6 lg:px-8 xl:grid-cols-3">

          {/* Notre équipe */}
          <div className="max-w-xl">
            <h2 className="text-pretty text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
              Notre équipe
            </h2>
            <p className="mt-6 text-lg/8 text-gray-600">
              Nous sommes un groupe d'apprenants en formation chez Alyra, l'école de la blockchain, réunis autour d'un projet de fin d'étude ambitieux.
            </p>
            <p className="mt-4 text-lg/8 text-gray-600">
              Ce projet de certification nucléaire via blockchain est pour nous l'occasion de mettre en pratique nos compétences tout en explorant les enjeux de sécurité, de transparence et de traçabilité propres aux technologies décentralisées.
            </p>
            <p className="mt-4 text-lg/8 text-gray-600">
              Il ne s'agit pas d'un produit commercial, mais d'une démonstration technique conçue avec rigueur, dans un cadre pédagogique.
            </p>
          </div>

          {/* Team members */}          
          <ul
  role="list"
  className="mx-auto mt-20 grid max-w-4xl grid-cols-1 gap-x-12 gap-y-20 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3 xl:col-span-2"
>
  {people.map((person) => (
    <li key={person.name} className="flex flex-col items-center text-center">
      <img
        alt={person.name}
        src={person.imageUrl}
        className="w-48 h-48 rounded-2xl object-cover shadow-lg"
      />
      <h3 className="mt-4 text-xl font-semibold text-gray-900">
        {person.name}
      </h3>
      <p className="text-sm text-gray-600">{person.role}</p>
    </li>
  ))}
</ul>


        </div>
      </div>
    )
}

export default OurTeam