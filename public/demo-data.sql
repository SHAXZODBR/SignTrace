-- SignTrace Demo Data
-- Run this in Supabase SQL Editor after creating tables

-- Insert demo recordings
INSERT INTO "Recording" ("id", "filename", "originalName", "filePath", "fileHash", "fileSize", "mimeType", "duration", "caseId", "institution", "location", "status", "createdAt") VALUES
('rec-001', 'court_hearing_001.mp3', 'Toshkent viloyat sudi - Ma''muriy ish.mp3', '/uploads/court_hearing_001.mp3', 'abc123hash', 15000000, 'audio/mp3', 1847.5, 'CASE-2024-0892', 'Toshkent viloyat sudi', 'Toshkent', 'completed', NOW() - INTERVAL '2 days'),
('rec-002', 'tax_inspection_002.mp3', 'Soliq tekshiruvi - OOO Baraka.mp3', '/uploads/tax_inspection_002.mp3', 'def456hash', 8500000, 'audio/mp3', 923.2, 'CASE-2024-0890', 'Davlat soliq qo''mitasi', 'Samarqand', 'completed', NOW() - INTERVAL '3 days'),
('rec-003', 'police_interrogation.mp3', 'Tergov - jinoyat ishi.mp3', '/uploads/police_interrogation.mp3', 'ghi789hash', 22000000, 'audio/mp3', 2456.8, 'CASE-2024-0889', 'Buxoro viloyat IIB', 'Buxoro', 'completed', NOW() - INTERVAL '1 day'),
('rec-004', 'traffic_hearing.mp3', 'Yo''l harakati buzilishi.mp3', '/uploads/traffic_hearing.mp3', 'jkl012hash', 5000000, 'audio/mp3', 534.1, 'CASE-2024-0891', 'Samarqand YHX', 'Samarqand', 'completed', NOW() - INTERVAL '4 days'),
('rec-005', 'permit_review.mp3', 'Litsenziya ko''rib chiqish.mp3', '/uploads/permit_review.mp3', 'mno345hash', 7200000, 'audio/mp3', 789.3, 'CASE-2024-0888', 'Toshkent shahar hokimligi', 'Toshkent', 'pending', NOW());

-- Insert transcripts
INSERT INTO "Transcript" ("id", "recordingId", "fullText", "language", "confidence", "segments", "createdAt") VALUES
('trans-001', 'rec-001', 'Sudya: Sud majlisini ochiq deb e''lon qilaman. Bugungi kun davomida fuqaro Aliyev Bobur Karimovichning ma''muriy huquqbuzarlik to''g''risidagi ishini ko''rib chiqamiz. Ayblanuvchi, sizga ayb qo''yilmoqda - Yo''l harakati qoidalarining 128-moddasini buzganlikda...', 'uz', 0.94, '[]', NOW() - INTERVAL '2 days'),
('trans-002', 'rec-002', 'Inspektor: Soliq tekshiruvi natijalarini e''lon qilaman. OOO Baraka kompaniyasi 2024-yil 1-chorak uchun QQS bo''yicha 45 million so''m kamaytirib ko''rsatgan...', 'uz', 0.91, '[]', NOW() - INTERVAL '3 days'),
('trans-003', 'rec-003', 'Tergovchi: Jinoyat-protsessual kodeksining 46-moddasiga muvofiq, sizga gumon qilinuvchi sifatida huquqlaringiz tushuntiriladi. Siz jimlik saqlash huquqiga egasiz...', 'uz', 0.89, '[]', NOW() - INTERVAL '1 day'),
('trans-004', 'rec-004', 'Sudya: Yo''l harakati xavfsizligi inspektorining hisobotini ko''rib chiqdim. Jazo sifatida 500,000 so''m jarima belgilanadi...', 'uz', 0.96, '[]', NOW() - INTERVAL '4 days');

