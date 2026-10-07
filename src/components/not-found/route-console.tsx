"use client";

import { usePathname } from "next/navigation";

const MAX_PATH_LENGTH = 48;

function shortenPath(path: string) {
    return path.length > MAX_PATH_LENGTH ? `${path.slice(0, MAX_PATH_LENGTH - 1)}…` : path;
}

/**
 * Quiet instrument readout under the message. This is real text (not
 * decorative): it names the path that failed and the status of each stage.
 */
export function RouteConsole() {
    const pathname = usePathname() || "/";
    const path = shortenPath(pathname);

    return (
        <div className="nf-console mx-auto w-full max-w-md rounded-xl px-4 py-3 text-left font-technical text-[11px] leading-relaxed tracking-[0.14em] text-starlight-300 uppercase sm:text-xs">
            <p className="flex items-baseline gap-2 text-starlight-200">
                <span className="shrink-0 text-gold-500">GET</span>
                <span className="min-w-0 break-all normal-case tracking-normal" title={pathname}>
                    {path}
                </span>
            </p>
            <p className="mt-0.5 text-gold-500">→ 404 NOT FOUND</p>
            <dl className="mt-2.5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 border-t border-border-subtle pt-2.5">
                <dt className="text-starlight-400">Packet</dt>
                <dd>Lost</dd>
                <dt className="text-starlight-400">Route</dt>
                <dd>Failed</dd>
                <dt className="text-starlight-400">Navigation</dt>
                <dd>
                    Recalculating...<span className="nf-cursor" aria-hidden="true" />
                </dd>
            </dl>
        </div>
    );
}
