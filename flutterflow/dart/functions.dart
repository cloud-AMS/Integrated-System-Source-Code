// AMS Mobile — FlutterFlow Custom Functions
// Satu blok "@ff" = satu Custom Function di FlutterFlow. Tempel berurutan.
// Semua fungsi di file ini berakhir di lib/custom_code/functions.dart pada proyek
// FlutterFlow hasil generate, sehingga saling memanggil satu sama lain aman.
// Sumber kebenaran aturan: src/utils/hris.ts + server/attendance.ts (aplikasi induk).

// @ff {"id":"amsState","type":"function","name":"amsState","returns":"dynamic","params":[],"imports":[],"deps":[],"desc":"Membaca seluruh state AMS dari FFAppState.amsState (JSON)."}
dynamic amsState() {
  final dynamic mentah = FFAppState().amsState;
  return mentah is Map ? Map<String, dynamic>.from(mentah) : <String, dynamic>{};
}

// @ff {"id":"amsPatchState","type":"function","name":"amsPatchState","returns":"dynamic","params":[{"name":"patch","type":"dynamic"}],"imports":[],"deps":[],"desc":"Menggabungkan sebagian field ke state AMS lalu memicu rebuild UI."}
dynamic amsPatchState(dynamic patch) {
  final state = Map<String, dynamic>.from(amsState() as Map);
  if (patch is Map) state.addAll(Map<String, dynamic>.from(patch));
  FFAppState().amsState = state;
  return state;
}

// @ff {"id":"amsToken","type":"function","name":"amsToken","returns":"Future<String>","params":[],"imports":["package:flutter_secure_storage/flutter_secure_storage.dart"],"deps":["flutter_secure_storage"],"desc":"Mengambil token sesi dari Keychain/Keystore (bukan dari state UI)."}
Future<String> amsToken() async {
  const penyimpanan = FlutterSecureStorage();
  try {
    return await penyimpanan.read(key: 'ams_session_token') ?? '';
  } catch (_) {
    return '';
  }
}

// @ff {"id":"amsApi","type":"function","name":"amsApi","returns":"Future<dynamic>","params":[{"name":"method","type":"String"},{"name":"path","type":"String"},{"name":"body","type":"dynamic"}],"imports":["dart:convert","package:http/http.dart as http"],"deps":["http"],"desc":"Pemanggil REST tunggal ke backend AMS. Mengembalikan {ok,status,data,pesan}; tidak pernah melempar exception."}
Future<dynamic> amsApi(String method, String path, dynamic body) async {
  final state = amsState();
  final dasar = state['apiBaseUrl'];
  final basis = (dasar is String && dasar.trim().isNotEmpty)
      ? dasar.trim()
      : 'http://10.0.2.2:3000';
  final token = await amsToken();
  final uri = Uri.parse('${basis.replaceAll(RegExp(r'/+$'), '')}$path');
  final header = <String, String>{'Accept': 'application/json'};
  if (token.isNotEmpty) header['Authorization'] = 'Bearer $token';
  if (body != null) header['Content-Type'] = 'application/json';

  final klien = http.Client();
  try {
    final permintaan = http.Request(method.toUpperCase(), uri)..headers.addAll(header);
    if (body != null) permintaan.body = jsonEncode(body);
    final streamed = await klien.send(permintaan).timeout(const Duration(seconds: 30));
    final res = await http.Response.fromStream(streamed);
    dynamic data;
    try {
      data = res.body.isEmpty ? null : jsonDecode(res.body);
    } catch (_) {
      data = null;
    }
    final ok = res.statusCode >= 200 && res.statusCode < 300;
    final pesan = ok
        ? ''
        : (data is Map && data['pesan'] is String
            ? data['pesan'] as String
            : 'Server menolak permintaan (HTTP ${res.statusCode}).');
    return <String, dynamic>{'ok': ok, 'status': res.statusCode, 'data': data, 'pesan': pesan};
  } catch (_) {
    return <String, dynamic>{
      'ok': false,
      'status': 0,
      'data': null,
      'pesan': 'Tidak dapat menghubungi server. Periksa koneksi dan alamat API.'
    };
  } finally {
    klien.close();
  }
}

