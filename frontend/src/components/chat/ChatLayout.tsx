import type { ReactNode } from "react";

interface ChatLayoutProps {
  header: ReactNode;
  messages: ReactNode;
  chips?: ReactNode;
  footer?: ReactNode;
  modeTabs?: ReactNode;
}

export function ChatLayout({ header, messages, chips, footer, modeTabs }: ChatLayoutProps) {
  return (
    <div className="chat-app">
      <div className="chat-wallpaper" aria-hidden />
      {header}
      {modeTabs}
      <div className="chat-body">{messages}</div>
      {chips}
      {footer}
    </div>
  );
}
