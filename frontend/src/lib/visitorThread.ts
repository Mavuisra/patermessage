import { publicApi, type ThreadItem } from "../api/client";
import { getVisitor } from "./visitor";
import { getVisitorToken } from "./visitorAuth";

export type VisitorChatMsg = {
  id: string;
  text?: string;
  out: boolean;
  time: string;
  priority?: boolean;
  voiceUrl?: string;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function threadItemToLocalMsg(item: ThreadItem): VisitorChatMsg {
  const isVoice =
    !!item.voice_note_url ||
    (item.kind === "visitor" && item.body === "Message vocal");

  return {
    id: `${item.kind}-${item.id}`,
    out: item.kind === "visitor",
    time: formatTime(item.created_at),
    priority: item.is_priority,
    voiceUrl: item.voice_note_url || undefined,
    text: isVoice ? undefined : item.body,
  };
}

export async function fetchVisitorThread(): Promise<VisitorChatMsg[]> {
  const email = getVisitor().email.trim();
  if (!getVisitorToken() && !email) return [];
  const { items } = getVisitorToken()
    ? await publicApi.getThread()
    : await publicApi.getThread(email);
  return items.map(threadItemToLocalMsg);
}