// @ff {"id":"amsJarakKm","type":"function","name":"amsJarakKm","returns":"double","params":[{"name":"lat1","type":"double"},{"name":"lon1","type":"double"},{"name":"lat2","type":"double"},{"name":"lon2","type":"double"}],"imports":["dart:math"],"deps":[],"desc":"Haversine (R=6371 km), identik dengan hitungJarakKm di aplikasi induk."}
double amsJarakKm(double lat1, double lon1, double lat2, double lon2) {
  double keRad(double derajat) => derajat * pi / 180;
  const r = 6371.0;
  final dLat = keRad(lat2 - lat1);
  final dLon = keRad(lon2 - lon1);
  final a = sin(dLat / 2) * sin(dLat / 2) +
      cos(keRad(lat1)) * cos(keRad(lat2)) * sin(dLon / 2) * sin(dLon / 2);
  return r * 2 * atan2(sqrt(a), sqrt(1 - a));
}

// @ff {"id":"amsGeofence","type":"function","name":"amsGeofence","returns":"dynamic","params":[{"name":"lat","type":"double"},{"name":"lon","type":"double"},{"name":"daftarLokasi","type":"dynamic"}],"imports":[],"deps":[],"desc":"Pratinjau pagar geofence sisi klien (pilih lokasi terdekat). Keputusan final tetap di server."}
dynamic amsGeofence(double lat, double lon, dynamic daftarLokasi) {
  final daftar = daftarLokasi is List ? daftarLokasi : const [];
  if (daftar.isEmpty) {
    return <String, dynamic>{
      'dalamPagar': false,
      'jarakMeter': 0,
      'radiusMeter': 0,
      'lokasiId': '',
      'nama': '-',
      'label': 'Master lokasi belum dimuat dari server.'
    };
  }
  Map<String, dynamic>? terdekat;
  var jarakTerdekat = double.infinity;
  for (final item in daftar) {
    if (item is! Map) continue;
    final l = Map<String, dynamic>.from(item);
    final jarak = amsJarakKm(
          lat,
          lon,
          (l['lat'] as num?)?.toDouble() ?? 0,
          (l['lon'] as num?)?.toDouble() ?? 0,
        ) *
        1000;
    if (jarak < jarakTerdekat) {
      jarakTerdekat = jarak;
      terdekat = l;
    }
  }
  if (terdekat == null) {
    return <String, dynamic>{
      'dalamPagar': false,
      'jarakMeter': 0,
      'radiusMeter': 0,
      'lokasiId': '',
      'nama': '-',
      'label': 'Master lokasi tidak valid.'
    };
  }
  final radius = (terdekat['radiusMeter'] as num?)?.toDouble() ?? 0;
  final meter = jarakTerdekat.isFinite ? jarakTerdekat : 0.0;
  final dalam = meter <= radius;
  return <String, dynamic>{
    'lokasiId': terdekat['id'] ?? '',
    'nama': terdekat['nama'] ?? '-',
    'radiusMeter': radius,
    'jarakMeter': meter.round(),
    'dalamPagar': dalam,
    'label': dalam
        ? 'Valid — radius ${meter.round()} m di dalam pagar geofence ${radius.round()} m'
        : 'Ditolak — radius ${meter.round()} m di luar pagar geofence ${radius.round()} m'
  };
}

// @ff {"id":"amsKeterlambatan","type":"function","name":"amsKeterlambatan","returns":"dynamic","params":[{"name":"jamMasuk","type":"String"}],"imports":[],"deps":[],"desc":"Evaluasi terlambat terhadap shift terdekat (07/08/15/23), toleransi 10 menit, potongan Rp25.000 per jam dibulatkan ke atas."}
dynamic amsKeterlambatan(String jamMasuk) {
  const jamMulaiKerja = ['07:00', '08:00', '15:00', '23:00'];
  const toleransiMenit = 10;
  const potonganPerJam = 25000;

  int menitDariJam(String jam) {
    final bagian = jam.split(':');
    if (bagian.length < 2) return -1;
    final h = int.tryParse(bagian[0]);
    final m = int.tryParse(bagian[1]);
    if (h == null || m == null) return -1;
    return h * 60 + m;
  }

  final masuk = menitDariJam(jamMasuk);
  if (masuk < 0) {
    return <String, dynamic>{
      'jamAcuan': null,
      'menitTerlambat': 0,
      'status': 'Hadir',
      'potongan': 0
    };
  }
  String? acuan;
  var jarakTerdekat = 1 << 30;
  var selisihMaju = 0;
  for (final mulai in jamMulaiKerja) {
    final selisih = (masuk - menitDariJam(mulai) + 1440) % 1440;
    final jarak = selisih < 1440 - selisih ? selisih : 1440 - selisih;
    if (jarak < jarakTerdekat) {
      jarakTerdekat = jarak;
      selisihMaju = selisih > 720 ? 0 : selisih;
      acuan = mulai;
    }
  }
  final int menitTerlambat =
      (acuan == null || jarakTerdekat > 120) ? 0 : (selisihMaju - toleransiMenit).clamp(0, 1440).toInt();
  final jumlahJam = (menitTerlambat / 60).ceil();
  return <String, dynamic>{
    'jamAcuan': acuan,
    'menitTerlambat': menitTerlambat,
    'status': menitTerlambat > 0 ? 'Terlambat' : 'Hadir',
    'potongan': jumlahJam * potonganPerJam
  };
}

