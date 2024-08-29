// src/utils/wallet.ts
import { getInjectiveAddress } from '@injectivelabs/sdk-ts'
import { ChainId } from '@injectivelabs/ts-types'

export const connectWallet = async () => {
  try {
    // Try connecting to Keplr
    const keplr = window.keplr
    const chainId = ChainId.Mainnet

    if (keplr) {
      await keplr.enable(chainId)
      const injectiveAddresses = await keplr.getOfflineSigner(chainId).getAccounts()
      
      if (injectiveAddresses.length > 0) {
        console.log('Connected with Keplr:', injectiveAddresses)
        return injectiveAddresses
      }
    }

    // If Keplr is not installed or connection is canceled, connect to Metamask
    const ethereum = window.ethereum

    if (ethereum) {
      const addresses = await ethereum.request({ method: 'eth_requestAccounts' }) // EVM addresses
      const injectiveAddresses = addresses.map(getInjectiveAddress) // Convert EVM addresses to Injective addresses

      if (injectiveAddresses.length > 0) {
        console.log('Connected with Metamask:', injectiveAddresses)
        return injectiveAddresses
      }
    }

    throw new Error('No wallet connected')
  } catch (error) {
    console.error('Failed to connect to wallet:', error)
    throw error
  }
}

export const addInjectiveToMetamask = async () => {
  const ethereum = window.ethereum

  if (ethereum) {
    try {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x66EED', // Injective Mainnet Chain ID (hex)
          chainName: 'Injective',
          nativeCurrency: {
            name: 'Injective',
            symbol: 'INJ',
            decimals: 18
          },
          rpcUrls: ['https://public-rpc.injective.network'],
          blockExplorerUrls: ['https://explorer.injective.network/']
        }]
      })
      console.log('Injective chain added to Metamask')
    } catch (addError) {
      console.error('Failed to add Injective chain to Metamask:', addError)
    }
  }
}
