import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Modal, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { t as getT } from "./i18n";

const STORAGE_SELECTED_CITY = "@fiyatlar_secilen_il";
const STORAGE_FAVORITE_STATIONS = "@fiyatlar_favori_istasyonlar";
const PRICES_FEED_URL = "https://raw.githubusercontent.com/ustadimiz/fuel-data/refs/heads/main/prices.json";
const ALL_CITIES_KEY = "__all__";

const BRAND_DEFS = [
  { key: "shell", label: "Shell" },
  { key: "opet", label: "Opet" },
  { key: "totalEnergies", label: "Total Energies" },
  { key: "petrolOfisi", label: "Petrol Ofisi" }
];

const TURKIYE_ILLERI = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir",
  "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli",
  "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari",
  "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir",
  "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir",
  "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat",
  "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman",
  "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
];

const fuelAccent = { benzin: "#F59E0B", motorin: "#0EA5E9", lpg: "#22C55E" };
const currencyFormatter = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const normalizeText = (value) => String(value ?? "").replace(/\s+/g, " ").trim();

const normalizeForMatch = (value) =>
  normalizeText(value)
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const toTitleCaseTr = (value) =>
  normalizeText(value)
    .toLocaleLowerCase("tr-TR")
    .replace(/(^|\s|\/|-)\S/g, (token) => token.toLocaleUpperCase("tr-TR"));

const CITY_LOOKUP = new Map(TURKIYE_ILLERI.map((city) => [normalizeForMatch(city), city]));

const CITY_ALIASES = new Map([
  ["afyon", "Afyonkarahisar"],
  ["maras", "Kahramanmaraş"],
  ["kmaras", "Kahramanmaraş"],
  ["sanliurfa", "Şanlıurfa"],
  ["canakkale", "Çanakkale"],
  ["cankiri", "Çankırı"],
  ["corum", "Çorum"],
  ["eskisehir", "Eskişehir"],
  ["gumushane", "Gümüşhane"],
  ["kirikkale", "Kırıkkale"],
  ["kirklareli", "Kırklareli"],
  ["kirsehir", "Kırşehir"],
  ["kutahya", "Kütahya"],
  ["mugla", "Muğla"],
  ["mus", "Muş"],
  ["nevsehir", "Nevşehir"],
  ["nigde", "Niğde"],
  ["sirnak", "Şırnak"],
  ["tekirdag", "Tekirdağ"],
  ["usak", "Uşak"],
  ["yozgat", "Yozgat"],
  ["zonguldak", "Zonguldak"],
  ["adiyaman", "Adıyaman"],
  ["agri", "Ağrı"],
  ["bingol", "Bingöl"],
  ["bitlis", "Bitlis"],
  ["denizli", "Denizli"],
  ["edirne", "Edirne"],
  ["elazig", "Elazığ"],
  ["erzincan", "Erzincan"],
  ["erzurum", "Erzurum"],
  ["gaziantep", "Gaziantep"],
  ["isparta", "Isparta"],
  ["izmir", "İzmir"],
  ["istanbul", "İstanbul"],
  ["ankara", "Ankara"]
]);

