#!/usr/bin/env node
// AMS Mobile — FlutterFlow Kit builder.
// Membaca kit.json + dart/{functions,actions,widgets}.dart (bertanda "// @ff {...}"),
// memvalidasi setiap unit, lalu menghasilkan:
//   dist/units/NN-<id>.dart        → blok siap tempel per unit FlutterFlow
//   dist/AMS-FlutterFlow-Kit.md    → satu dokumen panduan + seluruh kode berurutan
//   dist/pubspec-additions.yaml    → dependensi untuk FlutterFlow
//   dist/app-state.json            → spesifikasi App State
//   dist/manifest.json             → indeks unit + checksum
//   verify/lib/custom_code/*.dart  → struktur file persis seperti hasil generate FlutterFlow
// Pakai: node scripts/build-kit.mjs [--check]

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hanyaCek = process.argv.includes('--check');
const masalah = [];
const info = [];

function baca(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function tulis(rel, isi) {
  const target = path.join(root, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, isi, 'utf8');
}

const kit = JSON.parse(baca('kit.json'));
const namaDep = new Set(kit.dependencies.map((d) => d.name));
const namaSedia = new Set(kit.disediakanFlutterFlow.map((d) => d.name));

const sumber = ['functions', 'actions', 'widgets'].map((jenis) => ({
  jenis,
  teks: baca(`dart/${jenis}.dart`),
}));

const unit = [];
for (const { jenis, teks } of sumber) {
  const baris = teks.split(/\r?\n/);
  let aktif = null;
  for (const b of baris) {
    const penanda = b.match(/^\/\/\s*@ff\s+(\{.*\})\s*$/);
    if (penanda) {
      let meta;
      try {
        meta = JSON.parse(penanda[1]);
      } catch (e) {
        masalah.push(`${jenis}: penanda @ff bukan JSON valid → ${e.message}`);
        continue;
      }
      aktif = { ...meta, jenis, kode: [] };
      unit.push(aktif);
      continue;
    }
    if (aktif) aktif.kode.push(b);
  }
}

for (const u of unit) {
  u.kode = u.kode.join('\n').replace(/\s+$/, '');
}

const namaUnit = new Set(unit.map((u) => u.name));
const namaWidget = new Set(unit.filter((u) => u.type === 'widget').map((u) => u.name));
const namaFungsiAksi = new Set(unit.filter((u) => u.type !== 'widget').map((u) => u.name));

function validasi() {
  if (unit.length === 0) masalah.push('Tidak ada unit @ff ditemukan.');

  const terlihat = new Set();
  const kelasPrivat = new Map();

  for (const [i, u] of unit.entries()) {
    const label = `${u.jenis}/${u.id ?? '(tanpa id)'}`;
    if (!u.id || !u.name || !u.type || !u.desc) {
      masalah.push(`${label}: metadata wajib id, name, type, desc.`);
    }
    if (!['function', 'action', 'widget'].includes(u.type)) {
      masalah.push(`${label}: type harus function|action|widget.`);
    }
    if (u.type === 'action') {
      if (!Array.isArray(u.params) || u.params[0]?.type !== 'BuildContext') {
        masalah.push(`${label}: action wajib berparameter pertama BuildContext.`);
      }
      if (!/Future<\w+>\s+/.test(u.kode) && !/Future<void>/.test(u.kode)) {
        masalah.push(`${label}: action harus async (Future).`);
      }
    }
    if (u.type === 'widget' && !/class\s+\w+\s+extends\s+(StatelessWidget|StatefulWidget)/.test(u.kode)) {
      masalah.push(`${label}: widget harus extends StatelessWidget atau StatefulWidget.`);
    }
    if (u.type !== 'widget' && !new RegExp(`\\b${u.name}\\s*\\(`).test(u.kode)) {
      masalah.push(`${label}: kode tidak memuat deklarasi ${u.name}().`);
    }
    if (u.type === 'widget' && !new RegExp(`class\\s+${u.name}\\b`).test(u.kode)) {
      masalah.push(`${label}: kode tidak memuat class ${u.name}.`);
    }
    if (/\b(TODO|FIXME|XXX|UnimplementedError|placeholder)\b/i.test(u.kode)) {
      masalah.push(`${label}: masih memuat TODO/placeholder.`);
    }

    const imporDeklarasi = new Set(u.imports ?? []);
    for (const im of imporDeklarasi) {
      const pkg = im.match(/^package:([^/]+)\//)?.[1];
      if (im.startsWith('dart:') || im.startsWith('package:flutter/')) continue;
      if (pkg && !namaDep.has(pkg) && !namaSedia.has(pkg)) {
        masalah.push(`${label}: impor ${im} memakai paket "${pkg}" yang belum dideklarasikan di kit.json.`);
      }
      if (!pkg) masalah.push(`${label}: impor tidak dikenal → ${im}`);
    }
    for (const im of u.kode.match(/^import\s+'([^']+)'/gm) ?? []) {
      const bersih = im.replace(/^import\s+'/, '').replace(/'.*$/, '');
      if (!imporDeklarasi.has(bersih)) {
        masalah.push(`${label}: impor "${bersih}" ada di kode tapi tidak di metadata imports.`);
      }
    }
    for (const d of u.deps ?? []) {
      if (!namaDep.has(d) && !namaSedia.has(d)) {
        masalah.push(`${label}: deps "${d}" tidak ada di kit.json.`);
      }
    }

    for (const panggil of u.kode.match(/\b(ams[A-Za-z0-9_]+)\s*\(/g) ?? []) {
      const nama = panggil.replace(/\s*\($/, '');
      if (!namaFungsiAksi.has(nama)) {
        masalah.push(`${label}: memanggil ${nama}() yang bukan unit function/action terdaftar.`);
      }
    }
    for (const pakai of u.kode.match(/\b(Ams[A-Za-z0-9_]+)\s*\(/g) ?? []) {
      const nama = pakai.replace(/\s*\($/, '');
      if (!namaWidget.has(nama)) {
        masalah.push(`${label}: memakai widget ${nama} yang bukan unit widget terdaftar.`);
      }
    }

    for (const k of u.kode.match(/^class\s+(_[A-Za-z0-9_]+)\b/gm) ?? []) {
      const nama = k.replace(/^class\s+/, '');
      if (kelasPrivat.has(nama)) {
        masalah.push(`${label}: kelas privat ${nama} didefinisikan ganda (sebelumnya di ${kelasPrivat.get(nama)}).`);
      }
      kelasPrivat.set(nama, u.id);
      terlihat.add(nama);
    }
    for (const pakai of u.kode.match(/\b(_[A-Z][A-Za-z0-9_]*)\s*\(/g) ?? []) {
      const nama = pakai.replace(/\s*\($/, '');
      if (!terlihat.has(nama) && !/^\(_/.test(pakai)) {
        const adaDiUnitIni = new RegExp(`class\\s+${nama}\\b`).test(u.kode);
        if (!adaDiUnitIni) {
          masalah.push(`${label}: memakai kelas privat ${nama} yang belum didefinisikan pada unit ini atau unit sebelumnya (urutan tempel salah).`);
        }
      }
    }
    for (const nama of u.kode.match(/^class\s+([A-Z][A-Za-z0-9_]*)\b/gm) ?? []) {
      terlihat.add(nama.replace(/^class\s+/, ''));
    }

    const buka = (u.kode.match(/\{/g) ?? []).length;
    const tutup = (u.kode.match(/\}/g) ?? []).length;
    if (buka !== tutup) {
      masalah.push(`${label}: kurung kurawal tidak seimbang (${buka} buka / ${tutup} tutup).`);
    }
    info.push(`  ${String(i + 1).padStart(2, '0')}. [${u.type}] ${u.name} (${u.kode.split('\n').length} baris)`);
  }

  const urutanJenis = { function: 0, action: 1, widget: 2 };
  for (let i = 1; i < unit.length; i++) {
    if (urutanJenis[unit[i].type] < urutanJenis[unit[i - 1].type]) {
      masalah.push(`Urutan unit harus functions → actions → widgets; "${unit[i].name}" muncul setelah ${unit[i - 1].type}.`);
    }
  }
}

validasi();

const ringkas = `${unit.filter((u) => u.type === 'function').length} functions, ${unit.filter((u) => u.type === 'action').length} actions, ${unit.filter((u) => u.type === 'widget').length} widgets`;

if (masalah.length) {
  console.error(`KIT GAGAL VALIDASI (${masalah.length} masalah):`);
  for (const m of masalah) console.error(`  - ${m}`);
  process.exit(1);
}

console.log(`Kit valid: ${ringkas}.`);
if (hanyaCek) {
  console.log(info.join('\n'));
  process.exit(0);
}

const headerImpor = (u, ekstra = []) => {
  const semua = [...new Set([...(u.imports ?? []), ...ekstra])];
  return semua.map((i) => `import '${i}';`).join('\n');
};

fs.rmSync(path.join(root, 'dist'), { recursive: true, force: true });

unit.forEach((u, i) => {
  const nn = String(i + 1).padStart(2, '0');
  const parameter = (u.params ?? [])
    .map((p) => `${p.type} ${p.name}${p.default !== undefined ? ` = ${JSON.stringify(p.default)}` : ''}`)
    .join(', ');
  const isi = [
    `// FlutterFlow → Custom ${u.type === 'widget' ? 'Widget' : u.type === 'action' ? 'Action' : 'Function'}: ${u.name}`,
    `// ${u.desc}`,
    `// Parameter: ${parameter || '(tidak ada)'}`,
    u.returns ? `// Return: ${u.returns}` : null,
    `// Dependensi: ${(u.deps ?? []).join(', ') || 'tidak ada'}`,
    headerImpor(u),
    '',
    u.kode,
    '',
  ]
    .filter((x) => x !== null)
    .join('\n');
  tulis(`dist/units/${nn}-${u.id}.dart`, isi);
});

const pubspec = [
  '# Tempel ke FlutterFlow → Custom Code → Dependencies (pubspec.yaml).',
  '# go_router & flutter sudah disediakan FlutterFlow; jangan ditambahkan di sini.',
  'dependencies:',
  ...kit.dependencies.map((d) => `  ${d.name}: ${d.version}`),
  '',
].join('\n');
tulis('dist/pubspec-additions.yaml', pubspec);
tulis('dist/app-state.json', `${JSON.stringify({ appState: kit.appState, bentukState: kit.bentukState, kunciPenyimpananAman: kit.kunciPenyimpananAman }, null, 2)}\n`);

const manifest = {
  nama: kit.nama,
  versi: kit.versi,
  dibuat: new Date().toISOString(),
  jumlahUnit: unit.length,
  unit: unit.map((u, i) => ({
    urutan: i + 1,
    id: u.id,
    name: u.name,
    type: u.type,
    params: u.params ?? [],
    returns: u.returns ?? null,
    imports: u.imports ?? [],
    deps: u.deps ?? [],
    berkas: `units/${String(i + 1).padStart(2, '0')}-${u.id}.dart`,
    sha256: createHash('sha256').update(u.kode).digest('hex').slice(0, 16),
  })),
};
tulis('dist/manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);

const bagianMarkdown = [];
bagianMarkdown.push(`# ${kit.nama}

Kit siap tempel untuk membangun **AMS Mobile** di FlutterFlow, terhubung ke backend
**${kit.induk}**. Versi kit ${kit.versi}.

Isi: ${ringkas}. Semua kode di dokumen ini **identik** dengan berkas di \`dist/units/\`
dan diverifikasi lewat \`flutter analyze\` + \`flutter test\` pada harness \`verify/\`.

## 1. Buat proyek & dependensi

1. FlutterFlow → **Create Project** → pilih *Blank App*, nama \`AMS Mobile\`.
2. **Custom Code → Dependencies**, tempel:

\`\`\`yaml
${pubspec.trim()}
\`\`\`

3. Klik **Save / Get Packages**. \`go_router\` dan \`flutter\` sudah bawaan FlutterFlow.

## 2. App State (satu variabel saja)

**App State → Add Variable**:

| Nama | Tipe | Default | Persisted |
| --- | --- | --- | --- |
${kit.appState.map((a) => `| \`${a.name}\` | ${a.type} | \`${JSON.stringify(a.default)}\` | ${a.persisted ? 'ya' : 'tidak'} |`).join('\n')}

Token sesi **tidak** disimpan di App State; kit memakai Keychain/Keystore lewat
\`flutter_secure_storage\` dengan kunci: ${kit.kunciPenyimpananAman.map((k) => `\`${k.key}\``).join(', ')}.

Bentuk \`amsState\` yang diisi kit:

${Object.entries(kit.bentukState).map(([k, v]) => `- \`${k}\` — ${v}`).join('\n')}

## 3. Tema (Theme Settings)

Warna (tempel sebagai *Custom Colors*):

| Token | Hex |
| --- | --- |
${Object.entries(kit.tema.warna).map(([k, v]) => `| ${k} | \`${v}\` |`).join('\n')}

Tipografi: **${kit.tema.tipografi.sans}** (sans) dan **${kit.tema.tipografi.mono}** (mono).
Radius kartu ${kit.tema.bentuk.radiusKartu}, tombol ${kit.tema.bentuk.radiusTombol}, badge ${kit.tema.bentuk.radiusBadge}.

## 4. Halaman

${kit.halaman.map((h) => `### ${h.nama} (\`${h.rute}\`)${h.initial ? ' — halaman awal' : ''}

Widget (urut dari atas): ${h.widget.map((w) => `\`${w}\``).join(', ')}.
${h.aksi.length ? `Aksi On Page Load: ${h.aksi.map((a) => `\`${a.action}\``).join(', ')}.` : 'Tanpa aksi tambahan.'}
${h.catatan}`).join('\n\n')}

> Atur **App State → amsState.apiBaseUrl** ke alamat backend AMS. Default kit
> \`${kit.api.baseUrlDefault}\` (alias loopback host dari emulator Android). Untuk perangkat
> fisik gunakan IP LAN atau domain HTTPS, contoh \`https://ams.perusahaan.co.id\`.

## 5. Tempel unit berurutan

Tempel **persis sesuai urutan** di bawah. Kelas pembantu privat (mis. \`_Tombol\`)
ikut dalam blok widget pertama yang memakainya — jangan dihapus.

${unit.map((u, i) => `### ${String(i + 1).padStart(2, '0')} · ${u.type === 'widget' ? 'Custom Widget' : u.type === 'action' ? 'Custom Action' : 'Custom Function'} — \`${u.name}\`

${u.desc}

**Parameter:** ${(u.params ?? []).map((p) => `\`${p.type} ${p.name}\`${p.default !== undefined ? ` (default ${JSON.stringify(p.default)})` : ''}`).join(', ') || 'tidak ada'}${u.returns ? ` · **Return:** \`${u.returns}\`` : ''}
**Dependensi:** ${(u.deps ?? []).join(', ') || 'tidak ada'}

\`\`\`dart
${headerImpor(u)}

${u.kode}
\`\`\`
`).join('\n')}

