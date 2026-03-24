# Benzin

Expo ile gelistirilmis, Turkiye akaryakit fiyatlarini (Benzin, Motorin, LPG) ornek JSON veri ile listeleyen basit mobil uygulama.

## Kurulum

```bash
if (Test-Path node_modules) { Remove-Item -Recurse -Force node_modules }
if (Test-Path package-lock.json) { Remove-Item -Force package-lock.json }
npm install
npm run start
```

## Proje Notlari

- Uygulama girisi: App.js
- Ornek veri dosyasi: data/fuelPrices.sample.json
- Logo varligi: assets/logo.svg

Su an veriler JSON dosyasindan okunur. Sonraki asamada gercek API baglantisi eklenebilir.

## Node Notu

Bu proje su anda Node 18 ile uyumlu Expo SDK 51 surumune sabitlenmistir. Daha yeni Expo surumleri Node 20 isteyebilir.
