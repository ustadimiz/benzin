import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { t as getT } from "./i18n";

const HISTORY_FEED_URL = "https://raw.githubusercontent.com/ustadimiz/fuel-data/refs/heads/main/allprices.json";
const FUEL_ACCENT = { benzin: "#F59E0B", motorin: "#0EA5E9", lpg: "#22C55E" };
const FUEL_FIELD_MAP = { benzin: "gasolineAmount", motorin: "dieselAmount", lpg: "lpgAmount" };
const BRANDS = [
  { key: "shell", label: "Shell" },
  { key: "opet", label: "Opet" },
  { key: "totalEnergies", label: "Total Energies" },
  { key: "petrolOfisi", label: "Petrol Ofisi" },
];

const DARK = {
  cardBg: "#102B3A",
  cardBorder: "#204960",
  title: "#EAF7FF",
  sub: "#9FC2D6",
  chipBg: "#0D2230",
  chipBorder: "#1E465D",
  chipText: "#B7D2E2",
  chartBg: "#0D2230",
  chartBorder: "#1E465D",
  grid: "#224D63",
  line: "#4FC2F2",
  point: "#E8F7FF",
  axis: "#8DB8CF",
  empty: "#D0E5F2",
};

const LIGHT = {
  cardBg: "#FFFFFF",
  cardBorder: "#C4D9E7",
  title: "#12384D",
  sub: "#5A8298",
  chipBg: "#EAF3FB",
  chipBorder: "#BBCFDC",
  chipText: "#3E6678",
  chartBg: "#F8FCFF",
  chartBorder: "#C4D9E7",
  grid: "#D7E5EF",
  line: "#1B7FAB",
  point: "#0F2433",
  axis: "#5F8FA8",
  empty: "#385A70",
};

