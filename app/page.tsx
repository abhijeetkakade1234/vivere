"use client";

import { OccasionCard } from "@/components/occasion-card";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { APP_COPY, OCCASIONS } from "@/lib/app-config";

export default function HomePage() {
  const { canInstall, install } = useInstallPrompt();

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">{APP_COPY.eyebrow}</p>
        <h1>{APP_COPY.title}</h1>
        <p className="lede">{APP_COPY.subtitle}</p>

        <div className="hero-actions">
          <a className="primary-action" href="#moments">
            Start with a moment
          </a>
          {canInstall ? (
            <button className="secondary-action" onClick={install} type="button">
              Install the app
            </button>
          ) : null}
        </div>
      </section>

      <section aria-labelledby="moments-heading" className="moments" id="moments">
        <div className="section-copy">
          <p className="section-kicker">Occasions</p>
          <h2 id="moments-heading">What is happening today?</h2>
          <p>
            The first build keeps the front door simple: pick a moment, answer a short intake, then
            let the API turn it into a plan.
          </p>
        </div>

        <div className="occasion-grid">
          {OCCASIONS.map((occasion) => (
            <OccasionCard key={occasion.slug} occasion={occasion} />
          ))}
        </div>
      </section>
    </main>
  );
}
