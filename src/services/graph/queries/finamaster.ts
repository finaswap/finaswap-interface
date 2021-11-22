import gql from 'graphql-tag'

export const poolsQuery = gql`
  query poolsQuery(
    $first: Int! = 1000
    $skip: Int! = 0
    $orderBy: String! = "id"
    $orderDirection: String! = "desc"
    $block: Block_height
    $where: Pool_filter! = { allocPoint_gt: 0, accFinaPerShare_gt: 0 }
  ) {
    pools(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      block: $block
      where: $where
    ) {
      id
      pair
      allocPoint
      lastRewardBlock
      accFinaPerShare
      balance
      userCount
      owner {
        id
        sushiPerBlock
        totalAllocPoint
      }
    }
  }
`

export const finaMasterV1PairAddressesQuery = gql`
  query finaMasterV1PairAddresses(
    $first: Int! = 1000
    $skip: Int! = 0
    $orderBy: String! = "id"
    $orderDirection: String! = "desc"
    $where: Pool_filter! = { allocPoint_gt: 0, accFinaPerShare_gt: 0 }
  ) {
    pools(first: $first, skip: $skip, orderBy: $orderBy, orderDirection: $orderDirection, where: $where) {
      id
      allocPoint
      accFinaPerShare
      pair {
        id
      }
    }
  }
`

export const finaMasterV1TotalAllocPointQuery = gql`
  query finaMasterV1TotalAllocPoint($id: String! = "0xc2edad668740f1aa35e4d8f227fb8e17dca888cd") {
    finaMaster(id: $id) {
      id
      totalAllocPoint
    }
  }
`

export const finaMasterV1FinaPerBlockQuery = gql`
  query finaMasterV1FinaPerBlock($id: String! = "0xc2edad668740f1aa35e4d8f227fb8e17dca888cd") {
    finaMaster(id: $id) {
      id
      sushiPerBlock
    }
  }
`
