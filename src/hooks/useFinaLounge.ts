import { Currency, CurrencyAmount, Token } from '@finaswap/sdk'

import { useCallback } from 'react'
import { useFinaLoungeContract } from './useContract'
import { useTransactionAdder } from '../state/transactions/hooks'

const useFinaLounge = () => {
  const addTransaction = useTransactionAdder()
  const barContract = useFinaLoungeContract()

  const enter = useCallback(
    async (amount: CurrencyAmount<Token> | undefined) => {
      if (amount?.quotient) {
        try {
          const tx = await barContract?.enter(amount?.quotient.toString())
          return addTransaction(tx, { summary: 'Enter FinaLounge' })
        } catch (e) {
          return e
        }
      }
    },
    [addTransaction, barContract]
  )

  const leave = useCallback(
    async (amount: CurrencyAmount<Token> | undefined) => {
      if (amount?.quotient) {
        try {
          const tx = await barContract?.leave(amount?.quotient.toString())
          return addTransaction(tx, { summary: 'Leave FinaLounge' })
        } catch (e) {
          return e
        }
      }
    },
    [addTransaction, barContract]
  )

  return { enter, leave }
}

export default useFinaLounge
