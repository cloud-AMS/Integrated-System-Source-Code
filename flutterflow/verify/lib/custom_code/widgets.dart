// Dibangkitkan oleh flutterflow/scripts/build-kit.mjs — JANGAN diedit manual.
// Struktur ini meniru lib/custom_code/<jenis>.dart hasil generate FlutterFlow.
import 'dart:convert';
import 'dart:typed_data';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart as http';
import '../ff_app_state.dart';
import 'actions.dart';
import 'functions.dart';
class AmsTopBar extends StatefulWidget {
  const AmsTopBar({super.key});

  @override
  State<AmsTopBar> createState() => _AmsTopBarState();
}

class _AmsTopBarState extends State<AmsTopBar> {
  void _dengar() {
    if (mounted) setState(() {});
  }

  @override
  void initState() {
    super.initState();
    FFAppState().addListener(_dengar);
  }

  @override
  void dispose() {
    FFAppState().removeListener(_dengar);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = amsState();
    final pengguna =
        state['user'] is Map ? Map<String, dynamic>.from(state['user'] as Map) : <String, dynamic>{};
    final nama = (pengguna['fullName'] as String?)?.trim() ?? '';
    final inisial = nama.isEmpty
        ? '?'
        : nama
            .split(RegExp(r'\s+'))
            .where((k) => k.isNotEmpty)
            .take(2)
            .map((k) => k[0])
            .join()
            .toUpperCase();
    final atas = MediaQuery.of(context).padding.top;

    return Container(
      padding: EdgeInsets.fromLTRB(16, atas + 12, 16, 12),
      decoration: BoxDecoration(
        color: amsWarna('surface'),
        border: Border(bottom: BorderSide(color: amsWarna('border'))),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [amsWarna('aksen'), amsWarna('info')],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: amsWarna('aksen').withValues(alpha: 0.28),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: const Text(
              'AMS',
              style: TextStyle(
                fontFamily: 'Quicksand',
                fontWeight: FontWeight.w700,
                fontSize: 11,
                letterSpacing: 0.4,
                color: Colors.white,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'AMS Integrated System',
                  style: TextStyle(
                    fontFamily: 'Quicksand',
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                    color: Color(0xFF111111),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Perusahaan Alat Kesehatan • CDAKB & ISO 13485',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontFamily: 'Quicksand',
                    fontSize: 10.5,
                    color: amsWarna('muted'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Container(
            width: 36,
            height: 36,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: amsWarna('slate100'),
              shape: BoxShape.circle,
              border: Border.all(color: amsWarna('border')),
            ),
            child: Text(
              inisial,
              style: TextStyle(
                fontFamily: 'Quicksand',
                fontWeight: FontWeight.w700,
                fontSize: 12,
                color: amsWarna('slate700'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class AmsBadge extends StatelessWidget {
  const AmsBadge({super.key, required this.teks, this.tone = 'slate'});

  final String teks;
  final String tone;

  @override
  Widget build(BuildContext context) {
    final warna = amsTone(tone);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: warna.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: warna.withValues(alpha: 0.28)),
      ),
      child: Text(
        teks,
        style: TextStyle(
          fontFamily: 'Quicksand',
          fontWeight: FontWeight.w700,
          fontSize: 10.5,
          letterSpacing: 0.2,
          color: warna,
        ),
      ),
    );
  }
}

class AmsStatCard extends StatelessWidget {
  const AmsStatCard({
    super.key,
    required this.label,
    required this.nilai,
    this.keterangan = '',
    this.tone = 'slate',
  });

  final String label;
  final String nilai;
  final String keterangan;
  final String tone;

  @override
  Widget build(BuildContext context) {
    final warna = amsTone(tone);
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: amsWarna('surface'),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: amsWarna('border')),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF111111).withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(width: 3, height: 38, decoration: BoxDecoration(color: warna, borderRadius: BorderRadius.circular(2))),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label.toUpperCase(),
                  style: TextStyle(
                    fontFamily: 'Quicksand',
                    fontWeight: FontWeight.w700,
                    fontSize: 9.5,
                    letterSpacing: 0.8,
                    color: amsWarna('muted'),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  nilai,
                  style: const TextStyle(
                    fontFamily: 'JetBrains Mono',
                    fontWeight: FontWeight.w700,
                    fontSize: 18,
                    color: Color(0xFF111111),
                  ),
                ),
                if (keterangan.isNotEmpty) ...[
                  const SizedBox(height: 3),
                  Text(
                    keterangan,
                    style: TextStyle(fontFamily: 'Quicksand', fontSize: 10.5, color: amsWarna('muted')),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class AmsEmptyState extends StatelessWidget {
  const AmsEmptyState({super.key, required this.judul, this.pesan = ''});

  final String judul;
  final String pesan;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 22),
      decoration: BoxDecoration(
        color: amsWarna('latar'),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: amsWarna('border')),
      ),
      child: Column(
        children: [
          Icon(Icons.inbox_outlined, size: 26, color: amsWarna('slate300')),
          const SizedBox(height: 10),
          Text(
            judul,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: 'Quicksand',
              fontWeight: FontWeight.w700,
              fontSize: 13,
              color: amsWarna('slate700'),
            ),
          ),
          if (pesan.isNotEmpty) ...[
            const SizedBox(height: 5),
            Text(
              pesan,
              textAlign: TextAlign.center,
              style: TextStyle(fontFamily: 'Quicksand', fontSize: 11, color: amsWarna('muted'), height: 1.45),
            ),
          ],
        ],
      ),
    );
  }
}

class AmsAuthPhoto extends StatefulWidget {
  const AmsAuthPhoto({super.key, required this.path, this.tinggi = 160});

  final String path;
  final double tinggi;

  @override
  State<AmsAuthPhoto> createState() => _AmsAuthPhotoState();
}

class _AmsAuthPhotoState extends State<AmsAuthPhoto> {
  Uint8List? _byte;
  String _galat = '';
  bool _memuat = true;

  @override
  void initState() {
    super.initState();
    _unduh();
  }

  @override
  void didUpdateWidget(covariant AmsAuthPhoto lama) {
    super.didUpdateWidget(lama);
    if (lama.path != widget.path) _unduh();
  }

  Future<void> _unduh() async {
    setState(() {
      _memuat = true;
      _galat = '';
    });
    final state = amsState();
    final dasar = state['apiBaseUrl'];
    final basis = (dasar is String && dasar.trim().isNotEmpty) ? dasar.trim() : 'http://10.0.2.2:3000';
    final token = await amsToken();
    final klien = http.Client();
    try {
      final res = await klien
          .get(
            Uri.parse('${basis.replaceAll(RegExp(r'/+$'), '')}${widget.path}'),
            headers: <String, String>{if (token.isNotEmpty) 'Authorization': 'Bearer $token'},
          )
          .timeout(const Duration(seconds: 25));
      if (!mounted) return;
      if (res.statusCode == 200 && res.bodyBytes.isNotEmpty) {
        setState(() {
          _byte = res.bodyBytes;
          _memuat = false;
        });
      } else {
        setState(() {
          _galat = 'Foto tidak dapat dimuat (HTTP ${res.statusCode}).';
          _memuat = false;
        });
      }
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _galat = 'Gagal memuat foto. Periksa koneksi.';
        _memuat = false;
      });
    } finally {
      klien.close();
    }
  }

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: Container(
        height: widget.tinggi,
        width: double.infinity,
        color: amsWarna('slate100'),
        child: _memuat
            ? Center(
                child: SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(strokeWidth: 2, color: amsWarna('aksen')),
                ),
              )
            : _byte != null
                ? Image.memory(_byte!, fit: BoxFit.cover, gaplessPlayback: true)
                : Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.broken_image_outlined, color: amsWarna('slate300'), size: 24),
                      const SizedBox(height: 8),
                      Text(
                        _galat,
                        textAlign: TextAlign.center,
                        style: TextStyle(fontFamily: 'Quicksand', fontSize: 10.5, color: amsWarna('muted')),
                      ),
                      const SizedBox(height: 8),
                      TextButton(
                        onPressed: _unduh,
                        child: Text(
                          'Coba lagi',
                          style: TextStyle(
                            fontFamily: 'Quicksand',
                            fontWeight: FontWeight.w700,
                            fontSize: 11,
                            color: amsWarna('aksen'),
                          ),
                        ),
                      ),
                    ],
                  ),
      ),
    );
  }
}

