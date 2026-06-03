import {
  BadgeCheck,
  Bell,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Eye,
  EyeOff,
  Info,
  Lock,
  Mic,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Pause,
  Play,
  Plus,
  Search,
  Trash2,
  Send,
  Shield,
  Smartphone,
  Sparkles,
  Square,
  Star,
  User,
  Wallet,
  X,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

export type IconName =
  | "back"
  | "chevron-right"
  | "menu"
  | "verified"
  | "lock"
  | "mic"
  | "search"
  | "star"
  | "star-filled"
  | "message"
  | "card"
  | "user"
  | "send"
  | "shield"
  | "bell"
  | "check"
  | "check-double"
  | "info"
  | "sparkles"
  | "stop"
  | "phone"
  | "plus"
  | "play"
  | "pause"
  | "trash"
  | "eye"
  | "eye-off"
  | "close"
  | "install"
  | "wallet";

const MAP: Record<IconName, LucideIcon> = {
  back: ChevronLeft,
  "chevron-right": ChevronRight,
  menu: MoreHorizontal,
  verified: BadgeCheck,
  lock: Lock,
  mic: Mic,
  search: Search,
  star: Star,
  "star-filled": Star,
  message: MessageCircle,
  card: CreditCard,
  user: User,
  send: Send,
  shield: Shield,
  bell: Bell,
  check: Check,
  "check-double": CheckCheck,
  info: Info,
  sparkles: Sparkles,
  stop: Square,
  phone: Phone,
  plus: Plus,
  play: Play,
  pause: Pause,
  trash: Trash2,
  eye: Eye,
  "eye-off": EyeOff,
  close: X,
  install: Smartphone,
  wallet: Wallet,
};

export interface IconProps extends Omit<LucideProps, "ref"> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 22, strokeWidth = 2, className = "", ...props }: IconProps) {
  const Cmp = MAP[name];
  return (
    <Cmp
      size={size}
      strokeWidth={strokeWidth}
      className={`wa-icon ${className}`.trim()}
      aria-hidden={props["aria-label"] ? undefined : true}
      {...props}
    />
  );
}
