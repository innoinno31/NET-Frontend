import { ConnectButton } from '@rainbow-me/rainbowkit';

function WalletConnection() {
  return (
    <div className="flex text-sm lg:text-base">
      {/* Version petits écrans */}
      <div className="lg:hidden">
        <ConnectButton
          label="Connexion"
          accountStatus="address"
          chainStatus="none"
          showBalance={false}
        />
      </div>

      {/* Version grands écrans */}
      <div className="hidden lg:block">
        <ConnectButton
          label="Se connecter"
          accountStatus="address"
          chainStatus="icon"
          showBalance={true}
        />
      </div>
    </div>
  )
}

export default WalletConnection