class AmsSelfieCamera extends StatefulWidget {
  const AmsSelfieCamera({super.key});

  @override
  State<AmsSelfieCamera> createState() => _AmsSelfieCameraState();
}

class _AmsSelfieCameraState extends State<AmsSelfieCamera> {
  CameraController? _kontroler;
  String _galat = '';
  bool _menyiapkan = true;
  bool _menjepret = false;

  @override
  void initState() {
    super.initState();
    _siapkan();
  }

  Future<void> _siapkan() async {
    setState(() {
      _menyiapkan = true;
      _galat = '';
    });
    try {
      final daftar = await availableCameras();
      if (daftar.isEmpty) throw CameraException('no_camera', 'Tidak ada kamera pada perangkat ini.');
      final depan = daftar.firstWhere(
        (k) => k.lensDirection == CameraLensDirection.front,
        orElse: () => daftar.first,
      );
      final kontroler = CameraController(depan, ResolutionPreset.medium, enableAudio: false);
      await kontroler.initialize();
      if (!mounted) {
        await kontroler.dispose();
        return;
      }
      setState(() {
        _kontroler = kontroler;
        _menyiapkan = false;
      });
    } on CameraException catch (e) {
      if (!mounted) return;
      setState(() {
        _menyiapkan = false;
        _galat = e.code == 'CameraAccessDenied' || e.code == 'cameraPermission'
            ? 'Izin kamera ditolak. Aktifkan izin kamera untuk mengambil selfie.'
            : 'Kamera gagal dibuka: ${e.description ?? e.code}';
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _menyiapkan = false;
        _galat = 'Kamera tidak tersedia di perangkat ini.';
      });
    }
  }

