import { CRXFNA, FNA } from '../../../config/tokens'
import { ChainId, FNA_ADDRESS, Token } from '@finaswap/sdk'
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
import useFinaPerXFina from '../../../hooks/useXFinaPerFina'
import { useTokenBalances } from '../../wallet/hooks'

export const GENERAL = (i18n: I18n): StrategyGeneralInfo => ({
  name: i18n._(t`Cream → Bento`),
  steps: [i18n._(t`FNA`), i18n._(t`crXFNA`), i18n._(t`BentoBox`)],
  zapMethod: 'stakeFinaToCreamToBento',
  unzapMethod: 'unstakeFinaFromCreamFromBento',
  description: i18n._(t`Stake FNA for xFNA into Cream and deposit crXFNA into BentoBox in one click.`),
  inputSymbol: i18n._(t`FNA`),
  outputSymbol: i18n._(t`crXFNA in BentoBox`),
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
    address: '0x228619cca194fbe3ebeb2f835ec1ea5080dafbb2',
    decimals: 8,
    symbol: 'crXFNA',
  },
}

const useStakeFinaToCreamToBentoStrategy = (): StrategyHook => {
  const { i18n } = useLingui()
  const { account } = useActiveWeb3React()
  const zenkoContract = useZenkoContract()
  const balances = useTokenBalances(account, [FNA[ChainId.MAINNET]])
  const sushiPerXFina = useFinaPerXFina(true)
  const crxFinaBentoBalance = useBentoBalance(CRXFNA.address)

  // Strategy ends in BentoBox so use BaseBentoBox strategy
  const general = useMemo(() => GENERAL(i18n), [i18n])
  const baseStrategy = useBaseStrategy({
    id: 'stakeFinaToCreamToBentoStrategy',
    general,
    tokenDefinitions,
  })

  // Add in BentoBox trait as output is in BentoBox
  const { setBalances, calculateOutputFromInput: _, ...strategy } = useBentoBoxTrait(baseStrategy)

  useEffect(() => {
    if (!balances) return

    setBalances({
      inputTokenBalance: balances[FNA[ChainId.MAINNET].address],
      outputTokenBalance: tryParseAmount(crxFinaBentoBalance?.value?.toFixed(8) || '0', CRXFNA),
    })
  }, [balances, setBalances, crxFinaBentoBalance?.value])

  const calculateOutputFromInput = useCallback(
    async (zapIn: boolean, inputValue: string, inputToken: Token, outputToken: Token) => {
      if (!sushiPerXFina || !inputValue || !zenkoContract) return null

      if (zapIn) {
        const value = inputValue.toBigNumber(18).mulDiv(e10(18), sushiPerXFina.toString().toBigNumber(18)).toString()
        const cValue = await zenkoContract.toCtoken(CRXFNA.address, value)
        return cValue.toFixed(outputToken.decimals)
      } else {
        const cValue = await zenkoContract.fromCtoken(CRXFNA.address, inputValue.toBigNumber(inputToken.decimals))
        const value = BigNumber.from(cValue).mulDiv(sushiPerXFina.toString().toBigNumber(18), e10(18))
        return value.toFixed(outputToken.decimals)
      }
    },
    [sushiPerXFina, zenkoContract]
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

export default useStakeFinaToCreamToBentoStrategy
