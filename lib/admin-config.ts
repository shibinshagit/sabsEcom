// Admin Security Configuration
export const ADMIN_CONFIG = {
  // Secret access key - change this to your own secret
  SECRET_ACCESS_KEY: process.env.ADMIN_SECRET_KEY || "sabs-admin-2025-secure",
  
  // Admin registration settings
  REGISTRATION_ENABLED: process.env.ADMIN_REGISTRATION_ENABLED === "true" || false,
  REQUIRE_INVITATION: process.env.ADMIN_REQUIRE_INVITATION === "true" || true,
  
  // Maximum number of admin users allowed
  MAX_ADMIN_USERS: parseInt(process.env.MAX_ADMIN_USERS || "5"),
  
  // Super admin email (first admin who can approve others)
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL || "spidewolx@gmail.com"
}

// Check if admin access is allowed
export function isValidAdminAccess(secretKey?: string): boolean {
  if (!secretKey) return false
  return secretKey === ADMIN_CONFIG.SECRET_ACCESS_KEY
}

// Check if registration is allowed
export async function canRegisterAdmin(): Promise<{ allowed: boolean; reason?: string }> {
  if (!ADMIN_CONFIG.REGISTRATION_ENABLED) {
    return { allowed: false, reason: "Admin registration is disabled" }
  }
  
  // Check max admin limit (you'll need to implement this check in your registration API)
  return { allowed: true }
}