  Future<void> _jepret() async {
    final kontroler = _kontroler;
    if (kontroler == null || !kontroler.value.isInitialized || _menjepret) return;
    setState(() => _menjepret = true);
    try {
      final berkas = await kontroler.takePicture();
      final byte = await berkas.readAsBytes();
      if (byte.length > 5 * 1024 * 1024) {
        if (!mounted) return;
        setState(() {
          _menjepret = false;
          _galat = 'Foto terlalu besar (batas 5 MB). Jepret ulang dengan cahaya lebih baik.';
        });
        return;
      }
      final dataUrl = 'data:image/jpeg;base64,${base64Encode(byte)}';
      final ok = await amsSimpanSelfie(context, dataUrl);
      if (!mounted) return;
      if (ok) {
        Navigator.of(context).pop(true);
      } else {
        setState(() {
          _menjepret = false;
          _galat = (amsState()['galat'] as String?) ?? 'Foto gagal disimpan.';
        });
      }
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _menjepret = false;
        _galat = 'Gagal mengambil foto. Coba lagi.';
      });
    }
  }

  @override
  void dispose() {
    _kontroler?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bawah = MediaQuery.of(context).padding.bottom;
    final kontroler = _kontroler;
    return Scaffold(
      backgroundColor: const Color(0xFF0B0F14),
      body: Column(
        children: [
          Expanded(
            child: Stack(
              fit: StackFit.expand,
              children: [
                if (_menyiapkan)
                  Center(
                    child: SizedBox(
                      width: 26,
                      height: 26,
                      child: CircularProgressIndicator(strokeWidth: 2, color: amsWarna('aksen')),
                    ),
                  )
                else if (kontroler != null && kontroler.value.isInitialized)
                  CameraPreview(kontroler)
                else
                  Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 28),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.videocam_off_outlined, color: amsWarna('bahaya'), size: 30),
                          const SizedBox(height: 12),
                          Text(
                            _galat,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontFamily: 'Quicksand',
                              fontSize: 12,
                              color: Colors.white,
                              height: 1.5,
                            ),
                          ),
                          const SizedBox(height: 14),
                          OutlinedButton(
                            onPressed: _siapkan,
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.white,
                              side: BorderSide(color: amsWarna('aksen')),
                            ),
                            child: const Text('Coba lagi', style: TextStyle(fontFamily: 'Quicksand', fontWeight: FontWeight.w700)),
                          ),
                        ],
                      ),
                    ),
                  ),
                if (kontroler != null && kontroler.value.isInitialized)
                  IgnorePointer(
                    child: Center(
                      child: Container(
                        width: 210,
                        height: 260,
                        decoration: BoxDecoration(
                          border: Border.all(color: amsWarna('aksen').withValues(alpha: 0.75), width: 2),
                          borderRadius: BorderRadius.circular(120),
                        ),
                      ),
                    ),
                  ),
                Positioned(
                  left: 16,
                  right: 16,
                  bottom: 16,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.45),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Text(
                      'Posisikan wajah di dalam bingkai. Foto terikat waktu & lokasi server.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontFamily: 'Quicksand', fontSize: 10.5, color: Colors.white, height: 1.4),
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (_galat.isNotEmpty && kontroler != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
              child: Text(
                _galat,
                textAlign: TextAlign.center,
                style: TextStyle(fontFamily: 'Quicksand', fontSize: 11, fontWeight: FontWeight.w600, color: amsWarna('bahaya')),
              ),
            ),
          Padding(
            padding: EdgeInsets.fromLTRB(20, 18, 20, bawah + 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                TextButton(
                  onPressed: _menjepret ? null : () => Navigator.of(context).pop(false),
                  child: Text(
                    'Batal',
                    style: TextStyle(fontFamily: 'Quicksand', fontWeight: FontWeight.w700, fontSize: 13, color: Colors.white.withValues(alpha: 0.8)),
                  ),
                ),
                GestureDetector(
                  onTap: _menjepret ? null : _jepret,
                  child: Container(
                    width: 68,
                    height: 68,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: _menjepret ? amsWarna('muted') : amsWarna('aksen'),
                      border: Border.all(color: Colors.white, width: 4),
                      boxShadow: [
                        BoxShadow(color: amsWarna('aksen').withValues(alpha: 0.4), blurRadius: 18, offset: const Offset(0, 6)),
                      ],
                    ),
                    child: _menjepret
                        ? const Padding(
                            padding: EdgeInsets.all(20),
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Icon(Icons.camera_alt_rounded, color: Colors.white, size: 26),
                  ),
                ),
                const SizedBox(width: 56),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class AmsAttendancePanel extends StatefulWidget {
  const AmsAttendancePanel({super.key});

  @override
  State<AmsAttendancePanel> createState() => _AmsAttendancePanelState();
}

class _AmsAttendancePanelState extends State<AmsAttendancePanel> {
  void _dengar() {
    if (mounted) setState(() {});
  }

  @override
  void initState() {
    super.initState();
    FFAppState().addListener(_dengar);
  }

  @override
  void dispose() {
    FFAppState().removeListener(_dengar);
    super.dispose();
  }

  Future<void> _bukaKamera() async {
    await Navigator.of(context).push(
      MaterialPageRoute<bool>(builder: (_) => const AmsSelfieCamera()),
    );
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final state = amsState();
    final titik = state['titik'] is Map ? Map<String, dynamic>.from(state['titik'] as Map) : null;
    final pagar = state['geofence'] is Map ? Map<String, dynamic>.from(state['geofence'] as Map) : null;
    final selfie = state['selfie'] is String ? state['selfie'] as String : '';
    final rekaman = state['hariIni'] is Map ? Map<String, dynamic>.from(state['hariIni'] as Map) : null;
    final hasil = state['hasil'] is Map ? Map<String, dynamic>.from(state['hasil'] as Map) : null;
    final galat = (state['galat'] as String?) ?? '';
    final memuat = state['memuat'] == true;
    final jamMasuk = (rekaman?['jamMasuk'] as String?) ?? '';
    final jamKeluar = (rekaman?['jamKeluar'] as String?) ?? '';
    final lengkap = jamMasuk.isNotEmpty && jamKeluar.isNotEmpty;
    final dalamPagar = pagar?['dalamPagar'] == true;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: amsWarna('surface'),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: amsWarna('border')),
            boxShadow: [
              BoxShadow(color: const Color(0xFF111111).withValues(alpha: 0.05), blurRadius: 16, offset: const Offset(0, 6)),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 34,
                    height: 34,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: amsWarna('aksen').withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(Icons.fingerprint_rounded, size: 19, color: amsWarna('aksen')),
                  ),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Absensi Geofencing',
                          style: TextStyle(fontFamily: 'Quicksand', fontWeight: FontWeight.w700, fontSize: 14, color: Color(0xFF111111)),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Server memverifikasi lokasi, akurasi, dan waktu resmi.',
                          style: TextStyle(fontFamily: 'Quicksand', fontSize: 10.5, color: Color(0xFF7A7A7A)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: titik == null
                        ? Text(
                            'Lokasi belum diambil.',
                            style: TextStyle(fontFamily: 'Quicksand', fontSize: 11.5, color: amsWarna('muted')),
                          )
                        : Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${(titik['lat'] as num).toStringAsFixed(5)}, ${(titik['lon'] as num).toStringAsFixed(5)}',
                                style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF111111)),
                              ),
                              const SizedBox(height: 3),
                              Text(
                                'Akurasi ±${titik['akurasiMeter']} m${titik['mock'] == true ? ' • TERDETEKSI MOCK' : ''}',
                                style: TextStyle(
                                  fontFamily: 'Quicksand',
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w600,
                                  color: titik['mock'] == true ? amsWarna('bahaya') : amsWarna('muted'),
                                ),
                              ),
                            ],
                          ),
                  ),
                  const SizedBox(width: 10),
                  _Tombol(
                    judul: 'GPS',
                    ikon: Icons.my_location_rounded,
                    gaya: 'sekunder',
                    sedang: memuat,
                    onTap: () => amsAmbilLokasi(context),
                  ),
                ],
              ),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 220),
                child: pagar == null
                    ? const SizedBox.shrink()
                    : Padding(
                        key: ValueKey<String>('${pagar['dalamPagar']}-${pagar['jarakMeter']}'),
                        padding: const EdgeInsets.only(top: 12),
                        child: AmsBadge(
                          tone: dalamPagar ? 'emerald' : 'rose',
                          teks:
                              '${dalamPagar ? 'Dalam pagar' : 'Luar pagar'} • ${pagar['jarakMeter']} m dari ${pagar['nama']}',
                        ),
                      ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: selfie.isNotEmpty
                        ? Image.memory(
                            base64Decode(selfie.split(',').last),
                            width: 62,
                            height: 62,
                            fit: BoxFit.cover,
                            gaplessPlayback: true,
                          )
                        : Container(
                            width: 62,
                            height: 62,
                            color: amsWarna('slate100'),
                            child: Icon(Icons.person_outline_rounded, color: amsWarna('slate300'), size: 26),
                          ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Selfie bukti',
                          style: TextStyle(fontFamily: 'Quicksand', fontWeight: FontWeight.w700, fontSize: 12, color: amsWarna('slate700')),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          selfie.isEmpty ? 'Wajib; terikat waktu dan lokasi server.' : 'Siap dikirim bersama koordinat.',
                          style: TextStyle(fontFamily: 'Quicksand', fontSize: 10.5, color: amsWarna('muted'), height: 1.4),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 10),
                  _Tombol(
                    judul: 'Selfie',
                    ikon: Icons.photo_camera_rounded,
                    gaya: 'sekunder',
                    onTap: _bukaKamera,
                  ),
                ],
              ),
              if (galat.isNotEmpty) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                  decoration: BoxDecoration(
                    color: amsWarna('bahaya').withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: amsWarna('bahaya').withValues(alpha: 0.25)),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.error_outline_rounded, size: 16, color: amsWarna('bahaya')),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          galat,
                          style: TextStyle(fontFamily: 'Quicksand', fontSize: 11, fontWeight: FontWeight.w600, color: amsWarna('bahaya'), height: 1.4),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 16),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 220),
                child: lengkap
                    ? Container(
                        key: const ValueKey<String>('lengkap'),
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
                        decoration: BoxDecoration(
                          color: amsWarna('sukses').withValues(alpha: 0.09),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: amsWarna('sukses').withValues(alpha: 0.3)),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.verified_rounded, size: 18, color: amsWarna('sukses')),
                            const SizedBox(width: 9),
                            Expanded(
                              child: Text(
                                'Absen lengkap hari ini • $jamMasuk – $jamKeluar',
                                style: TextStyle(fontFamily: 'Quicksand', fontSize: 11.5, fontWeight: FontWeight.w700, color: amsWarna('suksesTua')),
                              ),
                            ),
                          ],
                        ),
                      )
                    : _Tombol(
                        key: ValueKey<String>(jamMasuk.isEmpty ? 'in' : 'out'),
                        judul: jamMasuk.isEmpty ? 'Clock In' : 'Clock Out (masuk $jamMasuk)',
                        ikon: jamMasuk.isEmpty ? Icons.login_rounded : Icons.logout_rounded,
                        gaya: 'primer',
                        sedang: memuat,
                        onTap: () => amsClock(context, jamMasuk.isEmpty ? 'in' : 'out'),
                      ),
              ),
            ],
          ),
        ),
        if (hasil != null) ...[
          const SizedBox(height: 14),
          TweenAnimationBuilder<double>(
            tween: Tween<double>(begin: 0, end: 1),
            duration: const Duration(milliseconds: 260),
            curve: Curves.easeOutCubic,
            builder: (context, nilai, anak) => Opacity(
              opacity: nilai,
              child: Transform.translate(offset: Offset(0, 12 * (1 - nilai)), child: anak),
            ),
            child: _KartuHasil(hasil: hasil),
          ),
        ],
      ],
    );
  }
}

