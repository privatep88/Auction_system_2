import type { SystemSettings } from '../src/types';
import { buildAuctionLookupMap, resolveVehicleAuction } from '../src/utils/auctionLink';
import { computeMonthlyTrend, filterCollections, filterVehicles } from '../src/utils/calculations';
import {
  generateDemoDataset,
  runFinancialValidationSuite,
} from '../src/utils/demoDataGenerator';
import {
  buildCalendarMonthGrid,
  formatIsoDateParts,
  isValidIsoCalendarDate,
  parseIsoDateParts,
} from '../src/utils/saleDate';

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

// Sale date editing & live report synchronization verification
const novSoldSample = dataset.vehicles.find(
  (v) => v.year === 2026 && v.month === 11 && v.status === 'sold'
);
const gridNov = buildCalendarMonthGrid(2026, 11);
const dateValidationOk =
  isValidIsoCalendarDate('2026-11-15') &&
  isValidIsoCalendarDate('2024-02-29') &&
  !isValidIsoCalendarDate('2026-02-29') &&
  !isValidIsoCalendarDate('2026-13-01') &&
  !isValidIsoCalendarDate('not-a-date') &&
  formatIsoDateParts(2026, 12, 5) === '2026-12-05' &&
  gridNov.length === 42 &&
  gridNov.filter((c) => c.isCurrentMonth).length === 30;

if (!novSoldSample || !dateValidationOk) {
  failedCount += 1;
  console.error('[FAIL] T14: Date calendar validation failed.');
} else {
  const newDate = '2026-10-25';
  const parsed = parseIsoDateParts(newDate)!;
  const modifiedVehicles = dataset.vehicles.map((v) =>
    v.id === novSoldSample.id
      ? { ...v, saleDate: newDate, year: parsed.year, month: parsed.month }
      : v
  );

  const octBefore = filterVehicles(dataset.vehicles, {
    month: 10,
    year: 2026,
    location: 'all',
    auctionId: 'all',
    status: 'all',
  });
  const octAfter = filterVehicles(modifiedVehicles, {
    month: 10,
    year: 2026,
    location: 'all',
    auctionId: 'all',
    status: 'all',
  });
  const trendBefore = computeMonthlyTrend(dataset.vehicles, dataset.collections, 2026, 'all', 'all');
  const trendAfter = computeMonthlyTrend(modifiedVehicles, dataset.collections, 2026, 'all', 'all');

  const annualSaleBefore = trendBefore.reduce((s, p) => s + p.saleValue, 0);
  const annualSaleAfter = trendAfter.reduce((s, p) => s + p.saleValue, 0);
  const annualCollectedBefore = trendBefore.reduce((s, p) => s + p.collectedAmount, 0);
  const annualCollectedAfter = trendAfter.reduce((s, p) => s + p.collectedAmount, 0);

  const octPointBefore = trendBefore.find((p) => p.month === 10)!;
  const octPointAfter = trendAfter.find((p) => p.month === 10)!;

  if (
    octAfter.length === octBefore.length + 1 &&
    octPointAfter.saleValue === octPointBefore.saleValue + novSoldSample.salePrice &&
    annualSaleBefore === annualSaleAfter &&
    annualCollectedBefore === annualCollectedAfter
  ) {
    console.log(
      `[PASS] T14: التحقق من تعديل تاريخ البيع والمزامنة الزمنية في التقارير الحية دون تغيير المجاميع السنوية`
    );
  } else {
    failedCount += 1;
    console.error('[FAIL] T14: Sale date period reclassification or financial invariance failed.');
  }
}

// T15: Payment date editing & financial invariance verification
const targetPaymentSample = dataset.collections.find(
  (c) => c.year === 2026 && c.month === 11 && !c.vehicleId
) || dataset.collections.find((c) => c.year === 2026 && c.month === 11);

if (!targetPaymentSample) {
  failedCount += 1;
  console.error('[FAIL] T15: No November 2026 collection record found for payment date test.');
} else {
  const newPaymentDate = '2026-10-19';
  const parsedPayDate = parseIsoDateParts(newPaymentDate)!;
  const modifiedCollections = dataset.collections.map((c) =>
    c.id === targetPaymentSample.id
      ? {
          ...c,
          collectionDate: newPaymentDate,
          year: parsedPayDate.year,
          month: parsedPayDate.month,
        }
      : c
  );

  const octCollectionsBefore = filterCollections(
    dataset.collections,
    { month: 10, year: 2026, location: 'all', auctionId: 'all', status: 'all' },
    dataset.vehicles
  );
  const octCollectionsAfter = filterCollections(
    modifiedCollections,
    { month: 10, year: 2026, location: 'all', auctionId: 'all', status: 'all' },
    dataset.vehicles
  );
  const novCollectionsBefore = filterCollections(
    dataset.collections,
    { month: 11, year: 2026, location: 'all', auctionId: 'all', status: 'all' },
    dataset.vehicles
  );
  const novCollectionsAfter = filterCollections(
    modifiedCollections,
    { month: 11, year: 2026, location: 'all', auctionId: 'all', status: 'all' },
    dataset.vehicles
  );

  const updatedCol = modifiedCollections.find((c) => c.id === targetPaymentSample.id)!;
  const fieldsPreserved =
    updatedCol.amount === targetPaymentSample.amount &&
    updatedCol.amountDue === targetPaymentSample.amountDue &&
    updatedCol.remainingAmount === targetPaymentSample.remainingAmount &&
    updatedCol.paymentStatus === targetPaymentSample.paymentStatus &&
    updatedCol.collectionType === targetPaymentSample.collectionType &&
    updatedCol.vehicleId === targetPaymentSample.vehicleId;

  const totalCollectedSumBefore = dataset.collections.reduce((s, c) => s + c.amount, 0);
  const totalCollectedSumAfter = modifiedCollections.reduce((s, c) => s + c.amount, 0);

  if (
    fieldsPreserved &&
    totalCollectedSumBefore === totalCollectedSumAfter &&
    octCollectionsAfter.some((c) => c.id === targetPaymentSample.id) &&
    !octCollectionsBefore.some((c) => c.id === targetPaymentSample.id) &&
    novCollectionsBefore.some((c) => c.id === targetPaymentSample.id) &&
    !novCollectionsAfter.some((c) => c.id === targetPaymentSample.id)
  ) {
    console.log(
      `[PASS] T15: التحقق من تعديل تاريخ الدفع في سجل التحصيلات والمزامنة الزمنية دون المساس بالمبالغ أو حالة السداد`
    );
  } else {
    failedCount += 1;
    console.error('[FAIL] T15: Payment date edit synchronization or amount invariance failed.');
  }
}

if (failedCount > 0) {
  console.error(`\nFinancial validation failed: ${failedCount} test(s) did not pass.`);
  process.exit(1);
}

console.log(`\nAll ${results.length + 3} financial & operational integrity tests passed.`);
