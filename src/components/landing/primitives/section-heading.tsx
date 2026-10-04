import { cn } from "@/lib/utils";

interface SectionHeadingProps {
    kicker: string;
    title: string;
    support?: string;
    align?: "left" | "center";
    className?: string;
    as?: "h1" | "h2" | "h3";
}

/** Shared kicker + headline + one-line support used by every landing section. */
export function SectionHeading({
    kicker,
    title,
    support,
    align = "left",
    className,
    as: Heading = "h2",
}: SectionHeadingProps) {
    return (
        <div className={cn(align === "center" && "mx-auto text-center", "max-w-2xl", className)}>
            <p className="font-technical text-xs font-medium tracking-[0.22em] text-gold-500 uppercase">
                {kicker}
            </p>
            <Heading className="mt-4 font-heading text-3xl font-extrabold leading-[1.1] tracking-tight text-balance text-starlight-100 sm:text-4xl md:text-5xl">
                {title}
            </Heading>
            {support && (
                <p className="mt-4 text-base text-balance text-starlight-300 sm:text-lg">{support}</p>
            )}
        </div>
    );
}