class _KartuHasil extends StatelessWidget {
  const _KartuHasil({required this.hasil});

  final Map<String, dynamic> hasil;

  @override
  Widget build(BuildContext context) {
    final rekaman = hasil['record'] is Map ? Map<String, dynamic>.from(hasil['record'] as Map) : <String, dynamic>{};
    final pagar = hasil['geofence'] is Map ? Map<String, dynamic>.from(hasil['geofence'] as Map) : <String, dynamic>{};
    final status = (rekaman['status'] as String?) ?? 'Hadir';
    final fotoPath = (rekaman['fotoKeluarUrl'] as String?) ?? (rekaman['fotoMasukUrl'] as String?) ?? '';
    final jamMasuk = (rekaman['jamMasuk'] as String?) ?? '-';
    final jamKeluar = (rekaman['jamKeluar'] as String?) ?? '';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: amsWarna('surface'),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: amsWarna('sukses').withValues(alpha: 0.35)),
        boxShadow: [
          BoxShadow(color: amsWarna('sukses').withValues(alpha: 0.1), blurRadius: 18, offset: const Offset(0, 6)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Hasil Absensi',
                      style: TextStyle(fontFamily: 'Quicksand', fontWeight: FontWeight.w700, fontSize: 13.5, color: Color(0xFF111111)),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      'Jam server: $jamMasuk${jamKeluar.isNotEmpty ? ' – $jamKeluar' : ''}',
                      style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 11.5, color: Color(0xFF3D3D3D)),
                    ),
                  ],
                ),
              ),
              AmsBadge(teks: status, tone: status == 'Hadir' ? 'emerald' : 'amber'),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            (pagar['label'] as String?) ?? '',
            style: TextStyle(fontFamily: 'Quicksand', fontSize: 11, fontWeight: FontWeight.w600, color: amsWarna('slate700'), height: 1.45),
          ),
          const SizedBox(height: 5),
          Text(
            'Lokasi: ${rekaman['lokasi'] ?? '-'} • ${rekaman['geofence'] is Map ? (rekaman['geofence'] as Map)['jarakMeter'] ?? 0 : 0} m dari titik pusat',
            style: TextStyle(fontFamily: 'Quicksand', fontSize: 10.5, color: amsWarna('muted')),
          ),
          if (fotoPath.isNotEmpty) ...[
            const SizedBox(height: 12),
            AmsAuthPhoto(path: fotoPath, tinggi: 170),
          ],
          if (hasil['sudahAda'] == true) ...[
            const SizedBox(height: 12),
            const AmsBadge(teks: 'Idempoten — rekaman sudah ada', tone: 'blue'),
          ],
        ],
      ),
    );
  }
}

