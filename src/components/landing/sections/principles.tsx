import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/utils";
import { EFFORT_COPY, FOLLOW_UP_COPY, FOUNDATION_COPY } from "../data/landing-content";
import { SectionHeading } from "../primitives/section-heading";
import { EffortGrowth } from "./effort-growth";
import { FollowUpOrbit } from "./follow-up-orbit";
import { FoundationStack } from "./foundation-stack";

interface StationProps {
    kicker: string;
    title: string;
    support: string;
    flip?: boolean;
    children: React.ReactNode;
}

function Station({ kicker, title, support, flip, children }: StationProps) {
    return (
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
            <Reveal className={cn(flip && "md:order-2")}>
                <SectionHeading kicker={kicker} title={title} support={support} as="h3" />
            </Reveal>
            <Reveal delay={150} direction={flip ? "right" : "left"} className={cn(flip && "md:order-1")}>
                {children}
            </Reveal>
        </div>
    );
}

/** The three supporting ideas after the pipeline: follow-up, foundations, genuine effort. */
export function Principles() {
    return (
        <section aria-label="How NST works" className="relative mx-auto max-w-6xl space-y-28 px-6 py-24 sm:space-y-36">
            <Station kicker={FOLLOW_UP_COPY.kicker} title={FOLLOW_UP_COPY.headline} support={FOLLOW_UP_COPY.support}>
                <FollowUpOrbit />
            </Station>

            <Station kicker={FOUNDATION_COPY.kicker} title={FOUNDATION_COPY.headline} support={FOUNDATION_COPY.support} flip>
                <FoundationStack />
            </Station>

            <div>
                <Reveal>
                    <SectionHeading
                        kicker={EFFORT_COPY.kicker}
                        title={EFFORT_COPY.headline}
                        support={EFFORT_COPY.support}
                        as="h3"
                    />
                </Reveal>
                <Reveal delay={150} className="mt-12">
                    <EffortGrowth />
                </Reveal>
            </div>
        </section>
    );
}
