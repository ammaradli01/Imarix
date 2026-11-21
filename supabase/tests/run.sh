#!/usr/bin/env bash
# Jalankan ujian pangkalan data pada kluster PostgreSQL 16 sementara.
set -euo pipefail
cd "$(dirname "$0")/.."
PGBIN=${PGBIN:-/usr/lib/postgresql/16/bin}
DIR=$(mktemp -d); PORT=${PORT:-54329}
trap '"$PGBIN/pg_ctl" -D "$DIR" stop -m fast >/dev/null 2>&1 || true; rm -rf "$DIR"' EXIT
"$PGBIN/initdb" -D "$DIR" -U postgres >/dev/null
"$PGBIN/pg_ctl" -D "$DIR" -o "-p $PORT -k $DIR -c listen_addresses=''" -l "$DIR/log" start >/dev/null
PSQL="psql -h $DIR -p $PORT -U postgres -v ON_ERROR_STOP=1 -q"
$PSQL -c "create database t" 
$PSQL -d t -f tests/00_auth_stub.sql
for f in migrations/*.sql; do $PSQL -d t -f "$f"; done
$PSQL -d t -f tests/10_rls_test.sql
