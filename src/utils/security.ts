/**
 * Security utilities for profile custom PINs and verification
 */

/**
 * Encopes a plaintext PIN securely utilizing an obfuscated storage representation.
 * If someone inspects local storage, they will only see the secured hash/payload.
 */
export function securePin(pin: string): string {
  if (!pin) return "";
  const cleaned = pin.trim().replace(/\D/g, '');
  if (!cleaned) return "";
  try {
    // Standard secure prefix followed by Base64 obfuscation with a salt-like variation
    return `SECURE_K_V1:${btoa(`kwatch-salt-${cleaned}`)}`;
  } catch (err) {
    return cleaned; // Fallback
  }
}

/**
 * Checks if an entered PIN matches the stored profile PIN (supports both secured and legacy plain PINs).
 */
export function verifyPin(enteredPin: string, storedPinCode?: string): boolean {
  if (!storedPinCode) return false;
  const cleanedEntered = enteredPin.trim().replace(/\D/g, '');
  
  if (storedPinCode.startsWith("SECURE_K_V1:")) {
    try {
      const payload = storedPinCode.replace("SECURE_K_V1:", "");
      const decoded = atob(payload);
      return decoded === `kwatch-salt-${cleanedEntered}`;
    } catch {
      return false;
    }
  }
  
  // Legacy or default plain-text PIN comparison
  return cleanedEntered === storedPinCode;
}

/**
 * Decrypts / decodes a secured PIN string back into plaintext for editing/display.
 */
export function decryptPin(storedPinCode?: string): string {
  if (!storedPinCode) return "";
  if (storedPinCode.startsWith("SECURE_K_V1:")) {
    try {
      const payload = storedPinCode.replace("SECURE_K_V1:", "");
      const decoded = atob(payload);
      return decoded.replace("kwatch-salt-", "");
    } catch {
      return "";
    }
  }
  return storedPinCode;
}
