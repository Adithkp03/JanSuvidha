-- Phase 2 Multi-Department Services MVP Migration

CREATE TABLE IF NOT EXISTS departments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  code        TEXT UNIQUE NOT NULL,
  icon        TEXT,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id      UUID REFERENCES departments(id),
  name               TEXT NOT NULL,
  code               TEXT UNIQUE NOT NULL,
  description        TEXT,
  required_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  form_schema        JSONB NOT NULL DEFAULT '[]'::jsonb,
  fee_amount         NUMERIC NOT NULL DEFAULT 0,
  processing_days    INTEGER NOT NULL DEFAULT 7,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Data

-- 1. Gas
INSERT INTO departments (id, name, code, icon, description) VALUES 
('d0000000-0000-0000-0000-000000000001', 'Gas', 'gas', 'Flame', 'Piped natural gas services')
ON CONFLICT (code) DO NOTHING;

-- 2. Electricity
INSERT INTO departments (id, name, code, icon, description) VALUES 
('d0000000-0000-0000-0000-000000000002', 'Electricity', 'electricity', 'Zap', 'State electricity board')
ON CONFLICT (code) DO NOTHING;

-- 3. Municipal Corporation (MC)
INSERT INTO departments (id, name, code, icon, description) VALUES 
('d0000000-0000-0000-0000-000000000003', 'Municipal Corporation', 'mc', 'Building2', 'Local civic administration')
ON CONFLICT (code) DO NOTHING;

-- 4. Water Board
INSERT INTO departments (id, name, code, icon, description) VALUES 
('d0000000-0000-0000-0000-000000000004', 'Water Board', 'water', 'Droplets', 'Water supply and sanitation')
ON CONFLICT (code) DO NOTHING;

-- 5. Transport
INSERT INTO departments (id, name, code, icon, description) VALUES 
('d0000000-0000-0000-0000-000000000005', 'Transport', 'transport', 'Bus', 'RTO and vehicle services')
ON CONFLICT (code) DO NOTHING;

-- 6. Revenue
INSERT INTO departments (id, name, code, icon, description) VALUES 
('d0000000-0000-0000-0000-000000000006', 'Revenue', 'revenue', 'Landmark', 'Certificates and land records')
ON CONFLICT (code) DO NOTHING;


-- Gas Services
INSERT INTO services (department_id, name, code, description, required_documents, form_schema, fee_amount, processing_days) VALUES
('d0000000-0000-0000-0000-000000000001', 'New Gas Connection', 'gas_new_conn', 'Apply for a new piped gas connection', 
'["address_proof", "id_proof"]'::jsonb, 
'[{"name": "applicant_name", "label": "Applicant Name", "type": "text", "required": true}, {"name": "address", "label": "Installation Address", "type": "text", "required": true}]'::jsonb, 
500, 15),

('d0000000-0000-0000-0000-000000000001', 'Gas Address Change', 'gas_addr_change', 'Update connection address', 
'["new_address_proof"]'::jsonb, 
'[{"name": "consumer_number", "label": "Consumer Number", "type": "text", "required": true}, {"name": "new_address", "label": "New Address", "type": "text", "required": true}]'::jsonb, 
100, 7)
ON CONFLICT (code) DO NOTHING;

-- Electricity Services
INSERT INTO services (department_id, name, code, description, required_documents, form_schema, fee_amount, processing_days) VALUES
('d0000000-0000-0000-0000-000000000002', 'New Electricity Connection', 'elec_new_conn', 'Apply for new meter', 
'["property_ownership", "id_proof"]'::jsonb, 
'[{"name": "applicant_name", "label": "Applicant Name", "type": "text", "required": true}, {"name": "load_kw", "label": "Required Load (kW)", "type": "number", "required": true}]'::jsonb, 
1000, 10),

('d0000000-0000-0000-0000-000000000002', 'Bill Payment Support', 'elec_bill_support', 'File a query for high bill', 
'["recent_bill"]'::jsonb, 
'[{"name": "consumer_number", "label": "Consumer Number", "type": "text", "required": true}, {"name": "issue_description", "label": "Issue Description", "type": "text", "required": true}]'::jsonb, 
0, 5)
ON CONFLICT (code) DO NOTHING;

