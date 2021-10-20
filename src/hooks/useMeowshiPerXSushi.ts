import { useEffect, useState } from 'react'

import { BigNumber } from '@ethersproject/bignumber'
import { XFINA } from '../config/tokens'
import { useBentoBoxContract } from './useContract'

export default function useMeowshiPerXSushi() {
  const bentoboxContract = useBentoBoxContract()
  const [state, setState] = useState<[BigNumber, BigNumber]>([BigNumber.from('0'), BigNumber.from('0')])

  useEffect(() => {
    if (!bentoboxContract) return
    ;(async () => {
      const toShare = await bentoboxContract.toShare(XFINA.address, '1'.toBigNumber(XFINA.decimals), false)
      const toAmount = await bentoboxContract.toAmount(XFINA.address, '1'.toBigNumber(XFINA.decimals), false)
      setState([toShare, toAmount])
    })()
  }, [bentoboxContract])

  return state
}
