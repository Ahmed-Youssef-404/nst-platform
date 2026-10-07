// src/components/boot/boot-gate.tsx
import "./boot.css";
import { InitialLoadingScreen } from "./initial-loading-screen";

/**
 * Runs synchronously while the HTML is still being parsed, before first paint.
 * The loader is only armed for the first entry to "/" in a browser session, so
 * returning visitors and every other route never see it (and never flash it).
 * If this script is blocked, the overlay simply stays hidden (CSS default).
 */
const ARM_SCRIPT = `(function(){try{if(location.pathname==="/"&&!sessionStorage.getItem("nst-boot")){document.documentElement.setAttribute("data-nst-boot","active")}}catch(e){}})();`;

export function BootGate() {
    return (
        <>
            <script dangerouslySetInnerHTML={{ __html: ARM_SCRIPT }} />
            <InitialLoadingScreen />
        </>
    );
}