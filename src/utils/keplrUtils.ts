import { Buffer } from 'buffer';
import { ChainGrpcBankApi } from '@injectivelabs/sdk-ts';
import { CosmosTxV1Beta1Tx, TxRaw } from '@injectivelabs/sdk-ts';
import { TransactionException } from '@injectivelabs/exceptions';

const getKeplr = async (chainId: string) => {
  await window.keplr.enable(chainId);
  const offlineSigner = window.keplr.getOfflineSigner(chainId);
  const accounts = await offlineSigner.getAccounts();
  const key = await window.keplr.getKey(chainId);
  return { offlineSigner, accounts, key };
};


const fetchBalances = async (injectiveAddress: string, grpcWebEndpoint: string) => {
  try {
    const chainGrpcBankApi = new ChainGrpcBankApi(grpcWebEndpoint);
    const response = await chainGrpcBankApi.fetchBalances(injectiveAddress);
    const balanceMap: Map<string, string> = new Map();

    response.balances.forEach(({ denom, amount }) => {
      const decimals = denom.startsWith('peggy') || denom === 'inj' ? 18 : 6;
      const humanReadableBalance = (parseFloat(amount) / Math.pow(10, decimals)).toFixed(6);
      balanceMap.set(denom, humanReadableBalance);
    });

    return balanceMap;
  } catch (error) {
    console.error('Error fetching balances:', error);
    return null;
  }
};

const broadcastTx = async (chainId: string, txRaw: TxRaw) => {
  const result = await window.keplr.sendTx(
    chainId,
    CosmosTxV1Beta1Tx.TxRaw.encode(txRaw).finish(),
    'sync'
  );

  if (!result || result.length === 0) {
    throw new TransactionException(
      new Error('Transaction failed to be broadcasted'),
      { contextModule: 'Keplr' }
    );
  }

  return Buffer.from(result).toString('hex');
};

export { getKeplr, fetchBalances, broadcastTx };
