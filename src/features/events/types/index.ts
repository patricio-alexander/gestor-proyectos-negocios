export type EventTypeRecord = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  created_at: string;
};

export type EventRecord = {
  id: number;
  app_id: number;
  type_id: number;
  name: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  type?: EventTypeRecord;
};

export type CreateEventInput = {
  app_id: number;
  type_key: string;
  name: string;
  metadata?: Record<string, unknown>;
};
