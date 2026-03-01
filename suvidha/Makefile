# This Makefile provides the single-command developer workflow for JanSuvidha Phase 0 (docker-compose stack).

SHELL := /bin/sh

COMPOSE_FILE := infra/docker-compose.yml
ENV_FILE := infra/.env
ENV_EXAMPLE := infra/.env.example

.PHONY: dev stop migrate test

$(ENV_FILE):
	@echo "Creating $(ENV_FILE) from $(ENV_EXAMPLE)"
	@cp $(ENV_EXAMPLE) $(ENV_FILE)

dev: $(ENV_FILE)
	@docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) up --build

stop:
	@docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) down

migrate: $(ENV_FILE)
	@echo "Running init.sql against Postgres..."
	@docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) exec -T postgres psql -U $${POSTGRES_USER} -d $${POSTGRES_DB} -f /docker-entrypoint-initdb.d/init.sql

test:
	@echo "Placeholder: add integrated tests in Phase 1 (contract tests + smoke tests)."
	@echo "OK"

