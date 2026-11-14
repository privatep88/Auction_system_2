import type { Auction, Vehicle } from '../types';

export type VehicleAuctionLinkStatus = 'linked' | 'unlinked' | 'unavailable';

export interface ResolvedVehicleAuction {
  status: VehicleAuctionLinkStatus;
  label: string;
  auctionCode?: string;
}

export function buildAuctionLookupMap(auctions: readonly Auction[]): Map<string, Auction> {
  const map = new Map<string, Auction>();
  for (const auction of auctions) {
    if (auction.id) {
      map.set(auction.id, auction);
    }
  }
  return map;
}

export function resolveVehicleAuction(
  vehicle: Pick<Vehicle, 'auctionId'>,
  auctionsById: ReadonlyMap<string, Auction>
): ResolvedVehicleAuction {
  const rawId = typeof vehicle.auctionId === 'string' ? vehicle.auctionId.trim() : '';
  if (!rawId || rawId === 'general_auction') {
    return {
      status: 'unlinked',
      label: 'غير مرتبط بمزاد',
    };
  }

  const matchedAuction = auctionsById.get(rawId);
  if (matchedAuction) {
    const cleanTitle = (matchedAuction.title || '').trim();
    return {
      status: 'linked',
      label: cleanTitle || matchedAuction.auctionCode || 'مزاد مسجل',
      auctionCode: matchedAuction.auctionCode,
    };
  }

  return {
    status: 'unavailable',
    label: 'مزاد غير متاح',
  };
}
