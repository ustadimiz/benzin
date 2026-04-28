import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSupabaseClient, isSupabaseConfigured } from "./supabase";

const FUEL_STORAGE_KEY_PREFIX = "@yakit_takip";
const MAINTENANCE_STORAGE_KEY_PREFIX = "@bakim_takip";
const CLOUD_TABLE = "user_app_data";

function fuelStorageKey(userId) {
  return `${FUEL_STORAGE_KEY_PREFIX}_${userId}`;
}

function maintenanceStorageKey(userId) {
  return `${MAINTENANCE_STORAGE_KEY_PREFIX}_${userId}`;
}

function canUseCloudSync(userId) {
  return Boolean(userId && userId !== "default" && userId !== "guest-local" && isSupabaseConfigured);
}

async function resolveCloudUserId(userId) {
  if (!isSupabaseConfigured) return userId;
  if (userId === "guest-local" || userId === "default") return userId;

  try {
    const supabase = getSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // On web, prefer the authenticated session user id if available.
    return user?.id || userId;
  } catch {
    return userId;
  }
}

function cloneFuelState(state = {}) {
  const normalized = normalizeStatePayload(state);
  return {
    vehicles: Array.isArray(normalized.vehicles) ? [...normalized.vehicles] : [],
    entries: Array.isArray(normalized.entries) ? [...normalized.entries] : [],
  };
}

function cloneMaintenanceState(state = {}) {
  const normalized = normalizeStatePayload(state);
  return {
    entries: Array.isArray(normalized.entries) ? [...normalized.entries] : [],
  };
}

