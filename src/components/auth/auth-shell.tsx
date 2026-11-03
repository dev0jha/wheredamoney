import Image from "next/image";
import { cn } from "@/lib/utils";
import { CornerDecorations } from "@/components/ui/corner-decorations";
import BackBtn from "@/components/back-btn";
import { Logo } from "@/components/logo";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh w-full items-start justify-center overflow-x-hidden overflow-y-auto bg-background px-4 pb-12 pt-20 sm:items-center sm:px-6 sm:pb-8 sm:pt-14 lg:pt-6 selection:bg-primary selection:text-primary-foreground font-[family-name:var(--font-geist-mono)]">
      {/* Main Container: Auth Card and Authpage Image side-by-side */}
      <main className="relative mx-auto flex w-full max-w-7xl flex-1 items-center justify-center">
        <div className="grid w-full grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-14">
          {/* Auth Card Column */}
          <div className="flex w-full items-center justify-center lg:justify-end">
            <div className="flex w-full max-w-[430px] flex-col gap-3.5">
              {/* Back Button positioned directly above the card */}
              <div>
                <BackBtn />
              </div>

              <div className="relative w-full">
                {/* Corner Accents */}
                <CornerDecorations />

                <div
                  className={cn(
                    "relative border-2 border-border/50 p-6 sm:p-8",
                    "transition-all duration-200"
                  )}
                >
                <div>
                  {/* Brand Logo Header */}
                  <div className="mb-5 flex items-center gap-2">
                    <Logo />
                  </div>

                  {title ? (
                    <div className="mb-4 space-y-1">
                      <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        {title}
                      </h1>
                      {description ? (
                        <p className="text-sm text-muted-foreground">{description}</p>
                      ) : null}
                    </div>
                  ) : null}

                  {children}

                  {footer ? (
                    <div className="mt-4 text-center text-xs text-muted-foreground">
                      {footer}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

          {/* Right Column: authpage Illustration */}
          <div className="relative hidden w-full items-center justify-center lg:flex lg:justify-start">
            <div className="relative h-[620px] w-full max-w-xl xl:h-[720px] xl:max-w-2xl">
              <div className="relative h-full w-full">
                <Image
                  src="/authpage-faded.png"
                  alt="WhereDaMoney Auth Illustration"
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              {/* Deep Bottom fade into background */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-background from-30% via-background/85 to-transparent" />

              {/* Right edge fade into background */}
              <div className="pointer-events-none absolute inset-y-0 right-0 w-44 bg-gradient-to-l from-background from-20% via-background/80 to-transparent" />

              {/* Bottom-right corner blend */}
              <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 bg-[radial-gradient(circle_at_bottom_right,var(--background)_35%,transparent_75%)]" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AuthShell;
