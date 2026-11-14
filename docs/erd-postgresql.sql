-- =====================================================================
-- AMS INTEGRATED SYSTEM - ENTERPRISE POSTGRESQL 16 DDL SCHEMA
-- STATUS DOKUMEN (2026-11): DESIGN TARGET — BELUM DIIMPLEMENTASIKAN.
-- DDL ini belum dijalankan; koneksi Express/PostgreSQL lokal tersedia terpisah.
-- Tabel bisnis di bawah masih spesifikasi target migrasi dari localStorage.
-- Jangan dikutip sebagai bukti bahwa basis data produksi sudah ada.
-- =====================================================================
-- Target: Modular Monolith / Microservices-Ready, Table Partitioning,
--         pgvector, Immutable Audit Trail, and Transactional Outbox.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =====================================================================
-- 1. REGULATORY & COMPLIANCE BOUNDED CONTEXT
-- =====================================================================

CREATE TABLE public.izin_edar_alkes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode_sku VARCHAR(64) UNIQUE NOT NULL,
    nama_alkes VARCHAR(255) NOT NULL,
    tipe_model VARCHAR(128) NOT NULL,
    nomor_izin_edar VARCHAR(128) UNIQUE NOT NULL, -- Contoh: KEMENKES RI AKD 20501910234
    kategori VARCHAR(64) NOT NULL, -- 'Elektromedik Radiasi', dll
    kelas_risiko VARCHAR(16) NOT NULL, -- 'Kelas A', 'Kelas B', 'Kelas C', 'Kelas D'
    produsen VARCHAR(255) NOT NULL,
    negara_asal VARCHAR(64) NOT NULL,
    tanggal_terbit DATE NOT NULL,
    tanggal_kedaluwarsa DATE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Aktif',
    status_perpanjangan VARCHAR(64) NOT NULL DEFAULT 'Aman',
    keterangan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.sertifikat_perusahaan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jenis VARCHAR(128) NOT NULL, -- 'SDAK', 'Sertifikat CPAKB', 'ISO 13485:2016'
    nomor_sertifikat VARCHAR(128) UNIQUE NOT NULL,
    penerbit VARCHAR(128) NOT NULL,
    tanggal_berlaku DATE NOT NULL,
    tanggal_habis DATE NOT NULL,
    lingkup TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Valid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- 2. QUALITY MANAGEMENT BOUNDED CONTEXT
-- =====================================================================

CREATE TABLE public.capa_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_capa VARCHAR(64) UNIQUE NOT NULL,
    sumber VARCHAR(64) NOT NULL, -- 'Audit Internal', 'Keluhan Fasyankes', dll
    deskripsi_masalah TEXT NOT NULL,
    akar_penyebab TEXT,
    tindakan_korektif TEXT,
    tindakan_preventif TEXT,
    penanggung_jawab VARCHAR(128) NOT NULL,
    target_selesai DATE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Terbuka',
    verifikasi_pjt BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.penarikan_produk (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_recall VARCHAR(64) UNIQUE NOT NULL,
    nama_alkes VARCHAR(255) NOT NULL,
    nomor_izin_edar VARCHAR(128) NOT NULL,
    nomor_batch VARCHAR(64) NOT NULL,
    alasan_recall TEXT NOT NULL,
    tingkat_risiko VARCHAR(32) NOT NULL, -- 'Kelas I', 'Kelas II', 'Kelas III'
    tanggal_mulai DATE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Aktif Berjalan',
    faskes_terdampak_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================
-- 3. OPERATIONAL & WAREHOUSE BOUNDED CONTEXT (Partitioned)
-- =====================================================================

CREATE TABLE public.gudang_fisik (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode_gudang VARCHAR(32) UNIQUE NOT NULL,
    nama_gudang VARCHAR(128) NOT NULL,
    tipe_gudang VARCHAR(64) NOT NULL, -- 'Utama', 'Karantina', 'Cold Room', dll
    penanggung_jawab VARCHAR(128) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE public.lokasi_bin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gudang_id UUID REFERENCES public.gudang_fisik(id) ON DELETE CASCADE,
    kode_bin VARCHAR(64) UNIQUE NOT NULL,
    lorong VARCHAR(16) NOT NULL,
    baris VARCHAR(16) NOT NULL,
    rak VARCHAR(16) NOT NULL,
    laci VARCHAR(16) NOT NULL,
    zona_suhu VARCHAR(32) NOT NULL, -- 'Suhu Ruang', 'Cold Room 2-8C'
    kapasitas NUMERIC(12, 2) NOT NULL,
    terpakai NUMERIC(12, 2) DEFAULT 0,
    jarak_dari_dock_meter NUMERIC(8, 2) DEFAULT 0
);

-- Partitioned Stok Table by Warehouse & Status
CREATE TABLE public.stok_gudang (
    id UUID,
    sku_id VARCHAR(64) NOT NULL,
    gudang_id UUID NOT NULL,
    bin_id UUID NOT NULL,
    nomor_batch VARCHAR(64) NOT NULL,
    nomor_seri VARCHAR(128),
    jumlah_stok NUMERIC(12, 2) NOT NULL DEFAULT 0,
    qty_tersedia NUMERIC(12, 2) NOT NULL DEFAULT 0,
    qty_dipesan NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status_stok VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'QUARANTINE', 'EXPIRED_LOCK'
    jalur VARCHAR(8) NOT NULL DEFAULT 'A', -- 'A' (Batch/FEFO) atau 'B' (Serial)
    tanggal_manufaktur DATE,
    tanggal_kedaluwarsa DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id, status_stok)
) PARTITION BY LIST (status_stok);

