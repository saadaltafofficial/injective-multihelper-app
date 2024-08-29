// utils/tokenUtils.ts
import mainnetTokens from '../../mainnet.json';
import testnetTokens from '../../testnet.json';

export const getSymbolFromDenom = (denom: string, isTestnet: boolean): string | null => {
  const tokens = isTestnet ? testnetTokens : mainnetTokens;
  const token = tokens.find((token) => token.denom === denom);
  return token ? token.symbol : null;
};
