import useSWR, { SWRResponse } from 'swr'
import { ChainId } from '@finaswap/sdk'

import React from 'react'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'

function Gas({ network }) {
  const apiEndpoint =
    network === ChainId.MAINNET
      ? 'https://ethgasstation.info/api/ethgasAPI.json?'
      : 'https://bscgas.info/gas?apikey=bd3301cc74a14eaa98131754ad7baeaa'

  const { i18n } = useLingui()
  const { data, error }: SWRResponse<{ average: number; standard: number }, Error> = useSWR(apiEndpoint, (url) =>
    fetch(url).then((r) => r.json())
  )

  if (error) return <div>{i18n._(t`failed to load`)}</div>
  if (!data) return <div>{i18n._(t`loading...`)}</div>

  const gasPrice = network === ChainId.MAINNET ? data.average / 10 : data.standard

  return <div>{gasPrice}</div>
}

export default Gas
