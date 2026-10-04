import { Constellation } from "@/components/constellation";
import { FOOTER_COPY, NAV_LINKS, SOCIAL_LINKS } from "./data/landing-content";
import { SocialIcon } from "./primitives/social-icon";

export function Footer() {
    const channels = SOCIAL_LINKS.filter((link) => link.href);

    return (
        <footer className="relative z-10 overflow-hidden border-t border-[color:var(--border-subtle)]">
            <div className="mx-auto max-w-6xl px-6 pt-14 pb-10">
                <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <span className="flex size-9 items-center justify-center rounded-xl bg-gold-500 font-technical text-base font-bold text-space-950">
                                N
                            </span>
                            <span className="font-heading text-lg font-extrabold text-starlight-100">Northern Stars Team</span>
                        </div>
                        <p className="mt-4 max-w-xs text-sm text-balance text-starlight-300">{FOOTER_COPY.statement}</p>
                        <Constellation variant="divider" className="mt-6 -ml-1" />
                    </div>

                    <nav aria-label="Footer">
                        <p className="font-technical text-xs tracking-[0.2em] text-starlight-400 uppercase">Explore</p>
                        <ul className="mt-4 space-y-2.5">
                            {NAV_LINKS.map((link) => (
                                <li key={link.id}>
                                    <a href={`#${link.id}`} className="text-sm text-starlight-200 transition-colors hover:text-gold-500">
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div>
                        <p className="font-technical text-xs tracking-[0.2em] text-starlight-400 uppercase">Contact</p>
                        <ul className="mt-4 space-y-2.5">
                            {channels.map((channel) => (
                                <li key={channel.id}>
                                    <a
                                        href={channel.href}
                                        target={channel.id === "email" ? undefined : "_blank"}
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2.5 text-sm text-starlight-200 transition-colors hover:text-gold-500"
                                    >
                                        <SocialIcon id={channel.id} className="size-4" />
                                        {channel.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <p className="mt-12 text-xs text-starlight-400">
                    &copy; {new Date().getFullYear()} NST Platform. All rights reserved.
                </p>
            </div>

            <p
                aria-hidden="true"
                className="pointer-events-none -mb-[0.22em] text-center font-heading text-[26vw] leading-none font-extrabold tracking-tighter text-transparent select-none [-webkit-text-stroke:1px_var(--border-default)] opacity-60"
            >
                NST
            </p>
        </footer>
    );
}
