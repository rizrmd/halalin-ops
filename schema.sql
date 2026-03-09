CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE org_type AS ENUM ('internal', 'client', 'regulator', 'vendor');
CREATE TYPE partner_type AS ENUM ('candidate', 'mitra', 'penyelia_halal', 'tenaga_ahli', 'halal_auditor', 'interviewer');
CREATE TYPE project_status AS ENUM ('draft', 'active', 'on_hold', 'closed');
CREATE TYPE standard_code AS ENUM ('halal', 'slhs', 'haccp');
CREATE TYPE batch_status AS ENUM ('draft', 'active', 'completed', 'cancelled');
CREATE TYPE assignment_status AS ENUM ('assigned', 'visited', 'reported', 'closed', 'overdue');
CREATE TYPE form_purpose AS ENUM ('interview', 'self_assessment', 'visit_report', 'capa', 'closing_site');
CREATE TYPE question_type AS ENUM ('short_text', 'long_text', 'single_choice', 'multiple_choice', 'rating', 'date', 'boolean');
CREATE TYPE assessment_context AS ENUM ('interview', 'self_assessment', 'inspection');
CREATE TYPE interview_mode AS ENUM ('onsite', 'online', 'hybrid');
CREATE TYPE interview_kind AS ENUM ('walking', 'full');
CREATE TYPE talent_result AS ENUM ('priority_deploy', 'talent_pool', 'training_first', 'hold', 'senior_halal_compliance', 'deployable_penyelia_halal', 'training_required', 'not_ready');
CREATE TYPE site_status AS ENUM ('very_ready', 'minor_fix', 'major_fix', 'not_ready');
CREATE TYPE finding_category AS ENUM ('major', 'minor', 'observation');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE action_type AS ENUM ('containment', 'corrective', 'preventive');
CREATE TYPE action_status AS ENUM ('open', 'in_progress', 'waiting_verification', 'closed', 'rejected');
CREATE TYPE evidence_owner AS ENUM ('visit_report', 'finding', 'capa_action', 'assessment_attempt', 'interview_session', 'contract');

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    org_type org_type NOT NULL,
    address TEXT,
    contact_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    domicile_city TEXT,
    domicile_province TEXT,
    partner_type partner_type NOT NULL,
    experience_level TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    client_org_id UUID REFERENCES organizations(id),
    owner_org_id UUID REFERENCES organizations(id),
    status project_status NOT NULL DEFAULT 'draft',
    visit_fee_min NUMERIC(12,2),
    visit_fee_max NUMERIC(12,2),
    report_due_hours INTEGER NOT NULL DEFAULT 24,
    started_at DATE,
    ended_at DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE project_standards (
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    standard_code standard_code NOT NULL,
    PRIMARY KEY (project_id, standard_code)
);

CREATE TABLE project_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    batch_code TEXT NOT NULL,
    batch_name TEXT NOT NULL,
    status batch_status NOT NULL DEFAULT 'draft',
    target_site_count INTEGER,
    started_on DATE,
    due_on DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, batch_code)
);

CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES project_batches(id) ON DELETE SET NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    site_type TEXT DEFAULT 'sppg',
    province TEXT,
    city TEXT,
    district TEXT,
    address TEXT,
    pic_name TEXT,
    pic_phone TEXT,
    worker_count INTEGER,
    daily_capacity INTEGER,
    site_status site_status,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, code)
);

CREATE TABLE partnership_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    contract_number TEXT UNIQUE,
    role_title TEXT NOT NULL,
    payment_scheme TEXT NOT NULL DEFAULT 'visit_based',
    visit_fee_amount NUMERIC(12,2),
    start_date DATE NOT NULL,
    end_date DATE,
    reporting_sla_hours INTEGER NOT NULL DEFAULT 24,
    max_sites_per_batch INTEGER,
    scope_of_work TEXT,
    signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE site_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES project_batches(id) ON DELETE SET NULL,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES partnership_contracts(id) ON DELETE SET NULL,
    assigned_fee NUMERIC(12,2) NOT NULL,
    target_visit_date DATE,
    report_due_at TIMESTAMPTZ,
    status assignment_status NOT NULL DEFAULT 'assigned',
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (site_id, partner_id, batch_id)
);

CREATE TABLE question_banks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purpose form_purpose NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    template_code TEXT,
    version_no INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (purpose, template_code, version_no)
);

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_id UUID NOT NULL REFERENCES question_banks(id) ON DELETE CASCADE,
    section_code TEXT,
    section_title TEXT,
    field_key TEXT,
    question_type question_type NOT NULL,
    prompt TEXT NOT NULL,
    help_text TEXT,
    standard_code standard_code,
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    weight NUMERIC(8,2) NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_label TEXT NOT NULL,
    option_value TEXT NOT NULL,
    score_value NUMERIC(8,2) NOT NULL DEFAULT 0,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE scoring_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    context assessment_context NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    max_score NUMERIC(8,2) NOT NULL,
    weight NUMERIC(8,2) NOT NULL DEFAULT 1,
    description TEXT,
    UNIQUE (context, code)
);

CREATE TABLE interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    bank_id UUID REFERENCES question_banks(id) ON DELETE SET NULL,
    candidate_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    interviewer_id UUID REFERENCES partners(id) ON DELETE SET NULL,
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
    interview_mode interview_mode,
    interview_kind interview_kind,
    interview_date DATE NOT NULL,
    objective TEXT,
    result talent_result,
    total_score NUMERIC(8,2),
    notes TEXT,
    submission_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE interview_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
    response_text TEXT,
    selected_option_id UUID REFERENCES question_options(id) ON DELETE SET NULL,
    awarded_score NUMERIC(8,2),
    reviewer_note TEXT
);