const DEFAULT_DISTRICT = {
  "Adana": "Seyhan",
  "Adıyaman": "Merkez",
  "Afyonkarahisar": "Merkez",
  "Ağrı": "Merkez",
  "Amasya": "Merkez",
  "Ankara": "Çankaya",
  "Antalya": "Muratpaşa",
  "Artvin": "Merkez",
  "Aydın": "Efeler",
  "Balıkesir": "Karesi",
  "Bilecik": "Merkez",
  "Bingöl": "Merkez",
  "Bitlis": "Merkez",
  "Bolu": "Merkez",
  "Burdur": "Merkez",
  "Bursa": "Nilüfer",
  "Çanakkale": "Merkez",
  "Çankırı": "Merkez",
  "Çorum": "Merkez",
  "Denizli": "Pamukkale",
  "Diyarbakır": "Kayapınar",
  "Edirne": "Merkez",
  "Elazığ": "Merkez",
  "Erzincan": "Merkez",
  "Erzurum": "Yakutiye",
  "Eskişehir": "Tepebaşı",
  "Gaziantep": "Şehitkamil",
  "Giresun": "Merkez",
  "Gümüşhane": "Merkez",
  "Hakkari": "Merkez",
  "Hatay": "Antakya",
  "Isparta": "Merkez",
  "Mersin": "Yenişehir",
  "İstanbul": "Kadıköy",
  "İzmir": "Bornova",
  "Kars": "Merkez",
  "Kastamonu": "Merkez",
  "Kayseri": "Melikgazi",
  "Kırklareli": "Merkez",
  "Kırşehir": "Merkez",
  "Kocaeli": "İzmit",
  "Konya": "Selçuklu",
  "Kütahya": "Merkez",
  "Malatya": "Yeşilyurt",
  "Manisa": "Yunusemre",
  "Kahramanmaraş": "Dulkadiroğlu",
  "Mardin": "Artuklu",
  "Muğla": "Menteşe",
  "Muş": "Merkez",
  "Nevşehir": "Merkez",
  "Niğde": "Merkez",
  "Ordu": "Altınordu",
  "Rize": "Merkez",
  "Sakarya": "Adapazarı",
  "Samsun": "Atakum",
  "Siirt": "Merkez",
  "Sinop": "Merkez",
  "Sivas": "Merkez",
  "Tekirdağ": "Süleymanpaşa",
  "Tokat": "Merkez",
  "Trabzon": "Ortahisar",
  "Tunceli": "Merkez",
  "Şanlıurfa": "Haliliye",
  "Uşak": "Merkez",
  "Van": "İpekyolu",
  "Yozgat": "Merkez",
  "Zonguldak": "Merkez",
  "Aksaray": "Merkez",
  "Bayburt": "Merkez",
  "Karaman": "Merkez",
  "Kırıkkale": "Merkez",
  "Batman": "Merkez",
  "Şırnak": "Merkez",
  "Bartın": "Merkez",
  "Ardahan": "Merkez",
  "Iğdır": "Merkez",
  "Yalova": "Merkez",
  "Karabük": "Merkez",
  "Kilis": "Merkez",
  "Osmaniye": "Merkez",
  "Düzce": "Merkez"
};

const mapProvinceName = (provinceName) => {
  const cleaned = normalizeText(provinceName);
  if (!cleaned) return "";

  const upper = cleaned.toLocaleUpperCase("tr-TR");
  if (upper.includes("İSTANBUL") || upper.includes("ISTANBUL")) return "İstanbul";

  const alias = CITY_ALIASES.get(normalizeForMatch(cleaned));
  if (alias) return alias;

  return CITY_LOOKUP.get(normalizeForMatch(cleaned)) || toTitleCaseTr(cleaned);
};

const mapIstanbulRegion = (provinceName) => {
  const upper = normalizeText(provinceName).toLocaleUpperCase("tr-TR");
  if (upper.includes("ANADOLU")) return "Anadolu";
  if (upper.includes("AVRUPA")) return "Avrupa";
  return null;
};