## 6. Kontrak API backend

Base URL: state \`amsState.apiBaseUrl\`. Semua endpoint kecuali login butuh header
\`Authorization: Bearer <token>\` (ditangani otomatis oleh \`amsApi\`).

| Method | Path | Body | Respons |
| --- | --- | --- | --- |
${kit.api.endpoints.map((e) => `| ${e.method} | \`${e.path}\` | ${e.body ? `\`${JSON.stringify(e.body)}\`` : '—'} | ${e.respons} |`).join('\n')}

## 7. Aturan bisnis (cermin aplikasi induk)

- Shift acuan: ${kit.aturanBisnis.jamMulaiKerja.join(', ')}; toleransi ${kit.aturanBisnis.toleransiKeterlambatanMenit} menit; potongan ${'Rp'}${kit.aturanBisnis.potonganPerJamTerlambat.toLocaleString('id-ID')}/jam (dibulatkan ke atas).
- Jam masuk dinilai terhadap shift terdekat dalam ${kit.aturanBisnis.ambangAcuanTerdekatMenit} menit; di luar itu dianggap bukan absensi shift biasa.
- Akurasi GPS maksimum ${kit.aturanBisnis.akurasiGpsMaksMeter} m; mock GPS ditolak server.
- Selfie wajib, maksimum ${(kit.aturanBisnis.fotoMaksByte / 1024 / 1024).toFixed(0)} MB, dikirim sebagai data URL base64.
- Geofence default: ${kit.aturanBisnis.geofenceDefault.nama} (${kit.aturanBisnis.geofenceDefault.lat}, ${kit.aturanBisnis.geofenceDefault.lon}) radius ${kit.aturanBisnis.geofenceDefault.radiusMeter} m — master resmi diambil dari \`/api/geo/locations\`.
- **Jam, status, dan potongan final selalu diputuskan server.** Perhitungan di klien hanya pratinjau.

## 8. Izin platform

**Android** (\`android/app/src/main/AndroidManifest.xml\`): \`ACCESS_FINE_LOCATION\`,
\`ACCESS_COARSE_LOCATION\`, \`CAMERA\`, \`INTERNET\`. Untuk uji HTTP non-TLS di emulator,
tambahkan \`android:usesCleartextTraffic="true"\` pada \`<application>\` (atau pakai HTTPS).

**iOS** (\`Info.plist\`): \`NSLocationWhenInUseUsageDescription\`, \`NSCameraUsageDescription\`.

FlutterFlow mengurus izin ini lewat **App Settings → Permissions**; pastikan lokasi
dan kamera dicentang agar tidak ditolak sistem operasi.

## 9. Verifikasi

\`\`\`bash
node flutterflow/scripts/build-kit.mjs --check   # validasi kit tanpa menulis
node flutterflow/scripts/build-kit.mjs           # bangun dist/ + harness verify/
cd flutterflow/verify
flutter pub get
flutter analyze
flutter test
flutter run                                      # aplikasi referensi (kode kit yang sama)
\`\`\`

Harness \`verify/\` memakai berkas \`custom_code/\` yang **dibangkitkan dari kit ini**
dengan struktur persis seperti hasil generate FlutterFlow, plus stub \`FFAppState\`
yang setara dengan App State di atas. Lolosnya analyze + test berarti kode kit
kompilasi bersih terhadap Flutter ${kit.flutterMinimal}+.
`);
tulis('dist/AMS-FlutterFlow-Kit.md', bagianMarkdown.join('\n'));