class _Tombol extends StatelessWidget {
  const _Tombol({
    super.key,
    required this.judul,
    required this.ikon,
    required this.onTap,
    this.gaya = 'primer',
    this.sedang = false,
  });

  final String judul;
  final IconData ikon;
  final VoidCallback onTap;
  final String gaya;
  final bool sedang;

  @override
  Widget build(BuildContext context) {
    final primer = gaya == 'primer';
    final warna = primer ? amsWarna('sukses') : amsWarna('slate700');
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: sedang ? null : onTap,
        borderRadius: BorderRadius.circular(12),
        child: Ink(
          decoration: BoxDecoration(
            gradient: primer
                ? LinearGradient(colors: [amsWarna('sukses'), amsWarna('suksesTua')], begin: Alignment.topLeft, end: Alignment.bottomRight)
                : null,
            color: primer ? null : amsWarna('surface'),
            borderRadius: BorderRadius.circular(12),
            border: primer ? null : Border.all(color: amsWarna('slate300')),
            boxShadow: primer
                ? [BoxShadow(color: amsWarna('sukses').withValues(alpha: 0.28), blurRadius: 12, offset: const Offset(0, 4))]
                : null,
          ),
          child: Container(
            height: primer ? 50 : 42,
            padding: EdgeInsets.symmetric(horizontal: primer ? 18 : 14),
            alignment: Alignment.center,
            child: sedang
                ? SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2, color: primer ? Colors.white : warna),
                  )
                : Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(ikon, size: primer ? 18 : 16, color: primer ? Colors.white : warna),
                      const SizedBox(width: 8),
                      Flexible(
                        child: Text(
                          judul,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontFamily: 'Quicksand',
                            fontWeight: FontWeight.w700,
                            fontSize: primer ? 13.5 : 12,
                            color: primer ? Colors.white : warna,
                          ),
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}

class AmsHistoryList extends StatefulWidget {
  const AmsHistoryList({super.key, this.batas = 30});

  final int batas;

  @override
  State<AmsHistoryList> createState() => _AmsHistoryListState();
}

class _AmsHistoryListState extends State<AmsHistoryList> {
  void _dengar() {
    if (mounted) setState(() {});
  }

  @override
  void initState() {
    super.initState();
    FFAppState().addListener(_dengar);
  }

  @override
  void dispose() {
    FFAppState().removeListener(_dengar);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = amsState();
    final daftar = state['riwayat'] is List ? state['riwayat'] as List : const [];
    if (daftar.isEmpty) {
      return const AmsEmptyState(
        judul: 'Belum ada riwayat absensi',
        pesan: 'Riwayat 60 hari terakhir akan muncul setelah Clock In pertama tercatat di server.',
      );
    }
    final terpotong = daftar.take(widget.batas).toList();
    return Column(
      children: [
        for (var i = 0; i < terpotong.length; i++) ...[
          if (i > 0) const SizedBox(height: 10),
          _BarisRiwayat(rekaman: Map<String, dynamic>.from(terpotong[i] as Map)),
        ],
      ],
    );
  }
}

class _BarisRiwayat extends StatelessWidget {
  const _BarisRiwayat({required this.rekaman});

  final Map<String, dynamic> rekaman;

  @override
  Widget build(BuildContext context) {
    final status = (rekaman['status'] as String?) ?? 'Hadir';
    final nada = status == 'Hadir'
        ? 'emerald'
        : status == 'Terlambat'
            ? 'amber'
            : status == 'Mangkir'
                ? 'rose'
                : 'blue';
    final jamMasuk = (rekaman['jamMasuk'] as String?) ?? '-';
    final jamKeluar = (rekaman['jamKeluar'] as String?) ?? '';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: amsWarna('surface'),
        borderRadius: BorderRadius.circular(13),
        border: Border.all(color: amsWarna('border')),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            padding: const EdgeInsets.symmetric(vertical: 7),
            decoration: BoxDecoration(color: amsWarna('latar'), borderRadius: BorderRadius.circular(9)),
            child: Column(
              children: [
                Text(
                  ((rekaman['tanggal'] as String?) ?? '').split('-').last,
                  style: const TextStyle(fontFamily: 'JetBrains Mono', fontWeight: FontWeight.w700, fontSize: 14, color: Color(0xFF111111)),
                ),
                Text(
                  _namaBulan(((rekaman['tanggal'] as String?) ?? '').split('-').length > 1
                      ? (rekaman['tanggal'] as String).split('-')[1]
                      : ''),
                  style: TextStyle(fontFamily: 'Quicksand', fontSize: 9, fontWeight: FontWeight.w700, color: amsWarna('muted')),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$jamMasuk${jamKeluar.isNotEmpty ? ' – $jamKeluar' : ''}',
                  style: const TextStyle(fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF111111)),
                ),
                const SizedBox(height: 3),
                Text(
                  '${rekaman['lokasi'] ?? '-'} • ${rekaman['sumber'] ?? '-'}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontFamily: 'Quicksand', fontSize: 10.5, color: amsWarna('muted')),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          AmsBadge(teks: status, tone: nada),
        ],
      ),
    );
  }

  String _namaBulan(String bulan) {
    const nama = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    final idx = int.tryParse(bulan) ?? 0;
    return idx >= 1 && idx <= 12 ? nama[idx - 1] : '-';
  }
}

class AmsNotificationList extends StatefulWidget {
  const AmsNotificationList({super.key, this.ruteAbsen = '/absen'});