const amountOf = (amount) => {
  if (typeof amount === "number") return amount;
  const parsed = Number(String(amount).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
};

const pickBrandPrices = (brandPricesRaw) => {
  const benzin = amountOf(brandPricesRaw?.gasolineAmount);
  const motorin = amountOf(brandPricesRaw?.dieselAmount);
  const lpg = amountOf(brandPricesRaw?.lpgAmount);
  return { benzin, motorin, lpg };
};

const mapFeedRecords = (payload) => {
  const provinces = Array.isArray(payload?.provinces) ? payload.provinces : [];

  return provinces
    .map((row) => {
      const city = mapProvinceName(row?.provinceName);
      if (!city) return null;

      const pricesByBrand = BRAND_DEFS.reduce((acc, brand) => {
        const prices = pickBrandPrices(row?.prices?.[brand.key]);
        const hasAnyPrice = [prices.benzin, prices.motorin, prices.lpg].some((v) => Number.isFinite(v) && v > 0);
        if (hasAnyPrice) acc[brand.key] = prices;
        return acc;
      }, {});

      if (Object.keys(pricesByBrand).length === 0) return null;

      return {
        city,
        region: city === "İstanbul" ? mapIstanbulRegion(row?.provinceName) : null,
        pricesByBrand
      };
    })
    .filter(Boolean);
};

const stationKey = (item) => `${item.city}-${item.region || ""}`;

const DARK = {
  screenBg: "transparent",
  chip: "#102433",
  chipBorder: "#294B60",
  chipText: "#B7D2E2",
  cityCard: "#102B3A",
  cityCardBorder: "#204960",
  cityLabel: "#AFCBDD",
  cityPicker: "#0D2230",
  cityPickerBorder: "#1E465D",
  cityPickerText: "#E3F1F9",
  cityPickerArrow: "#8DB8CF",
  stationCard: "#0D2230",
  stationCardBorder: "#1E465D",
  stationTitle: "#E3F1F9",
  stationMeta: "#9FC2D6",
  starBtn: "#173244",
  starBtnBorder: "#2A5A73",
  badge: "#1A3A4E",
  badgeText: "#A7C8DB",
  priceName: "#BFD7E5",
  emptyCard: "#0D2230",
  emptyCardBorder: "#1E465D",
  emptyText: "#D0E5F2",
  emptySub: "#96B8CC",
  modalBg: "#0F2838",
  modalBorder: "#1D445A",
  modalTitle: "#F0F9FF",
  searchInput: "#0D2230",
  searchInputBorder: "#1E465D",
  searchInputText: "#E3F1F9",
  searchPlaceholder: "#8DB8CF",
  cityItem: "#0B202E",
  cityItemBorder: "#1B4258",
  cityItemActive: "#12384D",
  cityItemActiveBorder: "#3B8CB4",
  cityItemText: "#CBE0ED",
  cityItemTextActive: "#DDF4FF",
};

const LIGHT = {
  screenBg: "transparent",
  chip: "#FFFFFF",
  chipBorder: "#C4D9E7",
  chipText: "#3E6678",
  cityCard: "#FFFFFF",
  cityCardBorder: "#C4D9E7",
  cityLabel: "#47657A",
  cityPicker: "#EAF3FB",
  cityPickerBorder: "#BBCFDC",
  cityPickerText: "#12384D",
  cityPickerArrow: "#5F8FA8",
  stationCard: "#FFFFFF",
  stationCardBorder: "#CDDCE7",
  stationTitle: "#0F2433",
  stationMeta: "#5A8298",
  starBtn: "#EAF3F9",
  starBtnBorder: "#BAD1E0",
  badge: "#E0EEF6",
  badgeText: "#2E607B",
  priceName: "#3E6678",
  emptyCard: "#FFFFFF",
  emptyCardBorder: "#CDDCE7",
  emptyText: "#1A3A4E",
  emptySub: "#5A82A0",
  modalBg: "#F8FCFF",
  modalBorder: "#C4D9E7",
  modalTitle: "#0F2433",
  searchInput: "#EAF3FB",
  searchInputBorder: "#BBCFDC",
  searchInputText: "#12384D",
  searchPlaceholder: "#7A9EB5",
  cityItem: "#F0F7FC",
  cityItemBorder: "#C8DBE8",
  cityItemActive: "#DCEEF9",
  cityItemActiveBorder: "#4A9EC4",
  cityItemText: "#2A4F66",
  cityItemTextActive: "#0F2C3F",
};

export default function PricesScreen({ themeMode = "dark", lang = "tr" }) {
  const C = themeMode === "light" ? LIGHT : DARK;
  const i = getT(lang);
  const fuelLabels = { benzin: i.benzin, motorin: i.motorin, lpg: i.lpg };

  const [selectedFuel, setSelectedFuel] = useState("benzin");
  const [selectedCity, setSelectedCity] = useState(ALL_CITIES_KEY);
  const [showCityModal, setShowCityModal] = useState(false);
  const [favoriteStations, setFavoriteStations] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [allCityRecords, setAllCityRecords] = useState([]);
  const [lastUpdatedText, setLastUpdatedText] = useState("");

  const availableCities = useMemo(() => {
    const set = new Set(allCityRecords.map((record) => record.city));
    return [...set].sort((a, b) => a.localeCompare(b, "tr-TR"));
  }, [allCityRecords]);

  const fetchLivePrices = async () => {
    try {
      const response = await fetch(PRICES_FEED_URL);
      if (!response.ok) return false;

      const payload = await response.json();
      const mapped = mapFeedRecords(payload);
      if (mapped.length === 0) return false;

      setAllCityRecords(mapped);
      setLastUpdatedText(normalizeText(payload?.generatedAt?.formatted));
      return true;
    } catch (_) {
      return false;
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const [rawFavStations, rawCity] = await Promise.all([
          AsyncStorage.getItem(STORAGE_FAVORITE_STATIONS),
          AsyncStorage.getItem(STORAGE_SELECTED_CITY)
        ]);

        if (rawFavStations) setFavoriteStations(JSON.parse(rawFavStations));
        if (rawCity) {
          setSelectedCity(rawCity === "Tümü" ? ALL_CITIES_KEY : rawCity);
        }
      } catch (_) {}
    })();
  }, []);

  useEffect(() => {
    fetchLivePrices();
  }, []);

  useEffect(() => {
    if (selectedCity !== ALL_CITIES_KEY && !availableCities.includes(selectedCity)) {
      setSelectedCity(ALL_CITIES_KEY);
    }
  }, [availableCities, selectedCity]);

  const filteredRecords = useMemo(() => {
    if (selectedCity === ALL_CITIES_KEY) return allCityRecords;
    return allCityRecords.filter((record) => record.city === selectedCity);
  }, [selectedCity, allCityRecords]);

  const sortedRecords = useMemo(() => {
    const items = [...filteredRecords];
    return items.sort((a, b) => {
      const aFav = favoriteStations.includes(stationKey(a));
      const bFav = favoriteStations.includes(stationKey(b));
      if (aFav === bFav) return 0;
      return aFav ? -1 : 1;
    });
  }, [filteredRecords, favoriteStations]);

  const toggleStationFavorite = async (item) => {
    const key = stationKey(item);
    const alreadyFav = favoriteStations.includes(key);
    const next = alreadyFav
      ? favoriteStations.filter((station) => station !== key)
      : [key, ...favoriteStations.filter((station) => station !== key)];

    setFavoriteStations(next);
    try {
      await AsyncStorage.setItem(STORAGE_FAVORITE_STATIONS, JSON.stringify(next));
    } catch (_) {}
  };

  const onSelectCity = async (city) => {
    setSelectedCity(city);
    setShowCityModal(false);
    try {
      await AsyncStorage.setItem(STORAGE_SELECTED_CITY, city);
    } catch (_) {}
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLivePrices();
    setTimeout(() => setRefreshing(false), 300);
  };

  const getOrderedCities = (searchTerm) => {
    const topCities = ["İstanbul", "Ankara", "İzmir"];
    const allCities = availableCities;
    
    const filtered = allCities.filter((city) =>
      searchTerm === "" || city.toLowerCase().startsWith(searchTerm.toLowerCase())
    );

    const first3 = topCities.filter((c) => filtered.includes(c));
    const rest = filtered.filter((c) => !topCities.includes(c));

    return [ALL_CITIES_KEY, ...first3, ...rest];
  };

  return (
    <View style={styles.container}>
      <View style={styles.filtersRow}>
        {["benzin", "motorin", "lpg"].map((fuel) => {
          const active = selectedFuel === fuel;
          return (
            <Pressable
              key={fuel}
              onPress={() => setSelectedFuel(fuel)}
              style={[
                styles.chip,
                { backgroundColor: C.chip, borderColor: C.chipBorder },
                active && { backgroundColor: fuelAccent[fuel], borderColor: fuelAccent[fuel] }
              ]}
            >
              <Text style={[styles.chipText, { color: C.chipText }, active && styles.chipTextActive]}>{fuelLabels[fuel]}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.cityCard, { backgroundColor: C.cityCard, borderColor: C.cityCardBorder }]}>
        <Text style={[styles.cityLabel, { color: C.cityLabel }]}>{i.citySelection}</Text>
        <Pressable style={[styles.cityPicker, { backgroundColor: C.cityPicker, borderColor: C.cityPickerBorder }]} onPress={() => setShowCityModal(true)}>
          <Text style={[styles.cityPickerText, { color: C.cityPickerText }]}>
            {selectedCity === ALL_CITIES_KEY ? i.allCities : selectedCity}
          </Text>
          <Text style={[styles.cityPickerArrow, { color: C.cityPickerArrow }]}>▾</Text>
        </Pressable>
        {lastUpdatedText ? (
          <Text style={[styles.updatedText, { color: C.cityLabel }]}>{i.updatedAtLabel || "Son güncelleme"}: {lastUpdatedText}</Text>
        ) : null}
      </View>

      {isInitialLoading ? (
        <View style={[styles.emptyState, { backgroundColor: C.emptyCard, borderColor: C.emptyCardBorder }]}>
          <Text style={[styles.emptyStateText, { color: C.emptyText }]}>{i.pricesLoading}</Text>
        </View>
      ) : filteredRecords.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: C.emptyCard, borderColor: C.emptyCardBorder }]}>
          <Text style={[styles.emptyStateText, { color: C.emptyText }]}>{selectedCity === ALL_CITIES_KEY ? i.allCities : selectedCity} {i.noDataForCity || "için veri yok"}</Text>
          <Text style={[styles.emptyStateSub, { color: C.emptySub }]}>{i.noDataSub}</Text>
        </View>
      ) : (
        <FlatList
          data={sortedRecords}
          keyExtractor={(item) => `${item.city}-${item.region || ""}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D3ECFB" />}
          renderItem={({ item }) => {
            const isFav = favoriteStations.includes(stationKey(item));
            const brandRows = BRAND_DEFS
              .map((brand) => ({
                key: brand.key,
                label: brand.label,
                value: item.pricesByBrand?.[brand.key]?.[selectedFuel]
              }))
              .sort((a, b) => {
                const aOk = Number.isFinite(a.value) && a.value > 0;
                const bOk = Number.isFinite(b.value) && b.value > 0;
                if (aOk && bOk) return a.value - b.value;
                if (aOk) return -1;
                if (bOk) return 1;
                return a.label.localeCompare(b.label, "tr-TR");
              });

            const bestRow = brandRows.find((row) => Number.isFinite(row.value) && row.value > 0);

            return (
              <View style={[styles.stationCard, { backgroundColor: C.stationCard, borderColor: C.stationCardBorder }]}>
                <View style={styles.stationHead}>
                  <View>
                    <Text style={[styles.stationTitle, { color: C.stationTitle }]}>{item.city}</Text>
                    {item.region ? <Text style={[styles.stationMeta, { color: C.stationMeta }]}>{i.regionLabel}: {item.region}</Text> : null}
                  </View>
                  <View style={styles.stationRight}>
                    <Pressable style={[styles.stationStarBtn, { backgroundColor: C.starBtn, borderColor: C.starBtnBorder }]} onPress={() => toggleStationFavorite(item)}>
                      <Text style={styles.stationStarText}>{isFav ? "★" : "☆"}</Text>
                    </Pressable>
                  </View>
                </View>
                <View style={styles.priceHeader}>
                  {bestRow ? <Text style={[styles.bestPriceHint, { color: fuelAccent[selectedFuel] }]}>{i.bestPriceLabel || "En uygun"}: {bestRow.label}</Text> : null}
                </View>

                {brandRows.map((row) => {
                  const available = Number.isFinite(row.value) && row.value > 0;
                  const isBest = bestRow?.key === row.key;

                  return (
                    <View key={row.key} style={[styles.brandRow, { borderBottomColor: C.stationCardBorder }]}>
                      <Text style={[styles.brandName, { color: C.stationMeta }]}>{row.label}</Text>
                      <Text style={[styles.brandPrice, { color: isBest ? fuelAccent[selectedFuel] : C.stationTitle }]}>
                        {available ? `${currencyFormatter.format(row.value)} TL` : "-"}
                      </Text>
                    </View>
                  );
                })}
              </View>
            );
          }}
        />
      )}

      <Modal visible={showCityModal} transparent animationType="slide" onRequestClose={() => setShowCityModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: C.modalBg, borderColor: C.modalBorder }]}>
            <Text style={[styles.modalTitle, { color: C.modalTitle }]}>{i.selectCity}</Text>
            <TextInput
              style={[styles.searchInput, { backgroundColor: C.searchInput, borderColor: C.searchInputBorder, color: C.searchInputText }]}
              placeholder={i.searchCity}
              placeholderTextColor={C.searchPlaceholder}
              value={searchText}
              onChangeText={setSearchText}
            />
            <FlatList
              data={getOrderedCities(searchText)}
              keyExtractor={(item) => item}
              style={{ maxHeight: 350 }}
              renderItem={({ item }) => {
                const active = selectedCity === item;
                return (
                  <Pressable
                    style={[
                      styles.cityItem,
                      { backgroundColor: C.cityItem, borderColor: C.cityItemBorder },
                      active && { backgroundColor: C.cityItemActive, borderColor: C.cityItemActiveBorder }
                    ]}
                    onPress={() => {
                      onSelectCity(item);
                      setSearchText("");
                    }}
                  >
                    <Text style={[styles.cityItemText, { color: C.cityItemText }, active && { color: C.cityItemTextActive }]}>
                    {item === ALL_CITIES_KEY ? i.allCities : item}
                  </Text>
                  </Pressable>
                );
              }}
            />
            <Pressable style={styles.closeModalBtn} onPress={() => { setShowCityModal(false); setSearchText(""); }}>
              <Text style={styles.closeModalText}>{i.close}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 2 },
  filtersRow: { marginBottom: 12, flexDirection: "row", gap: 8 },
  chip: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  chipText: { fontWeight: "700", fontSize: 13 },
  chipTextActive: { color: "#0A2230" },

  cityCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10
  },
  cityLabel: { fontSize: 12, fontWeight: "700", marginBottom: 8 },
  cityPicker: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  cityPickerText: { fontSize: 14, fontWeight: "600" },
  cityPickerArrow: { fontSize: 16, fontWeight: "700" },
  updatedText: { marginTop: 8, fontSize: 11, fontWeight: "600" },

  listContent: { paddingBottom: 14, gap: 10 },
  stationCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  stationHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  stationRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  stationStarBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  stationStarText: { color: "#F6C35E", fontSize: 17, lineHeight: 19 },
  stationTitle: { fontWeight: "700", fontSize: 15 },
  stationMeta: { fontWeight: "600", fontSize: 11, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontWeight: "600", fontSize: 11 },
  priceHeader: { marginTop: 12, flexDirection: "row", justifyContent: "flex-end", alignItems: "center" },
  bestPriceHint: { fontSize: 12, fontWeight: "700" },
  brandRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#3A6277"
  },
  brandName: { fontSize: 14, fontWeight: "600" },
  brandPrice: { fontSize: 17, fontWeight: "800" },

  emptyState: {
    marginTop: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyStateText: { fontSize: 14, fontWeight: "700" },
  emptyStateSub: { fontSize: 12, marginTop: 6 },

  modalOverlay: { flex: 1, backgroundColor: "#000000AA", justifyContent: "flex-end" },
  modalBox: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    borderTopWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 10 },
  searchInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 14,
    fontWeight: "500"
  },
  cityItem: {
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6
  },
  cityItemText: { fontSize: 14, fontWeight: "600" },
  closeModalBtn: {
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: "#1B7FAB",
    alignItems: "center",
    paddingVertical: 12
  },
  closeModalText: { color: "#F2FAFF", fontWeight: "800", fontSize: 14 }
});
