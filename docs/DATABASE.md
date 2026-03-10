# Database Documentation

## Overview

Database ini dirancang untuk mendukung operasional Halalin pada 4 area utama:

1. Seleksi mitra dan interview kandidat
2. Self-assessment teknikal penyelia halal / auditor
3. Manajemen proyek kepatuhan SPPG
4. Visit report, temuan, dan CAPA lapangan

Model ini sudah diasumsikan **form dibangun internal**, bukan bergantung ke Jotform.

File utama:

- Schema: `database/schema.sql`
- Seed contoh: `database/seed_sppg_mabes_polri.sql`

## Business Context

Contoh implementasi saat ini adalah proyek:

- `Manajemen Sertifikasi Kepatuhan SPPG Mabes Polri`

Ruang lingkup proyek:

- Halal
- SLHS
- HACCP

Karakter operasional yang ditangani schema:

- 1 mitra bisa memegang 10-20 dapur dalam 1 batch
- pembayaran berbasis visite per dapur
- nilai visite per dapur dapat berbeda per wilayah
- laporan visite wajib masuk maksimal 1 x 24 jam
- temuan lapangan harus ditindaklanjuti dengan CAPA
- ketepatan tenggat waktu menjadi prioritas utama

## Core Modules

### 1. Master Data

Tabel utama:

- `organizations`
- `partners`

Fungsi:

- menyimpan entitas seperti Halalin, client, regulator
- menyimpan mitra, auditor, penyelia halal, interviewer

### 2. Project Operations

Tabel utama:

- `projects`
- `project_standards`
- `project_batches`
- `sites`
- `partnership_contracts`
- `site_assignments`

Fungsi:

- mendefinisikan proyek kepatuhan
- membagi proyek ke batch
- menyimpan daftar dapur/site
- menghubungkan mitra ke kontrak kerja sama
- menetapkan mitra ke site tertentu dengan fee dan target visite

### 3. Internal Form Templates

Tabel utama:

- `question_banks`
- `questions`
- `question_options`
- `scoring_criteria`

Fungsi:

- menjadi template form internal
- mendukung interview, self-assessment, visit report, CAPA, closing site
- mendukung versioning template melalui `template_code` dan `version_no`

### 4. Recruitment and Assessment

Tabel utama:

- `interview_sessions`
- `interview_responses`
- `interview_score_entries`
- `assessment_attempts`
- `assessment_responses`

Fungsi:

- menyimpan hasil interview kandidat
- menyimpan scoring per aspek
- menyimpan submission self-assessment
- mendukung objective score dan essay score

### 5. Inspection and CAPA

Tabel utama:

- `visit_reports`
- `visit_check_results`
- `findings`
- `finding_updates`
- `capa_actions`
- `evidence_files`

Fungsi:

- menyimpan laporan visite harian
- mencatat checklist per standar
- mencatat temuan mayor/minor/observasi
- melacak update harian tindak lanjut
- mencatat corrective dan preventive action
- menyimpan evidence foto/dokumen

## Main Flow

### A. Recruitment Flow

1. kandidat masuk ke `partners`
2. template interview disimpan di `question_banks`
3. sesi interview dicatat di `interview_sessions`
4. jawaban masuk ke `interview_responses`
5. nilai per aspek masuk ke `interview_score_entries`

### B. Self-Assessment Flow

1. template soal disimpan di `question_banks`
2. pertanyaan disimpan di `questions`
3. opsi jawaban objektif disimpan di `question_options`
4. peserta submit ke `assessment_attempts`
5. jawaban detail disimpan di `assessment_responses`

### C. Project Deployment Flow

1. proyek dibuat di `projects`
2. standar kepatuhan didaftarkan di `project_standards`
3. batch dibuat di `project_batches`
4. daftar dapur dimasukkan ke `sites`
5. kontrak mitra dibuat di `partnership_contracts`
6. penugasan per dapur dibuat di `site_assignments`

### D. Field Inspection Flow

1. mitra melakukan visite ke site
2. laporan dibuat di `visit_reports`
3. checklist detail disimpan di `visit_check_results`
4. temuan audit dicatat di `findings`
5. update harian ditulis di `finding_updates`
6. CAPA ditulis di `capa_actions`
7. foto dan evidence masuk ke `evidence_files`

## Important Design Decisions

### Why `question_banks` exists

Karena form dibuat sendiri, sistem tetap perlu definisi template internal.

`question_banks` dipakai untuk:

- membedakan template `interview`, `self_assessment`, `visit_report`, `capa`, `closing_site`
- menyimpan versi form
- menjaga submission lama tetap refer ke template yang benar

### Why `site_assignments` exists

Karena satu partner bisa:

- menangani banyak site
- punya target visite yang berbeda
- punya fee per site yang berbeda
- punya SLA pelaporan yang harus dipantau

Semua itu sebaiknya tidak ditempel langsung di tabel `sites` atau `partners`.

### Why `findings` and `capa_actions` dipisah

Karena satu temuan bisa punya lebih dari satu action:

- containment
- corrective action
- preventive action

Model ini lebih fleksibel untuk closing temuan.

## Important Enums

Enum penting di schema:

- `standard_code`: `halal`, `slhs`, `haccp`
- `partner_type`: `candidate`, `mitra`, `penyelia_halal`, `tenaga_ahli`, `halal_auditor`, `interviewer`
- `assignment_status`: `assigned`, `visited`, `reported`, `closed`, `overdue`
- `finding_category`: `major`, `minor`, `observation`
- `action_status`: `open`, `in_progress`, `waiting_verification`, `closed`, `rejected`

Catatan otorisasi:

- `partners.is_admin` menandai akun internal yang boleh menambah user/mitra baru ke sistem

## Reporting and SLA

View yang disediakan:

- `vw_assignment_sla`

Fungsi view ini:

- melihat assignment per site
- melihat siapa partner yang bertugas
- melihat due date laporan
- melihat apakah report terlambat atau tidak

Ini penting untuk Project Manager Halalin.

## Seed Data

File seed contoh:

- `database/seed_sppg_mabes_polri.sql`

Seed ini membuat:

- organisasi Halalin dan client
- project `SPPG-MABES-2026`
- batch awal
- mitra contoh
- site contoh
- kontrak kemitraan
- assignment visite
- template form internal dasar

## How To Use

Urutan dasar:

1. Jalankan `database/schema.sql`
2. Jalankan `database/seed_sppg_mabes_polri.sql`
3. Tambahkan seed pertanyaan ke `questions`
4. Bangun UI form internal berdasarkan `question_banks`
5. Simpan submission ke tabel operasional yang sesuai

Contoh command:

```bash
psql "$DATABASE_URL" -f database/schema.sql
psql "$DATABASE_URL" -f database/seed_sppg_mabes_polri.sql
```

## Recommended Next Tables/Seeds

Agar sistem bisa langsung dipakai, langkah berikut yang direkomendasikan:

1. Seed `questions` untuk template `VISIT-REPORT-SPPG`
2. Seed `questions` untuk `INTERVIEW-MITRA`
3. Seed `questions` dan `question_options` untuk `SELF-ASSESSMENT-PH`
4. Query dashboard untuk PM: progres batch, keterlambatan laporan, open findings, open CAPA

## Notes

Schema ini masih netral terhadap framework.

Anda bisa lanjutkan ke:

- migrasi SQL bertahap
- Prisma schema
- backend API
- admin dashboard
