import { CurrencyAmount, Token } from '@finaswap/sdk'

type TokenAddress = string

export type TokenBalancesMap = Record<TokenAddress, CurrencyAmount<Token>>
