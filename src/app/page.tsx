// src/app/page.tsx
import "./landing.css";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getLandingStats } from "@/lib/data/get-landing-stats";
import { buildStats } from "@/components/landing/data/landing-content";
import { JourneyBackdrop } from "@/components/landing/primitives/journey-backdrop";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/sections/hero";
import { Philosophy } from "@/components/landing/sections/philosophy";
import { MindsetPipeline } from "@/components/landing/sections/mindset-pipeline";
import { Principles } from "@/components/landing/sections/principles";
import { LearningPaths } from "@/components/landing/sections/learning-paths";
import { RankingChamber } from "@/components/landing/sections/ranking-chamber";
import { StudentVoices } from "@/components/landing/sections/student-voices";
import { FeedbackConstellation } from "@/components/landing/sections/feedback-constellation";
import { FinalCta } from "@/components/landing/sections/final-cta";

export default async function Home() {
  const user = await getCurrentUser();

  if (user?.role === "instructor") {
    redirect("/instructor");
  }

  if (user?.role === "student") {
    redirect("/student");
  }

  if (user?.role === "super_admin") {
    redirect("/super_admin");
  }

  const stats = buildStats(await getLandingStats());

  return (
    <div className="nst-landing relative flex min-h-full flex-1 flex-col">
      <JourneyBackdrop />
      <Navbar />
      <main className="relative z-10 flex-1">
        <Hero stats={stats} />
        <Philosophy />
        <MindsetPipeline />
        <Principles />
        <LearningPaths />
        <RankingChamber />
        <StudentVoices />
        <FeedbackConstellation />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
