import * as XLSX from 'xlsx';
import { SystemSettings, Vehicle, VehicleStatus } from '../types';
import { generateSafeId } from './uaeDate';

export interface ParsedVehicleImportRow {
  lotNumber: string;
  make: string;
  model: string;
  modelYear: number;
  vin?: string;
  estimatedValue: number;
  salePrice: number;
  collectedAmount: number;
  status: VehicleStatus;
  platformFee: number;
  adminFee: number;
  forkliftFee: number;
  recoveryFee: number;
  buyerName?: string;
  location?: string;
}

function normalizeHeader(key: string): string {
  return key.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function pickField(row: Record<string, unknown>, candidates: string[]): unknown {
  const keys = Object.keys(row);
  for (const candidate of candidates) {
    const normCand = normalizeHeader(candidate);
    const foundKey = keys.find((k) => normalizeHeader(k) === normCand);
    if (foundKey !== undefined && row[foundKey] !== '' && row[foundKey] !== undefined) {
      return row[foundKey];
    }
  }
  return undefined;
}

function toNum(val: unknown, fallback = 0): number {
  if (typeof val === 'number' && Number.isFinite(val)) return Math.max(0, val);
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.-]/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
  }
  return fallback;
}

function parseStatus(val: unknown, salePrice: number): VehicleStatus {
  const s = String(val || '').trim().toLowerCase();
  if (['sold', 'مبيعة', 'مباع', 'تم البيع', 'yes', '1'].includes(s)) return 'sold';
  if (['unsold', 'غير مبيعة', 'غير مباع', 'لم يباع', 'no', '0'].includes(s)) return 'unsold';
  if (['pending', 'قيد التحصيل', 'معلق'].includes(s)) return 'pending';
  return salePrice > 0 ? 'sold' : 'unsold';
}

export async function parseVehiclesSpreadsheet(
  file: File,
  defaults: SystemSettings
): Promise<ParsedVehicleImportRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const sheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  return rawRows
    .map((row, idx): ParsedVehicleImportRow | null => {
      const make = String(
        pickField(row, ['نوع المركبة', 'الشركة المصنعة', 'make', 'brand', 'manufacturer']) || ''
      ).trim();
      const model = String(
        pickField(row, ['الطراز', 'الموديل', 'model', 'variant']) || ''
      ).trim();

      if (!make && !model) return null;

      const lotNumber = String(
        pickField(row, ['رقم اللوت', 'رقم المركبة', 'lot', 'lotnumber', 'lot_number', 'no']) ||
          `LOT-${idx + 1}`
      ).trim();

      const modelYear = Math.round(
        toNum(pickField(row, ['سنة الصنع', 'السنة', 'modelyear', 'year']), 2024)
      );
      const vin = String(pickField(row, ['رقم الشاصي', 'vin', 'chassis']) || '').trim();
      const estimatedValue = toNum(
        pickField(row, ['القيمة التقديرية', 'التقديري', 'estimatedvalue', 'estimated', 'reserve']),
        0
      );
      const salePrice = toNum(
        pickField(row, ['سعر البيع', 'قيمة البيع', 'saleprice', 'soldprice', 'price']),
        0
      );
      const status = parseStatus(pickField(row, ['الحالة', 'status']), salePrice);
      const collectedAmount = toNum(
        pickField(row, ['المبلغ المحصل', 'المحصل', 'collectedamount', 'collected', 'paid']),
        status === 'sold' ? salePrice : 0
      );
      const platformFee = toNum(
        pickField(row, ['رسوم المنصة', 'platformfee', 'platform']),
        status === 'sold' ? defaults.defaultPlatformFee : 0
      );
      const adminFee = toNum(
        pickField(row, ['الرسوم الإدارية', 'adminfee', 'admin']),
        status === 'sold' ? defaults.defaultAdminFee : 0
      );
      const forkliftFee = toNum(
        pickField(row, ['رسوم الفوركلفت', 'الفوركلفت', 'forkliftfee', 'forklift']),
        0
      );
      const recoveryFee = toNum(
        pickField(row, ['رسوم النقل', 'ريكفري', 'ريكفري ساعد', 'recoveryfee', 'recovery']),
        0
      );
      const buyerName = String(
        pickField(row, ['المشتري', 'اسم المزايد', 'buyer', 'buyername', 'bidder']) || ''
      ).trim();
      const location = String(
        pickField(row, ['الموقع', 'الساحة', 'location', 'yard']) || ''
      ).trim();

      return {
        lotNumber,
        make: make || 'غير محدد',
        model: model || 'غير محدد',
        modelYear: modelYear >= 1950 && modelYear <= 2100 ? modelYear : 2024,
        vin: vin || undefined,
        estimatedValue,
        salePrice: status === 'unsold' ? 0 : salePrice,
        collectedAmount: status === 'unsold' ? 0 : collectedAmount,
        status,
        platformFee,
        adminFee,
        forkliftFee,
        recoveryFee,
        buyerName: buyerName || undefined,
        location: location || undefined,
      };
    })
    .filter((r): r is ParsedVehicleImportRow => r !== null);
}

