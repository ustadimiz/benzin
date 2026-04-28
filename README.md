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
- Veri kaynagi: data/fuelPrices.sample.json
- Logo varligi: assets/logo.svg

Uygulama su anda sabit ornek JSON verisi ile calisir.

## Supabase Kimlik Dogrulama Kurulumu

Uygulama giris/kayit islemleri artik Supabase Auth ile calisir.

1. [app.json](app.json) icindeki asagidaki alanlari doldurun:

```json
"extra": {
	"supabaseUrl": "https://YOUR_PROJECT_REF.supabase.co",
	"supabaseAnonKey": "YOUR_SUPABASE_ANON_KEY"
}
```

2. Supabase SQL Editor'de profiles tablosunu olusturun:

```sql
create table if not exists public.profiles (
	id uuid primary key references auth.users(id) on delete cascade,
	email text unique not null,
	username text unique not null,
	display_name text not null,
	created_at timestamptz default now()
);

alter table public.profiles add column if not exists is_deleted boolean not null default false;
alter table public.profiles add column if not exists deleted_at timestamptz;

alter table public.profiles enable row level security;

drop policy if exists "Profiles are readable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

create policy "Profiles are readable by everyone"
on public.profiles
for select
using (true);

create policy "Users can insert their own profile"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles
for update
using (auth.uid() = id);

create table if not exists public.user_app_data (
	user_id uuid primary key references auth.users(id) on delete cascade,
	fuel_data jsonb not null default '{"vehicles": [], "entries": []}'::jsonb,
	fuel_updated_at timestamptz,
	maintenance_data jsonb not null default '{"entries": []}'::jsonb,
	maintenance_updated_at timestamptz,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

alter table public.user_app_data add column if not exists is_deleted boolean not null default false;
alter table public.user_app_data add column if not exists deleted_at timestamptz;

alter table public.user_app_data enable row level security;

drop policy if exists "Users can read their own app data" on public.user_app_data;
drop policy if exists "Users can insert their own app data" on public.user_app_data;
drop policy if exists "Users can update their own app data" on public.user_app_data;

create policy "Users can read their own app data"
on public.user_app_data
for select
using (auth.uid() = user_id);

create policy "Users can insert their own app data"
on public.user_app_data
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own app data"
on public.user_app_data
for update
using (auth.uid() = user_id);

create table if not exists public.maintenance_types (
	id bigint primary key generated always as identity,
	name text not null unique,
	created_at timestamptz not null default now()
);

alter table public.maintenance_types enable row level security;

drop policy if exists "Maintenance types are readable by everyone" on public.maintenance_types;

create policy "Maintenance types are readable by everyone"
on public.maintenance_types
for select
using (true);

insert into public.maintenance_types (name) values
	('Akü'), ('Antifriz'), ('Balata (Fren)'), ('Cam Silecekleri'), ('Differansiyel Yağı'),
	('Dizel Filtresi'), ('Enjektör Temizliği'), ('Far Ampülü'), ('Filtre (Ayva)'),
	('Fren Balata Ön'), ('Fren Balata Arka'), ('Fren Diskleri'), ('Fren Sıvısı'),
	('Gaz Filtresi (LPG)'), ('Hava Filtresi'), ('Hidrolik Sıvı'), ('Işık Kontrol'),
	('Karbüratör Temizliği'), ('Klç Takımı'), ('Kontrol Muayenesi'), ('Körükler'),
	('Lastik Değişimi'), ('Lastik Onarımı'), ('Lastik Yönü'), ('Motor Yağı Değişimi'),
	('Motor Yağı Filtresi'), ('Oto Elektrik'), ('Pamuk Filtre'), ('Radyatör Temizliği'),
	('Sağlık Kontrol'), ('Şaft Onarımı'), ('Spark Plug (Bujiler)'), ('Şanzıman Yağı'),
	('Tesisat Kontrol'), ('Türboşarj Servisi'), ('Valve Korektörü'), ('Yönetim Kontrol'),
	('Zincir Gerimi') on conflict do nothing;
```

