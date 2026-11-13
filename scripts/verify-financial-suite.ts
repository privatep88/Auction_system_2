import type { SystemSettings } from '../src/types';
import {
  generateDemoDataset,
  runFinancialValidationSuite,
} from '../src/utils/demoDataGenerator';

const demoSettings: SystemSettings = {
  id: 'demo_settings',
  defaultSaaedSharePercent: 70,
  defaultThirdPartySharePercent: 30,
  defaultPlatformFee: 100,
  defaultAdminFee: 200,
  defaultForkliftFee: 200,
  defaultRecoveryFee: 400,
  excludeServicesFromShare: true,
  ownerId: 'demo_workspace',
};

const dataset = generateDemoDataset('ci_verification');
const results = runFinancialValidationSuite({
  auctions: dataset.auctions,
  vehicles: dataset.vehicles,
  collections: dataset.collections,
  serviceRecords: dataset.serviceRecords,
  approvedReports: dataset.approvedReports,
  settings: demoSettings,
  isDemoMode: true,
});

let failedCount = 0;
for (const result of results) {
  const mark = result.passed ? 'PASS' : 'FAIL';
  console.log(`[${mark}] ${result.id}: ${result.name} (${result.actual})`);
  if (!result.passed) {
    failedCount += 1;
    console.error(`   Expected: ${result.expected} | Diff: ${result.diff}`);
  }
}

if (failedCount > 0) {
  console.error(`\nFinancial validation failed: ${failedCount} test(s) did not pass.`);
  process.exit(1);
}

console.log(`\nAll ${results.length} financial & operational integrity tests passed.`);