CREATE TABLE public.stok_gudang_available PARTITION OF public.stok_gudang FOR VALUES IN ('AVAILABLE');
CREATE TABLE public.stok_gudang_quarantine PARTITION OF public.stok_gudang FOR VALUES IN ('QUARANTINE', 'EXPIRED_LOCK', 'DAMAGED');

-- =====================================================================
-- 4. COMMERCIAL BOUNDED CONTEXT (Partitioned by Date/Quarter)
-- =====================================================================

CREATE TABLE public.customer_faskes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode_faskes VARCHAR(32) UNIQUE NOT NULL,
    nama_institusi VARCHAR(255) NOT NULL,
    tipe_faskes VARCHAR(64) NOT NULL,
    akreditasi VARCHAR(32) NOT NULL,
    nomor_izin_operasional VARCHAR(128) NOT NULL,
    masa_berlaku_izin DATE NOT NULL,
    is_izin_valid BOOLEAN DEFAULT TRUE,
    dokter_penanggung_jawab VARCHAR(128) NOT NULL,
    kontak_pengadaan VARCHAR(128) NOT NULL,
    telepon VARCHAR(32) NOT NULL,
    email VARCHAR(128) NOT NULL,
    alamat TEXT NOT NULL,
    wilayah VARCHAR(64) NOT NULL,
    batas_kredit NUMERIC(16, 2) NOT NULL DEFAULT 500000000,
    piutang_berjalan NUMERIC(16, 2) NOT NULL DEFAULT 0,
    term_of_payment_hari INT NOT NULL DEFAULT 45,
    status_cdakb VARCHAR(64) NOT NULL DEFAULT 'Tervalifikasi PJT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partitioned Sales Orders by Quarter Range
CREATE TABLE public.sales_orders (
    id UUID,
    nomor_so VARCHAR(64) NOT NULL,
    faskes_id UUID REFERENCES public.customer_faskes(id),
    tanggal_order DATE NOT NULL,
    jalur_penjualan VARCHAR(64) NOT NULL,
    subtotal NUMERIC(16, 2) NOT NULL,
    ppn_11_persen NUMERIC(16, 2) NOT NULL,
    grand_total NUMERIC(16, 2) NOT NULL,
    status_compliance_cdakb VARCHAR(64) NOT NULL,
    status_kredit VARCHAR(32) NOT NULL,
    status_order VARCHAR(32) NOT NULL,
    nama_sales VARCHAR(128) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id, tanggal_order)
) PARTITION BY RANGE (tanggal_order);

CREATE TABLE public.sales_orders_2026_q4 PARTITION OF public.sales_orders FOR VALUES FROM ('2026-10-01') TO ('2027-01-01');
CREATE TABLE public.sales_orders_2027_q1 PARTITION OF public.sales_orders FOR VALUES FROM ('2027-01-01') TO ('2027-04-01');

-- =====================================================================
-- 5. SUPPORTING & AUDIT INFRASTRUCTURE (Immutable Audit & Outbox)
-- =====================================================================

-- Append-only Immutable Audit Trail with Hash Chain
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    operator_user VARCHAR(128) NOT NULL,
    user_role VARCHAR(64) NOT NULL,
    modul VARCHAR(64) NOT NULL,
    action_type VARCHAR(32) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE', 'VALIDATE_CDAKB'
    entity_name VARCHAR(64) NOT NULL,
    record_id VARCHAR(64) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    correlation_id UUID NOT NULL,
    previous_hash VARCHAR(64) NOT NULL,
    cryptographic_hash VARCHAR(64) NOT NULL
);

-- Transactional Outbox for Event-Driven Architecture
CREATE TABLE public.outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type VARCHAR(64) NOT NULL,
    aggregate_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(128) NOT NULL, -- Contoh: 'SalesOrderCreated'
    payload JSONB NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PUBLISHED', 'FAILED'
    retry_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- Integration Gateway Logs
CREATE TABLE public.integration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    system_target VARCHAR(64) NOT NULL, -- 'SIMRS', 'SATUSEHAT', 'LKPP_EKATALOG'
    direction VARCHAR(16) NOT NULL, -- 'INBOUND', 'OUTBOUND'
    endpoint VARCHAR(255) NOT NULL,
    http_status INT NOT NULL,
    request_payload JSONB,
    response_payload JSONB,
    latency_ms INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
