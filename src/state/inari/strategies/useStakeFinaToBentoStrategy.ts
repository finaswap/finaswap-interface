import { ChainId, FNA_ADDRESS } from '@finaswap/sdk'
import { FNA, XFNA } from '../../../config/tokens'
import { StrategyGeneralInfo, StrategyHook, StrategyTokenDefinitions } from '../types'
import { useEffect, useMemo } from 'react'

import { I18n } from '@lingui/core'
import { t } from '@lingui/macro'
import { tryParseAmount } from '../../../functions'
import { useActiveWeb3React } from '../../../hooks'
import useBaseStrategy from './useBaseStrategy'
import { useBentoBalance } from '../../bentobox/hooks'
import useBentoBoxTrait from '../traits/useBentoBoxTrait'
import { useLingui } from '@lingui/react'
import { useTokenBalances } from '../../wallet/hooks'

export const GENERAL = (i18n: I18n): StrategyGeneralInfo => ({
  name: i18n._(t`FNA → Bento`),
  steps: [i18n._(t`FNA`), i18n._(t`xFNA`), i18n._(t`BentoBox`)],
  zapMethod: 'stakeFinaToBento',
  unzapMethod: 'unstakeFinaFromBento',
  description: i18n._(t`Stake FNA for xFNA and deposit into BentoBox in one click. xFNA in BentoBox is automatically
                invested into a passive yield strategy, and can be lent or used as collateral for borrowing in Kashi.`),
  inputSymbol: i18n._(t`FNA`),
  outputSymbol: i18n._(t`xFNA in BentoBox`),
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

const useStakeFinaToBentoStrategy = (): StrategyHook => {
  const { i18n } = useLingui()
  const { account } = useActiveWeb3React()
  const balances = useTokenBalances(account, [FNA[ChainId.MAINNET], XFNA])
  const xFinaBentoBalance = useBentoBalance(XFNA.address)

  // Strategy ends in BentoBox so use BaseBentoBox strategy
  const general = useMemo(() => GENERAL(i18n), [i18n])
  const baseStrategy = useBaseStrategy({
    id: 'stakeFinaToBentoStrategy',
    general,
    tokenDefinitions,
  })

  // Add in BentoBox trait as output is in BentoBox
  const { setBalances, ...strategy } = useBentoBoxTrait(baseStrategy)

  useEffect(() => {
    if (!balances) return

    setBalances({
      inputTokenBalance: balances[FNA[ChainId.MAINNET].address],
      outputTokenBalance: tryParseAmount(xFinaBentoBalance?.value?.toFixed(18) || '0', XFNA),
    })
  }, [balances, setBalances, xFinaBentoBalance?.value])

  return useMemo(
    () => ({
      setBalances,
      ...strategy,
    }),
    [strategy, setBalances]
  )
}

export default useStakeFinaToBentoStrategy