const fmt = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const normalize = (v) =>
  String(v ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

function parseTimestamp(generatedAt) {
  if (!generatedAt || typeof generatedAt !== "object") return null;
  const dd = Number(generatedAt.day || 1);
  const mm = Number(generatedAt.month || 1) - 1;
  const yy = Number(generatedAt.year || 2000);
  const hh = Number(generatedAt.hour || 0);
  const mi = Number(generatedAt.minute || 0);
  const ss = Number(generatedAt.second || 0);
  const d = new Date(yy, mm, dd, hh, mi, ss);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseHistory(payload) {
  const rawList = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.history)
      ? payload.history
      : payload?.generatedAt && Array.isArray(payload?.provinces)
        ? [payload]
        : [];

  return rawList
    .map((item) => {
      const at = parseTimestamp(item.generatedAt);
      const provinces = Array.isArray(item.provinces) ? item.provinces : [];
      if (!at || provinces.length === 0) return null;
      return {
        at,
        label: `${String(item.generatedAt.day).padStart(2, "0")}.${String(item.generatedAt.month).padStart(2, "0")}`,
        provinces,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.at - b.at);
}

function getProvincePrice(snapshot, selectedCity, selectedBrand, selectedFuel) {
  const wanted = normalize(selectedCity);
  const province = snapshot.provinces.find((p) => normalize(p?.provinceName) === wanted);
  const fuelField = FUEL_FIELD_MAP[selectedFuel] || "gasolineAmount";
  const value = province?.prices?.[selectedBrand]?.[fuelField];
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function shrinkSeries(points, maxPoints = 28) {
  if (points.length <= maxPoints) return points;
  const step = (points.length - 1) / (maxPoints - 1);
  const sampled = [];
  for (let i = 0; i < maxPoints; i++) {
    sampled.push(points[Math.round(i * step)]);
  }
  return sampled;
}

export default function StatisticsScreen({ themeMode = "dark", lang = "tr" }) {
  const i = getT(lang);
  const C = themeMode === "light" ? LIGHT : DARK;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snapshots, setSnapshots] = useState([]);
  const [selectedFuel, setSelectedFuel] = useState("benzin");
  const [selectedBrand, setSelectedBrand] = useState("shell");
  const [selectedCity, setSelectedCity] = useState("");
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [chartW, setChartW] = useState(0);

  const fuelLabels = { benzin: i.benzin, motorin: i.motorin, lpg: i.lpg };

  const load = async () => {
    try {
      const res = await fetch(HISTORY_FEED_URL);
      if (!res.ok) {
        setSnapshots([]);
        return;
      }
      const payload = await res.json();
      const parsed = parseHistory(payload);
      setSnapshots(parsed);

      if (!selectedCity && parsed.length > 0) {
        const latest = parsed[parsed.length - 1];
        const city = latest.provinces?.[0]?.provinceName || "";
        setSelectedCity(city);
      }
    } catch (_) {
      setSnapshots([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cities = useMemo(() => {
    if (snapshots.length === 0) return [];
    const set = new Set();
    snapshots[snapshots.length - 1].provinces.forEach((p) => {
      if (p?.provinceName) set.add(p.provinceName);
    });
    return [...set].sort((a, b) => a.localeCompare(b, "tr-TR"));
  }, [snapshots]);

  const filtered = useMemo(() => {
    if (snapshots.length === 0 || !selectedCity) return [];

    const points = snapshots
      .map((s) => {
        const value = getProvincePrice(s, selectedCity, selectedBrand, selectedFuel);
        return value ? { label: s.label, value, at: s.at } : null;
      })
      .filter(Boolean);

    return shrinkSeries(points, 28);
  }, [snapshots, selectedCity, selectedBrand, selectedFuel]);

  const filteredCities = useMemo(() => {
    const q = citySearch.trim().toLocaleLowerCase("tr-TR");
    if (!q) return cities;
    return cities.filter((c) => c.toLocaleLowerCase("tr-TR").includes(q));
  }, [cities, citySearch]);

  const stats = useMemo(() => {
    if (filtered.length === 0) return null;
    const values = filtered.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const latest = values[values.length - 1];
    const first = values[0];
    const change = first > 0 ? ((latest - first) / first) * 100 : 0;
    return { min, max, latest, change };
  }, [filtered]);

  const chart = useMemo(() => {
    if (filtered.length < 2 || chartW <= 0) return null;

    const height = 200;
    const padX = 10;
    const padY = 16;
    const min = Math.min(...filtered.map((p) => p.value));
    const max = Math.max(...filtered.map((p) => p.value));
    const spread = Math.max(max - min, 0.1);
    const usableW = Math.max(chartW - padX * 2, 1);
    const usableH = Math.max(height - padY * 2, 1);

    const pts = filtered.map((p, idx) => {
      const x = padX + (idx / (filtered.length - 1)) * usableW;
      const y = padY + (1 - (p.value - min) / spread) * usableH;
      return { ...p, x, y };
    });

    const segments = [];
    for (let k = 1; k < pts.length; k++) {
      const a = pts[k - 1];
      const b = pts[k];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      segments.push({ x: a.x, y: a.y, len, angle });
    }

    return { pts, segments, min, max };
  }, [filtered, chartW]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#D3ECFB" />}
    >
      <View style={[styles.headerCard, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}>
        <Text style={[styles.title, { color: C.title }]}>{i.statsTitle}</Text>
      </View>

      <View style={[styles.filterCard, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}>
        <Text style={[styles.filterLabel, { color: C.sub }]}>{i.statsSelectFuel}</Text>
        <Pressable
          onPress={() => setShowFuelModal(true)}
          style={[styles.dropdown, { backgroundColor: C.chipBg, borderColor: C.chipBorder }]}
        >
          <Text style={[styles.dropdownText, { color: C.chipText }]}>{fuelLabels[selectedFuel]}</Text>
          <Text style={[styles.dropdownArrow, { color: C.sub }]}>▾</Text>
        </Pressable>

        <Text style={[styles.filterLabel, { color: C.sub }]}>{i.statsSelectBrand}</Text>
        <Pressable
          onPress={() => setShowBrandModal(true)}
          style={[styles.dropdown, { backgroundColor: C.chipBg, borderColor: C.chipBorder }]}
        >
          <Text style={[styles.dropdownText, { color: C.chipText }]}>{BRANDS.find((b) => b.key === selectedBrand)?.label || "-"}</Text>
          <Text style={[styles.dropdownArrow, { color: C.sub }]}>▾</Text>
        </Pressable>

        <Text style={[styles.filterLabel, { color: C.sub }]}>{i.statsSelectCity}</Text>
        <Pressable
          onPress={() => setShowCityModal(true)}
          style={[styles.dropdown, { backgroundColor: C.chipBg, borderColor: C.chipBorder }]}
        >
          <Text style={[styles.dropdownText, { color: C.chipText }]} numberOfLines={1}>{selectedCity || "-"}</Text>
          <Text style={[styles.dropdownArrow, { color: C.sub }]}>▾</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={[styles.loadingCard, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}>
          <ActivityIndicator size="small" color="#1B7FAB" />
          <Text style={[styles.loadingText, { color: C.sub }]}>{i.statsLoading}</Text>
        </View>
      ) : filtered.length < 2 ? (
        <View style={[styles.loadingCard, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}>
          <Text style={[styles.loadingText, { color: C.empty }]}>{i.statsNoData}</Text>
        </View>
      ) : (
        <>
          {stats && (
            <View style={styles.kpiRow}>
              <View style={[styles.kpiBox, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}>
                <Text style={[styles.kpiLabel, { color: C.sub }]}>{i.statsLatest}</Text>
                <Text style={[styles.kpiValue, { color: C.title }]}>{fmt.format(stats.latest)} ₺</Text>
              </View>
              <View style={[styles.kpiBox, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}>
                <Text style={[styles.kpiLabel, { color: C.sub }]}>{i.statsMin}</Text>
                <Text style={[styles.kpiValue, { color: C.title }]}>{fmt.format(stats.min)} ₺</Text>
              </View>
              <View style={[styles.kpiBox, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}>
                <Text style={[styles.kpiLabel, { color: C.sub }]}>{i.statsMax}</Text>
                <Text style={[styles.kpiValue, { color: C.title }]}>{fmt.format(stats.max)} ₺</Text>
              </View>
              <View style={[styles.kpiBox, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}>
                <Text style={[styles.kpiLabel, { color: C.sub }]}>{i.statsChange}</Text>
                <Text style={[styles.kpiValue, { color: stats.change >= 0 ? "#22C55E" : "#EF4444" }]}>{stats.change >= 0 ? "+" : ""}{fmt.format(stats.change)}%</Text>
              </View>
            </View>
          )}

          <View
            style={[styles.chartCard, { backgroundColor: C.chartBg, borderColor: C.chartBorder }]}
            onLayout={(e) => setChartW(e.nativeEvent.layout.width - 24)}
          >
            <View style={[styles.gridLine, { top: 20, backgroundColor: C.grid }]} />
            <View style={[styles.gridLine, { top: 100, backgroundColor: C.grid }]} />
            <View style={[styles.gridLine, { top: 180, backgroundColor: C.grid }]} />

            {chart?.segments.map((s, idx) => (
              <View
                key={`seg-${idx}`}
                style={{
                  position: "absolute",
                  left: 12 + s.x,
                  top: 12 + s.y,
                  width: s.len,
                  height: 2.2,
                  backgroundColor: FUEL_ACCENT[selectedFuel] || C.line,
                  transform: [{ rotate: `${s.angle}deg` }],
                  transformOrigin: "left center",
                  borderRadius: 2,
                }}
              />
            ))}

            {chart?.pts.map((p, idx) => (
              <View
                key={`pt-${idx}`}
                style={{
                  position: "absolute",
                  left: 12 + p.x - 3,
                  top: 12 + p.y - 3,
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  backgroundColor: C.point,
                }}
              />
            ))}

            <View style={styles.axisRow}>
              <Text style={[styles.axisText, { color: C.axis }]}>{filtered[0]?.label}</Text>
              <Text style={[styles.axisText, { color: C.axis }]}>{filtered[Math.floor(filtered.length / 2)]?.label}</Text>
              <Text style={[styles.axisText, { color: C.axis }]}>{filtered[filtered.length - 1]?.label}</Text>
            </View>
          </View>
        </>
      )}

      <Modal visible={showFuelModal} transparent animationType="slide" onRequestClose={() => setShowFuelModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: C.chartBg, borderColor: C.chartBorder }]}>
            <Text style={[styles.modalTitle, { color: C.title }]}>{i.statsSelectFuel}</Text>
            {[
              { key: "benzin", label: fuelLabels.benzin },
              { key: "motorin", label: fuelLabels.motorin },
              { key: "lpg", label: fuelLabels.lpg },
            ].map((f) => (
              <Pressable
                key={f.key}
                onPress={() => { setSelectedFuel(f.key); setShowFuelModal(false); }}
                style={[styles.modalItem, { borderColor: C.chipBorder, backgroundColor: C.chipBg }]}
              >
                <Text style={[styles.modalItemText, { color: C.chipText }]}>{f.label}</Text>
                {selectedFuel === f.key ? <Text style={{ color: FUEL_ACCENT[f.key], fontWeight: "800" }}>✓</Text> : null}
              </Pressable>
            ))}
            <Pressable style={styles.modalCloseBtn} onPress={() => setShowFuelModal(false)}>
              <Text style={styles.modalCloseText}>{i.close}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showBrandModal} transparent animationType="slide" onRequestClose={() => setShowBrandModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: C.chartBg, borderColor: C.chartBorder }]}>
            <Text style={[styles.modalTitle, { color: C.title }]}>{i.statsSelectBrand}</Text>
            {BRANDS.map((b) => (
              <Pressable
                key={b.key}
                onPress={() => { setSelectedBrand(b.key); setShowBrandModal(false); }}
                style={[styles.modalItem, { borderColor: C.chipBorder, backgroundColor: C.chipBg }]}
              >
                <Text style={[styles.modalItemText, { color: C.chipText }]}>{b.label}</Text>
                {selectedBrand === b.key ? <Text style={{ color: "#1B7FAB", fontWeight: "800" }}>✓</Text> : null}
              </Pressable>
            ))}
            <Pressable style={styles.modalCloseBtn} onPress={() => setShowBrandModal(false)}>
              <Text style={styles.modalCloseText}>{i.close}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showCityModal} transparent animationType="slide" onRequestClose={() => setShowCityModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: C.chartBg, borderColor: C.chartBorder }]}>
            <Text style={[styles.modalTitle, { color: C.title }]}>{i.statsSelectCity}</Text>
            <TextInput
              style={[styles.searchInput, { backgroundColor: C.chipBg, borderColor: C.chipBorder, color: C.chipText }]}
              placeholder={i.searchCity}
              placeholderTextColor={C.sub}
              value={citySearch}
              onChangeText={setCitySearch}
            />
            <ScrollView style={{ maxHeight: 340 }}>
              {filteredCities.map((city) => (
                <Pressable
                  key={city}
                  onPress={() => { setSelectedCity(city); setShowCityModal(false); setCitySearch(""); }}
                  style={[styles.modalItem, { borderColor: C.chipBorder, backgroundColor: C.chipBg }]}
                >
                  <Text style={[styles.modalItemText, { color: C.chipText }]}>{city}</Text>
                  {selectedCity === city ? <Text style={{ color: "#1B7FAB", fontWeight: "800" }}>✓</Text> : null}
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={styles.modalCloseBtn} onPress={() => { setShowCityModal(false); setCitySearch(""); }}>
              <Text style={styles.modalCloseText}>{i.close}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 2 },
  headerCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  title: { fontSize: 18, fontWeight: "800" },
  subtitle: { marginTop: 4, fontSize: 12, fontWeight: "600" },

  filterCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  filterLabel: { fontSize: 12, fontWeight: "700", marginBottom: 6, marginTop: 4 },
  rowWrap: { flexDirection: "row", gap: 8, paddingBottom: 8 },
  chipText: { fontSize: 12, fontWeight: "700" },
  dropdown: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  dropdownText: { fontSize: 13, fontWeight: "700", flex: 1, marginRight: 8 },
  dropdownArrow: { fontSize: 14, fontWeight: "700" },

  loadingCard: {
    borderWidth: 1,
    borderRadius: 16,
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: { fontSize: 13, fontWeight: "700" },

  kpiRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  kpiBox: {
    width: "48.8%",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  kpiLabel: { fontSize: 11, fontWeight: "700" },
  kpiValue: { marginTop: 4, fontSize: 16, fontWeight: "800" },

  chartCard: {
    height: 230,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    position: "relative",
    overflow: "hidden",
  },
  gridLine: {
    position: "absolute",
    left: 12,
    right: 12,
    height: StyleSheet.hairlineWidth,
  },
  axisRow: {
    position: "absolute",
    bottom: 8,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  axisText: { fontSize: 10, fontWeight: "700" },

  modalOverlay: { flex: 1, backgroundColor: "#00000099", justifyContent: "flex-end" },
  modalBox: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    padding: 14,
  },
  modalTitle: { fontSize: 16, fontWeight: "800", marginBottom: 10 },
  searchInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: "600",
  },
  modalItem: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalItemText: { fontSize: 13, fontWeight: "700" },
  modalCloseBtn: {
    marginTop: 6,
    backgroundColor: "#1B7FAB",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  modalCloseText: { color: "#F2FAFF", fontWeight: "800", fontSize: 13 },
});
