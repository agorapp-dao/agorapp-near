import * as S from './TransactionsPanel.styled';
import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { TNearAccount, TNearTransaction, TRunActionRequest } from '../types';
import { AgButton } from '@agorapp-dao/react-common';
import { Box, CircularProgress, Grid, Menu, MenuItem } from '@mui/material';
import * as uuid from 'uuid';
import SlowMotionVideoIcon from '@mui/icons-material/SlowMotionVideo';
import { TActionRequest } from '@agorapp-dao/editor-common/src/types/TActionRequest';
import { useEditorStore } from '@agorapp-dao/editor-common/src/Editor/EditorStore';
import { useEditorPlugin } from '@agorapp-dao/editor-common/src/Editor/Monaco/useEditorPlugin';
import NearJsEditorPlugin from '../plugin';
import Avatar from 'react-avatar';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { List } from '@mui/material';
import TransactionItem from './TransactionItem';
import TransactionAmountDiff from './TransactionAmountDiff';
import { courseService } from '@agorapp-dao/editor-common';
import { TLesson } from '@agorapp-dao/content-common';

type TNearPluginConfig = {
  initialBalances: TNearAccount[];
  availableTransactions: TNearTransaction[];
  defaultTransactions: TNearTransaction[];
  signers: string[];
};

export function reorder<T>(list: T[], startIndex: number, endIndex: number) {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
}

