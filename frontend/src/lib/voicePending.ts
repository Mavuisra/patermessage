const KEY = "bp_pending_voice";

export async function stashVoiceBlob(blob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      sessionStorage.setItem(KEY, reader.result as string);
      resolve();
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function takeVoiceBlob(): Blob | null {
  const data = sessionStorage.getItem(KEY);
  sessionStorage.removeItem(KEY);
  if (!data || !data.includes(",")) return null;
  const [meta, b64] = data.split(",");
  const mime = meta.match(/:(.*?);/)?.[1] || "audio/webm";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export function clearPendingVoice(): void {
  sessionStorage.removeItem(KEY);
}
