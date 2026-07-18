import type { EventRecord } from "@/src/features/events/types";
import { createEvent } from "./events-service";

export type NormalizedWebhookEvent = {
  type_key: string;
  name: string;
  metadata?: Record<string, unknown>;
};

export type IngestWebhookResult = {
  event: EventRecord;
  type_key: string;
};

function humanizeEventTypeKey(key: string): string {
  return key
    .split(/[.:_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function normalizeWebhookBody(
  body: Record<string, unknown>,
): NormalizedWebhookEvent | { error: string } {
  const type_key =
    (typeof body.type_key === "string" && body.type_key.trim()) ||
    (typeof body.event_type === "string" && body.event_type.trim()) ||
    (typeof body.type === "string" && body.type.trim()) ||
    "";

  if (!type_key) {
    return {
      error: "type_key es obligatorio (alias: event_type, type)",
    };
  }

  const name =
    (typeof body.name === "string" && body.name.trim()) ||
    (typeof body.event_name === "string" && body.event_name.trim()) ||
    humanizeEventTypeKey(type_key);

  let metadata: Record<string, unknown> | undefined;

  if (
    body.metadata != null &&
    typeof body.metadata === "object" &&
    !Array.isArray(body.metadata)
  ) {
    metadata = body.metadata as Record<string, unknown>;
  } else {
    const rest = { ...body };
    delete rest.type_key;
    delete rest.event_type;
    delete rest.type;
    delete rest.name;
    delete rest.event_name;
    delete rest.metadata;
    if (Object.keys(rest).length > 0) metadata = rest;
  }

  return { type_key, name, metadata };
}

export async function ingestAppWebhookEvent(
  appId: number,
  body: Record<string, unknown>,
): Promise<IngestWebhookResult> {
  const normalized = normalizeWebhookBody(body);
  if ("error" in normalized) {
    throw Object.assign(new Error(normalized.error), { statusCode: 400 });
  }

  const event = await createEvent({
    app_id: appId,
    type_key: normalized.type_key,
    name: normalized.name,
    metadata: normalized.metadata ?? body,
    source: "webhook",
  });

  return {
    event,
    type_key: normalized.type_key,
  };
}
