import { Spinner } from "@/components/spinner";

export default function Loading() {
  return (
    <main className="loading-screen">
      <div className="loading-card">
        <Spinner />
        <p className="loading-copy">Loading your moment...</p>
      </div>
    </main>
  );
}
