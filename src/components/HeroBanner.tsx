import React, { useState } from 'react';
import { BarChart3, Car, Gavel, Plus, Printer, Upload } from 'lucide-react';
import heroPanoramicImg from '../assets/images/hero_panoramic_header_v2_1794561903512.jpg';
import { assetUrl } from '../utils/uaeDate';

interface HeroBannerProps {
  canEdit: boolean;
  onAddAuction: () => void;
  onAddVehicle: () => void;
  onOpenImport: () => void;
  onOpenPrintPreview: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  canEdit,
  onAddAuction,
  onAddVehicle,
  onOpenImport,
  onOpenPrintPreview,
}) => {
  const [logoFailed, setLogoFailed] = useState(false);
  const logoSrc = assetUrl('assets/aistudio/logo_1afd1154.png');

  return (
    <section className="no-print relative overflow-hidden border-b-2 border-[#1b5699] bg-[#051c40] text-white shadow-sm">
      {/* Panoramic Institutional Header Matching Reference Image 2:
          Far Right: Wooden Auction Gavel | Center-Right: Deep Navy + Title | Left: SAAED Building + Official Logo + UAE Flag + Car Rows */}
      <div className="relative min-h-[215px] w-full sm:min-h-[235px] lg:h-[248px]">
        {/* Left Scenic Zone: Fixed aspect wrapper keeps official SAAED logo pinned cleanly onto the building fascia */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-full overflow-hidden lg:w-[660px]"
          style={{
            WebkitMaskImage: 'linear-gradient(to right, black 72%, transparent 100%)',
            maskImage: 'linear-gradient(to right, black 72%, transparent 100%)',
          }}
        >
          <img
            src={heroPanoramicImg}
            alt="ساحة مزادات المركبات – شركة ساعد وعلم الإمارات ومبنى ساعد"
            className="h-full w-full object-cover object-[left_35%] select-none"
          />

          {/* Official Authentic SAAED Logo mounted on the modern building's clean white upper fascia */}
          {!logoFailed && (
            <div className="pointer-events-none absolute left-[26.8%] top-[37.5%] hidden -translate-x-1/2 -translate-y-1/2 lg:block">
              <img
                src={logoSrc}
                alt="شعار شركة ساعد SAAED"
                referrerPolicy="no-referrer"
                onError={() => setLogoFailed(true)}
                className="h-7 w-auto max-w-[82px] object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.18)]"
              />
            </div>
          )}
        </div>

        {/* Right Foreground Zone: Realistic Wooden Auction Gavel on Sound Block */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-[260px] overflow-hidden sm:block md:w-[295px] lg:w-[310px]"
          style={{
            WebkitMaskImage: 'linear-gradient(to left, black 64%, transparent 100%)',
            maskImage: 'linear-gradient(to left, black 64%, transparent 100%)',
          }}
        >
          <img
            src={heroPanoramicImg}
            alt="مطرقة مزاد المركبات"
            className="h-full w-full object-cover object-[96%_72%] select-none"
          />
        </div>

        {/* Mobile/Tablet Readability Navy Gradient */}
        <div
          className="pointer-events-none absolute inset-0 lg:hidden"
          style={{
            background:
              'linear-gradient(270deg, rgba(4, 24, 58, 0.94) 0%, rgba(7, 37, 82, 0.84) 55%, rgba(10, 50, 104, 0.48) 100%)',
          }}
        />

        {/* Desktop Smooth Atmospheric Blend Over Center Transition Zone */}
        <div
          className="pointer-events-none absolute inset-0 hidden lg:block"
          style={{
            background:
              'linear-gradient(270deg, rgba(5, 28, 64, 0.12) 0%, rgba(5, 28, 64, 0.88) 18%, rgba(7, 37, 82, 0.92) 42%, rgba(9, 46, 98, 0.45) 56%, rgba(9, 46, 98, 0) 68%)',
          }}
        />

        {/* Subtle Bottom Contrast Strip */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-8"
          style={{
            background:
              'linear-gradient(180deg, rgba(4, 20, 46, 0) 0%, rgba(4, 20, 46, 0.4) 100%)',
          }}
        />

        {/* Content Zone: Center-Right Vertically Centered Single-Line Title + Centered English Subtitle + Bottom Action Buttons */}
        <div className="relative z-10 flex h-full min-h-[215px] flex-col justify-between px-4 py-3 sm:min-h-[235px] sm:pr-[195px] sm:pl-6 lg:min-h-[248px] lg:py-3.5 lg:pr-[205px] xl:pr-[235px] 2xl:pr-[255px]">
          <div className="flex flex-1 items-center justify-start">
            <div className="inline-flex max-w-full flex-col items-center space-y-1 text-center">
              <h1 className="whitespace-nowrap text-[10.5px] font-extrabold leading-snug tracking-tight text-white drop-shadow-[0_2px_8px_rgba(4,20,46,0.9)] min-[480px]:text-[13px] sm:text-[14px] md:text-[15px] lg:text-[15.5px] xl:text-[18px] 2xl:text-[21px]">
                نظام التقرير المالي والتحليل التنفيذي لمزادات المركبات – شركة ساعد
              </h1>
              <p className="text-center text-[10.5px] font-semibold tracking-wide text-blue-100/95 drop-shadow-[0_1px_4px_rgba(4,20,46,0.85)] sm:text-xs">
                SAAED Vehicle Auctions – Financial &amp; Executive Analytics System
              </p>
            </div>
          </div>

          {/* Preserved 3 Category Icons + Functional Action Controls */}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {canEdit && (
                <>
                  <button
                    type="button"
                    onClick={onAddAuction}
                    className="flex items-center gap-1 rounded-lg bg-[#C8232C] px-2.5 py-1.5 text-[11px] font-bold text-white shadow-md transition hover:bg-[#a81b23] whitespace-nowrap"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>إضافة مزاد</span>
                  </button>
                  <button
                    type="button"
                    onClick={onAddVehicle}
                    className="flex items-center gap-1 rounded-lg border border-white/30 bg-[#0B4F93]/90 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-md backdrop-blur-xs transition hover:bg-[#093e75] whitespace-nowrap"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>إضافة مركبة</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenImport}
                    className="flex items-center gap-1 rounded-lg border border-white/35 bg-white/95 px-2.5 py-1.5 text-[11px] font-bold text-[#0A2C52] shadow-md transition hover:bg-blue-50 whitespace-nowrap"
                  >
                    <Upload className="h-3.5 w-3.5 text-[#0B4F93]" />
                    <span>استيراد Excel / CSV</span>
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={onOpenPrintPreview}
                className="flex items-center gap-1 rounded-lg border border-white/35 bg-slate-900/75 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-md backdrop-blur-xs transition hover:bg-slate-900/90 whitespace-nowrap"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>تقرير A4 / PDF</span>
              </button>

              <div className="mr-1 hidden items-center gap-1.5 text-white/90 sm:flex">
                <span
                  title="المركبات المعروضة والمبيعة"
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-white/25 bg-white/10 backdrop-blur-xs"
                >
                  <Car className="h-4 w-4" />
                </span>
                <span
                  title="سجل المزادات"
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-white/25 bg-white/10 backdrop-blur-xs"
                >
                  <Gavel className="h-4 w-4" />
                </span>
                <span
                  title="التحليل المالي ومؤشرات الأداء"
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-white/25 bg-white/10 backdrop-blur-xs"
                >
                  <BarChart3 className="h-4 w-4" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
