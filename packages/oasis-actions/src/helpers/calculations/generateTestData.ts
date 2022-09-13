import { testDataSources } from './test-scenarios/scenarioDataSources'
import { generateTestScenariosName } from './testDataUtils'

Object.values(testDataSources).forEach(range => {
  generateTestScenariosName(range)
})
