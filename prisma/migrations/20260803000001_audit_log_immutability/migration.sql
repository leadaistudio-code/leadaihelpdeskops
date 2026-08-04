-- Enforce append-only on the audit log at the database level.
--
-- "Append-only" was previously a comment in schema.prisma and a convention in
-- src/lib/audit.ts (which only ever calls `create`). Neither stops anyone
-- holding DATABASE_URL from rewriting history, which is exactly the scenario an
-- auditor asks about. The application-side hash chain makes tampering
-- *detectable*; this trigger makes it *fail*.
--
-- Deletes are refused outright rather than allowed-with-a-gap, because a gap in
-- a hash-chained log is indistinguishable from tampering and destroys the
-- verifiability of everything after it.
--
-- Retention, when it is implemented, must therefore drop whole partitions or
-- run as a superuser with the trigger explicitly disabled and the action itself
-- recorded — not by deleting individual rows.

CREATE OR REPLACE FUNCTION audit_log_is_append_only()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'AuditLog is append-only: % is not permitted', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_no_update ON "AuditLog";
CREATE TRIGGER audit_log_no_update
  BEFORE UPDATE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION audit_log_is_append_only();

DROP TRIGGER IF EXISTS audit_log_no_delete ON "AuditLog";
CREATE TRIGGER audit_log_no_delete
  BEFORE DELETE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION audit_log_is_append_only();
