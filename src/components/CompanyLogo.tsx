import Image from 'next/image'
import { useRouter } from 'next/navigation'

function CompanyLogo() {
    const router = useRouter()

    return (
        <div className="hidden sm:flex">
            <Image
            src="/logo.png"
            alt="Logo"
            width={100}
            height={100}
            onClick={() => router.push('/')}
            className="cursor-pointer"
        />
    </div>
  )
}

export default CompanyLogo