export function downloadVehiclesTemplateXlsx() {
  const sampleTemplate = [
    {
      'رقم اللوت': 'LOT-101',
      'نوع المركبة': 'مرسيدس',
      'الطراز': 'S-Class',
      'سنة الصنع': 2024,
      'رقم الشاصي': '',
      'القيمة التقديرية': 0,
      'سعر البيع': 0,
      'المبلغ المحصل': 0,
      'الحالة': 'مبيعة',
      'رسوم المنصة': 0,
      'الرسوم الإدارية': 0,
      'رسوم الفوركلفت': 0,
      'رسوم النقل': 0,
      'المشتري': '',
      'الموقع': 'ساحة الحجز – مصفح',
    },
  ];
  const ws = XLSX.utils.json_to_sheet(sampleTemplate);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'المركبات');
  XLSX.writeFile(wb, 'SAAED_Vehicles_Import_Template.xlsx');
}

export function exportVehiclesToXlsx(
  vehicles: Vehicle[],
  filename: string,
  isDemoMode = false
) {
  const rows = vehicles.map((v, index) => ({
    'م': index + 1,
    'بيئة البيانات': isDemoMode || v.isDemo ? 'بيانات تجريبية (Demo – ليست فعلية)' : 'إنتاج فعلي',
    'رقم اللوت': v.lotNumber,
    'نوع المركبة': v.make,
    'الطراز': v.model,
    'سنة الصنع': v.modelYear,
    'رقم الشاصي': v.vin || '',
    'الموقع': v.location,
    'الشهر': v.month,
    'السنة': v.year,
    'القيمة التقديرية (AED)': v.estimatedValue,
    'سعر البيع (AED)': v.salePrice,
    'المبلغ المحصل (AED)': v.collectedAmount,
    'الحالة': v.status === 'sold' ? 'مبيعة' : v.status === 'pending' ? 'قيد التحصيل' : 'غير مبيعة',
    'رسوم المنصة (AED)': v.platformFee,
    'الرسوم الإدارية (AED)': v.adminFee,
    'رسوم الفوركلفت (AED)': v.forkliftFee,
    'رسوم النقل ريكفري (AED)': v.recoveryFee,
    'المشتري': v.buyerName || '',
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, isDemoMode ? 'تقرير المركبات (تجريبي)' : 'تقرير المركبات');
  const safeName = isDemoMode && !filename.startsWith('DEMO_') ? `DEMO_${filename}` : filename;
  XLSX.writeFile(wb, `${safeName}.xlsx`);
}

export function buildVehicleFromImport(
  row: ParsedVehicleImportRow,
  params: {
    auctionId: string;
    year: number;
    month: number;
    defaultLocation: string;
    ownerId: string;
  }
): Omit<Vehicle, 'createdAt' | 'updatedAt'> {
  return {
    id: generateSafeId('veh'),
    auctionId: params.auctionId,
    lotNumber: row.lotNumber.slice(0, 64),
    make: row.make.slice(0, 80),
    model: row.model.slice(0, 80),
    modelYear: row.modelYear,
    ...(row.vin ? { vin: row.vin.slice(0, 64) } : {}),
    location: (row.location || params.defaultLocation).slice(0, 120),
    year: params.year,
    month: params.month,
    estimatedValue: row.estimatedValue,
    salePrice: row.salePrice,
    collectedAmount: row.collectedAmount,
    status: row.status,
    platformFee: row.platformFee,
    adminFee: row.adminFee,
    forkliftFee: row.forkliftFee,
    recoveryFee: row.recoveryFee,
    ...(row.buyerName ? { buyerName: row.buyerName.slice(0, 120) } : {}),
    ownerId: params.ownerId,
  };
}
