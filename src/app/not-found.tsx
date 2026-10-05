import type { Metadata } from "next";
import "./not-found.css";
import { NotFoundView } from "@/components/not-found/not-found-view";

export const metadata: Metadata = {
  title: "404 — Route Drifted into Uncharted Space | NST Platform",
  description:
    "The requested destination could not be resolved in the NST universe. Signal packet timed out along an unmapped celestial vector.",
};

export default function NotFound() {
  return <NotFoundView />;
}
