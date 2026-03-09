-- Seed questions and options for Self Assessment Penyelia Halal
BEGIN;

-- Get the question bank ID
INSERT INTO questions (bank_id, section_code, section_title, field_key, question_type, prompt, help_text, is_required, weight, sort_order)
SELECT 
  qb.id,
  'general',
  'Pengetahuan Umum Halal',
  'knowledge_basic',
  'single_choice',
  'Apa yang dimaksud dengan produk halal?',
  'Pilih jawaban yang paling tepat',
  TRUE,
  1.0,
  1
FROM question_banks qb 
WHERE qb.template_code = 'SELF-ASSESSMENT-PH' AND qb.purpose = 'self_assessment'
ON CONFLICT DO NOTHING;

-- Add options for question 1
INSERT INTO question_options (question_id, option_label, option_value, score_value, is_correct, sort_order)
SELECT 
  q.id,
  opt.label,
  opt.value,
  opt.score,
  opt.is_correct,
  opt.sort_order
FROM questions q
CROSS JOIN (VALUES 
  ('Produk yang tidak mengandung babi atau turunannya', 'A', 10.0, TRUE, 1),
  ('Produk yang diproduksi oleh perusahaan muslim', 'B', 0.0, FALSE, 2),
  ('Produk yang dijual di toko muslim', 'C', 0.0, FALSE, 3),
  ('Produk yang harganya terjangkau', 'D', 0.0, FALSE, 4)
) AS opt(label, value, score, is_correct, sort_order)
WHERE q.field_key = 'knowledge_basic'
ON CONFLICT DO NOTHING;

-- Question 2
INSERT INTO questions (bank_id, section_code, section_title, field_key, question_type, prompt, help_text, is_required, weight, sort_order)
SELECT 
  qb.id,
  'general',
  'Pengetahuan Umum Halal',
  'knowledge_lph',
  'single_choice',
  'Apa kepanjangan dari LPH?',
  'Lembaga yang berwenang melakukan uji halal',
  TRUE,
  1.0,
  2
FROM question_banks qb 
WHERE qb.template_code = 'SELF-ASSESSMENT-PH' AND qb.purpose = 'self_assessment'
ON CONFLICT DO NOTHING;

INSERT INTO question_options (question_id, option_label, option_value, score_value, is_correct, sort_order)
SELECT 
  q.id,
  opt.label,
  opt.value,
  opt.score,
  opt.is_correct,
  opt.sort_order
FROM questions q
CROSS JOIN (VALUES 
  ('Lembaga Pendidikan Halal', 'A', 0.0, FALSE, 1),
  ('Lembaga Pemeriksa Halal', 'B', 10.0, TRUE, 2),
  ('Lembaga Pengawas Halal', 'C', 0.0, FALSE, 3),
  ('Lembaga Penelitian Halal', 'D', 0.0, FALSE, 4)
) AS opt(label, value, score, is_correct, sort_order)
WHERE q.field_key = 'knowledge_lph'
ON CONFLICT DO NOTHING;

-- Question 3: Multiple choice
INSERT INTO questions (bank_id, section_code, section_title, field_key, question_type, prompt, help_text, is_required, weight, sort_order)
SELECT 
  qb.id,
  'audit',
  'Prosedur Audit',
  'audit_steps',
  'multiple_choice',
  'Manakah yang termasuk dalam tahapan audit halal? (Pilih semua yang benar)',
  'Bisa lebih dari satu jawaban',
  TRUE,
  1.0,
  3
FROM question_banks qb 
WHERE qb.template_code = 'SELF-ASSESSMENT-PH' AND qb.purpose = 'self_assessment'
ON CONFLICT DO NOTHING;

INSERT INTO question_options (question_id, option_label, option_value, score_value, is_correct, sort_order)
SELECT 
  q.id,
  opt.label,
  opt.value,
  opt.score,
  opt.is_correct,
  opt.sort_order