CREATE TABLE interview_score_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    criterion_id UUID NOT NULL REFERENCES scoring_criteria(id) ON DELETE CASCADE,
    score NUMERIC(8,2) NOT NULL,
    comment TEXT,
    UNIQUE (interview_session_id, criterion_id)
);

CREATE TABLE assessment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    bank_id UUID NOT NULL REFERENCES question_banks(id) ON DELETE RESTRICT,
    participant_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    submission_code TEXT,
    started_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    objective_score NUMERIC(8,2) NOT NULL DEFAULT 0,
    essay_score NUMERIC(8,2) NOT NULL DEFAULT 0,
    total_score NUMERIC(8,2) NOT NULL DEFAULT 0,
    competency_result talent_result,
    reviewer_id UUID REFERENCES partners(id) ON DELETE SET NULL,
    review_note TEXT
);

CREATE TABLE assessment_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
    selected_option_id UUID REFERENCES question_options(id) ON DELETE SET NULL,
    answer_text TEXT,
    awarded_score NUMERIC(8,2) NOT NULL DEFAULT 0,
    reviewer_note TEXT
);

CREATE TABLE visit_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES project_batches(id) ON DELETE SET NULL,
    assignment_id UUID REFERENCES site_assignments(id) ON DELETE SET NULL,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    submitted_by UUID NOT NULL REFERENCES partners(id) ON DELETE RESTRICT,
    template_bank_id UUID REFERENCES question_banks(id) ON DELETE SET NULL,
    submission_code TEXT,
    visit_date DATE NOT NULL,
    site_status site_status,
    worker_count INTEGER,
    daily_capacity INTEGER,
    summary TEXT,
    report_submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    pic_signature_name TEXT,
    UNIQUE (site_id, submitted_by, visit_date)
);

CREATE TABLE visit_check_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_report_id UUID NOT NULL REFERENCES visit_reports(id) ON DELETE CASCADE,
    standard_code standard_code NOT NULL,
    item_code TEXT NOT NULL,
    item_label TEXT NOT NULL,
    item_status BOOLEAN,
    note TEXT
);

CREATE TABLE findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_report_id UUID NOT NULL REFERENCES visit_reports(id) ON DELETE CASCADE,
    standard_code standard_code NOT NULL,
    category finding_category NOT NULL,
    risk_level risk_level NOT NULL DEFAULT 'medium',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    root_cause TEXT,
    recommended_action TEXT,
    due_date DATE,
    is_repeated BOOLEAN NOT NULL DEFAULT FALSE,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE finding_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
    updated_by UUID REFERENCES partners(id) ON DELETE SET NULL,
    update_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    progress_percent NUMERIC(5,2) CHECK (progress_percent >= 0 AND progress_percent <= 100),
    update_note TEXT NOT NULL
);

CREATE TABLE capa_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
    action_type action_type NOT NULL,
    owner_partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
    owner_name TEXT,
    action_description TEXT NOT NULL,
    target_date DATE,
    completed_at TIMESTAMPTZ,
    effectiveness_note TEXT,
    status action_status NOT NULL DEFAULT 'open'
);

CREATE TABLE evidence_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_type evidence_owner NOT NULL,
    owner_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    mime_type TEXT,
    external_file_id TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sites_project_id ON sites(project_id);
CREATE INDEX idx_site_assignments_partner_id ON site_assignments(partner_id);
CREATE INDEX idx_site_assignments_status ON site_assignments(status);
CREATE INDEX idx_interview_sessions_candidate_id ON interview_sessions(candidate_id);
CREATE INDEX idx_assessment_attempts_participant_id ON assessment_attempts(participant_id);
CREATE INDEX idx_visit_reports_site_id ON visit_reports(site_id);
CREATE INDEX idx_visit_reports_visit_date ON visit_reports(visit_date);
CREATE INDEX idx_findings_visit_report_id ON findings(visit_report_id);
CREATE INDEX idx_findings_standard_category ON findings(standard_code, category);
CREATE INDEX idx_capa_actions_status ON capa_actions(status);

CREATE VIEW vw_assignment_sla AS
SELECT
    sa.id AS assignment_id,
    p.code AS project_code,
    s.code AS site_code,
    s.name AS site_name,
    pr.full_name AS partner_name,
    sa.status,
    sa.target_visit_date,
    sa.report_due_at,
    vr.report_submitted_at,
    CASE
        WHEN sa.report_due_at IS NULL THEN NULL
        WHEN vr.report_submitted_at IS NULL AND NOW() > sa.report_due_at THEN TRUE
        WHEN vr.report_submitted_at IS NOT NULL AND vr.report_submitted_at > sa.report_due_at THEN TRUE
        ELSE FALSE
    END AS is_report_late
FROM site_assignments sa
JOIN projects p ON p.id = sa.project_id
JOIN sites s ON s.id = sa.site_id
JOIN partners pr ON pr.id = sa.partner_id
LEFT JOIN LATERAL (
    SELECT report_submitted_at
    FROM visit_reports vr
    WHERE vr.assignment_id = sa.id
    ORDER BY vr.report_submitted_at DESC
    LIMIT 1
) vr ON TRUE;
