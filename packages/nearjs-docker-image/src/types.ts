export type TRunActionRequest = {
  transactions: TNearTransaction[];
  accounts: TNearAccount[];
};

export type TRunActionResponse = {
  accounts: TNearAccount[];
};

export type TNearAccount = {
  accountId: string;
  balance: string;
};

export type TNearTransaction = {
  contract: string;
  signer: string;
  method: string;
  args: TNearArg[];
  amount?: string;
};

export type TNearArg = {
  name: string;
  type: 'string' | 'bigint';
  value: string;
};
