import Image from 'next/image'
import { useRouter } from 'next/navigation'

function CompanyLogo() {
    const router = useRouter()

    return (
        <div className="hidden sm:flex">
            <Image
            src="/logo2.png"
            alt="Logo"
            width={120}
            height={120}
            onClick={() => router.push('/')}
            className="cursor-pointer"
        />
    </div>
  )
}

export default CompanyLogo