  final String ruteAbsen;

  @override
  State<AmsNotificationList> createState() => _AmsNotificationListState();
}

class _AmsNotificationListState extends State<AmsNotificationList> {
  void _dengar() {
    if (mounted) setState(() {});
  }

  @override
  void initState() {
    super.initState();
    FFAppState().addListener(_dengar);
  }

  @override
  void dispose() {
    FFAppState().removeListener(_dengar);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final daftar = amsNotifikasi();
    final items = daftar is List ? daftar : const [];
    return Column(
      children: [
        for (var i = 0; i < items.length; i++) ...[
          if (i > 0) const SizedBox(height: 10),
          _KartuNotifikasi(
            item: Map<String, dynamic>.from(items[i] as Map),
            onTap: () {
              final rute = (items[i] as Map)['rute'];
              if (rute == '/absen') {
                GoRouter.of(context).go(widget.ruteAbsen);
              }
            },
          ),
        ],
      ],
    );
  }
}

class _KartuNotifikasi extends StatelessWidget {
  const _KartuNotifikasi({required this.item, required this.onTap});

  final Map<String, dynamic> item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final warna = amsTone((item['tone'] as String?) ?? 'slate');
    return Material(
      color: amsWarna('surface'),
      borderRadius: BorderRadius.circular(13),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(13),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(13),
            border: Border.all(color: amsWarna('border')),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 8,
                height: 8,
                margin: const EdgeInsets.only(top: 5),
                decoration: BoxDecoration(color: warna, shape: BoxShape.circle),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      (item['judul'] as String?) ?? '',
                      style: TextStyle(fontFamily: 'Quicksand', fontWeight: FontWeight.w700, fontSize: 12.5, color: amsWarna('ink')),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      (item['pesan'] as String?) ?? '',
                      style: TextStyle(fontFamily: 'Quicksand', fontSize: 11, color: amsWarna('muted'), height: 1.45),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class AmsHomeSummary extends StatefulWidget {
  const AmsHomeSummary({super.key, this.ruteAbsen = '/absen'});

  final String ruteAbsen;

  @override
  State<AmsHomeSummary> createState() => _AmsHomeSummaryState();
}

class _AmsHomeSummaryState extends State<AmsHomeSummary> {
  void _dengar() {
    if (mounted) setState(() {});
  }

  @override
  void initState() {
    super.initState();
    FFAppState().addListener(_dengar);
  }

  @override
  void dispose() {
    FFAppState().removeListener(_dengar);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = amsState();
    final pengguna = state['user'] is Map ? Map<String, dynamic>.from(state['user'] as Map) : <String, dynamic>{};
    final nama = ((pengguna['fullName'] as String?) ?? 'Karyawan').split(' ').first;
    final peran = (state['roleName'] as String?) ?? '';
    final rekaman = state['hariIni'] is Map ? Map<String, dynamic>.from(state['hariIni'] as Map) : null;
    final jamMasuk = (rekaman?['jamMasuk'] as String?) ?? '--:--';
    final jamKeluar = (rekaman?['jamKeluar'] as String?) ?? '';
    final status = (rekaman?['status'] as String?) ?? 'Belum absen';
    final nada = rekaman == null
        ? 'amber'
        : status == 'Hadir'
            ? 'emerald'
            : status == 'Terlambat'
                ? 'amber'
                : 'rose';
    final terlambat = amsKeterlambatan(jamMasuk == '--:--' ? '' : jamMasuk);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Halo, $nama',
                    style: const TextStyle(fontFamily: 'Quicksand', fontWeight: FontWeight.w700, fontSize: 19, color: Color(0xFF111111)),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Ringkasan kehadiran Anda hari ini.',
                    style: TextStyle(fontFamily: 'Quicksand', fontSize: 11.5, color: amsWarna('muted')),
                  ),
                ],
              ),
            ),
            if (peran.isNotEmpty) AmsBadge(teks: peran, tone: 'indigo'),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(child: AmsStatCard(label: 'Jam Masuk', nilai: jamMasuk, tone: 'blue', keterangan: jamMasuk == '--:--' ? 'Belum tercatat' : 'Waktu server')),
            const SizedBox(width: 12),
            Expanded(child: AmsStatCard(label: 'Jam Keluar', nilai: jamKeluar.isEmpty ? '--:--' : jamKeluar, tone: 'emerald', keterangan: jamKeluar.isEmpty ? 'Belum tercatat' : 'Waktu server')),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: amsWarna('surface'),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: amsWarna('border')),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    'STATUS HARI INI',
                    style: TextStyle(fontFamily: 'Quicksand', fontWeight: FontWeight.w700, fontSize: 9.5, letterSpacing: 0.8, color: amsWarna('muted')),
                  ),
                  const Spacer(),
                  AmsBadge(teks: status, tone: nada),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                rekaman == null
                    ? 'Belum ada rekaman. Lakukan Clock In di tab Absen dengan GPS dan selfie.'
                    : 'Lokasi ${rekaman['lokasi'] ?? '-'} • sumber ${rekaman['sumber'] ?? '-'}'
                        '${(terlambat['menitTerlambat'] as int) > 0 ? ' • terlambat ${terlambat['menitTerlambat']} menit (potongan ${amsRupiah(terlambat['potongan'] as int)})' : ''}',
                style: TextStyle(fontFamily: 'Quicksand', fontSize: 11.5, color: amsWarna('slate700'), height: 1.5),
              ),
              const SizedBox(height: 14),
              _Tombol(
                judul: 'Buka Absensi Geofencing',
                ikon: Icons.fingerprint_rounded,
                gaya: 'primer',
                onTap: () => GoRouter.of(context).go(widget.ruteAbsen),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        Text(
          'RIWAYAT TERAKHIR',
          style: TextStyle(fontFamily: 'Quicksand', fontWeight: FontWeight.w700, fontSize: 9.5, letterSpacing: 0.8, color: amsWarna('muted')),
        ),
        const SizedBox(height: 10),
        const AmsHistoryList(batas: 3),
      ],
    );
  }
}

