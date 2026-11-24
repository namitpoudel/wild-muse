import { saveHomepageAction, uploadHeroImageAction } from "./actions";
import { AdminForm, F, FArea, Submit } from "@/components/admin/admin-form";
import { AdminHeader, Card } from "@/components/admin/ui";
import { getSettings } from "@/server/settings";

/** Homepage hero, slogan and announcement bar (rendered inside the content route). */
export async function HomepageEditor() {
  const s = await getSettings();
  const c = s.hero.ctas;
  return (
    <div className="space-y-6">
      <AdminHeader
        title="Homepage & announcements"
        back={{ href: "/admin/content", label: "Pages" }}
        description="Changes appear on the live site immediately after saving."
      />
      <Card title="Hero, slogan & announcement bar">
        <AdminForm action={saveHomepageAction} className="grid gap-4 md:grid-cols-2">
          <F label="Eyebrow" name="eyebrow" defaultValue={s.hero.eyebrow} />
          <F label="Heading" name="heading" defaultValue={s.hero.heading} />
          <FArea label="Subheading" name="subheading" defaultValue={s.hero.subheading} rows={2} className="md:col-span-2" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="grid grid-cols-2 gap-2 md:col-span-2">
              <F label={`Button ${i + 1} label`} name={`cta${i + 1}Label`} defaultValue={c[i]?.label ?? ""} />
              <F label={`Button ${i + 1} link`} name={`cta${i + 1}Href`} defaultValue={c[i]?.href ?? ""} placeholder="/women" />
            </div>
          ))}
          <F label="Slogan (footer)" name="slogan" defaultValue={s.slogan} />
          <FArea
            label="Announcement bar messages (one per line, max 6)"
            name="announcements"
            defaultValue={s.announcements.join("\n")}
            rows={4}
            className="md:col-span-2"
          />
          <Submit className="md:col-span-2 md:justify-self-start">Save homepage</Submit>
        </AdminForm>
      </Card>
      <Card title="Hero images">
        <div className="grid gap-6 md:grid-cols-2">
          {(["primary", "secondary"] as const).map((slot) => {
            const url = slot === "primary" ? s.hero.primaryImageUrl : s.hero.secondaryImageUrl;
            return (
              <div key={slot} className="space-y-3">
                <p className="text-sm font-semibold">{slot === "primary" ? "Main image (arched, portrait)" : "Secondary image (small, portrait)"}</p>
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin preview
                  <img src={url} alt="" className="h-48 rounded object-cover" />
                ) : (
                  <p className="text-xs text-bark">Using the illustrated placeholder.</p>
                )}
                <AdminForm action={uploadHeroImageAction} resetOnSuccess className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="slot" value={slot} />
                  <input type="file" name="file" accept="image/jpeg,image/png,image/webp" className="text-sm" />
                  <Submit variant="dark">Upload</Submit>
                </AdminForm>
                {url && (
                  <AdminForm action={uploadHeroImageAction}>
                    <input type="hidden" name="slot" value={slot} />
                    <input type="hidden" name="remove" value="1" />
                    <Submit variant="outline">Remove</Submit>
                  </AdminForm>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
