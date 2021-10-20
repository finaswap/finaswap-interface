import { t } from '@lingui/macro'
import { AXFINA, FINA } from '../../../constants'
import { ChainId, FINA_ADDRESS } from '@finaswap/sdk'
import { useActiveWeb3React } from '../../../hooks'
import { useTokenBalances } from '../../wallet/hooks'
import { StrategyGeneralInfo, StrategyHook, StrategyTokenDefinitions } from '../types'
import useBaseStrategy from './useBaseStrategy'
import { useEffect, useMemo } from 'react'

export const general: StrategyGeneralInfo = {
  name: 'FINA → Aave',
  steps: ['FINA', 'xFINA', 'Aave'],
  zapMethod: 'stakeSushiToAave',
  unzapMethod: 'unstakeSushiFromAave',
  description: t`Stake FINA for xFINA and deposit into Aave in one click. xFINA in Aave (aXFINA) can be lent or used as collateral for borrowing.`,
  inputSymbol: 'FINA',
  outputSymbol: 'xFINA in Aave',
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
    address: '0xf256cc7847e919fac9b808cc216cac87ccf2f47a',
    decimals: 18,
    symbol: 'aXFINA',
  },
}

const useStakeSushiToAaveStrategy = (): StrategyHook => {
  const { account } = useActiveWeb3React()
  const balances = useTokenBalances(account, [FINA[ChainId.MAINNET], AXFINA])
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
