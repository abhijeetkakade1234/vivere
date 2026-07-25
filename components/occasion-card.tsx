type Occasion = {
  icon: string;
  title: string;
  description: string;
  slug: string;
};

export function OccasionCard({ occasion }: { occasion: Occasion }) {
  return (
    <article className="occasion-card">
      <div className="occasion-icon" aria-hidden="true">
        {occasion.icon}
      </div>
      <div className="occasion-copy">
        <h3>{occasion.title}</h3>
        <p>{occasion.description}</p>
      </div>
    </article>
  );
}
