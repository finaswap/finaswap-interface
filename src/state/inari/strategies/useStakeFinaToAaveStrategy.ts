import { AXFNA, FNA } from '../../../config/tokens'
import { ChainId, FNA_ADDRESS } from '@finaswap/sdk'
import { StrategyGeneralInfo, StrategyHook, StrategyTokenDefinitions } from '../types'
import { useEffect, useMemo } from 'react'

import { I18n } from '@lingui/core'
import { t } from '@lingui/macro'
import { useActiveWeb3React } from '../../../hooks'
import useBaseStrategy from './useBaseStrategy'
import { useLingui } from '@lingui/react'
import { useTokenBalances } from '../../wallet/hooks'

export const GENERAL = (i18n: I18n): StrategyGeneralInfo => ({
  name: i18n._(t`FNA → Aave`),
  steps: [i18n._(t`FNA`), i18n._(t`xFNA`), i18n._(t`Aave`)],
  zapMethod: 'stakeFinaToAave',
  unzapMethod: 'unstakeFinaFromAave',
  description: i18n._(
    t`Stake FNA for xFNA and deposit into Aave in one click. xFNA in Aave (aXFNA) can be lent or used as collateral for borrowing.`
  ),
  inputSymbol: i18n._(t`FNA`),
  outputSymbol: i18n._(t`xFNA in Aave`),
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
    address: '0xf256cc7847e919fac9b808cc216cac87ccf2f47a',
    decimals: 18,
    symbol: 'aXFNA',
  },
}

const useStakeFinaToAaveStrategy = (): StrategyHook => {
  const { i18n } = useLingui()
  const { account } = useActiveWeb3React()
  const balances = useTokenBalances(account, [FNA[ChainId.MAINNET], AXFNA])
  const general = useMemo(() => GENERAL(i18n), [i18n])
  const { setBalances, ...strategy } = useBaseStrategy({
    id: 'stakeFinaToAaveStrategy',
    general,
    tokenDefinitions,
  })

  useEffect(() => {
    if (!balances) return

    setBalances({
      inputTokenBalance: balances[FNA[ChainId.MAINNET].address],
      outputTokenBalance: balances[AXFNA.address],
    })
  }, [balances, setBalances])

  return useMemo(
    () => ({
      ...strategy,
      setBalances,
    }),
    [strategy, setBalances]
  )
}

export default useStakeFinaToAaveStrategy
