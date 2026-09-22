export interface RealEstateTabProps {
  properties: any[];
  loading: boolean;
  onSave: (p: any) => void;
  onDelete: (id: any) => void;
  user: any;
  branding: any;
  initialStatusFilter: string;
  onResetStatusFilter: () => void;
  storeId?: number;
}

export type RealEstateViewMode = 'grid' | 'list' | 'calendar' | 'pipeline';
export type RealEstateStatusFilter = 'all' | 'sale' | 'rent' | 'optioned' | 'sold' | 'rented';

export interface ShowingWaitlistItem {
  id: string;
  clientName: string;
  phone: string;
  notes: string;
}

export interface ShowingPrepState {
  alarmArmed: boolean;
  lightsOn: boolean;
  blindsOpen: boolean;
  acAdjusted: boolean;
  scentRefreshed: boolean;
  flyersPresent: boolean;
}
