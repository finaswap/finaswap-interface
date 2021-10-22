import { ApprovalState, useActiveWeb3React } from '../../hooks'
import { Field, MeowshiState } from '../../pages/tools/meowshi'
import React, { FC, useMemo, useState } from 'react'
import { FINA, XFINA } from '../../config/tokens'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../modals/TransactionConfirmationModal'

import Button from '../../components/Button'
import { ChainId } from '@finaswap/sdk'
import Dots from '../../components/Dots'
import { parseUnits } from '@ethersproject/units'
import { t } from '@lingui/macro'
import { tryParseAmount } from '../../functions'
import { useLingui } from '@lingui/react'
import useMeowshi from '../../hooks/useMeowshi'
import { useTokenBalance } from '../../state/wallet/hooks'

interface MeowshiButtonProps {
  meowshiState: MeowshiState
}

const MeowshiButton: FC<MeowshiButtonProps> = ({ meowshiState }) => {
  const { currencies, meow: doMeow, fields } = meowshiState
  const { i18n } = useLingui()
  const [modalState, setModalState] = useState({
    attemptingTxn: false,
    txHash: '',
    open: false,
  })
  const { account, chainId } = useActiveWeb3React()
  const sushiBalance = useTokenBalance(account, FINA[ChainId.MAINNET])
  const xFinaBalance = useTokenBalance(account, XFINA)
  const { approvalState, approve, meow, unmeow, meowFina, unmeowFina } = useMeowshi(
    currencies[Field.INPUT] === FINA[ChainId.MAINNET]
  )
  const balance = useTokenBalance(account, currencies[Field.INPUT])
  const parsedInputAmount = tryParseAmount(fields[Field.INPUT], currencies[Field.INPUT])
  const parsedOutputAmount = tryParseAmount(fields[Field.OUTPUT], currencies[Field.OUTPUT])

  const closeModal = () => {
    setModalState((prevState) => ({
      ...prevState,
      open: false,
    }))
  }

  const handleSubmit = async () => {
    setModalState({
      attemptingTxn: true,
      open: true,
      txHash: '',
    })

    let tx
    if (doMeow) {
      if (currencies[Field.INPUT]?.symbol === 'FINA') {
        tx = await meowFina({
          value: parseUnits(fields[Field.INPUT], sushiBalance.currency.decimals),
          decimals: sushiBalance.currency.decimals,
        })
      }
      if (currencies[Field.INPUT]?.symbol === 'xFINA') {
        tx = await meow({
          value: parseUnits(fields[Field.INPUT], sushiBalance.currency.decimals),
          decimals: xFinaBalance.currency.decimals,
        })
      }
    } else {
      if (currencies[Field.OUTPUT]?.symbol === 'FINA') {
        tx = await unmeowFina({
          value: parseUnits(fields[Field.INPUT], sushiBalance.currency.decimals),
          decimals: xFinaBalance.currency.decimals,
        })
      }
      if (currencies[Field.OUTPUT]?.symbol === 'xFINA') {
        tx = await unmeow({
          value: parseUnits(fields[Field.INPUT], sushiBalance.currency.decimals),
          decimals: xFinaBalance.currency.decimals,
        })
      }
    }

    if (tx?.hash) {
      setModalState((prevState) => ({
        ...prevState,
        attemptingTxn: false,
        txHash: tx.hash,
      }))
    } else {
      closeModal()
    }
  }

  const buttonDisabledText = useMemo(() => {
    if (!balance) return i18n._(t`Loading Balance`)
    if (parsedInputAmount?.greaterThan(balance)) return i18n._(t`Insufficient Balance`)
    if (!parsedInputAmount?.greaterThan(0)) return i18n._(t`Please enter an amount`)
    return null
  }, [balance, i18n, parsedInputAmount])

  if (!account)
    return (
      <Button onClick={approve} color="gradient" disabled={true}>
        {i18n._(t`Connect to wallet`)}
      </Button>
    )

  if (chainId !== ChainId.MAINNET)
    return (
      <Button onClick={approve} color="gradient" disabled={true}>
        {i18n._(t`Network not supported yet`)}
      </Button>
    )

  if (approvalState === ApprovalState.PENDING)
    return (
      <Button color="gradient" disabled={true}>
        <Dots>{i18n._(t`Approving`)}</Dots>
      </Button>
    )

  if (approvalState === ApprovalState.NOT_APPROVED)
    return (
      <Button onClick={approve} color="gradient" disabled={!!buttonDisabledText}>
        {buttonDisabledText || i18n._(t`Approve`)}
      </Button>
    )

  if (approvalState === ApprovalState.APPROVED)
    return (
      <>
        <TransactionConfirmationModal
          isOpen={modalState.open}
          onDismiss={closeModal}
          attemptingTxn={modalState.attemptingTxn}
          hash={modalState.txHash}
          content={() => (
            <ConfirmationModalContent
              title={i18n._(t`Confirm convert`)}
              onDismiss={closeModal}
              topContent={() => <span />}
              bottomContent={() => <span />}
            />
          )}
          pendingText={i18n._(
            t`Converting ${parsedInputAmount?.toSignificant(6, { groupSeparator: ',' })} ${
              meowshiState.currencies[Field.INPUT]?.symbol
            } for ${parsedOutputAmount?.toSignificant(6, { groupSeparator: ',' })} ${
              meowshiState.currencies[Field.OUTPUT]?.symbol
            }`
          )}
        />
        <Button onClick={handleSubmit} disabled={!!buttonDisabledText} color="gradient">
          {buttonDisabledText || i18n._(t`Convert`)}
        </Button>
      </>
    )
}

export default MeowshiButton
