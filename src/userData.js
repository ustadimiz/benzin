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

function cloneFuelState(state = {}) {
  return {
    vehicles: Array.isArray(state.vehicles) ? [...state.vehicles] : [],
    entries: Array.isArray(state.entries) ? [...state.entries] : [],
  };
}

function cloneMaintenanceState(state = {}) {
  return {
    entries: Array.isArray(state.entries) ? [...state.entries] : [],
  };
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
  if (snapshot?.is_deleted) {
    return {
      source: "remote",
      state: cloneFuelState(),
      updatedAt: snapshot?.deleted_at || snapshot?.fuel_updated_at || null,
      isLegacy: false,
      hasData: false,
    };
  }

  const state = cloneFuelState(snapshot?.fuel_data);
  return {
    source: "remote",
    state,
    updatedAt: snapshot?.fuel_updated_at || null,
    isLegacy: false,
    hasData: hasFuelStateData(state),
  };
}

function buildRemoteMaintenanceRecord(snapshot) {
  if (snapshot?.is_deleted) {
    return {
      source: "remote",
      state: cloneMaintenanceState(),
      updatedAt: snapshot?.deleted_at || snapshot?.maintenance_updated_at || null,
      isLegacy: false,
      hasData: false,
    };
  }

  const state = cloneMaintenanceState(snapshot?.maintenance_data);
  return {
    source: "remote",
    state,
    updatedAt: snapshot?.maintenance_updated_at || null,
    isLegacy: false,
    hasData: hasMaintenanceStateData(state),
  };
}

async function writeRemoteFuelRecord(userId, state, updatedAt = new Date().toISOString()) {
  if (!canUseCloudSync(userId)) return;

  const supabase = getSupabaseClient();
  await supabase.from(CLOUD_TABLE).upsert(
    {
      user_id: userId,
      fuel_data: cloneFuelState(state),
      fuel_updated_at: updatedAt,
      updated_at: updatedAt,
    },
    { onConflict: "user_id" }
  );
}

async function writeRemoteMaintenanceRecord(userId, state, updatedAt = new Date().toISOString()) {
  if (!canUseCloudSync(userId)) return;

  const supabase = getSupabaseClient();
  await supabase.from(CLOUD_TABLE).upsert(
    {
      user_id: userId,
      maintenance_data: cloneMaintenanceState(state),
      maintenance_updated_at: updatedAt,
      updated_at: updatedAt,
    },
    { onConflict: "user_id" }
  );
}

export async function loadFuelState(userId) {
  const localRecord = await readLocalFuelRecord(userId);

  if (!canUseCloudSync(userId)) {
    return localRecord.state;
  }

  const remoteSnapshot = await readRemoteSnapshot(userId);
  const remoteRecord = buildRemoteFuelRecord(remoteSnapshot);
  const preferred = pickPreferredRecord(localRecord, remoteRecord, hasFuelStateData);

  if (preferred.source === "remote" && remoteRecord.hasData) {
    await writeLocalFuelRecord(userId, remoteRecord.state, remoteRecord.updatedAt || new Date().toISOString());
  }

  if (preferred.source === "local" && localRecord.hasData) {
    await writeRemoteFuelRecord(userId, localRecord.state, localRecord.updatedAt || new Date().toISOString());
  }

  return preferred.state;
}

export async function loadMaintenanceState(userId) {
  const localRecord = await readLocalMaintenanceRecord(userId);

  if (!canUseCloudSync(userId)) {
    return localRecord.state;
  }

  const remoteSnapshot = await readRemoteSnapshot(userId);
  const remoteRecord = buildRemoteMaintenanceRecord(remoteSnapshot);
  const preferred = pickPreferredRecord(localRecord, remoteRecord, hasMaintenanceStateData);

  if (preferred.source === "remote" && remoteRecord.hasData) {
    await writeLocalMaintenanceRecord(
      userId,
      remoteRecord.state,
      remoteRecord.updatedAt || new Date().toISOString()
    );
  }

  if (preferred.source === "local" && localRecord.hasData) {
    await writeRemoteMaintenanceRecord(
      userId,
      localRecord.state,
      localRecord.updatedAt || new Date().toISOString()
    );
  }

  return preferred.state;
}

export async function saveFuelState(userId, state) {
  const updatedAt = new Date().toISOString();
  const payload = await writeLocalFuelRecord(userId, state, updatedAt);
  await writeRemoteFuelRecord(userId, payload, updatedAt);
  return payload;
}

export async function saveMaintenanceState(userId, state) {
  const updatedAt = new Date().toISOString();
  const payload = await writeLocalMaintenanceRecord(userId, state, updatedAt);
  await writeRemoteMaintenanceRecord(userId, payload, updatedAt);
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