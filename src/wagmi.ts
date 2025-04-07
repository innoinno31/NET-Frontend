import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  sepolia,
  hardhat,
  mainnet,
} from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Nuclear Certification Demo',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? 'YOUR_PROJECT_ID',
  chains: [
    hardhat,
    mainnet,
    ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true' ? [sepolia] : []),
  ],
  ssr: true,
});
