const navigation = {
    main: [
      { name: 'About', href: '#' },
      { name: 'Blog', href: '#' },
      { name: 'Jobs', href: '#' },
      { name: 'Press', href: '#' },
      { name: 'Accessibility', href: '#' },
      { name: 'Partners', href: '#' },
    ],
}
  
  function Footer() {
    return (
      <footer className="bg-gray-900">
        <div className="mx-auto max-w-7xl overflow-hidden px-6 py-20 sm:py-24 lg:px-8">
          <nav aria-label="Footer" className="-mb-6 flex flex-wrap justify-center gap-x-12 gap-y-3 text-sm/6">
            {navigation.main.map((item) => (
              <a key={item.name} href={item.href} className="text-gray-400 hover:text-white">
                {item.name}
              </a>
            ))}
          </nav>
          <p className="mt-10 text-center text-sm/6 text-gray-400">
          &copy; 2025 NET, Inc. All rights reserved.
          </p>
        </div>
      </footer>
    )
  }

  export default Footer