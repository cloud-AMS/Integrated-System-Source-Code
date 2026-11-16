// Dibangkitkan oleh flutterflow/scripts/build-kit.mjs — JANGAN diedit manual.
// Struktur ini meniru lib/custom_code/<jenis>.dart hasil generate FlutterFlow.
import 'dart:convert';
import 'package:geolocator/geolocator.dart';
import 'package:uuid/uuid.dart';
import '../ff_app_state.dart';
import 'functions.dart';
Future<void> amsMuatGeo(BuildContext context) async {
  final res = await amsApi('GET', '/api/geo/locations', null);
  if (res['ok'] == true && res['data'] is Map) {
    final data = Map<String, dynamic>.from(res['data'] as Map);
    amsPatchState(<String, dynamic>{
      'geo': data,
      'akurasiMaks': (data['akurasiMaksMeter'] as num?)?.toDouble() ?? 50,
    });
  }
}

Future<void> amsMuatAbsensi(BuildContext context) async {
  final hariIni = await amsApi('GET', '/api/attendance/today', null);
  if (hariIni['ok'] == true && hariIni['data'] is Map) {
    amsPatchState(<String, dynamic>{'hariIni': (hariIni['data'] as Map)['record']});
  }
  final riwayat = await amsApi('GET', '/api/attendance/history', null);
  if (riwayat['ok'] == true && riwayat['data'] is Map) {
    final daftar = (riwayat['data'] as Map)['records'];
    amsPatchState(<String, dynamic>{'riwayat': daftar is List ? daftar : <dynamic>[]});
  }
}

Future<void> amsBoot(BuildContext context) async {
  amsPatchState(<String, dynamic>{'memuat': true, 'galat': ''});
  await amsDeviceId();
  final adaSesi = await amsBacaSesi();
  if (adaSesi) {
    final me = await amsApi('GET', '/api/auth/me', null);
    if (me['ok'] == true && me['data'] is Map) {
      final sesi = Map<String, dynamic>.from(me['data'] as Map);
      sesi['token'] = await amsToken();
      await amsSimpanSesi(sesi);
      await amsMuatGeo(context);
      await amsMuatAbsensi(context);
    } else if (me['status'] == 401 || me['status'] == 403) {
      await amsHapusSesi();
    }
  }
  amsPatchState(<String, dynamic>{'memuat': false});
}

Future<bool> amsLogin(BuildContext context, String username, String password) async {
  if (username.trim().isEmpty || password.isEmpty) {
    amsPatchState(<String, dynamic>{'galat': 'Nama pengguna dan kata sandi wajib diisi.'});
    return false;
  }
  amsPatchState(<String, dynamic>{'memuat': true, 'galat': ''});
  final res = await amsApi(
    'POST',
    '/api/auth/login',
    <String, dynamic>{'username': username.trim(), 'password': password},
  );
  if (res['ok'] != true) {
    amsPatchState(<String, dynamic>{'memuat': false, 'galat': res['pesan']});
    return false;
  }
  final tersimpan = await amsSimpanSesi(res['data']);
  if (!tersimpan) {
    amsPatchState(<String, dynamic>{
      'memuat': false,
      'galat': 'Respons login tidak memuat token yang valid.'
    });
    return false;
  }
  await amsDeviceId();
  await amsMuatGeo(context);
  await amsMuatAbsensi(context);
  amsPatchState(<String, dynamic>{'memuat': false, 'sukses': 'Berhasil masuk.'});
  return true;
}

Future<void> amsLogout(BuildContext context) async {
  await amsApi('POST', '/api/auth/logout', null);
  await amsHapusSesi();
}

Future<void> amsAmbilLokasi(BuildContext context) async {
  amsPatchState(<String, dynamic>{'galat': '', 'memuat': true});
  try {
    if (!await Geolocator.isLocationServiceEnabled()) {
      amsPatchState(<String, dynamic>{
        'memuat': false,
        'galat': 'Layanan lokasi perangkat mati. Aktifkan GPS lalu coba lagi.'
      });
      return;
    }
    var izin = await Geolocator.checkPermission();
    if (izin == LocationPermission.denied) {
      izin = await Geolocator.requestPermission();
    }
    if (izin == LocationPermission.denied || izin == LocationPermission.deniedForever) {
      amsPatchState(<String, dynamic>{
        'memuat': false,
        'galat': 'Izin lokasi ditolak. Aktifkan GPS untuk absensi.'
      });
      return;
    }
    final posisi = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        timeLimit: Duration(seconds: 25),
      ),
    );
    final state = amsState();
    final geo = state['geo'];
    final daftar = geo is Map ? geo['lokasi'] : null;
    final titik = <String, dynamic>{
      'lat': posisi.latitude,
      'lon': posisi.longitude,
      'akurasiMeter': posisi.accuracy.round(),
      'mock': posisi.isMocked,
    };
    amsPatchState(<String, dynamic>{
      'titik': titik,
      'geofence': amsGeofence(posisi.latitude, posisi.longitude, daftar),
      'memuat': false,
    });
  } catch (_) {
    amsPatchState(<String, dynamic>{
      'memuat': false,
      'galat': 'Gagal mengambil lokasi. Pastikan GPS aktif dan izin diberikan.'
    });
  }
}

