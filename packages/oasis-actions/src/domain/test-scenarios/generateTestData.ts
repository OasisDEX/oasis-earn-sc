import { generateTestScenarios } from '../testDataUtils'

export const testDataSources = {
  LTV_target: 'Test_Scenarios_LTV_target!A1:K35',
  LTV_min: 'Test_Scenarios_LTV_min!A1:J15',
}

Object.values(testDataSources).forEach(range => {
  generateTestScenarios(range)
})