class AmsLoginPanel extends StatefulWidget {
  const AmsLoginPanel({super.key, this.ruteBeranda = '/beranda'});

  final String ruteBeranda;

  @override
  State<AmsLoginPanel> createState() => _AmsLoginPanelState();
}

class _AmsLoginPanelState extends State<AmsLoginPanel> {
  final _pengguna = TextEditingController();
  final _sandi = TextEditingController();
  final _fokusSandi = FocusNode();
  bool _lihatSandi = false;
  bool _memuat = false;
  String _galat = '';

  @override
  void dispose() {
    _pengguna.dispose();
    _sandi.dispose();
    _fokusSandi.dispose();
    super.dispose();
  }

  Future<void> _masuk() async {
    if (_memuat) return;
    setState(() {
      _memuat = true;
      _galat = '';
    });
    final ok = await amsLogin(context, _pengguna.text, _sandi.text);
    if (!mounted) return;
    setState(() => _memuat = false);
    if (ok) {
      GoRouter.of(context).go(widget.ruteBeranda);
    } else {
      setState(() => _galat = (amsState()['galat'] as String?) ?? 'Gagal masuk. Coba lagi.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final bawah = MediaQuery.of(context).padding.bottom;
    final atas = MediaQuery.of(context).padding.top;
    return SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(20, atas + 40, 20, bawah + 40),
      child: Column(
        children: [
          Container(
            width: 66,
            height: 66,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [amsWarna('aksen'), amsWarna('info')], begin: Alignment.topLeft, end: Alignment.bottomRight),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [BoxShadow(color: amsWarna('aksen').withValues(alpha: 0.3), blurRadius: 20, offset: const Offset(0, 8))],
            ),
            child: const Text('AMS', style: TextStyle(fontFamily: 'Quicksand', fontWeight: FontWeight.w700, fontSize: 16, letterSpacing: 0.6, color: Colors.white)),
          ),
          const SizedBox(height: 16),
          const Text('AMS Integrated System', style: TextStyle(fontFamily: 'Quicksand', fontWeight: FontWeight.w700, fontSize: 20, color: Color(0xFF111111))),
          const SizedBox(height: 6),
          Text(
            'PT Anugrahmitra Selaras • CDAKB & ISO 13485',
            textAlign: TextAlign.center,
            style: TextStyle(fontFamily: 'Quicksand', fontSize: 11.5, color: amsWarna('muted')),
          ),
          const SizedBox(height: 26),
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: amsWarna('surface'),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: amsWarna('border')),
              boxShadow: [BoxShadow(color: const Color(0xFF111111).withValues(alpha: 0.05), blurRadius: 18, offset: const Offset(0, 6))],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _label('Nama Pengguna'),
                const SizedBox(height: 7),
                _kolom(
                  kontroler: _pengguna,
                  petunjuk: 'mis. budi.santoso',
                  ikon: Icons.person_outline_rounded,
                  aksi: TextInputAction.next,
                  onSubmitted: (_) => _fokusSandi.requestFocus(),
                ),
                const SizedBox(height: 14),
                _label('Kata Sandi'),
                const SizedBox(height: 7),
                _kolom(
                  kontroler: _sandi,
                  petunjuk: '••••••••',
                  ikon: Icons.lock_outline_rounded,
                  fokus: _fokusSandi,
                  rahasia: !_lihatSandi,
                  aksi: TextInputAction.done,
                  onSubmitted: (_) => _masuk(),
                  akhiran: IconButton(
                    onPressed: () => setState(() => _lihatSandi = !_lihatSandi),
                    icon: Icon(
                      _lihatSandi ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                      size: 18,
                      color: amsWarna('muted'),
                    ),
                  ),
                ),
                if (_galat.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Icon(Icons.error_outline_rounded, size: 15, color: amsWarna('bahaya')),
                      const SizedBox(width: 7),
                      Expanded(
                        child: Text(
                          _galat,
                          style: TextStyle(fontFamily: 'Quicksand', fontSize: 11, fontWeight: FontWeight.w600, color: amsWarna('bahaya'), height: 1.4),
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 18),
                _Tombol(judul: 'Masuk', ikon: Icons.arrow_forward_rounded, gaya: 'primer', sedang: _memuat, onTap: _masuk),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'versi 2.4.0-cdakb',
            style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: amsWarna('muted')),
          ),
        ],
      ),
    );
  }

  Widget _label(String teks) => Text(
        teks,
        style: TextStyle(fontFamily: 'Quicksand', fontWeight: FontWeight.w700, fontSize: 11, color: amsWarna('slate700')),
      );

  Widget _kolom({
    required TextEditingController kontroler,
    required String petunjuk,
    required IconData ikon,
    FocusNode? fokus,
    bool rahasia = false,
    TextInputAction aksi = TextInputAction.next,
    Widget? akhiran,
    ValueChanged<String>? onSubmitted,
  }) {
    return TextField(
      controller: kontroler,
      focusNode: fokus,
      obscureText: rahasia,
      textInputAction: aksi,
      onSubmitted: onSubmitted,
      autocorrect: false,
      enableSuggestions: false,
      style: TextStyle(fontFamily: 'Quicksand', fontSize: 13, color: amsWarna('ink')),
      decoration: InputDecoration(
        hintText: petunjuk,
        hintStyle: TextStyle(fontFamily: 'Quicksand', fontSize: 12.5, color: amsWarna('slate300')),
        prefixIcon: Icon(ikon, size: 18, color: amsWarna('muted')),
        suffixIcon: akhiran,
        filled: true,
        fillColor: amsWarna('latar'),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: amsWarna('border'))),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: amsWarna('aksen'), width: 1.6)),
      ),
    );
  }
}

class AmsProfilePanel extends StatefulWidget {
  const AmsProfilePanel({super.key, this.ruteLogin = '/login'});

