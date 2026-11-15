/**
 * Checks whether the current browser environment supports a live WebGL2 context,
 * which MapLibre GL requires to initialize without throwing GPUInitializationError.
 */
export function isWebGL2Supported(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) return false;
    if (typeof gl.isContextLost === "function" && gl.isContextLost()) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
