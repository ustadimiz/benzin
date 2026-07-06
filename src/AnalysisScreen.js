import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { t as getT } from "./i18n";
import { loadFuelState, loadMaintenanceState } from "./userData";
import { useResponsiveLayout } from "./responsive";

const fmtCurrency = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtNumber = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 });

function parseNumber(value) {
  if (value === null || value === undefined) return NaN;
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  const normalized = String(value).replace(/\s/g, "").replace(/,/g, ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function getTopMaintenanceType(entries) {
  const counter = new Map();
  entries.forEach((entry) => {
    const types = Array.isArray(entry.maintenanceTypes) ? entry.maintenanceTypes : [];
    types.forEach((type) => {
      const key = String(type || "").trim();
      if (!key) return;
      counter.set(key, (counter.get(key) || 0) + 1);
    });
  });

  let top = null;
  let max = 0;
  counter.forEach((count, type) => {
    if (count > max) {
      top = type;
      max = count;
    }
  });

  return top;
}

export default function AnalysisScreen({ lang = "tr", themeMode = "dark", userId = "default" }) {
  const i = getT(lang);
  const layout = useResponsiveLayout();
  const isDark = themeMode === "dark";

  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [fuelEntries, setFuelEntries] = useState([]);
  const [maintenanceEntries, setMaintenanceEntries] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("all");

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const [fuelState, maintenanceState] = await Promise.all([
          loadFuelState(userId),
          loadMaintenanceState(userId),
        ]);

        if (!mounted) return;

        const nextVehicles = Array.isArray(fuelState?.vehicles) ? fuelState.vehicles : [];
        setVehicles(nextVehicles);
        setFuelEntries(Array.isArray(fuelState?.entries) ? fuelState.entries : []);
        setMaintenanceEntries(Array.isArray(maintenanceState?.entries) ? maintenanceState.entries : []);
      } catch (_) {
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, [userId]);

  const scopedFuelEntries = useMemo(() => {
    if (selectedVehicleId === "all") return fuelEntries;
    return fuelEntries.filter((entry) => entry.vehicleId === selectedVehicleId);
  }, [fuelEntries, selectedVehicleId]);

  const scopedMaintenanceEntries = useMemo(() => {
    if (selectedVehicleId === "all") return maintenanceEntries;
    return maintenanceEntries.filter((entry) => entry.vehicleId === selectedVehicleId);
  }, [maintenanceEntries, selectedVehicleId]);

  const summary = useMemo(() => {
    const fuelCost = scopedFuelEntries.reduce((sum, entry) => {
      const value = parseNumber(entry.totalAmount);
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);

    const fuelLitres = scopedFuelEntries.reduce((sum, entry) => {
      const value = parseNumber(entry.litre);
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);

    const maintenanceCost = scopedMaintenanceEntries.reduce((sum, entry) => {
      const value = parseNumber(entry.cost);
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);

    const fuelKmValues = scopedFuelEntries
      .map((entry) => parseNumber(entry.km))
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => a - b);

    const distanceKm = fuelKmValues.length >= 2 ? fuelKmValues[fuelKmValues.length - 1] - fuelKmValues[0] : 0;
    const totalCost = fuelCost + maintenanceCost;

    return {
      fuelEntriesCount: scopedFuelEntries.length,
      maintenanceEntriesCount: scopedMaintenanceEntries.length,
      fuelCost,
      maintenanceCost,
      totalCost,
      fuelLitres,
      avgFuelUnit: fuelLitres > 0 ? fuelCost / fuelLitres : null,
      avgMaintenanceCost: scopedMaintenanceEntries.length > 0 ? maintenanceCost / scopedMaintenanceEntries.length : null,
      approxCostPerKm: distanceKm > 0 ? totalCost / distanceKm : null,
      topMaintenanceType: getTopMaintenanceType(scopedMaintenanceEntries),
    };
  }, [scopedFuelEntries, scopedMaintenanceEntries]);

  const hasAnyData = summary.fuelEntriesCount > 0 || summary.maintenanceEntriesCount > 0;

  const styles = createStyles(isDark);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingHorizontal: layout.pagePadding, maxWidth: layout.contentMaxWidth || undefined }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerCard}>
        <Text style={styles.title}>{i.analysisTitle}</Text>
        <Text style={styles.subtitle}>{i.analysisSubtitle}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vehicleRow}>
        <Pressable
          style={[styles.vehicleChip, selectedVehicleId === "all" && styles.vehicleChipActive]}
          onPress={() => setSelectedVehicleId("all")}
        >
          <Text style={[styles.vehicleChipText, selectedVehicleId === "all" && styles.vehicleChipTextActive]}>{i.analysisScopeAll}</Text>
        </Pressable>
        {vehicles.map((vehicle) => (
          <Pressable
            key={vehicle.id}
            style={[styles.vehicleChip, selectedVehicleId === vehicle.id && styles.vehicleChipActive]}
            onPress={() => setSelectedVehicleId(vehicle.id)}
          >
            <Text style={[styles.vehicleChipText, selectedVehicleId === vehicle.id && styles.vehicleChipTextActive]}>
              {vehicle.brand} {vehicle.model}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="small" color="#1B7FAB" />
        </View>
      ) : !hasAnyData ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{i.analysisNoData}</Text>
        </View>
      ) : (
        <View style={styles.kpiGrid}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>{i.analysisFuelEntries}</Text>
            <Text style={styles.kpiValue}>{summary.fuelEntriesCount}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>{i.analysisMaintEntries}</Text>
            <Text style={styles.kpiValue}>{summary.maintenanceEntriesCount}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>{i.analysisFuelCost}</Text>
            <Text style={styles.kpiValue}>{fmtCurrency.format(summary.fuelCost)} ₺</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>{i.analysisMaintCost}</Text>
            <Text style={styles.kpiValue}>{fmtCurrency.format(summary.maintenanceCost)} ₺</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>{i.analysisTotalCost}</Text>
            <Text style={styles.kpiValue}>{fmtCurrency.format(summary.totalCost)} ₺</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>{i.analysisFuelLitres}</Text>
            <Text style={styles.kpiValue}>{fmtNumber.format(summary.fuelLitres)} L</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>{i.analysisAvgFuelUnit}</Text>
            <Text style={styles.kpiValue}>{summary.avgFuelUnit === null ? "-" : `${fmtCurrency.format(summary.avgFuelUnit)} ₺`}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>{i.analysisAvgMaintCost}</Text>
            <Text style={styles.kpiValue}>{summary.avgMaintenanceCost === null ? "-" : `${fmtCurrency.format(summary.avgMaintenanceCost)} ₺`}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>{i.analysisCostPerKm}</Text>
            <Text style={styles.kpiValue}>{summary.approxCostPerKm === null ? "-" : `${fmtCurrency.format(summary.approxCostPerKm)} ₺`}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>{i.analysisTopMaintType}</Text>
            <Text style={styles.kpiValue} numberOfLines={2}>{summary.topMaintenanceType || i.analysisUnknownType}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const createStyles = (isDark) => StyleSheet.create({
  container: { flex: 1 },
  content: { paddingVertical: 12, width: "100%", alignSelf: "center" },
  headerCard: {
    backgroundColor: isDark ? "#102B3A" : "#FFFFFF",
    borderWidth: 1,
    borderColor: isDark ? "#204960" : "#C4D9E7",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  title: { color: isDark ? "#EAF7FF" : "#12384D", fontSize: 18, fontWeight: "800" },
  subtitle: { color: isDark ? "#9FC2D6" : "#5A8298", fontSize: 12, marginTop: 4 },
  vehicleRow: { gap: 8, paddingVertical: 4, marginBottom: 10 },
  vehicleChip: {
    backgroundColor: isDark ? "#0F2331" : "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: isDark ? "#274B61" : "#C7D9E5",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  vehicleChipActive: { backgroundColor: isDark ? "#133246" : "#DCEEF9", borderColor: isDark ? "#3B8CB4" : "#1B7FAB" },
  vehicleChipText: { color: isDark ? "#B2CFDF" : "#47657A", fontWeight: "600", fontSize: 13 },
  vehicleChipTextActive: { color: isDark ? "#D4ECFA" : "#12384D" },
  loadingCard: {
    backgroundColor: isDark ? "#102B3A" : "#FFFFFF",
    borderWidth: 1,
    borderColor: isDark ? "#204960" : "#C4D9E7",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  emptyCard: {
    backgroundColor: isDark ? "#102B3A" : "#FFFFFF",
    borderWidth: 1,
    borderColor: isDark ? "#204960" : "#C4D9E7",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  emptyText: { color: isDark ? "#D0E5F2" : "#385A70", fontSize: 14, fontWeight: "600", textAlign: "center" },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  kpiBox: {
    width: "48%",
    backgroundColor: isDark ? "#102B3A" : "#FFFFFF",
    borderWidth: 1,
    borderColor: isDark ? "#204960" : "#C4D9E7",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 12,
    minHeight: 82,
    justifyContent: "center",
  },
  kpiLabel: { color: isDark ? "#9FC2D6" : "#5A8298", fontSize: 11, fontWeight: "700" },
  kpiValue: { color: isDark ? "#EAF7FF" : "#12384D", fontSize: 14, fontWeight: "800", marginTop: 4 },
});
