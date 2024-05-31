import React, { FC } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import {
  ListItem,
  ListItemText,
  Grid,
  Select,
  MenuItem,
  TextField,
  Card,
  Box,
  IconButton,
} from '@mui/material';
import { TNearTransaction } from '../types';
import Avatar from 'react-avatar';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import * as S from './TransactionsPanel.styled';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';

export type Props = {
  transaction: TNearTransaction;
  signers: string[];
  index: number;
  handleTransactionSignerChange: (id: string | undefined, signer: string) => void;
  handleTransactionArgChange: (id: string | undefined, name: string, value: string) => void;
  handleTransactionAmountChange: (id: string | undefined, amount: string) => void;
  handleDelete: (id: string | undefined) => void;
};

const DraggableListItem: FC<Props> = ({
  transaction,
  signers,
  index,
  handleTransactionSignerChange,
  handleTransactionArgChange,
  handleTransactionAmountChange,
  handleDelete,
}) => {
  return (
    <Draggable draggableId={transaction.id as string} index={index}>
      {provided => (
        <ListItem
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          sx={{ padding: 0 }}
        >
          <ListItemText
            primary={
              <>
                <Card
                  key={transaction.id}
                  variant="outlined"
                  style={{ padding: '20px', background: 'transparent' }}
                >
                  <Grid container alignItems={'center'}>
                    <Grid item xs>
                      <S.TransactionTitle>
                        {transaction.contract} / {transaction.method}
                      </S.TransactionTitle>
                    </Grid>
                  </Grid>
                  <Grid container alignItems={'center'}>
                    <Grid item xs direction="row" display="flex" alignItems="center" gap={1}>
                      <DragIndicatorIcon />
                      <Select
                        value={transaction.signer}
                        label="Signer"
                        onChange={e =>
                          handleTransactionSignerChange(transaction.id, e.target.value)
                        }
                      >
                        {signers.map(signer => (
                          <MenuItem key={signer} value={signer}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar name={signer} textSizeRatio={1.5} size="20" round={true} />
                              <Box sx={{ paddingLeft: 2 }}>{signer}</Box>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                      {transaction.args.map(arg => (
                        <TextField
                          key={arg.name}
                          label={arg.name}
                          name={arg.name}
                          variant="outlined"
                          value={arg.value || ''}
                          onChange={e =>
                            handleTransactionArgChange(
                              transaction.id,
                              e.target.name,
                              e.target.value,
                            )
                          }
                        />
                      ))}
                    </Grid>
                    <Grid item direction="row" display="flex" alignItems="center" gap={1}>
                      {transaction.payable && (
                        <TextField
                          label="$NEAR"
                          name="near$"
                          variant="outlined"
                          value={transaction.amount || ''}
                          onChange={e =>
                            handleTransactionAmountChange(transaction.id, e.target.value)
                          }
                        />
                      )}
                      <IconButton aria-label="delete" onClick={() => handleDelete(transaction.id)}>
                        <DeleteOutlineRoundedIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Card>
              </>
            }
          />
        </ListItem>
      )}
    </Draggable>
  );
};

export default DraggableListItem;
