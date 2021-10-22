import { CRXFINA, FINA, XFINA } from '../../../config/tokens'
import { ChainId, CurrencyAmount, FINA_ADDRESS, Token } from '@finaswap/sdk'
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
  name: i18n._(t`FINA → Cream`),
  steps: [i18n._(t`FINA`), i18n._(t`xFINA`), i18n._(t`Cream`)],
  zapMethod: 'stakeFinaToCream',
  unzapMethod: 'unstakeFinaFromCream',
  description: i18n._(
    t`Stake FINA for xFINA and deposit into Cream in one click. xFINA in Cream (crXFINA) can be lent or used as collateral for borrowing.`
  ),
  inputSymbol: i18n._(t`FINA`),
  outputSymbol: i18n._(t`xFINA in Cream`),
})

export const tokenDefinitions: StrategyTokenDefinitions = {
  inputToken: {
    chainId: ChainId.MAINNET,
    address: FINA_ADDRESS[ChainId.MAINNET],
    decimals: 18,
    symbol: 'FINA',
  },
  outputToken: {
    chainId: ChainId.MAINNET,
    address: '0x8798249c2E607446EfB7Ad49eC89dD1865Ff4272',
    decimals: 18,
    symbol: 'XFINA',
  },
}

const useStakeFinaToCreamStrategy = (): StrategyHook => {
  const { i18n } = useLingui()
  const { account } = useActiveWeb3React()
  const { zapIn, inputValue } = useDerivedInariState()
  const zenkoContract = useZenkoContract()
  const inariContract = useInariContract()
  const balances = useTokenBalances(account, [FINA[ChainId.MAINNET], CRXFINA])
  const cTokenAmountRef = useRef<CurrencyAmount<Token>>(null)
  const approveAmount = useMemo(() => (zapIn ? inputValue : cTokenAmountRef.current), [inputValue, zapIn])

  // Override approveCallback for this strategy as we need to approve CRXFINA on zapOut
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

      const bal = await zenkoContract.toCtoken(CRXFINA.address, val.quotient.toString())
      return CurrencyAmount.fromRawAmount(CRXFINA, bal.toString())
    },
    [zenkoContract]
  )

  // Run before executing transaction creation by transforming from xFINA value to crXFINA value
  // As you will be spending crXFINA when unzapping from this strategy
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
      if (!balances[CRXFINA.address]) return tryParseAmount('0', XFINA)
      const bal = await zenkoContract.fromCtoken(
        CRXFINA.address,
        balances[CRXFINA.address].toFixed().toBigNumber(CRXFINA.decimals).toString()
      )
      setBalances({
        inputTokenBalance: balances[FINA[ChainId.MAINNET].address],
        outputTokenBalance: CurrencyAmount.fromRawAmount(XFINA, bal.toString()),
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
