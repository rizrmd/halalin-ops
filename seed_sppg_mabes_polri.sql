BEGIN;

WITH owner_org AS (
    INSERT INTO organizations (name, org_type, address, contact_name, contact_email)
    VALUES (
        'PT Halalin Nusantara Ekosistem',
        'internal',
        'Jakarta, Indonesia',
        'Yuliana Zahara Mega',
        'ceo@halalin.id'
    )
    ON CONFLICT DO NOTHING
    RETURNING id
),
client_org AS (
    INSERT INTO organizations (name, org_type, address, contact_name)
    VALUES (
        'SPPG Mabes Polri',
        'client',
        'Mabes Polri, Jakarta',
        'Koordinator SPPG Mabes Polri'
    )
    ON CONFLICT DO NOTHING
    RETURNING id
)
INSERT INTO projects (
    code,
    title,
    description,
    client_org_id,
    owner_org_id,
    status,
    visit_fee_min,
    visit_fee_max,
    report_due_hours,
    started_at
)
SELECT
    'SPPG-MABES-2026',
    'Manajemen Sertifikasi Kepatuhan SPPG Mabes Polri',
    'Proyek inspeksi, pendampingan, reporting, dan closing temuan untuk standar halal, SLHS, dan HACCP.',
    COALESCE((SELECT id FROM client_org), (SELECT id FROM organizations WHERE name = 'SPPG Mabes Polri' LIMIT 1)),
    COALESCE((SELECT id FROM owner_org), (SELECT id FROM organizations WHERE name = 'PT Halalin Nusantara Ekosistem' LIMIT 1)),
    'active',
    300000,
    400000,
    24,
    DATE '2026-03-01'
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE code = 'SPPG-MABES-2026'
);

INSERT INTO project_standards (project_id, standard_code)
SELECT p.id, v.standard_code::standard_code
FROM projects p
CROSS JOIN (VALUES ('halal'), ('slhs'), ('haccp')) AS v(standard_code)
WHERE p.code = 'SPPG-MABES-2026'
ON CONFLICT DO NOTHING;

INSERT INTO project_batches (
    project_id,
    batch_code,
    batch_name,
    status,
    target_site_count,
    started_on,
    due_on,
    notes
)
SELECT
    p.id,
    'BATCH-01',
    'Batch 01 Area Jakarta',
    'active',
    10,
    DATE '2026-03-10',
    DATE '2026-03-20',
    'Contoh batch awal untuk 10 dapur.'
FROM projects p
WHERE p.code = 'SPPG-MABES-2026'
AND NOT EXISTS (
    SELECT 1
    FROM project_batches b
    WHERE b.project_id = p.id
      AND b.batch_code = 'BATCH-01'
);

INSERT INTO partners (
    full_name,
    email,
    phone,
    domicile_city,
    domicile_province,
    partner_type,
    experience_level,
    notes
)
VALUES
    ('Ahmad Fauzi', 'ahmad.fauzi@halalin.id', '081200000001', 'Jakarta Selatan', 'DKI Jakarta', 'halal_auditor', 'senior', 'Lead auditor batch 01'),
    ('Siti Rahma', 'siti.rahma@halalin.id', '081200000002', 'Depok', 'Jawa Barat', 'tenaga_ahli', 'middle', 'Field compliance expert'),
    ('Dian Prasetyo', 'dian.prasetyo@halalin.id', '081200000003', 'Bekasi', 'Jawa Barat', 'penyelia_halal', 'middle', 'Reviewer report dan closing temuan')
ON CONFLICT DO NOTHING;

INSERT INTO sites (
    project_id,
    batch_id,
    code,
    name,
    site_type,
    province,
    city,
    district,
    address,
    pic_name,
    pic_phone,
    worker_count,
    daily_capacity,
    site_status
)
SELECT
    p.id,
    b.id,
    s.code,
    s.name,
    'sppg',
    s.province,
    s.city,
    s.district,
    s.address,
    s.pic_name,
    s.pic_phone,
    s.worker_count,
    s.daily_capacity,
    s.site_status::site_status
FROM projects p
JOIN project_batches b
  ON b.project_id = p.id
 AND b.batch_code = 'BATCH-01'
CROSS JOIN (
    VALUES
        ('SPPG-JKT-001', 'SPPG Mabes Polri A', 'DKI Jakarta', 'Jakarta Selatan', 'Kebayoran Baru', 'Area Jakarta Selatan', 'KA SPPG A', '081310000001', 24, 2500, 'minor_fix'),
        ('SPPG-JKT-002', 'SPPG Mabes Polri B', 'DKI Jakarta', 'Jakarta Timur', 'Cipayung', 'Area Jakarta Timur', 'KA SPPG B', '081310000002', 18, 1800, 'major_fix'),
        ('SPPG-JKT-003', 'SPPG Mabes Polri C', 'DKI Jakarta', 'Jakarta Pusat', 'Senen', 'Area Jakarta Pusat', 'KA SPPG C', '081310000003', 20, 2200, 'very_ready')
) AS s(code, name, province, city, district, address, pic_name, pic_phone, worker_count, daily_capacity, site_status)
WHERE p.code = 'SPPG-MABES-2026'
AND NOT EXISTS (
    SELECT 1 FROM sites existing
    WHERE existing.project_id = p.id
      AND existing.code = s.code
);

