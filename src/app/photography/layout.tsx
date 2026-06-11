export default function PhotographyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="photography-theme min-h-screen bg-[var(--photo-surface)] text-[var(--photo-accent)]">
      {children}
    </div>
  );
}
