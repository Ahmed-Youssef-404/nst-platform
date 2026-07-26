// src/components/landing/contact.tsx
import { Reveal } from "@/components/reveal";
import { MessageCircle, Mail, Phone } from "lucide-react";

// Placeholder hrefs — swap for the real Discord invite, mailto, and
// WhatsApp link once the client provides them.
const CHANNELS = [
    { icon: MessageCircle, label: "Discord", href: "#" },
    { icon: Mail, label: "Email", href: "#" },
    { icon: Phone, label: "WhatsApp", href: "#" },
];

export function Contact() {
    return (
        <section id="contact" className="mx-auto max-w-4xl px-6 py-28">
            <Reveal>
                <div className="mx-auto max-w-3xl text-center">
                    <span className="text-sm font-medium tracking-wide text-primary uppercase">
                        Contact Us
                    </span>
                    <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                        Let&apos;s Connect
                    </h2>
                    <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                        Have a question? Need help? Want to join our community? Feel
                        free to reach out through any of our social platforms. Whether
                        you&apos;re just starting your programming journey or looking to
                        grow your skills, we&apos;re always happy to help.
                    </p>
                </div>
            </Reveal>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
                {CHANNELS.map((channel, i) => (
                    <Reveal key={channel.label} delay={i * 100}>
                        <a
                            href={channel.href}
                            className="flex items-center gap-2.5 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                        >
                            <channel.icon className="size-4.5" />
                            {channel.label}
                        </a>
                    </Reveal>
                ))}
            </div>
        </section>
    );
}