INSERT INTO partnership_contracts (
    project_id,
    partner_id,
    contract_number,
    role_title,
    payment_scheme,
    visit_fee_amount,
    start_date,
    end_date,
    reporting_sla_hours,
    max_sites_per_batch,
    scope_of_work,
    signed_at
)
SELECT
    p.id,
    pr.id,
    'PKS-SPPG-2026-' || ROW_NUMBER() OVER (ORDER BY pr.full_name),
    CASE
        WHEN pr.partner_type = 'halal_auditor' THEN 'Halal Auditor'
        WHEN pr.partner_type = 'tenaga_ahli' THEN 'Field Compliance Expert'
        ELSE 'Penyelia Halal'
    END,
    'visit_based',
    CASE
        WHEN pr.partner_type = 'halal_auditor' THEN 400000
        ELSE 350000
    END,
    DATE '2026-03-10',
    DATE '2026-06-30',
    24,
    20,
    'Visite lapangan, penyusunan laporan 1x24 jam, koordinasi temuan, update harian, dan tindak lanjut CAPA.',
    NOW()
FROM projects p
JOIN partners pr
  ON pr.email IN ('ahmad.fauzi@halalin.id', 'siti.rahma@halalin.id', 'dian.prasetyo@halalin.id')
WHERE p.code = 'SPPG-MABES-2026'
AND NOT EXISTS (
    SELECT 1
    FROM partnership_contracts c
    WHERE c.project_id = p.id
      AND c.partner_id = pr.id
);

INSERT INTO site_assignments (
    project_id,
    batch_id,
    site_id,
    partner_id,
    contract_id,
    assigned_fee,
    target_visit_date,
    report_due_at,
    status
)
SELECT
    p.id,
    b.id,
    s.id,
    pr.id,
    c.id,
    c.visit_fee_amount,
    a.target_visit_date,
    a.target_visit_date::timestamp + INTERVAL '1 day',
    'assigned'
FROM projects p
JOIN project_batches b
  ON b.project_id = p.id
 AND b.batch_code = 'BATCH-01'
JOIN (
    VALUES
        ('SPPG-JKT-001', 'ahmad.fauzi@halalin.id', DATE '2026-03-10'),
        ('SPPG-JKT-002', 'siti.rahma@halalin.id', DATE '2026-03-11'),
        ('SPPG-JKT-003', 'ahmad.fauzi@halalin.id', DATE '2026-03-12')
) AS a(site_code, partner_email, target_visit_date)
  ON TRUE
JOIN sites s
  ON s.project_id = p.id
 AND s.code = a.site_code
JOIN partners pr
  ON pr.email = a.partner_email
JOIN partnership_contracts c
  ON c.project_id = p.id
 AND c.partner_id = pr.id
WHERE p.code = 'SPPG-MABES-2026'
AND NOT EXISTS (
    SELECT 1
    FROM site_assignments sa
    WHERE sa.site_id = s.id
      AND sa.partner_id = pr.id
      AND sa.batch_id = b.id
);

INSERT INTO question_banks (
    purpose,
    project_id,
    title,
    description,
    template_code,
    version_no,
    is_active
)
SELECT
    q.purpose::form_purpose,
    p.id,
    q.title,
    q.description,
    q.template_code,
    1,
    TRUE
FROM projects p
CROSS JOIN (
    VALUES
        ('interview', 'Interview Penyelia Halal Mitra', 'Template interview screening dan full interview mitra Halalin.', 'INTERVIEW-MITRA'),
        ('self_assessment', 'Self Assessment Penyelia Halal', 'Template objective test dan essay untuk penilaian teknikal.', 'SELF-ASSESSMENT-PH'),
        ('visit_report', 'Visit Report Harian SPPG', 'Template laporan visite lapangan untuk standar halal, SLHS, dan HACCP.', 'VISIT-REPORT-SPPG'),
        ('capa', 'CAPA Tindak Lanjut Temuan', 'Template action plan korektif dan preventif per temuan.', 'CAPA-SPPG'),
        ('closing_site', 'Closing Site Readiness', 'Template verifikasi closing temuan dan readiness site.', 'CLOSING-SITE-SPPG')
) AS q(purpose, title, description, template_code)
WHERE p.code = 'SPPG-MABES-2026'
AND NOT EXISTS (
    SELECT 1
    FROM question_banks qb
    WHERE qb.project_id = p.id
      AND qb.purpose = q.purpose::form_purpose
      AND qb.template_code = q.template_code
      AND qb.version_no = 1
);

COMMIT;