3. Bu tablo ile yakit ve bakim verileri hem cihazda cache'lenir hem de kullanici hesabi altinda cloud'a yazilir. Kullanici yeni telefonda ayni hesapla giris yaptiginda en guncel veri otomatik olarak geri yuklenir.

4. Ayarlar ekranindaki "Hesabi Sil" aksiyonu `profiles` ve `user_app_data` tablolarindaki `is_deleted` alanini `true` yapar. Bu soft delete davranisidir; kayit fiziksel olarak silinmez.

5. Supabase Auth ayarlarinda email confirmation aciksa, kayit sonrasi kullanici mailini dogrulayip giris yapmalidir.

## Hesap Silme ve Ayni Email ile Yeniden Kayit

Sadece `is_deleted = true` yapmak ayni email ile tekrar kayit icin yeterli degildir; Supabase Auth tarafindaki `auth.users` kaydi da silinmelidir.

Bu proje bunun icin bir Supabase Edge Function icerir:

- [supabase/functions/delete-account/index.ts](supabase/functions/delete-account/index.ts)

Bu function sunlari yapar:

1. `profiles` kaydini `is_deleted = true` yapar.
2. `user_app_data` kaydini `is_deleted = true` yapar.
3. Auth kullanicisini gercekten siler.

Boylece kullanici ayni email ile yeniden kayit olabilir.

Deploy etmek icin senin terminalinde su komutlari calistirman gerekir:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy delete-account --no-verify-jwt=false
```

Notlar:

1. Bu function `SERVICE_ROLE_KEY` secret'i ile calisir; bu anahtar sadece Edge Function ortaminda kullanilmali, mobil uygulamaya konmamalidir.
2. Function deploy edilmeden uygulamadaki "Hesabi Sil" butonu tam silme yapmaz; uygulama sana bu durumu hata olarak gosterir.

## Node Notu

Bu proje su anda Node 18 ile uyumlu Expo SDK 51 surumune sabitlenmistir. Daha yeni Expo surumleri Node 20 isteyebilir.

## Web Yayini (GitHub Pages)

Bu repo artik GitHub Pages icin otomatik deploy workflow'u icerir:

- [.github/workflows/deploy-web-pages.yml](.github/workflows/deploy-web-pages.yml)

### Beklenen link formati

Repo adi `aracdefterim` ise yayin linki su sekilde olur:

`https://KULLANICI_ADI.github.io/aracdefterim`

### Bir kere yapilacak ayar

1. GitHub'da repo ayarlarina girin: Settings > Pages
2. Source olarak `GitHub Actions` secin
3. Bu repoya `main` branch'e push edin

Workflow otomatik olarak web build alip yayinlayacaktir.

### Lokal web export (opsiyonel)

Istersen lokalde statik cikti almak icin:

```bash
npm run export:web
```

Bu komut web ciktisini `dist/` klasorune uretir.

## Supabase Keep-Alive (GitHub Actions)

Supabase Free proje uykuya dusuyorsa, bu repodaki workflow otomatik ping atar:
profiles tablosundan sadece 1 satır id oku 

- [.github/workflows/supabase-keep-alive.yml](.github/workflows/supabase-keep-alive.yml)

Aktif etmek icin:

1. Repo'yu GitHub'a push edin.
2. GitHub > Repo > Settings > Secrets and variables > Actions > New repository secret:
	- `SUPABASE_URL` = `https://YOUR_PROJECT_REF.supabase.co`
	- `SUPABASE_ANON_KEY` = publishable/anon key
3. GitHub > Actions > "Supabase Keep Alive" workflow'unu bir kez `Run workflow` ile manuel calistirin.

Not: Workflow her 15 dakikada bir `profiles` endpoint'ine hafif bir istek atar.