// @ff {"id":"amsValidasiClock","type":"function","name":"amsValidasiClock","returns":"dynamic","params":[{"name":"lat","type":"double"},{"name":"lon","type":"double"},{"name":"akurasiMeter","type":"double"},{"name":"mock","type":"bool"},{"name":"foto","type":"String"},{"name":"akurasiMaks","type":"double"}],"imports":["dart:convert"],"deps":[],"desc":"Pra-validasi payload absensi sebelum dikirim: koordinat, mock GPS, ambang akurasi, dan selfie wajib ≤5 MB."}
dynamic amsValidasiClock(
  double lat,
  double lon,
  double akurasiMeter,
  bool mock,
  String foto,
  double akurasiMaks,
) {
  if (lat.isNaN || lat < -90 || lat > 90) {
    return <String, dynamic>{'ok': false, 'pesan': 'Lintang tidak valid. Ambil ulang lokasi GPS.'};
  }
  if (lon.isNaN || lon < -180 || lon > 180) {
    return <String, dynamic>{'ok': false, 'pesan': 'Bujur tidak valid. Ambil ulang lokasi GPS.'};
  }
  if (mock) {
    return <String, dynamic>{'ok': false, 'pesan': 'Lokasi tiruan (mock GPS) ditolak.'};
  }
  if (akurasiMeter > akurasiMaks) {
    return <String, dynamic>{
      'ok': false,
      'pesan': 'Akurasi GPS ${akurasiMeter.round()} m di atas ambang ${akurasiMaks.round()} m.'
    };
  }
  if (foto.isEmpty) {
    return <String, dynamic>{'ok': false, 'pesan': 'Ambil selfie sebagai bukti absensi.'};
  }
  if (!foto.startsWith('data:image/')) {
    return <String, dynamic>{'ok': false, 'pesan': 'Foto harus data URL base64 dari kamera.'};
  }
  final payload = foto.contains(',') ? foto.split(',').last : foto;
  try {
    final byte = base64Decode(payload).length;
    if (byte > 5 * 1024 * 1024) {
      return <String, dynamic>{'ok': false, 'pesan': 'Foto terlalu besar (batas 5 MB).'};
    }
  } catch (_) {
    return <String, dynamic>{'ok': false, 'pesan': 'Foto rusak atau bukan base64 valid.'};
  }
  return <String, dynamic>{'ok': true, 'pesan': ''};
}

// @ff {"id":"amsSimpanSesi","type":"function","name":"amsSimpanSesi","returns":"Future<bool>","params":[{"name":"responsLogin","type":"dynamic"}],"imports":["dart:convert","package:flutter_secure_storage/flutter_secure_storage.dart"],"deps":["flutter_secure_storage"],"desc":"Menyimpan token + cache sesi ke penyimpanan aman dan mengisi state pengguna."}
Future<bool> amsSimpanSesi(dynamic responsLogin) async {
  if (responsLogin is! Map) return false;
  final data = Map<String, dynamic>.from(responsLogin);
  final token = data['token'];
  if (token is! String || token.isEmpty) return false;
  const penyimpanan = FlutterSecureStorage();
  try {
    await penyimpanan.write(key: 'ams_session_token', value: token);
    await penyimpanan.write(key: 'ams_session_cache', value: jsonEncode(data));
  } catch (_) {
    return false;
  }
  final pengguna = data['user'] is Map ? Map<String, dynamic>.from(data['user'] as Map) : {};
  final peran = data['role'] is Map ? Map<String, dynamic>.from(data['role'] as Map) : {};
  amsPatchState(<String, dynamic>{
    'user': pengguna,
    'roleName': peran['name'] ?? pengguna['roleName'] ?? '',
    'permissions': data['permissions'] ?? <String, dynamic>{},
    'expiresAt': data['expiresAt'] ?? '',
    'galat': '',
  });
  return true;
}

