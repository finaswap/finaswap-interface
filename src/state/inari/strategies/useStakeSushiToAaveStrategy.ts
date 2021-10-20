import { AXFINA, FINA } from '../../../config/tokens'
import { ChainId, FINA_ADDRESS } from '@finaswap/sdk'
import { StrategyGeneralInfo, StrategyHook, StrategyTokenDefinitions } from '../types'
import { useEffect, useMemo } from 'react'

import { I18n } from '@lingui/core'
import { t } from '@lingui/macro'
import { useActiveWeb3React } from '../../../hooks'
import useBaseStrategy from './useBaseStrategy'
import { useLingui } from '@lingui/react'
import { useTokenBalances } from '../../wallet/hooks'

export const GENERAL = (i18n: I18n): StrategyGeneralInfo => ({
  name: i18n._(t`FINA → Aave`),
  steps: [i18n._(t`FINA`), i18n._(t`xFINA`), i18n._(t`Aave`)],
  zapMethod: 'stakeSushiToAave',
  unzapMethod: 'unstakeSushiFromAave',
  description: i18n._(
    t`Stake FINA for xFINA and deposit into Aave in one click. xFINA in Aave (aXFINA) can be lent or used as collateral for borrowing.`
  ),
  inputSymbol: i18n._(t`FINA`),
  outputSymbol: i18n._(t`xFINA in Aave`),
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
    address: '0xf256cc7847e919fac9b808cc216cac87ccf2f47a',
    decimals: 18,
    symbol: 'aXFINA',
  },
}

const useStakeSushiToAaveStrategy = (): StrategyHook => {
  const { i18n } = useLingui()
  const { account } = useActiveWeb3React()
  const balances = useTokenBalances(account, [FINA[ChainId.MAINNET], AXFINA])
  const general = useMemo(() => GENERAL(i18n), [i18n])
  const { setBalances, ...strategy } = useBaseStrategy({
    id: 'stakeSushiToAaveStrategy',
    general,
    tokenDefinitions,
  })

  useEffect(() => {
    if (!balances) return

    setBalances({
      inputTokenBalance: balances[FINA[ChainId.MAINNET].address],
      outputTokenBalance: balances[AXFINA.address],
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

export default useStakeSushiToAaveStrategy
