"use client";

import { PasskeyCredential } from "@/lib/types";

/**
 * WebAuthn / Passkey Biometric Service
 * Hardware-backed authentication using Touch ID, Face ID, Windows Hello, and Android Biometrics.
 */

// Helper: Buffer to Base64URL string
export function bufferToBase64URL(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Helper: Base64URL string to Uint8Array
export function base64URLToBuffer(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export class PasskeyService {
  /**
   * Checks if browser & OS platform supports biometric passkeys (Touch ID, Face ID, Windows Hello)
   */
  static async isPasskeySupported(): Promise<boolean> {
    if (typeof window === "undefined" || !window.PublicKeyCredential) {
      return false;
    }
    try {
      if (PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
        return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Registers a new biometric passkey on the current device
   */
  static async registerPasskey(
    email: string,
    fullName: string,
    userId: string
  ): Promise<{
    credentialId: string;
    rawId: string;
    publicKey: string;
    deviceName: string;
  } | null> {
    if (typeof window === "undefined" || !navigator.credentials) {
      throw new Error("WebAuthn is not supported in this browser.");
    }

    // Generate random 32-byte cryptographic challenge
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userHandle = new TextEncoder().encode(userId);

    const creationOptions: CredentialCreationOptions = {
      publicKey: {
        challenge,
        rp: {
          name: "Student Portal Pro",
          id: window.location.hostname
        },
        user: {
          id: userHandle,
          name: email.toLowerCase(),
          displayName: fullName || "Student"
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 }, // ES256 (ECDSA w/ SHA-256)
          { type: "public-key", alg: -257 } // RS256 (RSA w/ SHA-256)
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform", // Face ID, Touch ID, Windows Hello
          userVerification: "preferred",
          residentKey: "preferred"
        },
        timeout: 60000,
        attestation: "none"
      }
    };

    try {
      const credential = (await navigator.credentials.create(creationOptions)) as PublicKeyCredential | null;
      if (!credential) {
        throw new Error("Passkey registration was cancelled by user.");
      }

      const rawId = bufferToBase64URL(credential.rawId);
      const response = credential.response as AuthenticatorAttestationResponse;
      const attestationObject = response.attestationObject ? bufferToBase64URL(response.attestationObject) : "";

      // Determine human-readable device name
      const ua = navigator.userAgent;
      let deviceName = "Passkey Authenticator";
      if (/iPhone|iPad/.test(ua)) deviceName = "Apple Face ID / Touch ID";
      else if (/Macintosh/.test(ua)) deviceName = "MacBook Touch ID";
      else if (/Windows/.test(ua)) deviceName = "Windows Hello Biometrics";
      else if (/Android/.test(ua)) deviceName = "Android Biometrics / Fingerprint";

      return {
        credentialId: credential.id,
        rawId,
        publicKey: attestationObject || rawId,
        deviceName
      };
    } catch (err: any) {
      console.error("Passkey registration error:", err);
      throw err;
    }
  }

  /**
   * Prompts user for biometric verification (Face ID / Fingerprint / Windows Hello)
   */
  static async authenticate(allowedCredentialIds?: string[]): Promise<{
    credentialId: string;
    authenticatorData: string;
    clientDataJSON: string;
    signature: string;
  } | null> {
    if (typeof window === "undefined" || !navigator.credentials) {
      throw new Error("WebAuthn is not supported in this browser.");
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const allowCredentials: PublicKeyCredentialDescriptor[] | undefined = allowedCredentialIds && allowedCredentialIds.length > 0
      ? allowedCredentialIds.map(id => ({
          id: base64URLToBuffer(id),
          type: "public-key" as const
        }))
      : undefined;

    const getOptions: CredentialRequestOptions = {
      publicKey: {
        challenge,
        rpId: window.location.hostname,
        allowCredentials,
        userVerification: "preferred",
        timeout: 60000
      }
    };

    try {
      const assertion = (await navigator.credentials.get(getOptions)) as PublicKeyCredential | null;
      if (!assertion) {
        throw new Error("Biometric verification cancelled.");
      }

      const response = assertion.response as AuthenticatorAssertionResponse;
      return {
        credentialId: assertion.id,
        authenticatorData: bufferToBase64URL(response.authenticatorData),
        clientDataJSON: bufferToBase64URL(response.clientDataJSON),
        signature: bufferToBase64URL(response.signature)
      };
    } catch (err: any) {
      console.error("Passkey authentication error:", err);
      throw err;
    }
  }
}
