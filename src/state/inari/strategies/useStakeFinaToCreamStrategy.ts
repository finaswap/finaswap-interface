import { CRXFNA, FNA, XFNA } from '../../../config/tokens'
import { ChainId, CurrencyAmount, FNA_ADDRESS, Token } from '@finaswap/sdk'
import { StrategyGeneralInfo, StrategyHook, StrategyTokenDefinitions } from '../types'
import { useActiveWeb3React, useApproveCallback, useInariContract, useZenkoContract } from '../../../hooks'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import { I18n } from '@lingui/core'
import { t } from '@lingui/macro'
import { tryParseAmount } from '../../../functions'
import useBaseStrategy from './useBaseStrategy'
import { useDerivedInariState } from '../hooks'
import { useLingui } from '@lingui/react'
import { useTokenBalances } from '../../wallet/hooks'

export const GENERAL = (i18n: I18n): StrategyGeneralInfo => ({
  name: i18n._(t`FNA → Cream`),
  steps: [i18n._(t`FNA`), i18n._(t`xFNA`), i18n._(t`Cream`)],
  zapMethod: 'stakeFinaToCream',
  unzapMethod: 'unstakeFinaFromCream',
  description: i18n._(
    t`Stake FNA for xFNA and deposit into Cream in one click. xFNA in Cream (crXFNA) can be lent or used as collateral for borrowing.`
  ),
  inputSymbol: i18n._(t`FNA`),
  outputSymbol: i18n._(t`xFNA in Cream`),
})

export const tokenDefinitions: StrategyTokenDefinitions = {
  inputToken: {
    chainId: ChainId.MAINNET,
    address: FNA_ADDRESS[ChainId.MAINNET],
    decimals: 18,
    symbol: 'FNA',
  },
  outputToken: {
    chainId: ChainId.MAINNET,
    address: '0x8798249c2E607446EfB7Ad49eC89dD1865Ff4272',
    decimals: 18,
    symbol: 'XFNA',
  },
}

const useStakeFinaToCreamStrategy = (): StrategyHook => {
  const { i18n } = useLingui()
  const { account } = useActiveWeb3React()
  const { zapIn, inputValue } = useDerivedInariState()
  const zenkoContract = useZenkoContract()
  const inariContract = useInariContract()
  const balances = useTokenBalances(account, [FNA[ChainId.MAINNET], CRXFNA])
  const cTokenAmountRef = useRef<CurrencyAmount<Token>>(null)
  const approveAmount = useMemo(() => (zapIn ? inputValue : cTokenAmountRef.current), [inputValue, zapIn])

  // Override approveCallback for this strategy as we need to approve CRXFNA on zapOut
  const approveCallback = useApproveCallback(approveAmount, inariContract?.address)
  const general = useMemo(() => GENERAL(i18n), [i18n])
  const { execute, setBalances, ...baseStrategy } = useBaseStrategy({
    id: 'stakeFinaToCreamStrategy',
    general,
    tokenDefinitions,
  })

  const toCTokenAmount = useCallback(
    async (val: CurrencyAmount<Token>) => {
      if (!zenkoContract || !val) return null

      const bal = await zenkoContract.toCtoken(CRXFNA.address, val.quotient.toString())
      return CurrencyAmount.fromRawAmount(CRXFNA, bal.toString())
    },
    [zenkoContract]
  )

  // Run before executing transaction creation by transforming from xFNA value to crXFNA value
  // As you will be spending crXFNA when unzapping from this strategy
  const preExecute = useCallback(
    async (val: CurrencyAmount<Token>) => {
      if (zapIn) return execute(val)
      return execute(await toCTokenAmount(val))
    },
    [execute, toCTokenAmount, zapIn]
  )

  useEffect(() => {
    toCTokenAmount(inputValue).then((val) => (cTokenAmountRef.current = val))
  }, [inputValue, toCTokenAmount])

  useEffect(() => {
    if (!zenkoContract || !balances) return

    const main = async () => {
      if (!balances[CRXFNA.address]) return tryParseAmount('0', XFNA)
      const bal = await zenkoContract.fromCtoken(
        CRXFNA.address,
        balances[CRXFNA.address].toFixed().toBigNumber(CRXFNA.decimals).toString()
      )
      setBalances({
        inputTokenBalance: balances[FNA[ChainId.MAINNET].address],
        outputTokenBalance: CurrencyAmount.fromRawAmount(XFNA, bal.toString()),
      })
    }

    main()
  }, [balances, setBalances, zenkoContract])

  return useMemo(
    () => ({
      ...baseStrategy,
      approveCallback: [...approveCallback, approveAmount],
      setBalances,
      execute: preExecute,
    }),
    [approveAmount, approveCallback, baseStrategy, preExecute, setBalances]
  )
}

export default useStakeFinaToCreamStrategy
