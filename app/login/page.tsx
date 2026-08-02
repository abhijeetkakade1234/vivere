export default function LoginPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">Login</p>
        <h1>Login lands here later.</h1>
        <p>
          The auth flow is still pending. For now, use the planner directly so the chat app and API
          flow can be built first.
        </p>
        <div className="landing-actions">
          <a className="primary-action" href="/chat">
            Enter the planner
          </a>
          <a className="secondary-action" href="/">
            Back to landing
          </a>
        </div>
      </section>
    </main>
  );
}
