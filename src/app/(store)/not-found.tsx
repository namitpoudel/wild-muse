import { NotFoundContent } from "@/components/layout/not-found-content";

/** notFound() inside the store: rendered within the store layout's <main>, with header and footer. */
export default function StoreNotFound() {
  return (
    <div className="texture-grain flex flex-col bg-cream">
      <NotFoundContent />
    </div>
  );
}
