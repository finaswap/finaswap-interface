import { CRXFINA, FINA } from '../../../config/tokens'
import { ChainId, FINA_ADDRESS, Token } from '@finaswap/sdk'
import { StrategyGeneralInfo, StrategyHook, StrategyTokenDefinitions } from '../types'
import { e10, tryParseAmount } from '../../../functions'
import { useActiveWeb3React, useZenkoContract } from '../../../hooks'
import { useCallback, useEffect, useMemo } from 'react'

import { BigNumber } from '@ethersproject/bignumber'
import { I18n } from '@lingui/core'
import { t } from '@lingui/macro'
import useBaseStrategy from './useBaseStrategy'
import { useBentoBalance } from '../../bentobox/hooks'
import useBentoBoxTrait from '../traits/useBentoBoxTrait'
import { useLingui } from '@lingui/react'
import useSushiPerXSushi from '../../../hooks/useXSushiPerSushi'
import { useTokenBalances } from '../../wallet/hooks'

export const GENERAL = (i18n: I18n): StrategyGeneralInfo => ({
  name: i18n._(t`Cream → Bento`),
  steps: [i18n._(t`FINA`), i18n._(t`crXFINA`), i18n._(t`BentoBox`)],
  zapMethod: 'stakeSushiToCreamToBento',
  unzapMethod: 'unstakeSushiFromCreamFromBento',
  description: i18n._(t`Stake FINA for xFINA into Cream and deposit crXFINA into BentoBox in one click.`),
  inputSymbol: i18n._(t`FINA`),
  outputSymbol: i18n._(t`crXFINA in BentoBox`),
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
    address: '0x228619cca194fbe3ebeb2f835ec1ea5080dafbb2',
    decimals: 8,
    symbol: 'crXFINA',
  },
}

const useStakeSushiToCreamToBentoStrategy = (): StrategyHook => {
  const { i18n } = useLingui()
  const { account } = useActiveWeb3React()
  const zenkoContract = useZenkoContract()
  const balances = useTokenBalances(account, [FINA[ChainId.MAINNET]])
  const sushiPerXSushi = useSushiPerXSushi(true)
  const crxSushiBentoBalance = useBentoBalance(CRXFINA.address)

  // Strategy ends in BentoBox so use BaseBentoBox strategy
  const general = useMemo(() => GENERAL(i18n), [i18n])
  const baseStrategy = useBaseStrategy({
    id: 'stakeSushiToCreamToBentoStrategy',
    general,
    tokenDefinitions,
  })

  // Add in BentoBox trait as output is in BentoBox
  const { setBalances, calculateOutputFromInput: _, ...strategy } = useBentoBoxTrait(baseStrategy)

  useEffect(() => {
    if (!balances) return

    setBalances({
      inputTokenBalance: balances[FINA[ChainId.MAINNET].address],
      outputTokenBalance: tryParseAmount(crxSushiBentoBalance?.value?.toFixed(8) || '0', CRXFINA),
    })
  }, [balances, setBalances, crxSushiBentoBalance?.value])

  const calculateOutputFromInput = useCallback(
    async (zapIn: boolean, inputValue: string, inputToken: Token, outputToken: Token) => {
      if (!sushiPerXSushi || !inputValue || !zenkoContract) return null

      if (zapIn) {
        const value = inputValue.toBigNumber(18).mulDiv(e10(18), sushiPerXSushi.toString().toBigNumber(18)).toString()
        const cValue = await zenkoContract.toCtoken(CRXFINA.address, value)
        return cValue.toFixed(outputToken.decimals)
      } else {
        const cValue = await zenkoContract.fromCtoken(CRXFINA.address, inputValue.toBigNumber(inputToken.decimals))
        const value = BigNumber.from(cValue).mulDiv(sushiPerXSushi.toString().toBigNumber(18), e10(18))
        return value.toFixed(outputToken.decimals)
      }
    },
    [sushiPerXSushi, zenkoContract]
  )

  return useMemo(
    () => ({
      ...strategy,
      setBalances,
      calculateOutputFromInput,
    }),
    [strategy, calculateOutputFromInput, setBalances]
  )
}

export default useStakeSushiToCreamToBentoStrategy
