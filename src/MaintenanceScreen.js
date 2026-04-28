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
  View,
} from "react-native";
import { t as getT } from "./i18n";
import { loadFuelState, loadMaintenanceState, saveFuelState, saveMaintenanceState, loadMaintenanceTypes } from "./userData";

const columnWidths = {
  date: 92,
  km: 90,
  types: 140,
  cost: 76,
  actions: 70,
};

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

const emptyEntry = () => ({
  id: Date.now().toString(),
  date: formatDateTR(new Date()),
  km: "",
  maintenanceTypes: [],
  cost: "",
});

const fmt = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function MaintenanceScreen({ lang = "tr", userId = "default", themeMode = "dark" }) {
  const isDark = themeMode === "dark";
  const i = getT(lang);
  const MAINTENANCE_TYPES = i.maintenanceTypeList;

  const [vehicles, setVehicles] = useState([]);
  const [fuelData, setFuelData] = useState({ vehicles: [], entries: [] });
  const [entries, setEntries] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [entryForm, setEntryForm] = useState(emptyEntry());
  const [refreshing, setRefreshing] = useState(false);
  const [maintenanceTypeOptions, setMaintenanceTypeOptions] = useState([]);
  const [manualMaintenanceInput, setManualMaintenanceInput] = useState("");

  const loadData = async () => {
    const [fuelResult, maintenanceResult] = await Promise.allSettled([
      loadFuelState(userId),
      loadMaintenanceState(userId),
    ]);

    if (fuelResult.status === "fulfilled") {
      const nextFuelData = fuelResult.value || { vehicles: [], entries: [] };
      const nextVehicles = nextFuelData.vehicles || [];
      setFuelData(nextFuelData);
      setVehicles(nextVehicles);
      setSelectedVehicle((current) => nextVehicles.find((vehicle) => vehicle.id === current?.id) || nextVehicles[0] || null);
    }

    if (maintenanceResult.status === "fulfilled") {
      const nextMaintenanceData = maintenanceResult.value || { entries: [] };
      setEntries(nextMaintenanceData.entries || []);
    }

    const dbTypes = await loadMaintenanceTypes();
    setMaintenanceTypeOptions(dbTypes);
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const persist = async (nextEntries) => {
    try {
      await saveMaintenanceState(userId, { entries: nextEntries });
    } catch (_) {}
  };

  const submitEntry = () => {
    if (!entryForm.km || !entryForm.cost || entryForm.maintenanceTypes.length === 0) {
      Alert.alert(i.missingInfo, i.maintRequired);
      return;
    }

    if (editingId) {
      const updatedEntries = entries.map((e) =>
        e.id === editingId
          ? { ...entryForm, id: editingId, vehicleId: selectedVehicle.id }
          : e
      );
      setEntries(updatedEntries);
      persist(updatedEntries);
      setEditingId(null);
    } else {
      const entry = { ...entryForm, id: Date.now().toString(), vehicleId: selectedVehicle.id };
      const next = [...entries, entry];
      setEntries(next);
      persist(next);
    }

    setEntryForm(emptyEntry());
    setShowDatePicker(false);
    setShowAddEntry(false);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEntryForm({
      id: item.id,
      date: item.date || formatDateTR(new Date()),
      km: String(item.km ?? ""),
      maintenanceTypes: Array.isArray(item.maintenanceTypes) ? item.maintenanceTypes : [],
      cost: String(item.cost ?? ""),
      vehicleId: item.vehicleId,
    });
    setManualMaintenanceInput("");
    setShowAddEntry(true);
  };

  const cancelEntryModal = () => {
    setShowAddEntry(false);
    setEditingId(null);
    setShowDatePicker(false);
    setShowMaintenanceModal(false);
    setEntryForm(emptyEntry());
    setManualMaintenanceInput("");
  };

  const deleteEntry = async (id) => {
    Alert.alert(i.deleteTitle, i.deleteMsg, [
      { text: i.cancel, style: "cancel" },
      {
        text: i.deleteTitle,
        style: "destructive",
        onPress: () => {
          const next = entries.filter((e) => e.id !== id);
          setEntries(next);
          persist(next);
        },
      },
    ]);
  };

  const vehicleEntries = selectedVehicle
    ? entries.filter((e) => e.vehicleId === selectedVehicle.id).sort((a, b) => parseFloat(b.km) - parseFloat(a.km))
    : [];

  const deleteVehicle = async () => {
    Alert.alert(i.deleteVehicleTitle, i.deleteVehicleMsg, [
      { text: i.cancel, style: "cancel" },
      {
        text: i.deleteVehicleTitle,
        style: "destructive",
        onPress: async () => {
          try {
            const updatedVehicles = vehicles.filter((v) => v.id !== selectedVehicle.id);
            const updatedEntries = entries.filter((e) => e.vehicleId !== selectedVehicle.id);
            const updatedFuelEntries = fuelData.entries.filter((e) => e.vehicleId !== selectedVehicle.id);

            await Promise.all([
              saveFuelState(userId, { vehicles: updatedVehicles, entries: updatedFuelEntries }),
              saveMaintenanceState(userId, { entries: updatedEntries }),
            ]);

            setFuelData({ vehicles: updatedVehicles, entries: updatedFuelEntries });
            setEntries(updatedEntries);
            setVehicles(updatedVehicles);
            setSelectedVehicle(updatedVehicles.length > 0 ? updatedVehicles[0] : null);
          } catch (_) {}
        },
      },
    ]);
  };

  const toggleMaintenanceType = (type) => {
    const next = entryForm.maintenanceTypes.includes(type)
      ? entryForm.maintenanceTypes.filter((t) => t !== type)
      : [...entryForm.maintenanceTypes, type];
    setEntryForm((f) => ({ ...f, maintenanceTypes: next }));
  };

  const styles = createStyles(isDark);

  return (
    <View style={styles.container}>
      {/* Araç Seçici */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.vehicleRow}
        contentContainerStyle={styles.vehicleRowContent}
      >
        {vehicles.map((v) => (
          <Pressable
            key={v.id}
            onPress={() => setSelectedVehicle(v)}
            style={[styles.vehicleChip,selectedVehicle?.id === v.id && styles.vehicleChipActive]}
          >
            <Text style={styles.vehicleChipIcon}>🚗</Text>
            <Text style={[styles.vehicleChipText, selectedVehicle?.id === v.id && styles.vehicleChipTextActive]}>
              {v.brand} {v.model}
            </Text>
            {v.plate ? <Text style={styles.vehiclePlate}>{v.plate}</Text> : null}
          </Pressable>
        ))}
      </ScrollView>

      {!selectedVehicle ? (
        <ScrollView
          style={styles.emptyRefreshWrap}
          contentContainerStyle={styles.emptyRefreshContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D3ECFB" />}
        >
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🔧</Text>
            <Text style={styles.emptyStateText}>{i.noVehicle}</Text>
            <Text style={styles.emptyStateSub}>{i.noMaintVehicleSub}</Text>
          </View>
        </ScrollView>
      ) : (
        <>
          {vehicleEntries.length === 0 ? (
            <ScrollView
              style={styles.emptyRefreshWrap}
              contentContainerStyle={styles.emptyRefreshContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D3ECFB" />}
            >
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>{i.noMaintEntry}</Text>
              </View>
            </ScrollView>
          ) : (
            <View style={styles.tableCard}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tableScrollContent} style={{ flex: 1 }}>
                <View style={{ minWidth: columnWidths.date + columnWidths.km + columnWidths.types + columnWidths.cost + columnWidths.actions }}>
                {/* Bakım Listesi Header - Sticky */}
                <View style={styles.gridHeader}>
                  <Text numberOfLines={1} style={[styles.gridHeaderCell, { width: columnWidths.date }]}>{i.colDate}</Text>
                  <Text numberOfLines={1} style={[styles.gridHeaderCell, { width: columnWidths.km }]}>{i.colKm}</Text>
                  <Text numberOfLines={1} style={[styles.gridHeaderCell, { width: columnWidths.types }]}>{i.colMaintTypes}</Text>
                  <Text numberOfLines={1} style={[styles.gridHeaderCell, { width: columnWidths.cost }, { textAlign: "center" }]}>{i.colCost}</Text>
                  <Text numberOfLines={1} style={[styles.gridHeaderCell, { width: columnWidths.actions }, { textAlign: "center" }]}></Text>
                </View>

                {/* Tablo Verileri */}
                <FlatList
                  data={vehicleEntries}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D3ECFB" />}
                  renderItem={({ item, index }) => (
                    <View style={[styles.gridRow, index % 2 === 1 && styles.gridRowAlt]}>
                  <Text numberOfLines={1} style={[styles.gridCell, { width: columnWidths.date }]}>{item.date}</Text>
                  <Text numberOfLines={1} style={[styles.gridCell, { width: columnWidths.km }]}>{item.km}</Text>
                  <Text numberOfLines={1} style={[styles.gridCell, { width: columnWidths.types, fontSize: 11 }]}>
                    {item.maintenanceTypes.join(", ")}
                  </Text>
                  <Text numberOfLines={1} style={[styles.gridCell, { width: columnWidths.cost }]}>{item.cost} ₺</Text>
                  <View style={[styles.rowActions, { width: columnWidths.actions }]}>
                    <Pressable style={styles.rowIconBtn} onPress={() => startEdit(item)}>
                      <Text style={styles.rowEditIcon}>✎</Text>
                    </Pressable>
                    <Pressable style={styles.rowIconBtn} onPress={() => deleteEntry(item.id)}>
                      <Text style={styles.rowDeleteIcon}>✕</Text>
                    </Pressable>
                  </View>
                    </View>
                  )}
                />
              </View>
            </ScrollView>
            </View>
          )}

          {/* FAB */}
          <Pressable onPress={() => setShowAddEntry(true)} style={styles.fab}>
            <Text style={styles.fabText}>{i.addMaintEntry}</Text>
          </Pressable>
        </>
      )}

      {/* ── Modal: Bakım Ekle ─────────────────────────────────── */}
      <Modal visible={showAddEntry} transparent animationType="slide" onRequestClose={() => setShowAddEntry(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{editingId ? i.editMaintTitle : i.addMaintTitle}</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
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
                    if (event.type === "dismissed") {
                      setShowDatePicker(false);
                      return;
                    }

                    if (selectedDate) {
                      setShowDatePicker(false);
                      setEntryForm((f) => ({ ...f, date: formatDateTR(selectedDate) }));
                    }
                  }}
                />
              )}

              <TextInput
                style={styles.input}
                placeholder={i.kmMaintPlaceholder}
                placeholderTextColor="#4A7A94"
                value={entryForm.km}
                onChangeText={(t) => setEntryForm((f) => ({ ...f, km: t }))}
                keyboardType="decimal-pad"
              />

              <Text style={styles.inputLabel}>{i.maintenanceTypesLabel}</Text>
              <Pressable onPress={() => setShowMaintenanceModal(true)} style={styles.dropdownBtn}>
                <Text style={styles.dropdownBtnText}>
                  {entryForm.maintenanceTypes.length > 0
                    ? `${entryForm.maintenanceTypes.length} ${i.selectedSuffix}`
                    : i.selectMaintPlaceholder}
                </Text>
                <Text style={{ fontSize: 16, color: "#3B8CB4" }}>▼</Text>
              </Pressable>

              {entryForm.maintenanceTypes.length > 0 && (
                <View style={styles.selectedTypesBox}>
                  <Text style={styles.selectedTypesText}>{entryForm.maintenanceTypes.join(", ")}</Text>
                </View>
              )}

              {/* Tutar */}
              <TextInput
                style={styles.input}
                placeholder={i.costPlaceholder}
                placeholderTextColor="#4A7A94"
                value={entryForm.cost}
                onChangeText={(t) => setEntryForm((f) => ({ ...f, cost: t }))}
                keyboardType="decimal-pad"
              />

              <View style={styles.modalBtnGroup}>
                <Pressable onPress={submitEntry} style={styles.modalBtnSave}>
                  <Text style={styles.modalBtnSaveText}>{editingId ? i.update : i.save}</Text>
                </Pressable>
                <Pressable
                  onPress={cancelEntryModal}
                  style={styles.modalBtnCancel}
                >
                  <Text style={styles.modalBtnCancelText}>{i.cancel}</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Modal: Bakım Türü Seç ─────────────────────────────── */}
      <Modal visible={showMaintenanceModal} transparent animationType="slide" onRequestClose={() => setShowMaintenanceModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { flexDirection: "column", height: "90%" }]}>
            <Text style={styles.modalTitle}>{i.selectMaintType}</Text>

            {/* Manuel Giriş Bölümü */}
            <View style={{ paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#1D445A" }}>
              <Text style={styles.inputLabel}>Yeni tür ekle:</Text>
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Örn: Motor Temizliği"
                  placeholderTextColor="#4A7A94"
                  value={manualMaintenanceInput}
                  onChangeText={setManualMaintenanceInput}
                />
                <Pressable
                  style={({ pressed }) => [
                    styles.addTypeBtn,
                    pressed && { opacity: 0.7 }
                  ]}
                  onPress={() => {
                    const trimmed = manualMaintenanceInput.trim();
                    if (trimmed && !entryForm.maintenanceTypes.includes(trimmed)) {
                      toggleMaintenanceType(trimmed);
                      setManualMaintenanceInput("");
                    }
                  }}
                >
                  <Text style={styles.addTypeBtnText}>EKLE</Text>
                </Pressable>
              </View>
            </View>

            {/* Seçili Türler */}
            {entryForm.maintenanceTypes.length > 0 && (
              <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1D445A" }}>
                <Text style={styles.inputLabel}>Seçili türler:</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {entryForm.maintenanceTypes.map((type) => (
                    <Pressable
                      key={type}
                      onPress={() => toggleMaintenanceType(type)}
                      style={{ backgroundColor: "#1B7FAB", borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, flexDirection: "row", alignItems: "center", gap: 4 }}
                    >
                      <Text style={{ color: "#F2FAFF", fontSize: 12, fontWeight: "600" }}>{type}</Text>
                      <Text style={{ color: "#F2FAFF", fontSize: 10 }}>✕</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* DB Türleri Listesi */}
            <View style={{ flex: 1, paddingTop: 12 }}>
              <Text style={[styles.inputLabel, { marginBottom: 8 }]}>Önceden tanımlanmış:</Text>
              <FlatList
                data={maintenanceTypeOptions}
                keyExtractor={(item) => item}
                showsVerticalScrollIndicator={true}
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 10 }}
                renderItem={({ item: type }) => {
                  const isSelected = entryForm.maintenanceTypes.includes(type);
                  return (
                    <Pressable
                      style={[styles.checkboxItem, isSelected && styles.checkboxItemSelected]}
                      onPress={() => toggleMaintenanceType(type)}
                    >
                      <Text style={styles.checkboxBox}>{isSelected ? "☑" : "☐"}</Text>
                      <Text style={[styles.checkboxLabel, isSelected && styles.checkboxLabelSelected]}>
                        {type}
                      </Text>
                    </Pressable>
                  );
                }}
              />
            </View>

            <Pressable
              style={styles.maintenanceModalDoneBtn}
              onPress={() => setShowMaintenanceModal(false)}
            >
              <Text style={styles.modalBtnSaveText}>{i.ok}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (isDark) => StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingVertical: 12 },

  emptyRefreshWrap: { flex: 1 },
  emptyRefreshContent: { flexGrow: 1, justifyContent: "flex-start" },

  vehicleRow: { maxHeight: 76, marginBottom: 10 },
  vehicleRowContent: { gap: 10, paddingVertical: 4, alignItems: "center" },
  vehicleChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: isDark ? "#0F2331" : "#FFFFFF", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: isDark ? "#274B61" : "#C7D9E5"
  },
  vehicleChipActive: { backgroundColor: isDark ? "#133246" : "#DCEEF9", borderColor: isDark ? "#3B8CB4" : "#1B7FAB" },
  vehicleChipIcon: { fontSize: 16 },
  vehicleChipText: { color: isDark ? "#B2CFDF" : "#47657A", fontWeight: "600", fontSize: 13 },
  vehicleChipTextActive: { color: isDark ? "#D4ECFA" : "#12384D" },
  vehiclePlate: { color: isDark ? "#7297AB" : "#5A7588", fontSize: 11, marginTop: 1 },

  tableCard: {
    backgroundColor: isDark ? "#0C1F2C" : "#FFFFFF",
    borderWidth: 1,
    borderColor: isDark ? "#1D4258" : "#C7D9E5",
    borderRadius: 14,
    padding: 8,
    marginBottom: 72,
    flex: 1,
  },
  tableScrollContent: { paddingRight: 4 },

  gridHeader: {
    flexDirection: "row",
    backgroundColor: isDark ? "#133246" : "#EAF3F9",
    paddingHorizontal: 6,
    paddingVertical: 9,
    borderRadius: 10,
    marginBottom: 6,
  },
  gridHeaderCell: { color: isDark ? "#9BC3D8" : "#4A7588", fontSize: 11, fontWeight: "700", textAlign: "center" },
  gridRow: {
    flexDirection: "row",
    backgroundColor: isDark ? "#102737" : "#F8FCFF",
    paddingHorizontal: 6,
    paddingVertical: 10,
    marginBottom: 6,
    borderRadius: 10,
    alignItems: "center",
  },
  gridRowAlt: {
    backgroundColor: isDark ? "#0A1B26" : "#F0F6FA",
  },
  gridCell: { color: isDark ? "#D3ECFB" : "#163041", fontSize: 12, fontWeight: "500", textAlign: "center" },

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

  emptyState: {
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: isDark ? "#0D2230" : "#F5FAFE",
    borderWidth: 1,
    borderColor: isDark ? "#1E465D" : "#C7D9E5",
    alignItems: "center",
  },
  emptyStateIcon: { fontSize: 36, marginBottom: 8 },
  emptyStateText: { color: isDark ? "#D0E5F2" : "#5A7588", fontSize: 14, fontWeight: "700" },
  emptyStateSub: { color: isDark ? "#96B8CC" : "#7B95A8", fontSize: 12, marginTop: 6 },

  fab: {
    backgroundColor: "#1B7FAB",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  fabText: { color: "#F2FAFF", fontWeight: "800", fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: "#000000AA", justifyContent: "flex-end" },
  modalBox: {
    backgroundColor: isDark ? "#0F2838" : "#F8FCFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    borderTopWidth: 1,
    borderColor: isDark ? "#1D445A" : "#C7D9E5",
    maxHeight: "90%",
  },
  modalTitle: { color: isDark ? "#F0F9FF" : "#12384D", fontSize: 18, fontWeight: "800", marginBottom: 12 },

  input: {
    backgroundColor: isDark ? "#0D2230" : "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: isDark ? "#1E465D" : "#C7D9E5",
    color: isDark ? "#E3F1F9" : "#163041",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 14,
  },
  inputLabel: { color: isDark ? "#AFCBDD" : "#5A7588", fontSize: 12, fontWeight: "700", marginBottom: 8, marginTop: 4 },
  datePickerText: { color: isDark ? "#E3F1F9" : "#163041", fontSize: 14 },
  datePickerPlaceholder: { color: isDark ? "#4A7A94" : "#9ABFD2" },

  dropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: isDark ? "#0D2230" : "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: isDark ? "#1E465D" : "#C7D9E5",
    color: isDark ? "#E3F1F9" : "#163041",
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 12,
  },
  dropdownBtnText: { color: isDark ? "#E3F1F9" : "#163041", fontSize: 14, fontWeight: "500" },

  selectedTypesBox: {
    backgroundColor: isDark ? "#12384D" : "#DCEEF9",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: isDark ? "#3B8CB4" : "#1B7FAB",
    padding: 10,
    marginBottom: 12,
  },
  selectedTypesText: { color: isDark ? "#DDF4FF" : "#0F3B52", fontSize: 12, fontWeight: "500", lineHeight: 18 },

  checkboxGroup: { marginBottom: 12, gap: 8 },
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: isDark ? "#0D2230" : "#F5FAFE",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: isDark ? "#1E465D" : "#C7D9E5",
  },
  checkboxItemSelected: { borderColor: isDark ? "#3B8CB4" : "#1B7FAB", backgroundColor: isDark ? "#12384D" : "#DCEEF9" },
  checkboxBox: { fontSize: 16, marginRight: 8, color: isDark ? "#3B8CB4" : "#1B7FAB" },
  checkboxLabel: { color: isDark ? "#B7D2E2" : "#5A7588", fontSize: 13, fontWeight: "500", flex: 1 },
  checkboxLabelSelected: { color: isDark ? "#DDF4FF" : "#12384D", fontWeight: "600" },

  emptyStateInline: { alignItems: "center", justifyContent: "center", paddingVertical: 24 },

  maintenanceTypeList: { maxHeight: 340 },
  maintenanceTypeListContent: { paddingBottom: 10 },
  maintenanceModalDoneBtn: {
    marginTop: 8,
    backgroundColor: "#1B7FAB",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  addTypeBtn: {
    backgroundColor: "#1B7FAB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addTypeBtnText: {
    color: "#F2FAFF",
    fontWeight: "800",
    fontSize: 12,
  },

  modalBtnGroup: { flexDirection: "row", gap: 8, marginTop: 12 },
  modalBtnSave: {
    flex: 1,
    backgroundColor: "#1B7FAB",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalBtnSaveText: { color: "#F2FAFF", fontWeight: "800", fontSize: 14 },
  modalBtnCancel: {
    flex: 1,
    backgroundColor: isDark ? "#1C4B5E" : "#E8EFF6",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalBtnCancelText: { color: isDark ? "#9CBFD2" : "#5A7588", fontWeight: "800", fontSize: 14 },
});
