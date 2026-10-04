// Canvas drawing can't read Tailwind classes, so it reads the NST design
// tokens straight from the document and re-reads them when the theme flips.

export interface CanvasPalette {
    /** "r, g, b" of the star/ink colour (--starlight-100). */
    star: string;
    /** "r, g, b" of the accent (--gold-500). */
    gold: string;
    /** Dark theme draws bright points on black; light draws ink points on white. */
    isDark: boolean;
}

function hexToRgb(hex: string, fallback: string): string {
    const clean = hex.trim().replace("#", "");
    if (clean.length !== 6) return fallback;
    const value = parseInt(clean, 16);
    if (Number.isNaN(value)) return fallback;
    return `${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}`;
}

export function readPalette(): CanvasPalette {
    const root = document.documentElement;
    const styles = getComputedStyle(root);
    return {
        star: hexToRgb(styles.getPropertyValue("--starlight-100"), "247, 244, 237"),
        gold: hexToRgb(styles.getPropertyValue("--gold-500"), "232, 184, 74"),
        isDark: root.classList.contains("dark"),
    };
}

/** Calls `onChange` whenever next-themes toggles the `dark` class. Returns an unsubscribe. */
export function watchTheme(onChange: () => void): () => void {
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
}
