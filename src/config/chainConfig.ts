import { hardhat, sepolia } from 'viem/chains'
import { http } from 'viem'

const chainName = process.env.NEXT_PUBLIC_CHAIN || 'local'

if (chainName === 'sepolia' && !process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL) {
  throw new Error('NEXT_PUBLIC_RPC_URL_SEPOLIA is not defined')
}

const chainConfigs = {
  local: {
    chain: hardhat,
    transport: http(process.env.NEXT_PUBLIC_HARDHAT_RPC_URL || 'http://127.0.0.1:8545')
  },
  sepolia: {
    chain: sepolia,
    transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || '')
  }
}

export const currentChain = chainConfigs[chainName as keyof typeof chainConfigs]
