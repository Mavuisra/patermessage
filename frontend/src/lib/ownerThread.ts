import { ownerApi, type InboundMessage, type ThreadItem } from "../api/client";

export type OwnerChatMsg = {
  id: string;
  text?: string;
  out: boolean;
  time: string;
  priority?: boolean;
  voiceUrl?: string;
  inboundId?: number;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function threadItemToOwnerMsg(item: ThreadItem): OwnerChatMsg {
  const isVoice =
    !!item.voice_note_url ||
    (item.kind === "visitor" && item.body === "Message vocal");

  return {
    id: `${item.kind}-${item.id}`,
    out: item.kind === "owner",
    time: formatTime(item.created_at),
    priority: item.is_priority,
    voiceUrl: item.voice_note_url || undefined,
    text: isVoice ? undefined : item.body,
    inboundId: item.kind === "visitor" ? item.id : undefined,
  };
}

export async function fetchOwnerThread(email: string): Promise<OwnerChatMsg[]> {
  const { items } = await ownerApi.getVisitorThread(email);
  return items.map(threadItemToOwnerMsg);
}

export function latestInboundMessageId(messages: OwnerChatMsg[]): number | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].inboundId != null) return messages[i].inboundId!;
  }
  return null;
}

export async function fetchVisitorSummary(
  email: string
): Promise<InboundMessage | null> {
  const res = await ownerApi.getMessages({ search: email });
  const key = email.trim().toLowerCase();
  return (
    res.results.find((m) => m.sender_email.trim().toLowerCase() === key) ?? null
  );
}
