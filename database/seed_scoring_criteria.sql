-- Seed scoring criteria for interview context
-- These criteria are used to evaluate interview candidates

INSERT INTO scoring_criteria (context, code, name, max_score, weight, description)
VALUES 
  ('interview', 'professionalism', 'Profesionalisme', 20, 1, 'Sikap profesional, etika kerja, dan penampilan'),
  ('interview', 'communication', 'Komunikasi', 20, 1, 'Kemampuan berkomunikasi secara efektif dan jelas'),
  ('interview', 'technical_knowledge', 'Pengetahuan Teknis', 25, 1.5, 'Pemahaman tentang standar halal, SLHS, dan HACCP'),
  ('interview', 'problem_solving', 'Pemecahan Masalah', 15, 1, 'Kemampuan menganalisis dan menyelesaikan masalah'),
  ('interview', 'adaptability', 'Adaptabilitas', 10, 1, 'Fleksibilitas dan kemampuan beradaptasi dengan kondisi lapangan'),
  ('interview', 'integrity', 'Integritas', 10, 1, 'Kejujuran dan komitmen terhadap prinsip-prinsip halal')
ON CONFLICT (context, code) DO UPDATE SET
  name = EXCLUDED.name,
  max_score = EXCLUDED.max_score,
  weight = EXCLUDED.weight,
  description = EXCLUDED.description;
