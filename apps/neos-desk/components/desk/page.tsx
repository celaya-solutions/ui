import * as React from "react"

import { cn } from "@/lib/utils"

/** Page body. Every dashboard sits inside one, so gutters stay identical. */
function DeskPage({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="desk-page"
      className={cn("flex flex-1 flex-col gap-5 p-4 md:p-6", className)}
      {...props}
    />
  )
}

/**
 * The strip under the header that names what is on screen and when it last
 * updated — the `<header><span class="sym">…<span class="ts">` pair the views
 * each rebuilt.
 */
function DeskPageHeader({
  title,
  description,
  meta,
  actions,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  title: React.ReactNode
  description?: React.ReactNode
  meta?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div
      data-slot="desk-page-header"
      className={cn("flex flex-wrap items-start gap-x-6 gap-y-3", className)}
      {...props}
    >
      <div className="min-w-0 flex-1">
        <h2 className="flex items-center gap-2 font-sans text-[15px] font-semibold tracking-[0.06em]">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 max-w-prose text-[12px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {meta ? (
        // `break-words` because a meta line can carry a redirect URI, and an
        // unbroken URL is the one string that will widen the whole page.
        <div className="max-w-full shrink-0 text-[11px] break-words text-faint">
          {meta}
        </div>
      ) : null}
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  )
}

/**
 * The views' `<h2>` rule — 12px uppercase, wide tracking, dim — with the
 * lowercase aside several of them appended after an em dash.
 */
function SectionLabel({
  children,
  aside,
  className,
  ...props
}: React.ComponentProps<"h3"> & { aside?: React.ReactNode }) {
  return (
    <h3
      data-slot="section-label"
      className={cn(
        "text-[12px] tracking-[0.1em] text-muted-foreground uppercase",
        className
      )}
      {...props}
    >
      {children}
      {aside ? (
        <span className="ml-1.5 text-[11px] tracking-normal text-faint normal-case">
          — {aside}
        </span>
      ) : null}
    </h3>
  )
}

/** A labelled block: section heading plus its panel. */
function DeskSection({
  label,
  aside,
  actions,
  children,
  className,
  ...props
}: Omit<React.ComponentProps<"section">, "title"> & {
  label?: React.ReactNode
  aside?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <section
      data-slot="desk-section"
      className={cn("flex flex-col gap-2.5", className)}
      {...props}
    >
      {label || actions ? (
        <div className="flex items-center gap-3">
          {label ? <SectionLabel aside={aside}>{label}</SectionLabel> : null}
          {actions ? (
            <div className="ml-auto flex items-center gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export { DeskPage, DeskPageHeader, DeskSection, SectionLabel }