  final String ruteLogin;

  @override
  State<AmsProfilePanel> createState() => _AmsProfilePanelState();
}

class _AmsProfilePanelState extends State<AmsProfilePanel> {
  final _lama = TextEditingController();
  final _baru = TextEditingController();
  bool _memuat = false;
  String _galat = '';
  String _sukses = '';

  void _dengar() {
    if (mounted) setState(() {});
  }

  @override
  void initState() {
    super.initState();
    FFAppState().addListener(_dengar);
  }

  @override
  void dispose() {
    FFAppState().removeListener(_dengar);
    _lama.dispose();
    _baru.dispose();
    super.dispose();
  }

  Future<void> _ganti() async {
    if (_memuat) return;
    setState(() {
      _memuat = true;
      _galat = '';
      _sukses = '';
    });
    final ok = await amsGantiSandi(context, _lama.text, _baru.text);
    if (!mounted) return;
    setState(() {
      _memuat = false;
      if (ok) {
        _sukses = (amsState()['sukses'] as String?) ?? 'Kata sandi diperbarui.';
        _lama.clear();
        _baru.clear();
      } else {
        _galat = (amsState()['galat'] as String?) ?? 'Gagal memperbarui sandi.';
      }
    });
  }

  Future<void> _keluar() async {
    await amsLogout(context);
    if (!mounted) return;
    GoRouter.of(context).go(widget.ruteLogin);
  }

  @override
  Widget build(BuildContext context) {
    final state = amsState();
    final pengguna = state['user'] is Map ? Map<String, dynamic>.from(state['user'] as Map) : <String, dynamic>{};
    final peran = (state['roleName'] as String?) ?? '-';
    final departemen = (pengguna['department'] as String?) ?? '-';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _kartu(
          judul: 'Akun',
          anak: Column(
            children: [
              _baris('Nama', (pengguna['fullName'] as String?) ?? '-'),
              _baris('Nama pengguna', (pengguna['username'] as String?) ?? '-'),
              _baris('Email', (pengguna['email'] as String?) ?? '-'),
              _baris('Peran', peran),
              _baris('Departemen', departemen),
              _baris('Kedaluwarsa sesi', (state['expiresAt'] as String?) ?? '-'),
            ],
          ),
        ),
        const SizedBox(height: 14),
        _kartu(
          judul: 'Ganti Kata Sandi',
          anak: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextField(
                controller: _lama,
                obscureText: true,
                style: TextStyle(fontFamily: 'Quicksand', fontSize: 13, color: amsWarna('ink')),
                decoration: _dekorasi('Kata sandi saat ini'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _baru,
                obscureText: true,
                style: TextStyle(fontFamily: 'Quicksand', fontSize: 13, color: amsWarna('ink')),
                decoration: _dekorasi('Kata sandi baru (min. 6 karakter)'),
              ),
              if (_galat.isNotEmpty) ...[
                const SizedBox(height: 10),
                Text(_galat, style: TextStyle(fontFamily: 'Quicksand', fontSize: 11, fontWeight: FontWeight.w600, color: amsWarna('bahaya'))),
              ],
              if (_sukses.isNotEmpty) ...[
                const SizedBox(height: 10),
                Text(_sukses, style: TextStyle(fontFamily: 'Quicksand', fontSize: 11, fontWeight: FontWeight.w600, color: amsWarna('sukses'))),
              ],
              const SizedBox(height: 14),
              _Tombol(judul: 'Perbarui Kata Sandi', ikon: Icons.key_rounded, gaya: 'sekunder', sedang: _memuat, onTap: _ganti),
            ],
          ),
        ),
        const SizedBox(height: 14),
        _kartu(
          judul: 'Tentang',
          anak: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'AMS Integrated System — PT Anugrahmitra Selaras\nPerusahaan Alat Kesehatan • CDAKB & ISO 13485\nversi 2.4.0-cdakb',
                style: TextStyle(fontFamily: 'Quicksand', fontSize: 11.5, color: amsWarna('slate700'), height: 1.6),
              ),
              const SizedBox(height: 8),
              Text(
                '© 2026 PT Anugrahmitra Selaras • coded by Langgo Bramandityo',
                style: TextStyle(fontFamily: 'Quicksand', fontSize: 10.5, color: amsWarna('muted')),
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        Material(
          color: amsWarna('bahaya').withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
          child: InkWell(
            onTap: _keluar,
            borderRadius: BorderRadius.circular(12),
            child: Container(
              height: 50,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: amsWarna('bahaya').withValues(alpha: 0.35)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.logout_rounded, size: 17, color: amsWarna('bahaya')),
                  const SizedBox(width: 8),
                  Text('Keluar', style: TextStyle(fontFamily: 'Quicksand', fontWeight: FontWeight.w700, fontSize: 13, color: amsWarna('bahaya'))),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  InputDecoration _dekorasi(String petunjuk) => InputDecoration(
        hintText: petunjuk,
        hintStyle: TextStyle(fontFamily: 'Quicksand', fontSize: 12, color: amsWarna('slate300')),
        filled: true,
        fillColor: amsWarna('latar'),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: amsWarna('border'))),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: amsWarna('aksen'), width: 1.6)),
      );

  Widget _baris(String label, String nilai) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 116,
              child: Text(label, style: TextStyle(fontFamily: 'Quicksand', fontSize: 11, color: amsWarna('muted'))),
            ),
            Expanded(
              child: Text(
                nilai,
                style: TextStyle(fontFamily: 'Quicksand', fontSize: 11.5, fontWeight: FontWeight.w600, color: amsWarna('ink')),
              ),
            ),
          ],
        ),
      );

  Widget _kartu({required String judul, required Widget anak}) => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: amsWarna('surface'),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: amsWarna('border')),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(judul, style: const TextStyle(fontFamily: 'Quicksand', fontWeight: FontWeight.w700, fontSize: 13.5, color: Color(0xFF111111))),
            const SizedBox(height: 12),
            anak,
          ],
        ),
      );
}