-- Insert compliance reports
INSERT INTO "ComplianceReport" ("id", "recordingId", "complianceScore", "riskScore", "severityLevel", "summary", "recommendation", "createdAt") VALUES
('report-001', 'rec-001', 67, 33, 'medium', 'Ma''muriy ish bo''yicha sud jarayoni asosan to''g''ri o''tkazilgan. Biroq, ayblanuvchining huquqlari to''liq tushuntirilmagan.', 'Keyingi jarayonlarda ayblanuvchi huquqlarini to''liq o''qish tavsiya etiladi.', NOW() - INTERVAL '2 days'),
('report-002', 'rec-002', 42, 58, 'high', 'Soliq tekshiruvida jiddiy kamchiliklar aniqlandi. Soliq to''lovchining ishtiroki ta''minlanmagan, ba''zi hujjatlar ko''rib chiqilmagan.', 'Tekshiruv qayta o''tkazilishi kerak.', NOW() - INTERVAL '3 days'),
('report-003', 'rec-003', 28, 72, 'critical', 'Tergov jarayonida muhim buzilishlar: advokat ishtiroki ta''minlanmagan, huquqlar o''qilmagan, majburlov belgilari mavjud.', 'Tergov materiallari qayta ko''rib chiqilishi shart. Prokuraturaga xabar berilsin.', NOW() - INTERVAL '1 day'),
('report-004', 'rec-004', 89, 11, 'low', 'Jarayon to''g''ri o''tkazilgan. Barcha protsessual talablar bajarilgan.', 'Qo''shimcha tavsiyalar yo''q.', NOW() - INTERVAL '4 days');

-- Insert violations
INSERT INTO "Violation" ("id", "complianceReportId", "type", "description", "severity", "evidenceText", "createdAt") VALUES
('viol-001', 'report-001', 'missing_step', 'Ayblanuvchiga huquqlari to''liq tushuntirilmagan', 'medium', 'Sudya faqat "huquqlaringiz bor" dedi, lekin batafsil tushuntirmadi', NOW()),
('viol-002', 'report-002', 'no_justification', 'Qaror asoslanmagan', 'high', 'Jarima miqdori qanday hisoblanganini tushuntirmadi', NOW()),
('viol-003', 'report-002', 'missing_step', 'Soliq to''lovchi vakilining ishtiroki ta''minlanmagan', 'high', 'Tekshiruv vakilsiz o''tkazilgan', NOW()),
('viol-004', 'report-003', 'missing_step', 'Huquqlar o''qilmagan', 'critical', 'Miranda huquqlari o''qilmagan', NOW()),
('viol-005', 'report-003', 'no_legal_basis', 'Advokat ishtiroki rad etilgan', 'critical', 'Gumon qilinuvchi advokat so''ragan, lekin rad etilgan', NOW()),
('viol-006', 'report-003', 'informal_decision', 'Majburlov belgilari', 'critical', 'Tergovchi bosim o''tkazgan ko''rinadi', NOW());

-- Insert process events  
INSERT INTO "ProcessEvent" ("id", "recordingId", "stepNumber", "action", "speaker", "timestamp", "legalReference", "confidence", "createdAt") VALUES
('event-001', 'rec-001', 1, 'Sud majlisi ochildi', 'Sudya', '00:00:15', 'Ma''muriy javobgarlik kodeksi 276-modda', 0.95, NOW()),
('event-002', 'rec-001', 2, 'Ayblov o''qildi', 'Sudya', '00:02:30', 'YHQ 128-modda', 0.92, NOW()),
('event-003', 'rec-001', 3, 'Javob so''raldi', 'Sudya', '00:05:45', NULL, 0.88, NOW()),
('event-004', 'rec-003', 1, 'Tergov boshlandi', 'Tergovchi', '00:00:30', 'JPK 46-modda', 0.91, NOW()),
('event-005', 'rec-003', 2, 'Savol-javob', 'Tergovchi', '00:15:00', NULL, 0.85, NOW());
