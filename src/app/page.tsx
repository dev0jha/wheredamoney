import { Header } from "@/components/header";
import { BanknoteIcon } from "@/components/ui/banknote-icon";

export default function Home() {
  return (
    <div className="relative flex min-h-dvh flex-col bg-background selection:bg-primary selection:text-primary-foreground">
      {/* Ambient Top Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-primary/8 via-primary/2 to-transparent blur-3xl"
      />

      {/* Header */}
      <Header />

      <main className="relative flex flex-1 flex-col items-center justify-center">
        {/* Hero Section */}
        <section id="about" className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 pb-24 pt-16 text-center sm:pt-20 lg:pb-32 lg:pt-24">
          <div className="max-w-4xl space-y-6">
            <h1 className="font-cooper text-5xl leading-[0.98] tracking-[-0.045em] text-foreground text-balance sm:text-6xl lg:text-8xl">
              Know{" "}
              <span className="relative inline-block">
                <span className="pointer-events-none absolute -top-[11px] right-[-24px] -rotate-[12deg] select-none sm:-top-[15px] sm:right-[-32px] sm:-rotate-[14deg] lg:-top-[18px] lg:right-[-42px]">
                  <BanknoteIcon className="h-10 w-14 sm:h-14 sm:w-20 lg:h-18 lg:w-24 drop-shadow-sm" />
                </span>
                where
              </span>{" "}
              every rupee goes.
            </h1>
          </div>
        </section>
      </main>
    </div>
  );
}