FROM questions q
CROSS JOIN (VALUES 
  ('Pembukaan dan pengenalan', 'A', 5.0, TRUE, 1),
  ('Tinjauan dokumen', 'B', 5.0, TRUE, 2),
  ('Observasi lapangan', 'C', 5.0, TRUE, 3),
  ('Wawancara dengan karyawan', 'D', 5.0, TRUE, 4),
  ('Penutupan dan laporan', 'E', 5.0, TRUE, 5)
) AS opt(label, value, score, is_correct, sort_order)
WHERE q.field_key = 'audit_steps'
ON CONFLICT DO NOTHING;

-- Question 4: Boolean
INSERT INTO questions (bank_id, section_code, section_title, field_key, question_type, prompt, help_text, is_required, weight, sort_order)
SELECT 
  qb.id,
  'compliance',
  'Kepatuhan',
  'compliance_critical',
  'boolean',
  'Apakah bahan kritis harus selalu memiliki sertifikat halal?',
  'Pilih Ya atau Tidak',
  TRUE,
  1.0,
  4
FROM question_banks qb 
WHERE qb.template_code = 'SELF-ASSESSMENT-PH' AND qb.purpose = 'self_assessment'
ON CONFLICT DO NOTHING;

INSERT INTO question_options (question_id, option_label, option_value, score_value, is_correct, sort_order)
SELECT 
  q.id,
  opt.label,
  opt.value,
  opt.score,
  opt.is_correct,
  opt.sort_order
FROM questions q
CROSS JOIN (VALUES 
  ('Ya', 'true', 10.0, TRUE, 1),
  ('Tidak', 'false', 0.0, FALSE, 2)
) AS opt(label, value, score, is_correct, sort_order)
WHERE q.field_key = 'compliance_critical'
ON CONFLICT DO NOTHING;

-- Question 5: Essay
INSERT INTO questions (bank_id, section_code, section_title, field_key, question_type, prompt, help_text, is_required, weight, sort_order)
SELECT 
  qb.id,
  'essay',
  'Studi Kasus',
  'case_study',
  'long_text',
  'Jelaskan langkah-langkah yang akan Anda ambil jika menemukan ketidaksesuaian kritis selama audit halal di sebuah fasilitas produksi!',
  'Jawaban minimal 100 kata',
  TRUE,
  1.0,
  5
FROM question_banks qb 
WHERE qb.template_code = 'SELF-ASSESSMENT-PH' AND qb.purpose = 'self_assessment'
ON CONFLICT DO NOTHING;

-- Question 6: Rating
INSERT INTO questions (bank_id, section_code, section_title, field_key, question_type, prompt, help_text, is_required, weight, sort_order)
SELECT 
  qb.id,
  'self_eval',
  'Evaluasi Diri',
  'confidence_level',
  'rating',
  'Seberapa percaya diri Anda dalam melakukan audit halal secara mandiri?',
  '1 = Sangat tidak percaya diri, 5 = Sangat percaya diri',
  TRUE,
  1.0,
  6
FROM question_banks qb 
WHERE qb.template_code = 'SELF-ASSESSMENT-PH' AND qb.purpose = 'self_assessment'
ON CONFLICT DO NOTHING;

INSERT INTO question_options (question_id, option_label, option_value, score_value, is_correct, sort_order)
SELECT 
  q.id,
  opt.label,
  opt.value,
  opt.score,
  opt.is_correct,
  opt.sort_order
FROM questions q
CROSS JOIN (VALUES 
  ('1 - Sangat tidak percaya diri', '1', 1.0, FALSE, 1),
  ('2 - Tidak percaya diri', '2', 2.0, FALSE, 2),
  ('3 - Cukup percaya diri', '3', 3.0, TRUE, 3),
  ('4 - Percaya diri', '4', 4.0, TRUE, 4),
  ('5 - Sangat percaya diri', '5', 5.0, TRUE, 5)
) AS opt(label, value, score, is_correct, sort_order)
WHERE q.field_key = 'confidence_level'
ON CONFLICT DO NOTHING;

COMMIT;
