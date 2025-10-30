import { getBranchDistrict } from '@/lib/data/Branches'
import { getDistctName, getDistrict } from '@/lib/data/District'
import { getProductName } from '@/lib/data/Product'
import { fetchApprovers, fetchAssignments } from '@/lib/data/users'
import React from 'react'
import SettingUI from './SettingUI'

const SettingPage =async () => {
  const approver = await fetchApprovers()
  const district = await getDistctName()
  const branch = await getBranchDistrict()
  const product = await getProductName()
  const assignment= await fetchAssignments()


  return (
    <SettingUI approver={approver} district={district} branch={branch} product={product} assignment={assignment}/>
  )
}

export default SettingPage