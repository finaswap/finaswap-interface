import {
  ChainId,
  CurrencyAmount,
  JSBI,
  MASTERCHEF_ADDRESS,
  MASTERCHEF_V2_ADDRESS,
  MINICHEF_ADDRESS,
} from '@finaswap/sdk'
import { Chef } from './enum'
import { NEVER_RELOAD, useSingleCallResult, useSingleContractMultipleData } from '../../state/multicall/hooks'
import { Dispatch, useCallback, useEffect, useMemo, useState } from 'react'
import { useFinaMasterContract, useFinaMasterV2Contract, useMiniChefContract } from '../../hooks/useContract'

import { Contract } from '@ethersproject/contracts'
import { FNA } from '../../config/tokens'
import { Zero } from '@ethersproject/constants'
import concat from 'lodash/concat'
import { useActiveWeb3React } from '../../hooks/useActiveWeb3React'
import zip from 'lodash/zip'

export function useChefContract(chef: Chef) {
  const finaMasterContract = useFinaMasterContract()
  const finaMasterV2Contract = useFinaMasterV2Contract()
  const miniChefContract = useMiniChefContract()
  const contracts = useMemo(
    () => ({
      [Chef.finamaster]: finaMasterContract,
      [Chef.MASTERCHEF_V2]: finaMasterV2Contract,
      [Chef.MINICHEF]: miniChefContract,
    }),
    [finaMasterContract, finaMasterV2Contract, miniChefContract]
  )
  return useMemo(() => {
    return contracts[chef]
  }, [contracts, chef])
}

const CHEFS = {
  [ChainId.MAINNET]: [Chef.finamaster, Chef.MASTERCHEF_V2],
  [ChainId.MATIC]: [Chef.MINICHEF],
}

export function useChefContracts(chefs: Chef[]) {
  const finaMasterContract = useFinaMasterContract()
  const finaMasterV2Contract = useFinaMasterV2Contract()
  const miniChefContract = useMiniChefContract()
  const contracts = useMemo(
    () => ({
      [Chef.finamaster]: finaMasterContract,
      [Chef.MASTERCHEF_V2]: finaMasterV2Contract,
      [Chef.MINICHEF]: miniChefContract,
    }),
    [finaMasterContract, finaMasterV2Contract, miniChefContract]
  )
  return chefs.map((chef) => contracts[chef])
}

export function useUserInfo(farm, token) {
  const { account } = useActiveWeb3React()

  const contract = useChefContract(farm.chef)

  const args = useMemo(() => {
    if (!account) {
      return
    }
    return [String(farm.id), String(account)]
  }, [farm, account])

  const result = useSingleCallResult(args ? contract : null, 'userInfo', args)?.result

  const value = result?.[0]

  const amount = value ? JSBI.BigInt(value.toString()) : undefined

  return amount ? CurrencyAmount.fromRawAmount(token, amount) : undefined
}

export function usePendingFina(farm) {
  const { account, chainId } = useActiveWeb3React()

  const contract = useChefContract(farm.chef)

  const args = useMemo(() => {
    if (!account) {
      return
    }
    return [String(farm.id), String(account)]
  }, [farm, account])

  const result = useSingleCallResult(args ? contract : null, 'pendingFina', args)?.result

  const value = result?.[0]

  const amount = value ? JSBI.BigInt(value.toString()) : undefined

  return amount ? CurrencyAmount.fromRawAmount(FNA[chainId], amount) : undefined
}

export function usePendingToken(farm, contract) {
  const { account } = useActiveWeb3React()

  const args = useMemo(() => {
    if (!account || !farm) {
      return
    }
    return [String(farm.pid), String(account)]
  }, [farm, account])

  const pendingTokens = useSingleContractMultipleData(
    args ? contract : null,
    'pendingTokens',
    args.map((arg) => [...arg, '0'])
  )

  return useMemo(() => pendingTokens, [pendingTokens])
}

export function useChefPositions(contract?: Contract | null, rewarder?: Contract | null, chainId = undefined) {
  const { account } = useActiveWeb3React()

  const numberOfPools = useSingleCallResult(contract ? contract : null, 'poolLength', undefined, NEVER_RELOAD)
    ?.result?.[0]

  const args = useMemo(() => {
    if (!account || !numberOfPools) {
      return
    }
    return [...Array(numberOfPools.toNumber()).keys()].map((pid) => [String(pid), String(account)])
  }, [numberOfPools, account])

  const pendingFina = useSingleContractMultipleData(args ? contract : null, 'pendingFina', args)

  const userInfo = useSingleContractMultipleData(args ? contract : null, 'userInfo', args)

  // const pendingTokens = useSingleContractMultipleData(
  //     rewarder,
  //     'pendingTokens',
  //     args.map((arg) => [...arg, '0'])
  // )

  const getChef = useCallback(() => {
    if (MASTERCHEF_ADDRESS[chainId] === contract.address) {
      return Chef.finamaster
    } else if (MASTERCHEF_V2_ADDRESS[chainId] === contract.address) {
      return Chef.MASTERCHEF_V2
    } else if (MINICHEF_ADDRESS[chainId] === contract.address) {
      return Chef.MINICHEF
    }
  }, [chainId, contract])

  return useMemo(() => {
    if (!pendingFina || !userInfo) {
      return []
    }
    return zip(pendingFina, userInfo)
      .map((data, i) => ({
        id: args[i][0],
        pendingFina: data[0].result?.[0] || Zero,
        amount: data[1].result?.[0] || Zero,
        chef: getChef(),
        // pendingTokens: data?.[2]?.result,
      }))
      .filter(({ pendingFina, amount }) => {
        return (pendingFina && !pendingFina.isZero()) || (amount && !amount.isZero())
      })
  }, [args, getChef, pendingFina, userInfo])
}

export function usePositions(chainId = undefined) {
  const [finaMasterV1Positions, finaMasterV2Positions, miniChefPositions] = [
    useChefPositions(useFinaMasterContract(), undefined, chainId),
    useChefPositions(useFinaMasterV2Contract(), undefined, chainId),
    useChefPositions(useMiniChefContract(), undefined, chainId),
  ]
  return concat(finaMasterV1Positions, finaMasterV2Positions, miniChefPositions)
}

/*
  Currently expensive to render farm list item. The infinite scroll is used to
  to minimize this impact. This hook pairs with it, keeping track of visible
  items and passes this to <InfiniteScroll> component.
*/
export function useInfiniteScroll(items: any[]): [number, Dispatch<number>] {
  const [itemsDisplayed, setItemsDisplayed] = useState(10)
  useEffect(() => setItemsDisplayed(10), [items.length])
  return [itemsDisplayed, setItemsDisplayed]
}
