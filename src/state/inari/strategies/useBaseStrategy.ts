import { ApprovalState, useActiveWeb3React, useApproveCallback, useInariContract } from '../../../hooks'
import { useTransactionAdder } from '../../transactions/hooks'
import { Strategy, StrategyBalances, StrategyGeneralInfo, StrategyTokenDefinitions } from '../types'
import { useDerivedInariState } from '../hooks'
import { useCallback, useMemo, useState } from 'react'
import { CurrencyAmount, Token } from '@finaswap/sdk'
import { e10, tryParseAmount } from '../../../functions'
import useFinaPerXFina from '../../../hooks/useXFinaPerFina'
import { BentoPermit } from '../../../hooks/useBentoMasterApproveCallback'

export interface useBaseStrategyInterface {
  id: string
  general: StrategyGeneralInfo
  tokenDefinitions: StrategyTokenDefinitions
}

export interface BaseStrategyHook extends Strategy {
  execute: (val: CurrencyAmount<Token>, permit?: BentoPermit) => Promise<any>
  approveCallback: [ApprovalState, () => Promise<void>, CurrencyAmount<Token>]
  getStrategy: () => Strategy
  calculateOutputFromInput: (
    zapIn: boolean,
    inputValue: string,
    inputToken: Token,
    outputToken: Token
  ) => Promise<string> | string
  balances: StrategyBalances
  setBalances: ({
    inputTokenBalance,
    outputTokenBalance,
  }: {
    inputTokenBalance?: CurrencyAmount<Token>
    outputTokenBalance?: CurrencyAmount<Token>
  }) => void
  bentoApproveCallback?: null
}

// Every strategy should use a BaseStrategy. Can also use useBaseBentoBoxStrategy or useBaseHasPermitTokenStrategy
// which use BaseStrategy under the hood. Please look in both BaseStrategies to see what they offer and/or why you may need them
const useBaseStrategy = ({ id, general, tokenDefinitions }: useBaseStrategyInterface): BaseStrategyHook => {
  const { account } = useActiveWeb3React()
  const { inputValue, zapIn, tokens } = useDerivedInariState()
  const inariContract = useInariContract()
  const addTransaction = useTransactionAdder()
  const approveCallback = useApproveCallback(inputValue, inariContract?.address)
  const sushiPerXFina = useFinaPerXFina(true)
  const [balances, _setBalances] = useState<StrategyBalances>({
    inputTokenBalance: CurrencyAmount.fromRawAmount(tokens.inputToken, '0'),
    outputTokenBalance: CurrencyAmount.fromRawAmount(tokens.outputToken, '0'),
  })

  // Get basic strategy information
  const getStrategy = useCallback(() => {
    return {
      id,
      general,
      tokenDefinitions,
    }
  }, [general, id, tokenDefinitions])

  // Default execution function, can be overridden in child strategies
  // If you override, it's best to do some formatting beforehand and then still call this function
  // Look at useStakeFinaToCreamStrategy for an example
  const execute = useCallback(
    async (val: CurrencyAmount<Token>) => {
      if (!inariContract) return

      const method = zapIn ? general.zapMethod : general.unzapMethod

      try {
        const tx = await inariContract[method](account, val.quotient.toString())
        addTransaction(tx, {
          summary: `${zapIn ? 'Deposit' : 'Withdraw'} ${general.outputSymbol}`,
        })

        return tx
      } catch (error) {
        console.error(error)
      }
    },
    [account, addTransaction, general.outputSymbol, general.unzapMethod, general.zapMethod, inariContract, zapIn]
  )

  // Default function for calculating the output based on the input
  // This one is converting Fina to xFina and vice-versa.
  // Function can be overridden or enhanced if you need custom input to output calculations
  const calculateOutputFromInput = useCallback(
    (zapIn: boolean, inputValue: string, inputToken: Token, outputToken: Token) => {
      if (!sushiPerXFina || !inputValue) return null

      return (
        zapIn
          ? inputValue.toBigNumber(18).mulDiv(e10(18), sushiPerXFina.toString().toBigNumber(18))
          : inputValue.toBigNumber(18).mulDiv(sushiPerXFina.toString().toBigNumber(18), e10(18))
      )?.toFixed(18)
    },
    [sushiPerXFina]
  )

  // Convenience wrapper function that allows for setting balances
  // Mostly used when balances are loaded async in child strategies
  const setBalances = useCallback(
    ({
      inputTokenBalance,
      outputTokenBalance,
    }: {
      inputTokenBalance?: CurrencyAmount<Token>
      outputTokenBalance?: CurrencyAmount<Token>
    }) => {
      _setBalances((prevState) => ({
        ...prevState,
        inputTokenBalance,
        outputTokenBalance,
      }))
    },
    []
  )

  return useMemo(
    () => ({
      id,
      general,
      tokenDefinitions,
      execute,
      approveCallback: [...approveCallback, inputValue],
      getStrategy,
      calculateOutputFromInput,
      balances: {
        inputTokenBalance: zapIn ? balances.inputTokenBalance : balances.outputTokenBalance,
        outputTokenBalance: zapIn ? balances.outputTokenBalance : balances.inputTokenBalance,
      },
      setBalances,
    }),
    [
      approveCallback,
      balances.inputTokenBalance,
      balances.outputTokenBalance,
      calculateOutputFromInput,
      execute,
      general,
      getStrategy,
      id,
      inputValue,
      setBalances,
      tokenDefinitions,
      zapIn,
    ]
  )
}

export default useBaseStrategy
