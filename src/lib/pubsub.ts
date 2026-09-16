// Pub/Sub helper — minimal, no @google-cloud/pubsub dep
// Real flow: GBP → Pub/Sub topic → push subscription → POST /api/google/pubsub

export type PubSubPushBody = {
  message: {
    data: string; // base64
    attributes?: Record<string, string>;
    messageId: string;
    publishTime: string;
  };
  subscription: string;
};

export function decodePubSubData(data: string): any {
  try {
    const json = Buffer.from(data, "base64").toString("utf-8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Extract location name from various GBP notification formats
export function extractLocationFromNotification(payload: any): string | null {
  // Try several known shapes
  // 1) Business Profile Notifications API: { name: "accounts/.../locations/...", eventType: "REVIEW" }
  if (payload?.locationName) return payload.locationName;
  if (payload?.name && payload.name.includes("/locations/")) return payload.name;
  if (payload?.review?.name) {
    // review name: accounts/a/locations/l/review/r → extract location
    const parts = payload.review.name.split("/");
    const locIdx = parts.indexOf("locations");
    if (locIdx !== -1) return parts.slice(0, locIdx + 2).join("/");
  }
  if (payload?.location) return payload.location;
  if (payload?.attributes?.locationName) return payload.attributes.locationName;
  return null;
}

// For creating subscription via API (optional, requires GCP creds)
// ponytail: keep as doc, not auto-run in dev
export async function createGbpNotificationSetting(accessToken: string, accountName: string, pubSubTopic: string) {
  // POST https://mybusinessaccountmanagement.googleapis.com/v1/accounts/{account}/notificationSetting
  // body: { pubsubTopic: "projects/{project}/topics/{topic}", notificationTypes: ["NEW_REVIEW", "UPDATED_REVIEW"] }
  const url = `https://mybusinessaccountmanagement.googleapis.com/v1/${accountName}/notificationSetting`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      pubSubTopic,
      notificationTypes: ["NEW_REVIEW", "UPDATED_REVIEW", "NEW_CUSTOMER_MEDIA", "UPDATED_CUSTOMER_MEDIA"],
    }),
  });
  if (!res.ok) throw new Error(`notificationSetting failed: ${await res.text()}`);
  return res.json();
}