// @ff {"id":"amsBacaSesi","type":"function","name":"amsBacaSesi","returns":"Future<bool>","params":[],"imports":["dart:convert","package:flutter_secure_storage/flutter_secure_storage.dart"],"deps":["flutter_secure_storage"],"desc":"Memulihkan sesi tersimpan saat aplikasi dibuka (offline-first boot)."}
Future<bool> amsBacaSesi() async {
  const penyimpanan = FlutterSecureStorage();
  try {
    final token = await penyimpanan.read(key: 'ams_session_token');
    final cache = await penyimpanan.read(key: 'ams_session_cache');
    if (token == null || token.isEmpty || cache == null) return false;
    final data = jsonDecode(cache);
    if (data is! Map) return false;
    final sesi = Map<String, dynamic>.from(data);
    final pengguna = sesi['user'] is Map ? Map<String, dynamic>.from(sesi['user'] as Map) : {};
    final peran = sesi['role'] is Map ? Map<String, dynamic>.from(sesi['role'] as Map) : {};
    amsPatchState(<String, dynamic>{
      'user': pengguna,
      'roleName': peran['name'] ?? pengguna['roleName'] ?? '',
      'permissions': sesi['permissions'] ?? <String, dynamic>{},
      'expiresAt': sesi['expiresAt'] ?? '',
    });
    return true;
  } catch (_) {
    return false;
  }
}

// @ff {"id":"amsHapusSesi","type":"function","name":"amsHapusSesi","returns":"Future<bool>","params":[],"imports":["package:flutter_secure_storage/flutter_secure_storage.dart"],"deps":["flutter_secure_storage"],"desc":"Menghapus token, cache sesi, dan seluruh state AMS (logout penuh)."}
Future<bool> amsHapusSesi() async {
  const penyimpanan = FlutterSecureStorage();
  try {
    await penyimpanan.delete(key: 'ams_session_token');
    await penyimpanan.delete(key: 'ams_session_cache');
  } catch (_) {
    // Penyimpanan aman bisa gagal di perangkat tertentu; state UI tetap dibersihkan.
  }
  FFAppState().amsState = <String, dynamic>{'apiBaseUrl': amsState()['apiBaseUrl'] ?? ''};
  return true;
}

// @ff {"id":"amsDeviceId","type":"function","name":"amsDeviceId","returns":"Future<String>","params":[],"imports":["package:flutter_secure_storage/flutter_secure_storage.dart","package:uuid/uuid.dart"],"deps":["flutter_secure_storage","uuid"],"desc":"ID perangkat stabil untuk audit anti-spoof; dibuat sekali lalu disimpan aman."}
Future<String> amsDeviceId() async {
  const penyimpanan = FlutterSecureStorage();
  try {
    final ada = await penyimpanan.read(key: 'ams_device_id');
    if (ada != null && ada.isNotEmpty) {
      amsPatchState(<String, dynamic>{'deviceId': ada});
      return ada;
    }
    final baru = const Uuid().v4();
    await penyimpanan.write(key: 'ams_device_id', value: baru);
    amsPatchState(<String, dynamic>{'deviceId': baru});
    return baru;
  } catch (_) {
    final sementara = const Uuid().v4();
    amsPatchState(<String, dynamic>{'deviceId': sementara});
    return sementara;
  }
}

// @ff {"id":"amsWarna","type":"function","name":"amsWarna","returns":"Color","params":[{"name":"nama","type":"String"}],"imports":["package:flutter/material.dart"],"deps":[],"desc":"Token warna AMS Integrated System (satu sumber kebenaran untuk seluruh widget kit)."}
Color amsWarna(String nama) {
  const palet = <String, Color>{
    'aksen': Color(0xFF00AAFF),
    'info': Color(0xFF6366F1),
    'sekunder': Color(0xFFFF4400),
    'sukses': Color(0xFF059669),
    'suksesTua': Color(0xFF047857),
    'peringatan': Color(0xFFF59E0B),
    'bahaya': Color(0xFFE11D48),
    'ink': Color(0xFF111111),
    'slate700': Color(0xFF3D3D3D),
    'muted': Color(0xFF7A7A7A),
    'slate300': Color(0xFFD2D5D5),
    'border': Color(0xFFE3E5E5),
    'slate100': Color(0xFFF1F2F2),
    'latar': Color(0xFFF7F8F8),
    'surface': Color(0xFFFFFFFF),
  };
  return palet[nama] ?? palet['muted']!;
}

