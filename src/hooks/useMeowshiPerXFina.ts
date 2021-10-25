import { useEffect, useState } from 'react'

import { BigNumber } from '@ethersproject/bignumber'
import { XFNA } from '../config/tokens'
import { useBentoBoxContract } from './useContract'

export default function useMeowshiPerXFina() {
  const bentoboxContract = useBentoBoxContract()
  const [state, setState] = useState<[BigNumber, BigNumber]>([BigNumber.from('0'), BigNumber.from('0')])

  useEffect(() => {
    if (!bentoboxContract) return
    ;(async () => {
      const toShare = await bentoboxContract.toShare(XFNA.address, '1'.toBigNumber(XFNA.decimals), false)
      const toAmount = await bentoboxContract.toAmount(XFNA.address, '1'.toBigNumber(XFNA.decimals), false)
      setState([toShare, toAmount])
    })()
  }, [bentoboxContract])

  return state
}
