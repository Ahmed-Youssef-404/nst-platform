// src/components/boot/boot-gate.tsx
import "./boot.css";
import { InitialLoadingScreen } from "./initial-loading-screen";

/**
 * Runs synchronously while the HTML is still being parsed, before first paint.
 * The loader is armed for every full document entry to "/" — including refreshes
 * and reopening the site — regardless of authentication/session state.
 *
 * Client-side navigation does not re-run this script, so navigating around the
 * app will not replay the boot experience.
 */
const ARM_SCRIPT = `(function(){try{if(location.pathname==="/"){document.documentElement.setAttribute("data-nst-boot","active")}}catch(e){}})();`;

export function BootGate() {
    return (
        <>
            <script dangerouslySetInnerHTML={{ __html: ARM_SCRIPT }} />
            <InitialLoadingScreen />
        </>
    );
}