// @ff {"id":"amsTone","type":"function","name":"amsTone","returns":"Color","params":[{"name":"tone","type":"String"}],"imports":["package:flutter/material.dart"],"deps":[],"desc":"Memetakan nama nada badge (slate/emerald/blue/amber/rose/indigo) ke warna AMS."}
Color amsTone(String tone) {
  switch (tone) {
    case 'emerald':
      return amsWarna('sukses');
    case 'blue':
      return amsWarna('aksen');
    case 'amber':
      return amsWarna('peringatan');
    case 'rose':
      return amsWarna('bahaya');
    case 'indigo':
      return amsWarna('info');
    default:
      return amsWarna('slate700');
  }
}

// @ff {"id":"amsRupiah","type":"function","name":"amsRupiah","returns":"String","params":[{"name":"nilai","type":"int"}],"imports":["package:intl/intl.dart"],"deps":["intl"],"desc":"Format Rupiah tanpa desimal untuk potongan keterlambatan."}
String amsRupiah(int nilai) {
  return NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0).format(nilai);
}

// @ff {"id":"amsNotifikasi","type":"function","name":"amsNotifikasi","returns":"dynamic","params":[],"imports":[],"deps":[],"desc":"Kotak masuk berbasis peran yang diturunkan dari data absensi + hak modul (push notification menyusul di fase 3)."}
dynamic amsNotifikasi() {
  final state = amsState();
  final hasil = <Map<String, dynamic>>[];
  final hariIni = state['hariIni'];
  final rec = hariIni is Map ? Map<String, dynamic>.from(hariIni) : null;
  final nama = (state['user'] is Map ? (state['user'] as Map)['fullName'] : null) ?? 'Karyawan';

  if (rec == null) {
    hasil.add(<String, dynamic>{
      'judul': 'Absen hari ini belum tercatat',
      'pesan': 'Hai $nama, lakukan Clock In di tab Absen sebelum memulai pekerjaan.',
      'tone': 'amber',
      'rute': '/absen',
    });
  } else if ((rec['jamKeluar'] ?? '') == '') {
    hasil.add(<String, dynamic>{
      'judul': 'Clock Out belum dilakukan',
      'pesan': 'Jam masuk ${rec['jamMasuk']} tercatat. Jangan lupa Clock Out di akhir shift.',
      'tone': 'blue',
      'rute': '/absen',
    });
  } else {
    hasil.add(<String, dynamic>{
      'judul': 'Absensi hari ini lengkap',
      'pesan': 'Masuk ${rec['jamMasuk']} • Keluar ${rec['jamKeluar']} • ${rec['status']}.',
      'tone': 'emerald',
      'rute': '/absen',
    });
  }

  final izin = state['permissions'];
  final peta = izin is Map ? Map<String, dynamic>.from(izin) : <String, dynamic>{};
  const modul = <String, String>{
    'ra-pjt': 'Rantai Dingin & proyek PJT',
    'qa-mutu': 'QA / Mutu',
    'qc-inspeksi': 'QC Inspeksi',
    'gudang-logistik': 'Gudang & Logistik',
    'teknisi-service': 'Teknisi Service',
    'produksi-cpakb': 'Produksi CPAKB',
    'purchasing-procurement': 'Purchasing',
    'sales-marketing': 'Sales & Marketing',
    'pms-vigilance': 'PMS / Vigilance',
    'hrd-pelatihan': 'HRD & Pelatihan',
    'finance-akuntansi': 'Finance & Akuntansi',
    'it-traceability': 'IT Traceability',
  };
  final aktif = <String>[];
  for (final entri in peta.entries) {
    final aksi = entri.value;
    if (aksi is List && aksi.contains('view') && modul.containsKey(entri.key)) {
      aktif.add(modul[entri.key]!);
    }
  }
  if (aktif.isNotEmpty) {
    hasil.add(<String, dynamic>{
      'judul': 'Modul aktif untuk peran Anda',
      'pesan': '${aktif.take(4).join(', ')}${aktif.length > 4 ? ', +${aktif.length - 4} lainnya' : ''}.',
      'tone': 'slate',
      'rute': '/beranda',
    });
  }
  hasil.add(<String, dynamic>{
    'judul': 'Notifikasi pekerjaan realtime',
    'pesan': 'Push per-peran (WebSocket/SSE induk) dijadwalkan pada fase 3 blueprint AMS Mobile.',
    'tone': 'slate',
    'rute': '/notifikasi',
  });
  return hasil;
}
