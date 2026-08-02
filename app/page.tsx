"use client";

import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { APP_COPY, OCCASIONS } from "@/lib/app-config";

export default function HomePage() {
  const { canInstall, install } = useInstallPrompt();

  return (
    <main className="landing-shell">
      <section className="landing-hero">
        <p className="eyebrow">{APP_COPY.eyebrow}</p>
        <h1 className="landing-title">{APP_COPY.title}</h1>
        <p className="landing-copy">{APP_COPY.subtitle}</p>
        <p className="landing-copy">
          Start at the landing page, step into login later, then enter the planner as a chat-style
          app.
        </p>

        <div className="landing-actions">
          <a className="primary-action" href="/login">
            Start planning
          </a>
          {canInstall ? (
            <button className="secondary-action" onClick={install} type="button">
              Install the app
            </button>
          ) : null}
        </div>
      </section>

      <section className="landing-grid">
        {OCCASIONS.map((occasion) => (
          <article key={occasion.slug} className="feature-card">
            <p className="feature-index">{occasion.icon}</p>
            <h2>{occasion.title}</h2>
            <p>{occasion.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
