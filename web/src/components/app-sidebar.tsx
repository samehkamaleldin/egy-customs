import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
  SidebarFooter,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import type { Chapter } from "@/lib/api"
import { CHAPTER_SECTIONS, CHAPTER_ICONS } from "@/lib/chapters"
import { t, tSection, tChapter, fmt } from "@/lib/i18n"
import { HugeiconsIcon } from "@hugeicons/react"
import { GridIcon, DashboardCircleIcon, ArrowDown01Icon, Globe02Icon } from "@hugeicons/core-free-icons"

interface AppSidebarProps {
  chapters: Chapter[]
  selected: string
  onSelect: (chapter: string) => void
}

export function AppSidebar({ chapters, selected, onSelect }: AppSidebarProps) {
  const chapterSet = new Set(chapters.map((c) => c.chapter))
  const countMap = new Map(chapters.map((c) => [c.chapter, c.count]))
  const total = chapters.reduce((s, c) => s + c.count, 0)

  return (
    <Sidebar side="right" className="overflow-x-hidden">
      {/* ─── Brand ─── */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground">
                <HugeiconsIcon icon={DashboardCircleIcon} size={18} />
              </div>
              <div className="grid flex-1 text-start leading-tight">
                <span className="truncate text-sm font-semibold">{t("app.title")}</span>
                <span className="truncate text-xs text-muted-foreground">{t("app.subtitle")}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ─── All Tariffs — pinned ─── */}
      <div className="mx-3 mb-2">
        <button
          onClick={() => onSelect("")}
          className={`
            flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150
            ${selected === ""
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/50 text-foreground hover:bg-muted"
            }
          `}
        >
          <HugeiconsIcon icon={GridIcon} size={18} />
          <span className="flex-1 text-start">{t("nav.allTariffs")}</span>
          <span className={`text-xs tabular-nums ${selected === "" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            {fmt(total)}
          </span>
        </button>
      </div>

      {/* ─── Chapter sections ─── */}
      <SidebarContent>
        {CHAPTER_SECTIONS.map((section) => {
          const visible = section.chapters.filter((ch) => chapterSet.has(ch))
          if (visible.length === 0) return null
          const sectionCount = visible.reduce((s, ch) => s + (countMap.get(ch) ?? 0), 0)
          const isActive = visible.includes(selected)

          return (
            <Collapsible key={section.name} defaultOpen={isActive} className="group/collapsible">
              <SidebarGroup className="py-0">
                {/* Section header */}
                <CollapsibleTrigger className="sticky top-0 z-10 flex w-full items-center gap-2 px-3 py-2 bg-sidebar transition-colors duration-150 hover:bg-sidebar-accent/50">
                  <div className={`flex items-center justify-center size-5 rounded ${section.color} text-white shrink-0`}>
                    <HugeiconsIcon icon={section.icon} size={12} />
                  </div>
                  <span className="flex-1 text-start text-xs font-semibold text-sidebar-foreground/80 truncate">
                    {tSection(section.name)}
                  </span>
                  <span className="text-[10px] tabular-nums text-muted-foreground/60 me-0.5">
                    {fmt(sectionCount)}
                  </span>
                  <HugeiconsIcon
                    icon={ArrowDown01Icon}
                    size={12}
                    className="text-muted-foreground/50 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180"
                  />
                </CollapsibleTrigger>

                {/* Chapter items */}
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu className="pe-2">
                      {visible.map((ch) => (
                        <SidebarMenuItem key={ch} className="ps-7">
                          <SidebarMenuButton
                            isActive={selected === ch}
                            onClick={() => onSelect(ch)}
                          >
                            {CHAPTER_ICONS[ch] && (
                              <HugeiconsIcon
                                icon={CHAPTER_ICONS[ch]}
                                size={13}
                                className={selected === ch ? "" : "text-muted-foreground/60"}
                              />
                            )}
                            <span className="truncate">{tChapter(ch)}</span>
                          </SidebarMenuButton>
                          <SidebarMenuBadge>
                            {fmt(countMap.get(ch) ?? 0)}
                          </SidebarMenuBadge>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          )
        })}
      </SidebarContent>

      {/* ─── Footer ─── */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="https://customs.gov.eg/Services/Tarif" target="_blank" rel="noopener noreferrer">
                <HugeiconsIcon icon={Globe02Icon} size={16} />
                <span>customs.gov.eg</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