const gabung = (jenis, ekstraImpor) => {
  const daftar = unit.filter((u) => u.jenis === jenis);
  const impor = new Set();
  for (const u of daftar) for (const i of u.imports ?? []) impor.add(i);
  const kepala = [
    '// Dibangkitkan oleh flutterflow/scripts/build-kit.mjs — JANGAN diedit manual.',
    "// Struktur ini meniru lib/custom_code/<jenis>.dart hasil generate FlutterFlow.",
    ...[...impor].sort().map((i) => `import '${i}';`),
    ...ekstraImpor,
    '',
  ].join('\n');
  return `${kepala}${daftar.map((u) => u.kode).join('\n\n')}\n`;
};

tulis('verify/lib/custom_code/functions.dart', gabung('functions', ["import '../ff_app_state.dart';"]));
tulis(
  'verify/lib/custom_code/actions.dart',
  gabung('actions', ["import '../ff_app_state.dart';", "import 'functions.dart';"]),
);
tulis(
  'verify/lib/custom_code/widgets.dart',
  gabung('widgets', ["import '../ff_app_state.dart';", "import 'actions.dart';", "import 'functions.dart';"]),
);

console.log(info.join('\n'));
console.log('\nDitulis: dist/ (units, AMS-FlutterFlow-Kit.md, pubspec-additions.yaml, app-state.json, manifest.json) dan verify/lib/custom_code/.');