-- Municipal Corporation Services
INSERT INTO services (department_id, name, code, description, required_documents, form_schema, fee_amount, processing_days) VALUES
('d0000000-0000-0000-0000-000000000003', 'Birth Certificate', 'mc_birth_cert', 'Apply for new birth certificate', 
'["hospital_discharge_summary", "parents_id"]'::jsonb, 
'[{"name": "child_name", "label": "Child Name", "type": "text", "required": true}, {"name": "dob", "label": "Date of Birth", "type": "date", "required": true}, {"name": "gender", "label": "Gender", "type": "select", "options": [{"value":"Male", "label":"Male"}, {"value":"Female", "label":"Female"}, {"value":"Other", "label":"Other"}], "required": true}]'::jsonb, 
50, 7),

('d0000000-0000-0000-0000-000000000003', 'Death Certificate', 'mc_death_cert', 'Apply for death certificate', 
'["hospital_declaration", "deceased_id", "applicant_id"]'::jsonb, 
'[{"name": "deceased_name", "label": "Deceased Name", "type": "text", "required": true}, {"name": "dod", "label": "Date of Death", "type": "date", "required": true}]'::jsonb, 
50, 7),

('d0000000-0000-0000-0000-000000000003', 'Property Tax Payment', 'mc_prop_tax', 'Pay annual property tax', 
'[]'::jsonb, 
'[{"name": "property_id", "label": "Property ID", "type": "text", "required": true}, {"name": "financial_year", "label": "Financial Year", "type": "text", "required": true}]'::jsonb, 
0, 1)
ON CONFLICT (code) DO NOTHING;

-- Water Board Services
INSERT INTO services (department_id, name, code, description, required_documents, form_schema, fee_amount, processing_days) VALUES
('d0000000-0000-0000-0000-000000000004', 'New Water Connection', 'water_new_conn', 'Apply for domestic water connection', 
'["property_ownership", "id_proof"]'::jsonb, 
'[{"name": "applicant_name", "label": "Applicant Name", "type": "text", "required": true}, {"name": "property_address", "label": "Property Address", "type": "text", "required": true}]'::jsonb, 
500, 14),

('d0000000-0000-0000-0000-000000000004', 'Water Bill Payment', 'water_bill_pay', 'Pay outstanding water bill', 
'[]'::jsonb, 
'[{"name": "can_number", "label": "CAN Number", "type": "text", "required": true}]'::jsonb, 
0, 1)
ON CONFLICT (code) DO NOTHING;

-- Transport Services 
INSERT INTO services (department_id, name, code, description, required_documents, form_schema, fee_amount, processing_days) VALUES
('d0000000-0000-0000-0000-000000000005', 'Driving License Renewal', 'trans_dl_renew', 'Renew expired driving license', 
'["old_dl", "medical_certificate", "address_proof"]'::jsonb, 
'[{"name": "dl_number", "label": "DL Number", "type": "text", "required": true}, {"name": "dob", "label": "Date of Birth", "type": "date", "required": true}]'::jsonb, 
300, 30),

('d0000000-0000-0000-0000-000000000005', 'Vehicle Address Update', 'trans_veh_addr', 'Update address in RC book', 
'["rc_copy", "new_address_proof", "insurance_copy"]'::jsonb, 
'[{"name": "vehicle_number", "label": "Vehicle Number", "type": "text", "required": true}, {"name": "new_address", "label": "New Address", "type": "text", "required": true}]'::jsonb, 
200, 15)
ON CONFLICT (code) DO NOTHING;

-- Revenue Services
INSERT INTO services (department_id, name, code, description, required_documents, form_schema, fee_amount, processing_days) VALUES
('d0000000-0000-0000-0000-000000000006', 'Income Certificate', 'rev_income_cert', 'For scholarships and subsidies', 
'["salary_slip_or_itr", "id_proof", "address_proof"]'::jsonb, 
'[{"name": "applicant_name", "label": "Applicant Name", "type": "text", "required": true}, {"name": "annual_income", "label": "Declared Annual Income", "type": "number", "required": true}, {"name": "purpose", "label": "Purpose", "type": "text", "required": true}]'::jsonb, 
30, 10),

('d0000000-0000-0000-0000-000000000006', 'Domicile Certificate', 'rev_domicile_cert', 'Proof of residence in state', 
'["residence_proof_5_years", "birth_certificate", "school_certificate"]'::jsonb, 
'[{"name": "applicant_name", "label": "Applicant Name", "type": "text", "required": true}, {"name": "years_of_residence", "label": "Years of Residence", "type": "number", "required": true}]'::jsonb, 
30, 15)
ON CONFLICT (code) DO NOTHING;