export function TransactionsPanel() {
  const editorStore = useEditorStore();
  const plugin = useEditorPlugin() as NearJsEditorPlugin;
  const { data: course } = courseService.useCourse();
  const lesson = courseService.findLessonBySlug(
    course,
    editorStore.activeLessonSlug,
  ) as TLesson<TNearPluginConfig>;

  const [running, setRunning] = useState<boolean>(false);
  const [newBalances, setNewBalances] = useState<TNearAccount[]>([]);
  const [transactions, setTransactions] = useState<TNearTransaction[]>([]);
  const [transactionsMenuAnchorEl, setTransactionsMenuAnchorEl] = useState<null | HTMLElement>(
    null,
  );
  const [error, setError] = useState('');
  const open = Boolean(transactionsMenuAnchorEl);

  const resultsRef = useRef<HTMLDivElement>(null);

  const pluginConfig = lesson.pluginConfig as TNearPluginConfig;
  const initialBalances = pluginConfig?.initialBalances || [];
  const availableTransactions = pluginConfig?.availableTransactions || [];
  const defaultTransactions = pluginConfig?.defaultTransactions || [];
  const signers = pluginConfig?.signers || [];

  function openTransactionsMenu(event: React.MouseEvent<HTMLButtonElement>) {
    setTransactionsMenuAnchorEl(event.currentTarget);
  }

  function closeTransactionsMenu() {
    setTransactionsMenuAnchorEl(null);
  }

  function addTransaction(transaction: TNearTransaction) {
    transaction.id = uuid.v4();
    setTransactions([...transactions, transaction]);
    closeTransactionsMenu();
  }

  function handleTransactionSignerChange(transactionId: string | undefined, signer: string) {
    const transaction = transactions.find(t => t.id === transactionId);
    if (transaction) {
      transaction.signer = signer;
      setTransactions([...transactions]);
    }
  }

  function handleTransactionArgChange(
    transactionId: string | undefined,
    argName: string,
    argValue: string,
  ) {
    const transaction = transactions.find(t => t.id === transactionId);
    const arg = transaction?.args.find(arg => arg.name === argName);
    if (arg) {
      arg.value = argValue;
      setTransactions([...transactions]);
    }
  }

  function handleTransactionAmountChange(transactionId: string | undefined, amount: string) {
    const transaction = transactions.find(t => t.id === transactionId);
    if (transaction) {
      transaction.amount = amount;
      setTransactions([...transactions]);
    }
  }

  function handleDelete(transactionId: string | undefined) {
    setTransactions(transactions.filter(t => t.id !== transactionId));
  }

  function onDragEnd({ destination, source }: DropResult) {
    if (!destination) return;
    const newItems = reorder(transactions, source.index, destination.index);
    setTransactions(newItems);
  }

  async function runTransactions(event: FormEvent) {
    event.preventDefault();
    setRunning(true);

    const req: TActionRequest<TRunActionRequest> = {
      runner: 'docker-runner',
      image: 'rbiosas/nearjs-docker-image',
      action: 'run',
      courseSlug: editorStore.courseSlug,
      lessonSlug: editorStore.activeLessonSlug,
      files: editorStore.files,
      args: {
        transactions,
        accounts: initialBalances,
      },
    };

    setError('');
    const res = await plugin.runAction(req);
    setRunning(false);

    if (res.error) {
      setError(res.error);
    } else {
      setNewBalances(res.body?.accounts ?? []);
    }

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }

  useEffect(() => {
    for (const transaction of defaultTransactions) {
      transaction.id = uuid.v4();
    }
    setTransactions(defaultTransactions);
  }, [defaultTransactions]);

  if (initialBalances.length === 0) {
    return (
      <Grid container>
        <Grid item sx={{ color: theme => theme.palette.secondary.light }}>
          Transactions not available for this lesson.
        </Grid>
      </Grid>
    );
  }

  return (
    <S.Wrapper>
      <S.Box>
        <S.Title>1. Initial account balances</S.Title>
        <table>
          <tbody>
            {initialBalances.map(account => (
              <tr key={account.accountId}>
                <td>
                  <Box display="flex" alignItems="center">
                    <Avatar name={account.accountId} textSizeRatio={1.5} size="20" round={true} />{' '}
                    <Box sx={{ marginLeft: 1 }}>{account.accountId}</Box>
                  </Box>
                </td>
                <td>
                  <Box display="flex" alignItems="center">
                    <S.TokenIcon>Ⓝ</S.TokenIcon>
                    {new Intl.NumberFormat().format(BigInt(account.balance))}
                  </Box>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </S.Box>

      <form onSubmit={runTransactions}>
        <S.Box sx={{ marginTop: '10px' }}>
          <S.Title>2. Transactions</S.Title>

          {transactions.length > 0 && (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="droppable-list">
                {provided => (
                  <List ref={provided.innerRef} {...provided.droppableProps}>
                    {transactions.map((item: TNearTransaction, index: number) => (
                      <TransactionItem
                        transaction={item}
                        signers={signers}
                        index={index}
                        key={item.id}
                        handleTransactionSignerChange={handleTransactionSignerChange}
                        handleTransactionArgChange={handleTransactionArgChange}
                        handleTransactionAmountChange={handleTransactionAmountChange}
                        handleDelete={handleDelete}
                      />
                    ))}
                    {provided.placeholder}
                  </List>
                )}
              </Droppable>
            </DragDropContext>
          )}

          <AgButton color="secondary" onClick={openTransactionsMenu}>
            Add transaction
          </AgButton>
          <Menu anchorEl={transactionsMenuAnchorEl} open={open} onClose={closeTransactionsMenu}>
            {availableTransactions.map(transaction => (
              <MenuItem key={transaction.method} onClick={() => addTransaction(transaction)}>
                {transaction.method}
              </MenuItem>
            ))}
          </Menu>
        </S.Box>

        <S.Box sx={{ marginTop: '10px' }}>
          <S.Title>3. Run</S.Title>

          <AgButton
            type="submit"
            startIcon={
              running ? (
                <CircularProgress sx={{ color: '#fff' }} size={14} />
              ) : (
                <SlowMotionVideoIcon />
              )
            }
          >
            Run transactions
          </AgButton>

          <div ref={resultsRef}>
            {error && (
              <Box sx={{ marginTop: '10px' }}>
                <div className="error">{error}</div>
              </Box>
            )}

            {newBalances.length > 0 && (
              <Box sx={{ marginTop: '10px' }}>
                <strong>New account balances</strong>
                <table>
                  <tbody>
                    {newBalances.map(account => (
                      <tr key={account.accountId}>
                        <td>
                          <Box display="flex" alignItems="center">
                            <Avatar
                              name={account.accountId}
                              textSizeRatio={1.5}
                              size="20"
                              round={true}
                            />{' '}
                            <Box sx={{ marginLeft: 1 }}>{account.accountId}</Box>
                          </Box>
                        </td>
                        <td>
                          <Box display="flex" alignItems="center">
                            <S.TokenIcon>Ⓝ</S.TokenIcon>
                            <TransactionAmountDiff
                              previous={
                                initialBalances.find(b => b.accountId === account.accountId)
                                  ?.balance ?? '0'
                              }
                              current={account.balance}
                            />
                          </Box>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            )}
          </div>
        </S.Box>
      </form>
    </S.Wrapper>
  );
}
