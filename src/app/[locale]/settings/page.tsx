import { redirect } from "@/i18n/routing";
import { CONSOLE_MODULES } from "@/lib/console/module-registry";

export default async function SettingsIndex({ params }: { params: Promise<{ locale: string }> }) {
  // Await params to ensure locale is available in the async context
  const { locale } = await params;
  const systemModule = CONSOLE_MODULES.find((module) => module.id === "system");
  const href = systemModule?.defaultHref ?? "/dashboard";
  return redirect({ href, locale });
}