Future<bool> amsSimpanSelfie(BuildContext context, String dataUrl) async {
  if (!dataUrl.startsWith('data:image/') || !dataUrl.contains(',')) {
    amsPatchState(<String, dynamic>{'galat': 'Kamera tidak menghasilkan foto yang valid.'});
    return false;
  }
  try {
    final byte = base64Decode(dataUrl.split(',').last).length;
    if (byte > 5 * 1024 * 1024) {
      amsPatchState(<String, dynamic>{'galat': 'Foto terlalu besar (batas 5 MB).'});
      return false;
    }
  } catch (_) {
    amsPatchState(<String, dynamic>{'galat': 'Foto rusak atau bukan base64 valid.'});
    return false;
  }
  amsPatchState(<String, dynamic>{'selfie': dataUrl, 'galat': ''});
  return true;
}

Future<bool> amsClock(BuildContext context, String jenis) async {
  final state = amsState();
  final titik = state['titik'];
  if (titik is! Map) {
    amsPatchState(<String, dynamic>{'galat': 'Ambil lokasi GPS terlebih dahulu.'});
    return false;
  }
  final t = Map<String, dynamic>.from(titik);
  final lat = (t['lat'] as num?)?.toDouble() ?? double.nan;
  final lon = (t['lon'] as num?)?.toDouble() ?? double.nan;
  final akurasi = (t['akurasiMeter'] as num?)?.toDouble() ?? 9999;
  final mock = t['mock'] == true;
  final foto = state['selfie'] is String ? state['selfie'] as String : '';
  final ambang = (state['akurasiMaks'] as num?)?.toDouble() ?? 50;

  final valid = amsValidasiClock(lat, lon, akurasi, mock, foto, ambang);
  if (valid['ok'] != true) {
    amsPatchState(<String, dynamic>{'galat': valid['pesan']});
    return false;
  }

  final deviceId = state['deviceId'] is String && (state['deviceId'] as String).isNotEmpty
      ? state['deviceId'] as String
      : await amsDeviceId();

  amsPatchState(<String, dynamic>{'memuat': true, 'galat': '', 'hasil': null});
  final payload = <String, dynamic>{
    'lat': lat,
    'lon': lon,
    'akurasiMeter': akurasi.round(),
    'foto': foto,
    'deviceId': deviceId,
    'idempotencyKey': const Uuid().v4(),
    'mockLocation': mock,
  };
  final res = await amsApi(
    'POST',
    jenis == 'out' ? '/api/attendance/clock-out' : '/api/attendance/clock-in',
    payload,
  );
  if (res['ok'] != true || res['data'] is! Map) {
    final data = res['data'];
    amsPatchState(<String, dynamic>{
      'memuat': false,
      'galat': res['pesan'],
      'geofence': data is Map && data['geofence'] is Map ? data['geofence'] : state['geofence'],
    });
    return false;
  }
  final hasil = Map<String, dynamic>.from(res['data'] as Map);
  amsPatchState(<String, dynamic>{
    'hasil': hasil,
    'hariIni': hasil['record'],
    'selfie': '',
    'memuat': false,
    'sukses': jenis == 'out' ? 'Clock Out tercatat oleh server.' : 'Clock In tercatat oleh server.',
  });
  await amsMuatAbsensi(context);
  return true;
}

Future<bool> amsGantiSandi(BuildContext context, String lama, String baru) async {
  if (lama.isEmpty || baru.isEmpty) {
    amsPatchState(<String, dynamic>{'galat': 'Kata sandi saat ini dan kata sandi baru wajib diisi.'});
    return false;
  }
  if (baru.length < 6) {
    amsPatchState(<String, dynamic>{'galat': 'Kata sandi baru minimal 6 karakter.'});
    return false;
  }
  amsPatchState(<String, dynamic>{'memuat': true, 'galat': ''});
  final res = await amsApi(
    'POST',
    '/api/auth/change-password',
    <String, dynamic>{'currentPassword': lama, 'newPassword': baru},
  );
  final data = res['data'];
  amsPatchState(<String, dynamic>{
    'memuat': false,
    'galat': res['ok'] == true ? '' : res['pesan'],
    'sukses': res['ok'] == true
        ? (data is Map && data['pesan'] is String
            ? data['pesan'] as String
            : 'Kata sandi berhasil diperbarui di server.')
        : '',
  });
  return res['ok'] == true;
}
