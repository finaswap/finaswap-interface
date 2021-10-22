import gql from 'graphql-tag'

export const barQuery = gql`
  query barQuery($id: String! = "0x8798249c2e607446efb7ad49ec89dd1865ff4272", $block: Block_height) {
    bar(id: $id, block: $block) {
      id
      totalSupply
      ratio
      xFinaMinted
      xFinaBurned
      sushiStaked
      sushiStakedUSD
      sushiHarvested
      sushiHarvestedUSD
      xFinaAge
      xFinaAgeDestroyed
      # histories(first: 1000) {
      #   id
      #   date
      #   timeframe
      #   sushiStaked
      #   sushiStakedUSD
      #   sushiHarvested
      #   sushiHarvestedUSD
      #   xFinaAge
      #   xFinaAgeDestroyed
      #   xFinaMinted
      #   xFinaBurned
      #   xFinaSupply
      #   ratio
      # }
    }
  }
`

export const barHistoriesQuery = gql`
  query barHistoriesQuery {
    histories(first: 1000) {
      id
      date
      timeframe
      sushiStaked
      sushiStakedUSD
      sushiHarvested
      sushiHarvestedUSD
      xFinaAge
      xFinaAgeDestroyed
      xFinaMinted
      xFinaBurned
      xFinaSupply
      ratio
    }
  }
`

export const barUserQuery = gql`
  query barUserQuery($id: String!) {
    user(id: $id) {
      id
      bar {
        totalSupply
        sushiStaked
      }
      xFina
      sushiStaked
      sushiStakedUSD
      sushiHarvested
      sushiHarvestedUSD
      xFinaIn
      xFinaOut
      xFinaOffset
      xFinaMinted
      xFinaBurned
      sushiIn
      sushiOut
      usdIn
      usdOut
      createdAt
      createdAtBlock
    }
  }
`
