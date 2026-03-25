# Legal Documents Management Guide

Created: 2025-12-22
Last updated: 2025-12-22

This guide explains how to manage the Terms of Service and Privacy Policy documents in the application.

## Overview

Legal documents are managed through two components:

1. **PDF files** - stored in `public/legal/` folder (served directly by the web server)
2. **Database metadata** - stored in `legal_documents` table (tracks versions, file paths, and settings)

## Database Structure

The `legal_documents` table contains:

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `document_type` | text | Either `'terms'` or `'privacy'` |
| `version` | text | Semantic version (e.g., `'1.0'`, `'1.1'`, `'2.0'`) |
| `last_updated` | date | Date the document was last updated |
| `file_path` | text | Path relative to `public/` folder |
| `is_active` | boolean | Only active documents are shown to users |
| `requires_acceptance` | boolean | If true, users must accept before using the app |

## File Naming Convention

Use this pattern for PDF files:

```
ai_global_experts_{document_type}_v{version}_{date}.pdf
```

Examples:
- `ai_global_experts_terms_of_service_v1.0_2025-12-22.pdf`
- `ai_global_experts_privacy_policy_v1.1_2026-01-15.pdf`

## Common Operations

### Adding a New Document Version

**Step 1:** Add the new PDF file to `public/legal/`

**Step 2:** Deactivate the old version and insert the new one:

```sql
-- Deactivate old terms version
UPDATE legal_documents
SET is_active = false
WHERE document_type = 'terms' AND is_active = true;

-- Insert new terms version
INSERT INTO legal_documents (
  document_type,
  version,
  last_updated,
  file_path,
  is_active,
  requires_acceptance
)
VALUES (
  'terms',
  '1.1',
  '2026-01-15',
  'legal/ai_global_experts_terms_of_service_v1.1_2026-01-15.pdf',
  true,
  false
);
```

For privacy policy, replace `'terms'` with `'privacy'` and update the file path accordingly.

### Requiring User Acceptance

To require all users to accept the current legal documents before using the app:

```sql
UPDATE legal_documents
SET requires_acceptance = true
WHERE is_active = true;
```

To disable mandatory acceptance (show dismissible banner instead):

```sql
UPDATE legal_documents
SET requires_acceptance = false
WHERE is_active = true;
```

### Viewing Current Active Documents

```sql
SELECT document_type, version, last_updated, file_path, requires_acceptance
FROM legal_documents
WHERE is_active = true;
```

### Viewing Document History

```sql
SELECT document_type, version, last_updated, is_active, created_at
FROM legal_documents
ORDER BY document_type, created_at DESC;
```

### Checking User Acceptance Status

To see which users have accepted terms:

```sql
SELECT
  u.email,
  a.terms_version_string,
  a.privacy_version_string,
  a.agreed_at
FROM user_terms_agreements a
JOIN auth.users u ON u.id = a.user_id
ORDER BY a.agreed_at DESC;
```

To find users who haven't accepted the latest version:

```sql
WITH latest_docs AS (
  SELECT document_type, version
  FROM legal_documents
  WHERE is_active = true
)
SELECT DISTINCT u.email, u.id
FROM auth.users u
LEFT JOIN user_terms_agreements a ON u.id = a.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM user_terms_agreements ua
  WHERE ua.user_id = u.id
  AND ua.terms_version_string = (SELECT version FROM latest_docs WHERE document_type = 'terms')
  AND ua.privacy_version_string = (SELECT version FROM latest_docs WHERE document_type = 'privacy')
);
```

## User Experience Behavior

### Non-Blocking Mode (`requires_acceptance = false`)

- Users see a dismissible banner at the top of the app
- Banner informs them of updated terms/privacy policy
- Links to view the full documents
- Can be dismissed without accepting
- Acceptance is recorded when user clicks "Accept"

### Blocking Mode (`requires_acceptance = true`)

- Users see a full-screen modal
- Cannot interact with the app until accepting
- Must check agreement checkbox and click accept
- Recommended only for significant legal changes

## Version Comparison Logic

The app compares semantic versions to determine if users need to accept new terms:

- `1.0` < `1.1` < `2.0`
- Users who accepted `1.0` will be prompted when `1.1` becomes active
- Version comparison handles multi-part versions (e.g., `1.0.1`)

## Rollback Procedure

If you need to revert to a previous document version:

```sql
-- Deactivate current version
UPDATE legal_documents
SET is_active = false
WHERE document_type = 'terms' AND version = '1.1';

-- Reactivate previous version
UPDATE legal_documents
SET is_active = true
WHERE document_type = 'terms' AND version = '1.0';
```

## Best Practices

1. **Keep old PDFs** - Don't delete old PDF files; users may have bookmarked them or need to reference what they agreed to

2. **Use meaningful versions** - Increment minor version for small changes, major version for significant rewrites

3. **Test locally first** - Verify the PDF displays correctly before updating the database

4. **Coordinate updates** - Update both terms and privacy together if they reference each other

5. **Notify users** - Consider email notification for significant changes before requiring acceptance

6. **Audit trail** - The `user_terms_agreements` table maintains a complete history of all user acceptances
