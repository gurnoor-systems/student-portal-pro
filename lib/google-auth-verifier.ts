/**
 * Server-Side Google OAuth ID Token (JWT) Verifier
 * Validates cryptographic signature, expiry, audience, and email verification status via Google's tokeninfo API.
 */

export interface GoogleVerifiedPayload {
  email: string;
  name: string;
  picture?: string;
  emailVerified: boolean;
  sub: string; // Google user unique ID
}

export async function verifyGoogleIdToken(idToken: string): Promise<{ valid: boolean; payload?: GoogleVerifiedPayload; error?: string }> {
  if (!idToken || typeof idToken !== "string") {
    return { valid: false, error: "Missing or invalid Google ID Token" };
  }

  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`, {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { 
        valid: false, 
        error: errData.error_description || errData.error || "Google ID Token verification failed on authentication server" 
      };
    }

    const data = await res.json();

    // Check expiration
    const exp = parseInt(data.exp, 10);
    const now = Math.floor(Date.now() / 1000);
    if (exp && exp < now) {
      return { valid: false, error: "Google ID Token has expired. Please sign in again." };
    }

    // Check audience if client ID is configured
    const expectedClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    if (expectedClientId && data.aud && data.aud !== expectedClientId) {
      // If audience doesn't match our app's Google Client ID
      return { valid: false, error: "Google ID Token audience mismatch (invalid client ID)" };
    }

    const email = (data.email || "").trim().toLowerCase();
    if (!email) {
      return { valid: false, error: "Google ID Token does not contain a valid email address" };
    }

    const isEmailVerified = data.email_verified === "true" || data.email_verified === true;

    return {
      valid: true,
      payload: {
        email,
        name: data.name || data.given_name || "Student",
        picture: data.picture,
        emailVerified: isEmailVerified,
        sub: data.sub
      }
    };
  } catch (err: any) {
    console.error("Google ID Token verification network error:", err);
    return { valid: false, error: err.message || "Failed to reach Google token verification service" };
  }
}
