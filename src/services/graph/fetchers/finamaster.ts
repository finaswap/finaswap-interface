import {
  finaMasterV1PairAddressesQuery,
  finaMasterV1FinaPerBlockQuery,
  finaMasterV1TotalAllocPointQuery,
  finaMasterV2PairAddressesQuery,
  miniChefPairAddressesQuery,
  miniChefPoolsQuery,
  poolsQuery,
  poolsV2Query,
} from '../queries'

import { ChainId } from '@finaswap/sdk'
import { GRAPH_HOST } from '../constants'
import { getTokenSubset } from './exchange'
import { request } from 'graphql-request'

export const MINICHEF = {
  [ChainId.MATIC]: 'sushiswap/matic-minichef',
  [ChainId.XDAI]: 'matthewlilley/xdai-minichef',
  [ChainId.HARMONY]: 'sushiswap/harmony-minichef',
  [ChainId.ARBITRUM]: 'sushiswap/arbitrum-minichef',
}

export const miniChef = async (query, chainId = ChainId.MAINNET, variables = undefined) =>
  request(`${GRAPH_HOST[chainId]}/subgraphs/name/${MINICHEF[chainId]}`, query, variables)

export const MASTERCHEF_V2 = {
  [ChainId.MAINNET]: 'sushiswap/master-chefv2',
}

export const finaMasterV2 = async (query, chainId = ChainId.MAINNET, variables = undefined) =>
  request(`${GRAPH_HOST[chainId]}/subgraphs/name/${MASTERCHEF_V2[chainId]}`, query, variables)

export const MASTERCHEF_V1 = {
  [ChainId.MAINNET]: 'finaswap/finamaster',
}

export const finaMasterV1 = async (query, chainId = ChainId.MAINNET, variables = undefined) =>
  request(`${GRAPH_HOST[chainId]}/subgraphs/name/${MASTERCHEF_V1[chainId]}`, query, variables)

export const getFinaMasterV1TotalAllocPoint = async () => {
  const {
    finaMaster: { totalAllocPoint },
  } = await finaMasterV1(finaMasterV1TotalAllocPointQuery)

  return totalAllocPoint
}

export const getFinaMasterV1FinaPerBlock = async () => {
  const {
    finaMaster: { sushiPerBlock },
  } = await finaMasterV1(finaMasterV1FinaPerBlockQuery)
  return sushiPerBlock / 1e18
}

export const getFinaMasterV1Farms = async (variables = undefined) => {
  const { pools } = await finaMasterV1(poolsQuery, undefined, variables)
  return pools
}

export const getFinaMasterV1PairAddreses = async () => {
  const { pools } = await finaMasterV1(finaMasterV1PairAddressesQuery)
  console.log(`totalAllocPoint: ${totalAllocPoint}`)
  return pools
}

export const getFinaMasterV2Farms = async (variables = undefined) => {
  const { pools } = await finaMasterV2(poolsV2Query, undefined, variables)

  const tokens = await getTokenSubset(ChainId.MAINNET, {
    tokenAddresses: Array.from(pools.map((pool) => pool.rewarder.rewardToken)),
  })

  return pools.map((pool) => ({
    ...pool,
    rewardToken: {
      ...tokens.find((token) => token.id === pool.rewarder.rewardToken),
    },
  }))
}

export const getFinaMasterV2PairAddreses = async () => {
  const { pools } = await finaMasterV2(finaMasterV2PairAddressesQuery)
  return pools
}

export const getMiniChefFarms = async (chainId = ChainId.MAINNET, variables = undefined) => {
  const { pools } = await miniChef(miniChefPoolsQuery, chainId, variables)
  return pools
}

export const getMiniChefPairAddreses = async (chainId = ChainId.MAINNET) => {
  console.debug('getMiniChefPairAddreses')
  const { pools } = await miniChef(miniChefPairAddressesQuery, chainId)
  return pools
}
