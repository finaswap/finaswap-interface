import { t } from '@lingui/macro'
import { FINA, XFINA } from '../../../constants'
import { ChainId, FINA_ADDRESS } from '@finaswap/sdk'
import { tryParseAmount } from '../../../functions'
import { useBentoBalance } from '../../bentobox/hooks'
import { useActiveWeb3React } from '../../../hooks'
import { useTokenBalances } from '../../wallet/hooks'
import { StrategyGeneralInfo, StrategyHook, StrategyTokenDefinitions } from '../types'
import { useEffect, useMemo } from 'react'
import useBaseStrategy from './useBaseStrategy'
import useBentoBoxTrait from '../traits/useBentoBoxTrait'

export const general: StrategyGeneralInfo = {
  name: 'FINA → Bento',
  steps: ['FINA', 'xFINA', 'BentoBox'],
  zapMethod: 'stakeSushiToBento',
  unzapMethod: 'unstakeSushiFromBento',
  description: t`Stake FINA for xFINA and deposit into BentoBox in one click. xFINA in BentoBox is automatically
                invested into a passive yield strategy, and can be lent or used as collateral for borrowing in Kashi.`,
  inputSymbol: 'FINA',
  outputSymbol: 'xFINA in BentoBox',
}

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

const useStakeSushiToBentoStrategy = (): StrategyHook => {
  const { account } = useActiveWeb3React()
  const balances = useTokenBalances(account, [FINA[ChainId.MAINNET], XFINA])
  const xSushiBentoBalance = useBentoBalance(XFINA.address)

  // Strategy ends in BentoBox so use BaseBentoBox strategy
  const baseStrategy = useBaseStrategy({
    id: 'stakeSushiToBentoStrategy',
    general,
    tokenDefinitions,
  })

  // Add in BentoBox trait as output is in BentoBox
  const { setBalances, ...strategy } = useBentoBoxTrait(baseStrategy)

  useEffect(() => {
    if (!balances) return

    setBalances({
      inputTokenBalance: balances[FINA[ChainId.MAINNET].address],
      outputTokenBalance: tryParseAmount(xSushiBentoBalance?.value?.toFixed(18) || '0', XFINA),
    })
  }, [balances, setBalances, xSushiBentoBalance?.value])

  return useMemo(
    () => ({
      setBalances,
      ...strategy,
    }),
    [strategy, setBalances]
  )
}

export default useStakeSushiToBentoStrategy
