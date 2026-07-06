export type OfferModule = {
  module_id: number;
  module_name: string;
};

export type Offer = {
  id: number;
  app_id: number;
  app_name?: string | null;
  name: string;
  price: number | null;
  start_at: string;
  expires_at: string;
  modules: OfferModule[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CreateOfferInput = {
  name: string;
  app_id: number;
  price?: number | null;
  start_at: string;
  expires_at: string;
  module_ids?: number[];
};

export type UpdateOfferInput = {
  name?: string;
  app_id?: number;
  price?: number | null;
  start_at?: string;
  expires_at?: string;
  module_ids?: number[];
};
