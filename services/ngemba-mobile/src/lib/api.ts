import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra as
  | { ngembaApiUrl?: string }
  | undefined;

export function apiBaseUrl(): string {
  return (
    process.env.EXPO_PUBLIC_NGEMBA_API_URL?.replace(/\/$/, "") ||
    extra?.ngembaApiUrl?.replace(/\/$/, "") ||
    "https://ngemba.cyberalert-rdc.org"
  );
}

export type CreateAlertInput = {
  message: string;
  locale: string;
  source: "sos_button" | "witness" | "chat";
  discrete?: boolean;
  shareLocation?: boolean;
  lat?: number | null;
  lng?: number | null;
  provinceId?: string | null;
  cityId?: string | null;
};

export type CreateAlertResult = {
  id: string;
  urgency: string;
  category: string;
  summary?: string;
  locationLabel?: string | null;
};

export async function createAlert(
  input: CreateAlertInput,
): Promise<CreateAlertResult> {
  const res = await fetch(`${apiBaseUrl()}/api/alerts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: input.message,
      locale: input.locale,
      source: input.source,
      discrete: Boolean(input.discrete),
      shareLocation: Boolean(input.shareLocation),
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      provinceId: input.provinceId ?? null,
      cityId: input.cityId ?? null,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.id) {
    throw new Error(data.error || "alert_failed");
  }
  return data as CreateAlertResult;
}

export async function fetchSession(id: string) {
  const res = await fetch(`${apiBaseUrl()}/api/alerts/${id}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.session) {
    throw new Error(data.error || "not_found");
  }
  return data.session as {
    id: string;
    urgency: string;
    aiSummary: string;
    locationLabel: string | null;
    commune: string | null;
    aiPayload?: { summary_user_locale?: string };
  };
}

export type ProvinceOption = {
  id: string;
  name: string;
  cities: Array<{ id: string; name: string }>;
};

export async function fetchProvinces(): Promise<ProvinceOption[]> {
  const res = await fetch(`${apiBaseUrl()}/api/location/resolve`);
  const data = await res.json().catch(() => ({}));
  return data.provinces ?? [];
}
