import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { t as getT } from "./i18n";
import { loadFuelState, saveFuelState } from "./userData";

const fuelAccent = { benzin: "#F59E0B", motorin: "#0EA5E9", lpg: "#22C55E" };
const fmt = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const columnWidths = {
  date: 92,
  km: 90,
  type: 76,
  litre: 72,
  amount: 92,
  unit: 92,
  tlPerKm: 88,
  litrePer100: 96,
  actions: 70,
};
const tableMinWidth = Object.values(columnWidths).reduce((sum, n) => sum + n, 0);

function parseNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  if (typeof value !== "string") return NaN;

  const cleaned = value.trim().replace(/\s/g, "");
  if (!cleaned) return NaN;

  // Support TR inputs like "1.850,75" and generic decimal inputs like "1850.75".
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;

  return Number(normalized);
}

function formatDateTR(date) {
  return date.toLocaleDateString("tr-TR");
}

function parseEntryDate(value) {
  if (!value || typeof value !== "string") return new Date();

  const trMatch = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (trMatch) {
    const day = Number(trMatch[1]);
    const month = Number(trMatch[2]) - 1;
    const year = Number(trMatch[3]);
    const parsed = new Date(year, month, day);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? new Date() : fallback;
}

// ── Boş form şablonu ──────────────────────────────────────────────
const emptyEntry = () => ({
  id: Date.now().toString(),
  date: formatDateTR(new Date()),
  fuelType: "benzin",
  litre: "",
  totalAmount: "",
  km: "",
  station: "",
});

// ── Hesaplamalar ─────────────────────────────────────────────────
function calcStats(entry) {
  const litre = parseNumber(entry.litre);
  const total = parseNumber(entry.totalAmount);
  const unitPrice = litre > 0 ? total / litre : null;
  return { unitPrice };
}

function calcEntryDeltaStats(curr, prev) {
  if (!curr || !prev) return { tlPer1km: null, litrePer100km: null };

  const currKm = parseNumber(curr.km);
  const prevKm = parseNumber(prev.km);
  const litre = parseNumber(curr.litre);
  const total = parseNumber(curr.totalAmount);
  const kmDiff = currKm - prevKm;

  if (!(kmDiff > 0) || !(litre > 0) || !(total >= 0)) {
    return { tlPer1km: null, litrePer100km: null };
  }

  return {
    tlPer1km: total / kmDiff,
    litrePer100km: (litre / kmDiff) * 100,
  };
}

function calcCrossEntryStats(entries, vehicleId) {
  const vehicleEntries = entries
    .filter((e) => e.vehicleId === vehicleId && parseNumber(e.km) > 0 && parseNumber(e.litre) > 0)
    .sort((a, b) => parseNumber(a.km) - parseNumber(b.km));

  if (vehicleEntries.length < 2) return null;

  const rows = [];
  for (let i = 1; i < vehicleEntries.length; i++) {
    const prev = vehicleEntries[i - 1];
    const curr = vehicleEntries[i];
    const kmDiff = parseNumber(curr.km) - parseNumber(prev.km);
    const litre = parseNumber(curr.litre);
    const total = parseNumber(curr.totalAmount);
    if (kmDiff > 0 && litre > 0) {
      rows.push({
        tlPer1km: total / kmDiff,
        tlPer100km: (total / kmDiff) * 100,
        litrePer100km: (litre / kmDiff) * 100,
      });
    }
  }

  if (rows.length === 0) return null;

  const avg = (key) => rows.reduce((s, r) => s + r[key], 0) / rows.length;
  return {
    avgTlPer1km: avg("tlPer1km"),
    avgTlPer100km: avg("tlPer100km"),
    avgLitrePer100km: avg("litrePer100km"),
  };
}

// ─────────────────────────────────────────────────────────────────
export default function FuelTrackerScreen({ lang = "tr", userId = "default", themeMode = "dark" }) {
  const i = getT(lang);
  const isDark = themeMode === "dark";
  const fuelLabels = { benzin: i.benzin, motorin: i.motorin, lpg: i.lpg };
  const { width: windowWidth } = useWindowDimensions();
  const isWide = windowWidth >= 768;
  const isDesktop = windowWidth >= 1200;

  const [vehicles, setVehicles] = useState([]);
  const [entries, setEntries] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Modal görünürlükleri
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Formlar
  const [vehicleForm, setVehicleForm] = useState({ brand: "", model: "", plate: "" });
  const [entryForm, setEntryForm] = useState(emptyEntry());

  const loadData = async () => {
    try {
      const parsed = await loadFuelState(userId);
      const nextVehicles = parsed.vehicles || [];
      const nextEntries = parsed.entries || [];

      setVehicles(nextVehicles);
      setEntries(nextEntries);
      setSelectedVehicle((current) => nextVehicles.find((vehicle) => vehicle.id === current?.id) || nextVehicles[0] || null);
    } catch (_) {}
  };

  // ── Storage yükle ───────────────────────────────────────────────
  useEffect(() => {
    loadData();
  }, [userId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // ── Storage kaydet ──────────────────────────────────────────────
  async function persist(nextVehicles, nextEntries) {
    try {
      await saveFuelState(userId, { vehicles: nextVehicles, entries: nextEntries });
    } catch (_) {}
  }

  // ── Araç ekle ───────────────────────────────────────────────────
  function submitVehicle() {
    if (!vehicleForm.brand.trim() || !vehicleForm.model.trim()) {
      Alert.alert(i.missingInfo, i.vehicleRequired);
      return;
    }

    if (editingVehicleId) {
      const updatedVehicle = { id: editingVehicleId, ...vehicleForm };
      const next = vehicles.map((v) => (v.id === editingVehicleId ? updatedVehicle : v));
      setVehicles(next);
      if (selectedVehicle?.id === editingVehicleId) {
        setSelectedVehicle(updatedVehicle);
      }
      persist(next, entries);
    } else {
      const vehicle = { id: Date.now().toString(), ...vehicleForm };
      const next = [...vehicles, vehicle];
      setVehicles(next);
      setSelectedVehicle(vehicle);
      persist(next, entries);
    }

    setEditingVehicleId(null);
    setVehicleForm({ brand: "", model: "", plate: "" });
    setShowAddVehicle(false);
  }

  const startEditVehicle = (vehicle) => {
    setEditingVehicleId(vehicle.id);
    setVehicleForm({
      brand: vehicle.brand || "",
      model: vehicle.model || "",
      plate: vehicle.plate || "",
    });
    setShowAddVehicle(true);
  };

  const cancelVehicleModal = () => {
    setEditingVehicleId(null);
    setVehicleForm({ brand: "", model: "", plate: "" });
    setShowAddVehicle(false);
  };

  // ── Aracı sil ────────────────────────────────────────────────────
  function deleteVehicle(vehicleId) {
    Alert.alert(i.deleteVehicleTitle, i.deleteVehicleMsg, [
      { text: i.cancel, style: "cancel" },
      {
        text: i.deleteVehicleTitle, style: "destructive", onPress: () => {
          const nextVehicles = vehicles.filter((v) => v.id !== vehicleId);
          const nextEntries = entries.filter((e) => e.vehicleId !== vehicleId);
          setVehicles(nextVehicles);
          setEntries(nextEntries);
          if (selectedVehicle?.id === vehicleId) {
            setSelectedVehicle(nextVehicles.length > 0 ? nextVehicles[0] : null);
          }
          setEditingVehicleId(null);
          setShowAddVehicle(false);
          persist(nextVehicles, nextEntries);
        }
      }
    ]);
  }

  // ── Yakıt girişi ekle / düzenle ────────────────────────────────
  function submitEntry() {
    if (!entryForm.litre || !entryForm.totalAmount || !entryForm.km) {
      Alert.alert(i.missingInfo, i.fuelRequired);
      return;
    }

    if (editingId) {
      const updatedEntries = entries.map((e) =>
        e.id === editingId
          ? { ...entryForm, id: editingId, vehicleId: selectedVehicle.id }
          : e
      );
      setEntries(updatedEntries);
      persist(vehicles, updatedEntries);
      setEditingId(null);
    } else {
      const entry = { ...entryForm, id: Date.now().toString(), vehicleId: selectedVehicle.id };
      const next = [...entries, entry];
      setEntries(next);
      persist(vehicles, next);
    }

    setEntryForm(emptyEntry());
    setShowDatePicker(false);
    setShowAddEntry(false);
  }

  const startEdit = (item) => {
    setEditingId(item.id);
    setShowDatePicker(false);
    setEntryForm({
      id: item.id,
      date: item.date || formatDateTR(new Date()),
      fuelType: item.fuelType || "benzin",
      litre: String(item.litre ?? ""),
      totalAmount: String(item.totalAmount ?? ""),
      km: String(item.km ?? ""),
      station: item.station || "",
      vehicleId: item.vehicleId,
    });
    setShowAddEntry(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowDatePicker(false);
    setEntryForm(emptyEntry());
    setShowAddEntry(false);
  };

  // ── Giriş sil ───────────────────────────────────────────────────
  function deleteEntry(id) {
    Alert.alert(i.deleteTitle, i.deleteMsg, [
      { text: i.cancel, style: "cancel" },
      {
        text: i.deleteTitle, style: "destructive", onPress: () => {
          const next = entries.filter((e) => e.id !== id);
          setEntries(next);
          persist(vehicles, next);
        }
      }
    ]);
  }

  // ── Seçili araca ait girişler ───────────────────────────────────
  const vehicleEntries = selectedVehicle
    ? entries.filter((e) => e.vehicleId === selectedVehicle.id).sort((a, b) => parseNumber(b.km) - parseNumber(a.km))
    : [];

  const crossStats = selectedVehicle ? calcCrossEntryStats(entries, selectedVehicle.id) : null;
  const totals = vehicleEntries.reduce(
    (acc, e) => {
      const litre = parseNumber(e.litre);
      const total = parseNumber(e.totalAmount);
      if (litre > 0) acc.totalLitre += litre;
      if (total > 0) acc.totalCost += total;
      return acc;
    },
    { totalLitre: 0, totalCost: 0 }
  );
  const avgUnitPrice = totals.totalLitre > 0 ? totals.totalCost / totals.totalLitre : null;

  // ── Render ──────────────────────────────────────────────────────
  const styles = createStyles(isDark);

  return (
    <View style={[styles.container, isWide && styles.containerWide, isDesktop && styles.containerDesktop]}>

      {/* Araç Seçici */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vehicleRow} contentContainerStyle={styles.vehicleRowContent}>
        {vehicles.map((v) => (
          <Pressable
            key={v.id}
            onPress={() => {
              if (selectedVehicle?.id === v.id) {
                startEditVehicle(v);
              } else {
                setSelectedVehicle(v);
              }
            }}
            style={[styles.vehicleChip, selectedVehicle?.id === v.id && styles.vehicleChipActive]}
          >
            <Text style={styles.vehicleChipIcon}>🚗</Text>
            <Text style={[styles.vehicleChipText, selectedVehicle?.id === v.id && styles.vehicleChipTextActive]}>
              {v.brand} {v.model}
            </Text>
            {v.plate ? <Text style={styles.vehiclePlate}>{v.plate}</Text> : null}
          </Pressable>
        ))}
        <Pressable
          onPress={() => {
            setEditingVehicleId(null);
            setVehicleForm({ brand: "", model: "", plate: "" });
            setShowAddVehicle(true);
          }}
          style={styles.addVehicleBtn}
        >
          <Text style={styles.addVehicleBtnText}>{i.addVehicleBtn}</Text>
        </Pressable>
      </ScrollView>

      {/* Seçili araç yoksa boş durum */}
      {!selectedVehicle ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🚗</Text>
          <Text style={styles.emptyStateText}>{i.noVehicle}</Text>
          <Text style={styles.emptyStateSub}>{i.noVehicleSub}</Text>
        </View>
      ) : (
        <>
          {/* KPI kartları */}
          {(vehicleEntries.length > 0 || crossStats) && (
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>{i.statTotalCost}</Text>
                <Text style={styles.statValue}>{fmt.format(totals.totalCost)} ₺</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>{i.statTotalLitre}</Text>
                <Text style={styles.statValue}>{fmt.format(totals.totalLitre)} L</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>{i.statAvgUnitPrice}</Text>
                <Text style={styles.statValue}>{avgUnitPrice ? fmt.format(avgUnitPrice) + " ₺" : "-"}</Text>
              </View>
            </View>
          )}

          {crossStats && (
            <View style={[styles.statsRow, styles.statsRowSecondary]}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>{i.statEfficiency}</Text>
                <Text style={styles.statValue}>{fmt.format(crossStats.avgLitrePer100km)} L</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>{i.statCostPer100km}</Text>
                <Text style={styles.statValue}>{fmt.format(crossStats.avgTlPer100km)} ₺</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>{i.statCostPerKm}</Text>
                <Text style={styles.statValue}>{fmt.format(crossStats.avgTlPer1km)} ₺</Text>
              </View>
            </View>
          )}

          <View style={[styles.tableCard, isDesktop && styles.tableCardDesktop]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tableScrollContent}>
              <View style={{ minWidth: tableMinWidth }}>
                {/* Grid başlığı */}
                <View style={styles.gridHeader}>
                  <Text numberOfLines={1} style={[styles.gridHeaderCell, { width: columnWidths.date }]}>{i.colDate}</Text>
                  <Text numberOfLines={1} style={[styles.gridHeaderCell, { width: columnWidths.km }]}>{i.colKm}</Text>
                  <Text numberOfLines={1} style={[styles.gridHeaderCell, { width: columnWidths.type }]}>{i.colType}</Text>
                  <Text numberOfLines={1} style={[styles.gridHeaderCell, { width: columnWidths.litre }]}>{i.colLitre}</Text>
                  <Text numberOfLines={1} style={[styles.gridHeaderCell, { width: columnWidths.amount }]}>{i.colAmount}</Text>
                  <Text numberOfLines={1} style={[styles.gridHeaderCell, { width: columnWidths.unit }]}>{i.colUnit}</Text>
                  <Text numberOfLines={1} style={[styles.gridHeaderCell, { width: columnWidths.tlPerKm }]}>{i.colTlPerKm}</Text>
                  <Text numberOfLines={1} style={[styles.gridHeaderCell, { width: columnWidths.litrePer100 }]}>{i.colLitrePer100km}</Text>
                  <Text numberOfLines={1} style={[styles.gridHeaderCell, { width: columnWidths.actions }]}></Text>
                </View>

                {vehicleEntries.length === 0 ? (
                  <View style={styles.emptyStateInline}>
                    <Text style={styles.emptyStateText}>{i.noFuelEntry}</Text>
                  </View>
                ) : (
                  <FlatList
                    data={vehicleEntries}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D3ECFB" />}
                    renderItem={({ item, index }) => {
                      const { unitPrice } = calcStats(item);
                      const prevEntry = vehicleEntries[index + 1];
                      const { tlPer1km, litrePer100km } = calcEntryDeltaStats(item, prevEntry);
                      const accent = fuelAccent[item.fuelType] || "#F59E0B";
                      return (
                        <View style={[styles.gridRow, index % 2 === 1 && styles.gridRowAlt]}>
                          <Text numberOfLines={1} style={[styles.gridCell, styles.gridCellLeft, { width: columnWidths.date }]}>{item.date}</Text>
                          <Text numberOfLines={1} style={[styles.gridCell, { width: columnWidths.km }]}>{item.km}</Text>
                          <Text numberOfLines={1} style={[styles.gridCell, { width: columnWidths.type, color: accent, fontWeight: "700" }]}>
                            {fuelLabels[item.fuelType]}
                          </Text>
                          <Text numberOfLines={1} style={[styles.gridCell, { width: columnWidths.litre }]}>{item.litre}</Text>
                          <Text numberOfLines={1} style={[styles.gridCell, { width: columnWidths.amount }]}>{item.totalAmount} ₺</Text>
                          <Text numberOfLines={1} style={[styles.gridCell, { width: columnWidths.unit }]}>
                            {unitPrice ? fmt.format(unitPrice) + " ₺" : "-"}
                          </Text>
                          <Text numberOfLines={1} style={[styles.gridCell, { width: columnWidths.tlPerKm }]}>{tlPer1km ? fmt.format(tlPer1km) : "-"}</Text>
                          <Text numberOfLines={1} style={[styles.gridCell, { width: columnWidths.litrePer100 }]}>{litrePer100km ? fmt.format(litrePer100km) : "-"}</Text>
                          <View style={[styles.rowActions, { width: columnWidths.actions }]}>
                            <Pressable style={styles.rowIconBtn} onPress={() => startEdit(item)}>
                              <Text style={styles.rowEditIcon}>✎</Text>
                            </Pressable>
                            <Pressable style={styles.rowIconBtn} onPress={() => deleteEntry(item.id)}>
                              <Text style={styles.rowDeleteIcon}>✕</Text>
                            </Pressable>
                          </View>
                        </View>
                      );
                    }}
                  />
                )}
              </View>
            </ScrollView>
          </View>

          <Pressable onPress={() => {
            setShowDatePicker(false);
            setShowAddEntry(true);
          }} style={styles.fab}>
            <Text style={styles.fabText}>{i.addFuelEntry}</Text>
          </Pressable>
        </>
      )}

      {/* ── Modal: Araç Ekle ─────────────────────────────────────── */}
      <Modal visible={showAddVehicle} transparent animationType="slide" onRequestClose={() => setShowAddVehicle(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{editingVehicleId ? i.editVehicleTitle : i.addVehicleTitle}</Text>
            <TextInput
              style={styles.input}
              placeholder={i.brandPlaceholder}
              placeholderTextColor="#4A7A94"
              value={vehicleForm.brand}
              onChangeText={(t) => setVehicleForm((f) => ({ ...f, brand: t }))}
            />
            <TextInput
              style={styles.input}
              placeholder={i.modelPlaceholder}
              placeholderTextColor="#4A7A94"
              value={vehicleForm.model}
              onChangeText={(t) => setVehicleForm((f) => ({ ...f, model: t }))}
            />
            <TextInput
              style={styles.input}
              placeholder={i.platePlaceholder}
              placeholderTextColor="#4A7A94"
              value={vehicleForm.plate}
              onChangeText={(t) => setVehicleForm((f) => ({ ...f, plate: t }))}
              autoCapitalize="characters"
            />
            <View style={styles.modalBtns}>
              {editingVehicleId ? (
                <>
                  <Pressable onPress={() => deleteVehicle(editingVehicleId)} style={[styles.modalBtnCancel, styles.modalBtnDelete]}>
                    <Text style={styles.modalBtnCancelText}>{i.deleteVehicleTitle}</Text>
                  </Pressable>
                  <Pressable onPress={cancelVehicleModal} style={styles.modalBtnCancel}>
                    <Text style={styles.modalBtnCancelText}>{i.cancel}</Text>
                  </Pressable>
                  <Pressable onPress={submitVehicle} style={styles.modalBtnSave}>
                    <Text style={styles.modalBtnSaveText}>{i.update}</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable onPress={cancelVehicleModal} style={styles.modalBtnCancel}>
                    <Text style={styles.modalBtnCancelText}>{i.cancel}</Text>
                  </Pressable>
                  <Pressable onPress={submitVehicle} style={styles.modalBtnSave}>
                    <Text style={styles.modalBtnSaveText}>{i.save}</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Modal: Yakıt Girişi ──────────────────────────────────── */}
      <Modal visible={showAddEntry} transparent animationType="slide" onRequestClose={() => setShowAddEntry(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>{editingId ? i.editFuelTitle : i.addFuelTitle}</Text>
              {selectedVehicle && (
                <Text style={styles.modalVehicleLabel}>
                  🚗 {selectedVehicle.brand} {selectedVehicle.model} {selectedVehicle.plate ? `· ${selectedVehicle.plate}` : ""}
                </Text>
              )}

              <Text style={styles.inputLabel}>{i.datePlaceholder}</Text>
              <Pressable
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={[styles.datePickerText, !entryForm.date && styles.datePickerPlaceholder]}>
                  {entryForm.date || i.datePlaceholder}
                </Text>
              </Pressable>

              {showDatePicker && (
                <DateTimePicker
                  value={parseEntryDate(entryForm.date)}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event, selectedDate) => {
                    if (event.type === "dismissed") return;
                    if (selectedDate) {
                      setShowDatePicker(false);
                      setEntryForm((f) => ({ ...f, date: formatDateTR(selectedDate) }));
                    }
                  }}
                />
              )}

              <Text style={styles.inputLabel}>{i.fuelTypeLabel}</Text>
              <View style={styles.fuelTypeRow}>
                {["benzin", "motorin", "lpg"].map((ft) => (
                  <Pressable
                    key={ft}
                    onPress={() => setEntryForm((f) => ({ ...f, fuelType: ft }))}
                    style={[
                      styles.fuelTypeChip,
                      entryForm.fuelType === ft && { backgroundColor: fuelAccent[ft], borderColor: fuelAccent[ft] }
                    ]}
                  >
                    <Text style={[styles.fuelTypeChipText, entryForm.fuelType === ft && { color: "#081B26" }]}>
                      {fuelLabels[ft]}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                style={styles.input}
                placeholder={i.litrePlaceholder}
                placeholderTextColor="#4A7A94"
                value={entryForm.litre}
                onChangeText={(t) => setEntryForm((f) => ({ ...f, litre: t }))}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={styles.input}
                placeholder={i.amountPlaceholder}
                placeholderTextColor="#4A7A94"
                value={entryForm.totalAmount}
                onChangeText={(t) => setEntryForm((f) => ({ ...f, totalAmount: t }))}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={styles.input}
                placeholder={i.kmPlaceholder}
                placeholderTextColor="#4A7A94"
                value={entryForm.km}
                onChangeText={(t) => setEntryForm((f) => ({ ...f, km: t }))}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder={i.stationPlaceholder}
                placeholderTextColor="#4A7A94"
                value={entryForm.station}
                onChangeText={(t) => setEntryForm((f) => ({ ...f, station: t }))}
              />

              <View style={styles.modalBtns}>
                <Pressable onPress={submitEntry} style={styles.modalBtnSave}>
                  <Text style={styles.modalBtnSaveText}>{editingId ? i.update : i.save}</Text>
                </Pressable>
                <Pressable onPress={cancelEdit} style={styles.modalBtnCancel}>
                  <Text style={styles.modalBtnCancelText}>{i.cancel}</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const createStyles = (isDark) => StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingVertical: 12 },
  containerWide: { maxWidth: 960, alignSelf: "center", width: "100%" },
  containerDesktop: { maxWidth: 1100, paddingHorizontal: 24 },
  headerHintCard: {
    backgroundColor: isDark ? "#0E2736" : "#E8F4FA",
    borderWidth: 1,
    borderColor: isDark ? "#1A4056" : "#C7E0ED",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10
  },
  headerHintTitle: { color: isDark ? "#E8F5FD" : "#0F3B52", fontSize: 16, fontWeight: "700" },
  headerHintText: { color: isDark ? "#9BBBCF" : "#4A7588", fontSize: 12, marginTop: 2 },

  // Araç seçici
  vehicleRow: { maxHeight: 78, marginBottom: 12 },
  vehicleRowContent: { gap: 10, paddingVertical: 6, alignItems: "center", paddingRight: 8 },
  vehicleChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: isDark ? "#0F2331" : "#FFFFFF", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: isDark ? "#274B61" : "#C7D9E5"
  },
  vehicleChipActive: { backgroundColor: isDark ? "#133246" : "#DCEEF9", borderColor: isDark ? "#4FAED9" : "#1B7FAB" },
  vehicleChipIcon: { fontSize: 16 },
  vehicleChipText: { color: isDark ? "#B2CFDF" : "#47657A", fontWeight: "600", fontSize: 13 },
  vehicleChipTextActive: { color: isDark ? "#D4ECFA" : "#12384D" },
  vehiclePlate: { color: isDark ? "#7297AB" : "#5A7588", fontSize: 11, marginTop: 1 },
  addVehicleBtn: {
    backgroundColor: isDark ? "#102433" : "#F5FAFE", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: isDark ? "#2A4E65" : "#C7D9E5", borderStyle: "dashed"
  },
  addVehicleBtnText: { color: isDark ? "#8CC2DF" : "#4A7588", fontWeight: "700", fontSize: 13 },

  // İstatistik kutuları
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  statBox: {
    flex: 1, backgroundColor: isDark ? "#102B3A" : "#FFFFFF", borderRadius: 16, paddingHorizontal: 10, paddingVertical: 12,
    alignItems: "center", borderWidth: 1, borderColor: isDark ? "#244D62" : "#C7D9E5"
  },
  statLabel: { color: isDark ? "#9CBFD2" : "#5A7588", fontSize: 10, fontWeight: "600", textAlign: "center" },
  statValue: { color: isDark ? "#F0F9FF" : "#12384D", fontSize: 14, fontWeight: "800", marginTop: 5 },

  // Grid
  tableCard: {
    backgroundColor: isDark ? "#0C1F2C" : "#FFFFFF",
    borderWidth: 1,
    borderColor: isDark ? "#1D4258" : "#C7D9E5",
    borderRadius: 14,
    padding: 8,
    marginBottom: 72,
  },
  tableCardDesktop: { marginBottom: 24 },
  tableScrollContent: { paddingRight: 4 },
  gridHeader: {
    flexDirection: "row", backgroundColor: isDark ? "#133246" : "#EAF3F9", paddingHorizontal: 6,
    paddingVertical: 9, borderRadius: 10, marginBottom: 6
  },
  gridHeaderCell: { color: isDark ? "#9BC3D8" : "#4A7588", fontSize: 11, fontWeight: "700", textAlign: "center" },
  gridRow: {
    flexDirection: "row", backgroundColor: isDark ? "#102737" : "#F8FCFF", paddingHorizontal: 6,
    paddingVertical: 10, borderRadius: 10, marginBottom: 6,
    borderWidth: 1, borderColor: isDark ? "#1E4359" : "#E0EAEF", alignItems: "center"
  },
  gridRowAlt: { backgroundColor: isDark ? "#0E2230" : "#F0F6FA", borderColor: isDark ? "#1A3A4D" : "#D9E7F0" },
  gridCell: { color: isDark ? "#D4E8F4" : "#163041", fontSize: 11, textAlign: "center" },
  gridCellLeft: { textAlign: "left" },
  rowActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 4 },
  rowIconBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: isDark ? "#0B1C28" : "#F5FAFE",
    borderWidth: 1,
    borderColor: isDark ? "#21475D" : "#C7D9E5",
    alignItems: "center",
    justifyContent: "center",
  },
  rowEditIcon: { color: isDark ? "#D8ECF7" : "#1B7FAB", fontSize: 12, fontWeight: "700" },
  rowDeleteIcon: { color: isDark ? "#F68A8A" : "#E14C4C", fontSize: 12, fontWeight: "700" },
  emptyStateInline: { alignItems: "center", justifyContent: "center", paddingVertical: 24 },
  kmCell: { lineHeight: 16 },

  // FAB
  fab: {
    position: "absolute", bottom: 6, right: 0, left: 0,
    backgroundColor: "#1B7FAB", borderRadius: 14, paddingVertical: 13,
    alignItems: "center"
  },
  fabText: { color: "#F2FAFF", fontWeight: "800", fontSize: 15 },

  // Boş durum
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 50 },
  emptyStateIcon: { fontSize: 48, marginBottom: 12 },
  emptyStateText: { color: isDark ? "#A7C7D9" : "#5A7588", fontSize: 16, fontWeight: "700" },
  emptyStateSub: { color: isDark ? "#749AAF" : "#7B95A8", fontSize: 13, marginTop: 6 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "#000000AA", justifyContent: "flex-end", alignItems: "center" },
  modalScrollContent: { justifyContent: "flex-end", flexGrow: 1, width: "100%", maxWidth: 500 },
  modalBox: {
    backgroundColor: isDark ? "#0F2838" : "#F8FCFF", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 22, borderTopWidth: 1, borderColor: isDark ? "#1D445A" : "#C7D9E5",
    width: "100%", maxWidth: 500, alignSelf: "center"
  },
  modalTitle: { color: isDark ? "#F0F9FF" : "#12384D", fontSize: 20, fontWeight: "800", marginBottom: 6 },
  modalVehicleLabel: { color: isDark ? "#96C2D9" : "#4A7588", fontSize: 13, marginBottom: 14 },
  inputLabel: { color: isDark ? "#9DBED2" : "#5A7588", fontSize: 12, fontWeight: "700", marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: isDark ? "#0A1F2D" : "#FFFFFF", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    color: isDark ? "#F0F9FF" : "#163041", fontSize: 14, borderWidth: 1, borderColor: isDark ? "#21485E" : "#C7D9E5", marginBottom: 10
  },
  datePickerText: { color: isDark ? "#F0F9FF" : "#163041", fontSize: 14 },
  datePickerPlaceholder: { color: isDark ? "#4A7A94" : "#9ABFD2" },
  fuelTypeRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  fuelTypeChip: {
    flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center",
    borderWidth: 1, borderColor: isDark ? "#2A4C60" : "#C7D9E5", backgroundColor: isDark ? "#0A1F2D" : "#FFFFFF"
  },
  fuelTypeChipText: { color: isDark ? "#AAC8D9" : "#5A7588", fontWeight: "700", fontSize: 13 },
  modalBtns: { flexDirection: "row", gap: 8, marginTop: 12 },
  modalBtnCancel: {
    flex: 1,
    backgroundColor: isDark ? "#1C4B5E" : "#E8EFF6",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalBtnCancelText: { color: isDark ? "#9CBFD2" : "#5A7588", fontWeight: "800", fontSize: 14 },
  modalBtnDelete: { backgroundColor: isDark ? "#C3362E" : "#E14C4C" },
  modalBtnSave: {
    flex: 1,
    backgroundColor: "#1B7FAB",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalBtnSaveText: { color: "#F1FAFF", fontWeight: "800", fontSize: 14 },
});
