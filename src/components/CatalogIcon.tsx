import { Laptop, Monitor, FileSpreadsheet, Palette, ShieldAlert, Database, Library, type LucideIcon } from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  laptop: Laptop,
  monitor: Monitor,
  fileSpreadsheet: FileSpreadsheet,
  palette: Palette,
  shield: ShieldAlert,
  database: Database,
};

export default function CatalogIcon({ icon, className }: { icon?: string | null; className?: string }) {
  const Icon = (icon && MAP[icon]) || Library;
  return <Icon className={className} />;
}
