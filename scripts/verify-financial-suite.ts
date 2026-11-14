import type { SystemSettings } from '../src/types';
import { buildAuctionLookupMap, resolveVehicleAuction } from '../src/utils/auctionLink';
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

// Auction link column verification
const auctionsById = buildAuctionLookupMap(dataset.auctions);
const sampleLinkedVehicle = dataset.vehicles.find((v) => auctionsById.has(v.auctionId));
if (!sampleLinkedVehicle) {
  failedCount += 1;
  console.error('[FAIL] T13: No linked vehicle found in demo dataset.');
} else {
  const expectedTitle = auctionsById.get(sampleLinkedVehicle.auctionId)!.title;
  const resolved = resolveVehicleAuction(sampleLinkedVehicle, auctionsById);
  const unlinkedRes = resolveVehicleAuction({ auctionId: '' }, auctionsById);
  const generalRes = resolveVehicleAuction({ auctionId: 'general_auction' }, auctionsById);
  const unavailableRes = resolveVehicleAuction({ auctionId: 'NON_EXISTENT_AUC' }, auctionsById);

  const updatedAuctions = dataset.auctions.map((a) =>
    a.id === sampleLinkedVehicle.auctionId ? { ...a, title: 'مزاد محدث للاختبار' } : a
  );
  const updatedMap = buildAuctionLookupMap(updatedAuctions);
  const updatedRes = resolveVehicleAuction(sampleLinkedVehicle, updatedMap);

  const linkSuitePassed =
    resolved.status === 'linked' &&
    resolved.label === expectedTitle &&
    unlinkedRes.status === 'unlinked' &&
    unlinkedRes.label === 'غير مرتبط بمزاد' &&
    generalRes.status === 'unlinked' &&
    generalRes.label === 'غير مرتبط بمزاد' &&
    unavailableRes.status === 'unavailable' &&
    unavailableRes.label === 'مزاد غير متاح' &&
    updatedRes.label === 'مزاد محدث للاختبار';

  if (linkSuitePassed) {
    console.log(
      `[PASS] T13: ربط عمود اسم المزاد وتحديثه التلقائي وحالات عدم الارتباط (${expectedTitle})`
    );
  } else {
    failedCount += 1;
    console.error('[FAIL] T13: Vehicle-to-auction resolution mismatch.');
  }
}

if (failedCount > 0) {
  console.error(`\nFinancial validation failed: ${failedCount} test(s) did not pass.`);
  process.exit(1);
}

console.log(`\nAll ${results.length + 1} financial & operational integrity tests passed.`);
