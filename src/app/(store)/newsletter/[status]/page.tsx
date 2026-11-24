import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MailCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Newsletter", robots: { index: false } };

const COPY: Record<string, { title: string; body: string }> = {
  confirmed: { title: "You're subscribed!", body: "Thanks for confirming. If a welcome discount is running, your code is on its way to your inbox." },
  unsubscribed: { title: "You've been unsubscribed", body: "You won't receive any more marketing emails from us. Order emails are not affected." },
  invalid: { title: "That link didn't work", body: "It may have expired or already been used. You can sign up again at the bottom of any page." },
};

export function generateStaticParams() {
  return Object.keys(COPY).map((status) => ({ status }));
}

export default async function NewsletterStatusPage({ params }: PageProps<"/newsletter/[status]">) {
  const copy = COPY[(await params).status];
  if (!copy) notFound();
  return (
    <div className="container-page py-16">
      <EmptyState icon={MailCheck} title={copy.title} action={<ButtonLink href="/">Back to the shop</ButtonLink>}>
        {copy.body}
      </EmptyState>
    </div>
  );
}
