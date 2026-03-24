import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from "react-native";

import data from "./data/fuelPrices.sample.json";

const fuelLabels = {
  benzin: "Benzin",
  motorin: "Motorin",
  lpg: "LPG"
};

const fuelAccent = {
  benzin: "#F59E0B",
  motorin: "#0EA5E9",
  lpg: "#22C55E"
};

const titleForStation = (record) => `${record.city} / ${record.district}`;

const currencyFormatter = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export default function App() {
  const [selectedFuel, setSelectedFuel] = useState("benzin");

  const averagePrice = useMemo(() => {
    const total = data.records.reduce((sum, station) => sum + station.prices[selectedFuel], 0);
    return total / data.records.length;
  }, [selectedFuel]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />

      <View style={styles.bgBlobTop} />
      <View style={styles.bgBlobBottom} />

      <View style={styles.container}>
        <View style={styles.headerCard}>
          <View style={styles.logoMark}>
            <View style={styles.logoDropOuter}>
              <View style={styles.logoDropInner} />
            </View>
          </View>

          <View style={styles.headerTextWrap}>
            <Text style={styles.kicker}>ustad-benzin</Text>
            <Text style={styles.title}>Benzin Fiyatları</Text>
            <Text style={styles.subtitle}>Guncelleme: {new Date(data.updatedAt).toLocaleString("tr-TR")}</Text>
          </View>
        </View>

        <View style={styles.filtersRow}>
          {["benzin", "motorin", "lpg"].map((fuel) => {
            const active = selectedFuel === fuel;
            return (
              <Pressable
                key={fuel}
                onPress={() => setSelectedFuel(fuel)}
                style={[
                  styles.chip,
                  active && {
                    backgroundColor: fuelAccent[fuel],
                    borderColor: fuelAccent[fuel]
                  }
                ]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{fuelLabels[fuel]}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Ortalama {fuelLabels[selectedFuel]}</Text>
          <Text style={styles.summaryValue}>{currencyFormatter.format(averagePrice)} TL</Text>
          <Text style={styles.summaryHint}>Ornek veri setindeki {data.records.length} istasyon baz alinir.</Text>
        </View>

        <FlatList
          data={data.records}
          keyExtractor={(item) => `${item.city}-${item.district}-${item.brand}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.stationCard}>
              <View style={styles.stationHead}>
                <Text style={styles.stationTitle}>{titleForStation(item)}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.brand}</Text>
                </View>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.priceName}>{fuelLabels[selectedFuel]}</Text>
                <Text style={[styles.priceValue, { color: fuelAccent[selectedFuel] }]}>
                  {currencyFormatter.format(item.prices[selectedFuel])} TL
                </Text>
              </View>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#081B26"
  },
  bgBlobTop: {
    position: "absolute",
    top: -80,
    right: -70,
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: "#0EA5E92A"
  },
  bgBlobBottom: {
    position: "absolute",
    bottom: -120,
    left: -90,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "#22C55E24"
  },
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 10
  },
  headerCard: {
    backgroundColor: "#0F2A3A",
    borderRadius: 24,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1A425A"
  },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#0F766E",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14
  },
  logoDropOuter: {
    width: 28,
    height: 36,
    borderRadius: 16,
    backgroundColor: "#FDE68A",
    alignItems: "center",
    justifyContent: "center"
  },
  logoDropInner: {
    width: 14,
    height: 18,
    borderRadius: 8,
    backgroundColor: "#0F766E"
  },
  headerTextWrap: {
    flex: 1
  },
  kicker: {
    color: "#7DD3FC",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1
  },
  title: {
    color: "#F0F9FF",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 2
  },
  subtitle: {
    color: "#C7DCE9",
    fontSize: 12,
    marginTop: 4
  },
  filtersRow: {
    marginTop: 16,
    flexDirection: "row",
    gap: 10
  },
  chip: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#26465A",
    backgroundColor: "#0E2230"
  },
  chipText: {
    color: "#C8DDEB",
    fontWeight: "700",
    fontSize: 13
  },
  chipTextActive: {
    color: "#08202E"
  },
  summaryCard: {
    marginTop: 14,
    backgroundColor: "#102B3A",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1A425A"
  },
  summaryLabel: {
    color: "#9CC8DF",
    fontSize: 12,
    fontWeight: "700"
  },
  summaryValue: {
    color: "#F8FAFC",
    marginTop: 4,
    fontSize: 26,
    fontWeight: "800"
  },
  summaryHint: {
    color: "#C7DCE9",
    marginTop: 4,
    fontSize: 12
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 40,
    gap: 12
  },
  stationCard: {
    backgroundColor: "#0E2230",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1A425A"
  },
  stationHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  stationTitle: {
    color: "#ECFEFF",
    fontWeight: "700",
    fontSize: 15
  },
  badge: {
    backgroundColor: "#18374B",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999
  },
  badgeText: {
    color: "#9CC8DF",
    fontWeight: "600",
    fontSize: 11
  },
  priceRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  priceName: {
    color: "#C8DDEB",
    fontSize: 13,
    fontWeight: "600"
  },
  priceValue: {
    fontSize: 22,
    fontWeight: "800"
  }
});
