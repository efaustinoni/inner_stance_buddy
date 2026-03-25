# Security Configuration Guide

Last Updated: 2026-02-13

This guide explains how to configure security features for the AI Global Experts platform.

## Table of Contents

- [Leaked Password Protection](#leaked-password-protection)
- [Security Best Practices](#security-best-practices)
- [Monitoring and Maintenance](#monitoring-and-maintenance)

## Leaked Password Protection

### Overview

Supabase Auth integrates with [HaveIBeenPwned.org](https://haveibeenpwned.com/) to automatically reject passwords that have been compromised in data breaches. This feature significantly enhances account security by preventing users from using passwords that are known to malicious actors.

### Why This Matters

- Over 11 billion passwords have been exposed in data breaches
- Attackers use these leaked password databases to compromise accounts
- Users often reuse passwords across multiple sites
- Enabling this protection helps prevent account takeovers

### How to Enable

**Important:** This feature requires a Supabase Pro Plan or higher (not available on the free tier).

#### Step 1: Access Supabase Dashboard

1. Log in to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project

#### Step 2: Navigate to Authentication Settings

1. Click on **Authentication** in the left sidebar
2. Click on **Configuration**
3. Navigate to the **Password Protection** section

#### Step 3: Enable the Feature

1. Toggle on **"Enable leaked password protection"**
2. Save your changes

### How It Works

Once enabled, the system automatically:

1. Checks all new passwords during sign-up against the HaveIBeenPwned database
2. Validates password changes for existing users
3. Uses a k-anonymity model to protect privacy (your actual password is never sent to HaveIBeenPwned)
4. Returns a clear error message if a leaked password is detected

### Error Handling

When a user attempts to use a compromised password, they will receive an error:

```json
{
  "message": "Password has been leaked",
  "status": 422
}
```

Your application should handle this error gracefully and prompt users to choose a different password.

### Privacy Considerations

The HaveIBeenPwned integration uses a **k-anonymity model**:

- Only the first 5 characters of the password hash are sent to the API
- The full password hash never leaves your system
- HaveIBeenPwned cannot determine the actual password being checked
- This approach is recommended by security experts worldwide

### Implementation in Application

No code changes are required in your application. Once enabled at the project level, this protection automatically applies to:

- `supabase.auth.signUp()` - Sign-up operations
- `supabase.auth.updateUser()` - Password update operations
- Password reset flows

### Testing the Feature

To verify the feature is working:

1. Try signing up with a known compromised password (e.g., "password123")
2. You should receive a "Password has been leaked" error
3. Try a strong, unique password - sign-up should succeed

### Cost Considerations

- This feature is included in the Supabase Pro Plan and higher
- There are no additional per-request charges
- The HaveIBeenPwned API is free to use
- Consider this essential security investment for production applications

## Security Best Practices

### Password Requirements

Even with leaked password protection enabled, enforce these requirements:

- Minimum 8 characters (current application setting)
- Mix of uppercase, lowercase, numbers, and special characters recommended
- Avoid common words or patterns
- Don't reuse passwords across services

### Additional Security Measures

Current implementation includes:

1. **Security Questions** - Used for account recovery
   - Answers are hashed using SHA-256
   - Case-insensitive comparison
   - Configurable per user

2. **Row Level Security (RLS)** - All database tables have RLS enabled
   - Users can only access their own data
   - Policies enforce authentication requirements
   - Regular audits of RLS policies

3. **Account Deletion Protection** - 30-day grace period
   - Soft delete with recovery option
   - Automatic permanent deletion after retention period
   - User confirmation required

4. **Session Management**
   - Automatic session timeout
   - Secure token storage
   - Session refresh handling

### Recommended Dashboard Settings

In addition to leaked password protection, configure:

1. **Authentication → Settings**
   - Enable email confirmation for production
   - Set appropriate session timeout values
   - Configure password requirements

2. **API Settings**
   - Restrict API keys to specific domains
   - Use environment variables for all secrets
   - Rotate service role keys regularly

3. **Database**
   - Regular backups enabled
   - Point-in-time recovery configured
   - Connection pooling optimized

## Monitoring and Maintenance

### Security Audits

Perform regular security audits:

- **Weekly**: Review authentication logs
- **Monthly**: Audit RLS policies
- **Quarterly**: Review user permissions and access patterns
- **Annually**: Full security assessment

### Database Index Optimization

The application automatically monitors and optimizes database indexes:

- Unused indexes are identified and removed
- Query performance is tracked
- Indexes are re-added when tables grow and query patterns justify them

Recent optimization (2026-02-13):
- Removed unused index `idx_user_terms_agreements_user_id`
- Will monitor and re-evaluate as table grows beyond 1000 rows

### Keeping Dependencies Updated

Regularly update:

- `@supabase/supabase-js` client library
- React and related dependencies
- Security patches as released

### Incident Response

If a security incident occurs:

1. Immediately rotate all API keys
2. Review authentication logs
3. Force password reset for affected users
4. Update security policies as needed
5. Document incident and response

## Support and Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Password Security Best Practices](https://supabase.com/docs/guides/auth/password-security)
- [HaveIBeenPwned API](https://haveibeenpwned.com/API/v3)
- [OWASP Authentication Guidelines](https://owasp.org/www-project-authentication-cheat-sheet/)

## Changelog

### 2026-02-13
- Initial security configuration guide created
- Documented leaked password protection setup
- Added database optimization notes
- Included security best practices

---

For questions or security concerns, please refer to the project's security policy or contact the development team.
