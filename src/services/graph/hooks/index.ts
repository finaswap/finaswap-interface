import {
  getFinaMasterV1Farms,
  getFinaMasterV1PairAddreses,
  getFinaMasterV1FinaPerBlock,
  getFinaMasterV1TotalAllocPoint,
  getFinaMasterV2Farms,
  getFinaMasterV2PairAddreses,
  getMiniChefFarms,
  getMiniChefPairAddreses,
} from '../fetchers'
import { useEffect, useMemo } from 'react'
import useSWR, { SWRConfiguration } from 'swr'

import { ChainId } from '@finaswap/sdk'
import { Chef } from '../../../features/onsen/enum'
import concat from 'lodash/concat'
import useActiveWeb3React from '../../../hooks/useActiveWeb3React'

export * from './bentobox'
export * from './blocks'
export * from './exchange'

export function useFinaMasterV1TotalAllocPoint(swrConfig = undefined) {
  const { chainId } = useActiveWeb3React()
  const shouldFetch = chainId && [ChainId.BSC, ChainId.ROPSTEN].includes(chainId)
  const { data } = useSWR(
    shouldFetch ? 'finaMasterV1TotalAllocPoint' : null,
    () => getFinaMasterV1TotalAllocPoint(),
    swrConfig
  )
  return data
}

export function useFinaMasterV1FinaPerBlock(swrConfig = undefined) {
  const { chainId } = useActiveWeb3React()
  const shouldFetch = chainId && [ChainId.BSC, ChainId.ROPSTEN].includes(chainId)
  const { data } = useSWR(
    shouldFetch ? 'finaMasterV1FinaPerBlock' : null,
    () => getFinaMasterV1FinaPerBlock(),
    swrConfig
  )
  return data
}

interface useFarmsProps {
  chainId: number
}

export function useFinaMasterV1Farms({ chainId }: useFarmsProps, swrConfig = undefined) {
  const shouldFetch = chainId && [ChainId.BSC, ChainId.ROPSTEN].includes(chainId)
  const { data } = useSWR(shouldFetch ? ['finaMasterV1Farms'] : null, () => getFinaMasterV1Farms(undefined), swrConfig)
  return useMemo(() => {
    if (!data) return []
    return data.map((data) => ({ ...data, chef: Chef.finamaster }))
  }, [data])
}

export function useFinaMasterV2Farms({ chainId }: useFarmsProps, swrConfig: SWRConfiguration = undefined) {
  const shouldFetch = chainId && [ChainId.BSC, ChainId.ROPSTEN].includes(chainId)
  const { data } = useSWR(shouldFetch ? 'finaMasterV2Farms' : null, () => getFinaMasterV2Farms(), swrConfig)
  return useMemo(() => {
    if (!data) return []
    return data.map((data) => ({ ...data, chef: Chef.MASTERCHEF_V2 }))
  }, [data])
}

export function useMiniChefFarms({ chainId }: useFarmsProps, swrConfig: SWRConfiguration = undefined) {
  const shouldFetch = chainId && [ChainId.MATIC, ChainId.XDAI, ChainId.HARMONY, ChainId.ARBITRUM].includes(chainId)
  const { data } = useSWR(
    shouldFetch ? ['miniChefFarms', chainId] : null,
    (_, chainId) => getMiniChefFarms(chainId),
    swrConfig
  )
  return useMemo(() => {
    if (!data) return []
    return data.map((data) => ({ ...data, chef: Chef.MINICHEF }))
  }, [data])
}

export function useFarms({ chainId }: useFarmsProps, swrConfig: SWRConfiguration = undefined) {
  const finaMasterV1Farms = useFinaMasterV1Farms({ chainId })
  const finaMasterV2Farms = useFinaMasterV2Farms({ chainId })
  const miniChefFarms = useMiniChefFarms({ chainId })
  // useEffect(() => {
  //   console.log('debug', { finaMasterV1Farms, finaMasterV2Farms, miniChefFarms })
  // }, [finaMasterV1Farms, finaMasterV2Farms, miniChefFarms])
  return useMemo(
    () => concat(finaMasterV1Farms, finaMasterV2Farms, miniChefFarms).filter((pool) => pool && pool.pair),
    [finaMasterV1Farms, finaMasterV2Farms, miniChefFarms]
  )
}

export function useFinaMasterV1PairAddresses() {
  const { chainId } = useActiveWeb3React()
  const shouldFetch = chainId && [ChainId.BSC, ChainId.ROPSTEN].includes(chainId)
  const { data } = useSWR(shouldFetch ? ['finaMasterV1PairAddresses', chainId] : null, (_) =>
    getFinaMasterV1PairAddreses()
  )
  return useMemo(() => {
    if (!data) return []
    return data.map((data) => data.pair)
  }, [data])
}

export function useFinaMasterV2PairAddresses() {
  const { chainId } = useActiveWeb3React()
  const shouldFetch = chainId && [ChainId.BSC, ChainId.ROPSTEN].includes(chainId)
  const { data } = useSWR(shouldFetch ? ['finaMasterV2PairAddresses', chainId] : null, (_) =>
    getFinaMasterV2PairAddreses()
  )
  return useMemo(() => {
    if (!data) return []
    return data.map((data) => data.pair)
  }, [data])
}

export function useMiniChefPairAddresses() {
  const { chainId } = useActiveWeb3React()
  const shouldFetch = chainId && [ChainId.MATIC, ChainId.XDAI, ChainId.HARMONY, ChainId.ARBITRUM].includes(chainId)
  const { data } = useSWR(shouldFetch ? ['miniChefPairAddresses', chainId] : null, (_, chainId) =>
    getMiniChefPairAddreses(chainId)
  )
  return useMemo(() => {
    if (!data) return []
    return data.map((data) => data.pair)
  }, [data])
}

export function useFarmPairAddresses() {
  const finaMasterV1PairAddresses = useFinaMasterV1PairAddresses()
  const finaMasterV2PairAddresses = useFinaMasterV2PairAddresses()
  const miniChefPairAddresses = useMiniChefPairAddresses()
  return useMemo(
    () => concat(finaMasterV1PairAddresses, finaMasterV2PairAddresses, miniChefPairAddresses),
    [finaMasterV1PairAddresses, finaMasterV2PairAddresses, miniChefPairAddresses]
  )
}
