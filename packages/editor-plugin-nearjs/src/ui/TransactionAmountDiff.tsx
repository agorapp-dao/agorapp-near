import { FC } from 'react';
import { TNearAccount } from '../types';
import { Box } from '@mui/material';

export type Props = {
  previous: string;
  current: string;
};

const TransactionAmountDiff: FC<Props> = ({ previous, current }) => {
  const diff = current ? BigInt(current) - BigInt(previous) : 0;
  const color = diff < 0 ? 'red' : 'green';
  const sign = diff > 0 ? '+' : '';

  return (
    <Box display="flex" alignItems="center">
      {new Intl.NumberFormat().format(BigInt(current))}{' '}
      {diff != 0 && (
        <Box sx={{ color: color, marginLeft: 2 }}>
          <>
            ({sign}
            {new Intl.NumberFormat().format(diff)})
          </>
        </Box>
      )}
    </Box>
  );
};

export default TransactionAmountDiff;