function normalizeStatePayload(state) {
  if (!state) return {};

  if (typeof state === "string") {
    try {
      const parsed = JSON.parse(state);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  return typeof state === "object" ? state : {};
}

function parseJson(raw) {
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function toComparableTime(value) {
  const timestamp = Date.parse(value || "");
  return Number.isFinite(timestamp) ? timestamp : null;
}

function hasFuelStateData(state) {
  return Array.isArray(state?.vehicles) && state.vehicles.length > 0
    || Array.isArray(state?.entries) && state.entries.length > 0;
}

function hasMaintenanceStateData(state) {
  return Array.isArray(state?.entries) && state.entries.length > 0;
}

function pickPreferredRecord(localRecord, remoteRecord, hasData) {
  if (remoteRecord.hasData && !localRecord.hasData) return remoteRecord;
  if (localRecord.hasData && !remoteRecord.hasData) return localRecord;
  if (!localRecord.hasData && !remoteRecord.hasData) return localRecord;

  if (localRecord.isLegacy && remoteRecord.updatedAt) return remoteRecord;

  const localTime = toComparableTime(localRecord.updatedAt);
  const remoteTime = toComparableTime(remoteRecord.updatedAt);

  if (localTime !== null && remoteTime !== null) {
    return localTime >= remoteTime ? localRecord : remoteRecord;
  }

  if (localTime !== null) return localRecord;
  if (remoteTime !== null) return remoteRecord;

  return hasData(localRecord.state) ? localRecord : remoteRecord;
}

async function syncRemoteFuelRecordQuietly(userId, state, updatedAt) {
  try {
    await writeRemoteFuelRecord(userId, state, updatedAt);
  } catch (error) {
    console.warn("Fuel cloud sync failed", error?.message || error);
  }
}

async function syncRemoteMaintenanceRecordQuietly(userId, state, updatedAt) {
  try {
    await writeRemoteMaintenanceRecord(userId, state, updatedAt);
  } catch (error) {
    console.warn("Maintenance cloud sync failed", error?.message || error);
  }
}

async function readLocalFuelRecord(userId) {
  const parsed = parseJson(await AsyncStorage.getItem(fuelStorageKey(userId)));
  const state = cloneFuelState(parsed);
  return {
    source: "local",
    state,
    updatedAt: parsed?.updatedAt || null,
    isLegacy: Boolean(parsed && !parsed.updatedAt),
    hasData: hasFuelStateData(state),
  };
}

async function readLocalMaintenanceRecord(userId) {
  const parsed = parseJson(await AsyncStorage.getItem(maintenanceStorageKey(userId)));
  const state = cloneMaintenanceState(parsed);
  return {
    source: "local",
    state,
    updatedAt: parsed?.updatedAt || null,
    isLegacy: Boolean(parsed && !parsed.updatedAt),
    hasData: hasMaintenanceStateData(state),
  };
}

async function writeLocalFuelRecord(userId, state, updatedAt = new Date().toISOString()) {
  const payload = {
    ...cloneFuelState(state),
    updatedAt,
  };
  await AsyncStorage.setItem(fuelStorageKey(userId), JSON.stringify(payload));
  return payload;
}

async function writeLocalMaintenanceRecord(userId, state, updatedAt = new Date().toISOString()) {
  const payload = {
    ...cloneMaintenanceState(state),
    updatedAt,
  };
  await AsyncStorage.setItem(maintenanceStorageKey(userId), JSON.stringify(payload));
  return payload;
}

async function readRemoteSnapshot(userId) {
  if (!canUseCloudSync(userId)) return null;

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(CLOUD_TABLE)
      .select("fuel_data, fuel_updated_at, maintenance_data, maintenance_updated_at, is_deleted, deleted_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error) return data || null;

    const fallbackResult = await supabase
      .from(CLOUD_TABLE)
      .select("fuel_data, fuel_updated_at, maintenance_data, maintenance_updated_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (fallbackResult.error) return null;
    return fallbackResult.data || null;
  } catch {
    return null;
  }
}

function buildRemoteFuelRecord(snapshot) {
  const state = cloneFuelState(snapshot?.fuel_data);
  const stateHasData = hasFuelStateData(state);

  // Recovery path: if a stale soft-delete flag exists but payload has data,
  // prefer the payload so users can still access their records.
  if (snapshot?.is_deleted && !stateHasData) {
    return {
      source: "remote",
      state: cloneFuelState(),
      updatedAt: snapshot?.deleted_at || snapshot?.fuel_updated_at || null,
      isLegacy: false,
      hasData: false,
    };
  }

  return {
    source: "remote",
    state,
    updatedAt: snapshot?.fuel_updated_at || null,
    isLegacy: false,
    hasData: stateHasData,
  };
}

function buildRemoteMaintenanceRecord(snapshot) {
  const state = cloneMaintenanceState(snapshot?.maintenance_data);
  const stateHasData = hasMaintenanceStateData(state);

  // Recovery path: if a stale soft-delete flag exists but payload has data,
  // prefer the payload so users can still access their records.
  if (snapshot?.is_deleted && !stateHasData) {
    return {
      source: "remote",
      state: cloneMaintenanceState(),
      updatedAt: snapshot?.deleted_at || snapshot?.maintenance_updated_at || null,
      isLegacy: false,
      hasData: false,
    };
  }

  return {
    source: "remote",
    state,
    updatedAt: snapshot?.maintenance_updated_at || null,
    isLegacy: false,
    hasData: stateHasData,
  };
}

async function writeRemoteFuelRecord(userId, state, updatedAt = new Date().toISOString()) {
  if (!canUseCloudSync(userId)) return;

  const supabase = getSupabaseClient();
  const { error } = await supabase.from(CLOUD_TABLE).upsert(
    {
      user_id: userId,
      fuel_data: cloneFuelState(state),
      fuel_updated_at: updatedAt,
      is_deleted: false,
      deleted_at: null,
      updated_at: updatedAt,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(error.message || "Fuel cloud upsert failed");
  }
}

async function writeRemoteMaintenanceRecord(userId, state, updatedAt = new Date().toISOString()) {
  if (!canUseCloudSync(userId)) return;

  const supabase = getSupabaseClient();
  const { error } = await supabase.from(CLOUD_TABLE).upsert(
    {
      user_id: userId,
      maintenance_data: cloneMaintenanceState(state),
      maintenance_updated_at: updatedAt,
      is_deleted: false,
      deleted_at: null,
      updated_at: updatedAt,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(error.message || "Maintenance cloud upsert failed");
  }
}

export async function loadFuelState(userId) {
  const resolvedUserId = await resolveCloudUserId(userId);
  const localRecord = await readLocalFuelRecord(resolvedUserId);

  if (!canUseCloudSync(resolvedUserId)) {
    return localRecord.state;
  }

  const remoteSnapshot = await readRemoteSnapshot(resolvedUserId);
  const remoteRecord = buildRemoteFuelRecord(remoteSnapshot);
  const preferred = pickPreferredRecord(localRecord, remoteRecord, hasFuelStateData);

  if (preferred.source === "remote" && remoteRecord.hasData) {
    await writeLocalFuelRecord(
      resolvedUserId,
      remoteRecord.state,
      remoteRecord.updatedAt || new Date().toISOString()
    );
  }

  if (preferred.source === "local" && localRecord.hasData) {
    await syncRemoteFuelRecordQuietly(
      resolvedUserId,
      localRecord.state,
      localRecord.updatedAt || new Date().toISOString()
    );
  }

  return preferred.state;
}

export async function loadMaintenanceState(userId) {
  const resolvedUserId = await resolveCloudUserId(userId);
  const localRecord = await readLocalMaintenanceRecord(resolvedUserId);

  if (!canUseCloudSync(resolvedUserId)) {
    return localRecord.state;
  }

  const remoteSnapshot = await readRemoteSnapshot(resolvedUserId);
  const remoteRecord = buildRemoteMaintenanceRecord(remoteSnapshot);
  const preferred = pickPreferredRecord(localRecord, remoteRecord, hasMaintenanceStateData);

  if (preferred.source === "remote" && remoteRecord.hasData) {
    await writeLocalMaintenanceRecord(
      resolvedUserId,
      remoteRecord.state,
      remoteRecord.updatedAt || new Date().toISOString()
    );
  }

  if (preferred.source === "local" && localRecord.hasData) {
    await syncRemoteMaintenanceRecordQuietly(
      resolvedUserId,
      localRecord.state,
      localRecord.updatedAt || new Date().toISOString()
    );
  }

  return preferred.state;
}

export async function saveFuelState(userId, state) {
  const resolvedUserId = await resolveCloudUserId(userId);
  const updatedAt = new Date().toISOString();
  const payload = await writeLocalFuelRecord(resolvedUserId, state, updatedAt);
  await writeRemoteFuelRecord(resolvedUserId, payload, updatedAt);
  return payload;
}

export async function saveMaintenanceState(userId, state) {
  const resolvedUserId = await resolveCloudUserId(userId);
  const updatedAt = new Date().toISOString();
  const payload = await writeLocalMaintenanceRecord(resolvedUserId, state, updatedAt);
  await writeRemoteMaintenanceRecord(resolvedUserId, payload, updatedAt);
  return payload;
}

export async function clearLocalUserData(userId) {
  await AsyncStorage.multiRemove([fuelStorageKey(userId), maintenanceStorageKey(userId)]);
}

export function getEmptyFuelState() {
  return cloneFuelState();
}

export function getEmptyMaintenanceState() {
  return cloneMaintenanceState();
}

export async function loadMaintenanceTypes() {
  if (!canUseCloudSync("dummy")) {
    return [];
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("maintenance_types")
      .select("name")
      .order("name", { ascending: true });

    if (!error && Array.isArray(data)) {
      return data.map((row) => row.name);
    }
  } catch {}

  return [];
}