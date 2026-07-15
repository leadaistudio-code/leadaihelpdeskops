import Link from "next/link";
import { cn, focusRing } from "./cn";
import type { LucideIcon } from "lucide-react";

// Mintlify button. Pill-shaped (rounded-full) always — squared buttons read as
// "third-party widget" in this language. Black is the dominant primary CTA;
// mint-green (`accent`) is the brand-emphasis action; secondary is an outlined
// white pill. Inter medium labels.

export type ButtonVariant = "primary" | "accent" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-medium rounded-full transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none select-none";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-[#0a0a0a] !text-white hover:bg-[#1c1c1e]",
  accent: "bg-[#00d4a4] text-[#0a0a0a] hover:bg-[#00b48a]",
  secondary: "bg-white text-[#0a0a0a] border border-[#e5e5e5] hover:bg-[#f7f7f7]",
  ghost: "text-[#3a3a3c] hover:text-[#0a0a0a] hover:bg-[#f7f7f7]",
  danger: "bg-[#d45656] !text-white hover:bg-[#c34545]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "text-xs px-3.5 py-1.5",
  md: "text-sm px-5 py-2.5",
  lg: "text-sm px-6 py-3",
};

const iconSize: Record<ButtonSize, string> = { sm: "w-3.5 h-3.5", md: "w-4 h-4", lg: "w-4 h-4" };

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
  className?: string;
  children?: React.ReactNode;
};

type ButtonAsButton = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & { href?: undefined };

type ButtonAsLink = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    icon: Icon,
    iconRight: IconRight,
    loading = false,
    className,
    children,
    ...rest
  } = props;

  const classes = cn(base, variants[variant], sizes[size], focusRing, className);
  const inner = (
    <>
      {loading ? (
        <span className={cn(iconSize[size], "animate-spin rounded-full border-2 border-current border-t-transparent")} />
      ) : (
        Icon && <Icon className={iconSize[size]} aria-hidden />
      )}
      {children}
      {IconRight && !loading && <IconRight className={iconSize[size]} aria-hidden />}
    </>
  );

  if ("href" in props && props.href !== undefined) {
    const { href, ...anchorRest } = rest as React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
    return (
      <Link href={href} className={classes} {...anchorRest}>
        {inner}
      </Link>
    );
  }

  const buttonRest = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button className={classes} disabled={loading || buttonRest.disabled} {...buttonRest}>
      {inner}
    </button>
  );
}
