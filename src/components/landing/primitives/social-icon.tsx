import { Mail } from "lucide-react";
import { FaInstagram, FaTelegram, FaWhatsapp } from "react-icons/fa";
import type { SocialId } from "../data/landing-content";

const ICONS = {
    whatsapp: FaWhatsapp,
    telegram: FaTelegram,
    instagram: FaInstagram,
    email: Mail,
} as const;

export function SocialIcon({ id, className }: { id: SocialId; className?: string }) {
    const Icon = ICONS[id];
    return <Icon className={className} aria-hidden="true" />;
}
