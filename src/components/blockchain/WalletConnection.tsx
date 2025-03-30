import { ConnectButton } from '@rainbow-me/rainbowkit';

function WalletConnection() {
  return (
    <div className="flex text-sm lg:text-base">
        <ConnectButton
          label="Se connecter"
          accountStatus="address"
          chainStatus="icon"
        />
    </div>
  )
}

export default WalletConnection