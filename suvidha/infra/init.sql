-- This SQL initializes the Phase 1 JanSuvidha core schema by applying the 001_core migration.
\i '/docker-entrypoint-initdb.d/migrations/001_core.sql'
\i '/docker-entrypoint-initdb.d/migrations/002_phase2.sql'
\i '/docker-entrypoint-initdb.d/migrations/003_suvidha_spec.sql'

