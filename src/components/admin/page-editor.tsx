"use client";

import { useRouter } from "next/navigation";
import { deletePageAction, savePageAction } from "@/app/admin/content/actions";
import { AdminForm, F, FArea, FSelect, Submit } from "./admin-form";

export interface PageEditorData {
  id?: string;
  path?: string;
  title: string;
  eyebrow: string;
  summary: string;
  description: string;
  body: string;
  requiresLegalReview: boolean;
  status: string;
  publicUrl?: string;
}

const HELP = `## Heading   ### Sub-heading
- bullet point        1. numbered point
**bold**   [link text](/pages/delivery)
> a highlighted note        > [!warning] a warning note
Table: Caption, then rows like | Column A | Column B |
[[faq]] then Q: question / A: answer lines, then [[/faq]]
[[form:contact]]  [[form:wholesale]]  [[size-guides]]  [[cookie-settings]]
Leave a blank line between paragraphs.`;

export function PageEditor({ page }: { page: PageEditorData }) {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <AdminForm
        action={savePageAction}
        className="grid gap-6 xl:grid-cols-3"
        onSuccess={(d: unknown) => !page.id && router.push(`/admin/content/${(d as { id: string }).id}`)}
      >
        {page.id && <input type="hidden" name="id" value={page.id} />}
        <div className="space-y-4 rounded-[3px] border border-sand bg-white p-5 shadow-soft xl:col-span-2">
          <F label="Title" name="title" defaultValue={page.title} />
          <FArea label="Page content" name="body" defaultValue={page.body} rows={26} className="font-mono text-xs" />
          <details className="rounded-[2px] bg-cream p-3 text-xs">
            <summary className="cursor-pointer font-semibold">Formatting help</summary>
            <pre className="mt-2 whitespace-pre-wrap font-mono">{HELP}</pre>
          </details>
        </div>
        <div className="space-y-4 rounded-[3px] border border-sand bg-white p-5 shadow-soft">
          {!page.id && (
            <>
              <FSelect
                label="Section"
                name="section"
                options={[
                  { value: "pages", label: "Information page (/pages/…)" },
                  { value: "handmade", label: "Handmade in Nepal story" },
                ]}
              />
              <F label="URL slug" name="slug" placeholder="e.g. gift-cards" />
            </>
          )}
          {page.publicUrl && (
            <a href={page.publicUrl} target="_blank" className="block text-sm font-semibold underline">
              View live page ↗
            </a>
          )}
          <FSelect
            label="Status"
            name="status"
            defaultValue={page.status}
            options={[
              { value: "PUBLISHED", label: "Published" },
              { value: "DRAFT", label: "Draft (hidden)" },
            ]}
          />
          <F label="Eyebrow label" name="eyebrow" defaultValue={page.eyebrow} placeholder="e.g. Help" />
          <FArea label="Summary (story cards)" name="summary" defaultValue={page.summary} rows={2} />
          <FArea label="Meta description (Google)" name="description" defaultValue={page.description} rows={3} maxLength={170} />
          <F
            type="checkbox"
            label="Show 'needs solicitor review' notice"
            name="requiresLegalReview"
            defaultValue={page.requiresLegalReview ? "1" : ""}
            hint="Untick once a solicitor has approved this policy."
          />
          <Submit className="w-full">Save page</Submit>
        </div>
      </AdminForm>
      {page.id && (
        <AdminForm action={deletePageAction} confirm="Delete this page?" onSuccess={() => router.push("/admin/content")}>
          <input type="hidden" name="id" value={page.id} />
          <Submit variant="danger">Delete page</Submit>
        </AdminForm>
      )}
    </div>
  );
}
