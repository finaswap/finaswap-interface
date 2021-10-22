import { useAppSelector } from '../hooks'
import { Token } from '@finaswap/sdk'
import { tryParseAmount } from '../../functions'
import useStakeFinaToBentoStrategy from './strategies/useStakeFinaToBentoStrategy'
import { DerivedInariState, InariState } from './types'
import useStakeFinaToCreamStrategy from './strategies/useStakeFinaToCreamStrategy'
import useStakeFinaToCreamToBentoStrategy from './strategies/useStakeFinaToCreamToBentoStrategy'
import useStakeFinaToAaveStrategy from './strategies/useStakeFinaToAaveStrategy'
import { useMemo } from 'react'

export function useInariState(): InariState {
  return useAppSelector((state) => state.inari)
}

// Redux doesn't allow for non-serializable classes so use a derived state hook for complex values
// Derived state may not use any of the strategy hooks to avoid an infinite loop
export function useDerivedInariState(): DerivedInariState {
  const { inputValue, outputValue, tokens, general, ...rest } = useInariState()

  // BalancePanel input token
  const inputToken = useMemo(
    () =>
      new Token(
        tokens.inputToken.chainId,
        tokens.inputToken.address,
        tokens.inputToken.decimals,
        tokens.inputToken.symbol
      ),
    [tokens.inputToken.address, tokens.inputToken.chainId, tokens.inputToken.decimals, tokens.inputToken.symbol]
  )

  // BalancePanel output token
  const outputToken = useMemo(
    () =>
      new Token(
        tokens.outputToken.chainId,
        tokens.outputToken.address,
        tokens.outputToken.decimals,
        tokens.outputToken.symbol
      ),
    [tokens.outputToken.address, tokens.outputToken.chainId, tokens.outputToken.decimals, tokens.outputToken.symbol]
  )

  return useMemo(
    () => ({
      ...rest,
      inputValue: tryParseAmount(inputValue, inputToken),
      outputValue: tryParseAmount(outputValue, outputToken),
      general,
      tokens: {
        inputToken,
        outputToken,
      },
    }),
    [general, inputToken, inputValue, outputToken, outputValue, rest]
  )
}

export function useSelectedInariStrategy() {
  const { id: selectedStrategy } = useInariState()
  const strategies = useInariStrategies()
  return useMemo(() => strategies[selectedStrategy], [selectedStrategy, strategies])
}

// Use this hook to register all strategies
export function useInariStrategies() {
  const stakeFinaToBentoStrategy = useStakeFinaToBentoStrategy()
  const stakeFinaToCreamStrategy = useStakeFinaToCreamStrategy()
  const stakeFinaToAaveStrategy = useStakeFinaToAaveStrategy()

  return useMemo(
    () => ({
      [stakeFinaToBentoStrategy.id]: stakeFinaToBentoStrategy,
      [stakeFinaToCreamStrategy.id]: stakeFinaToCreamStrategy,
      [stakeFinaToAaveStrategy.id]: stakeFinaToAaveStrategy,
    }),
    [stakeFinaToAaveStrategy, stakeFinaToBentoStrategy, stakeFinaToCreamStrategy]
  )
}
