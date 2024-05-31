import { styled } from '@mui/material/styles';
import { alpha } from '@mui/system';

export const Wrapper = styled('div')`
  overflow: auto;
  height: 100%;

  .error {
    color: ${props => props.theme.palette.error.main};
  }
`;

export const Box = styled('div')`
  border-radius: 5px;
  padding: 1rem;
`;

export const TokenIcon = styled('span')`
  color: ${p => alpha(p.theme.palette.text.secondary, 0.3)};
  margin-right: 0.5rem;
  margin-left: 2rem;
`;

export const Title = styled('h4')`
  color: ${p => p.theme.custom.textPrimary};
  font-size: 20px;
  margin: 0;
  margin-bottom: 1rem;
  line-height: 1.4rem;
`;

export const TransactionTitle = styled('h5')`
  margin: 0;
  margin-left: 2.2rem;
  margin-bottom: 0.5rem;
`;
