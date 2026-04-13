import { memo, useCallback, useEffect, useMemo, useState } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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
import { GridIcon, DashboardCircleIcon, ArrowDown01Icon, Globe02Icon, ArrowUpRight01Icon } from "@hugeicons/core-free-icons"

const ACTIVE_CLASS = "bg-primary text-primary-foreground shadow-sm data-active:bg-primary data-active:text-primary-foreground"

interface AppSidebarProps {
  chapters: Chapter[]
  selected: string
  onSelect: (chapter: string) => void
}

export const AppSidebar = memo(function AppSidebar({ chapters, selected, onSelect }: AppSidebarProps) {
  const chapterSet = useMemo(() => new Set(chapters.map((c) => c.chapter)), [chapters])
  const countMap = useMemo(() => new Map(chapters.map((c) => [c.chapter, c.count])), [chapters])
  const total = useMemo(() => chapters.reduce((s, c) => s + c.count, 0), [chapters])
  const selectedSet = useMemo(() => new Set(selected.split(",").filter(Boolean)), [selected])

  const activeSectionName = useMemo(() => {
    for (const section of CHAPTER_SECTIONS) {
      const visible = section.chapters.filter((ch) => chapterSet.has(ch))
      if (visible.includes(selected)) return section.name
      if (selectedSet.size === visible.length && visible.every((ch) => selectedSet.has(ch))) {
        return section.name
      }
    }
    return null
  }, [selected, selectedSet, chapterSet])

  const [openSection, setOpenSection] = useState<string | null>(activeSectionName)

  useEffect(() => {
    setOpenSection(activeSectionName)
  }, [activeSectionName])

  const handleSectionClick = useCallback((sectionName: string, visibleChapters: string[]) => {
    onSelect(visibleChapters.join(","))
  }, [onSelect])

  return (
    <Sidebar side="right" className="overflow-x-hidden">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground">
                <HugeiconsIcon icon={DashboardCircleIcon} size={18} />
              </div>
              <div className="grid flex-1 text-start leading-tight">
                <span className="truncate text-sm font-bold">{t("app.title")}</span>
                <span className="truncate text-xs text-muted-foreground">{t("app.subtitle")}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* All Tariffs */}
      <SidebarGroup className="py-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="sm"
              isActive={selected === ""}
              onClick={() => onSelect("")}
              className={selected === "" ? ACTIVE_CLASS : ""}
            >
              <HugeiconsIcon icon={GridIcon} size={14} />
              <span className="truncate">
                {t("nav.allTariffs")}
                <span className="opacity-50 ms-1">({fmt(total)})</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      {/* Chapter sections */}
      <SidebarContent>
        {CHAPTER_SECTIONS.map((section) => {
          const visible = section.chapters.filter((ch) => chapterSet.has(ch))
          if (visible.length === 0) return null
          const sectionCount = visible.reduce((s, ch) => s + (countMap.get(ch) ?? 0), 0)
          const sectionActive = selectedSet.size === visible.length && visible.every((ch) => selectedSet.has(ch))
          const isSingleChapter = visible.length === 1

          // Single-chapter sections: render flat, no collapsible
          if (isSingleChapter) {
            const ch = visible[0]
            const active = selected === ch || sectionActive
            return (
              <SidebarGroup key={section.name} className="py-0">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      size="sm"
                      isActive={active}
                      onClick={() => onSelect(ch)}
                      className={active ? ACTIVE_CLASS : ""}
                    >
                      <div className={`flex items-center justify-center size-4 rounded ${
                        active ? "bg-primary-foreground/20" : section.color
                      } text-white shrink-0`}>
                        <HugeiconsIcon icon={section.icon} size={10} />
                      </div>
                      <span className="truncate">
                        {tSection(section.name)}
                        <span className={active ? "opacity-70 ms-1" : "opacity-40 ms-1"}>({fmt(sectionCount)})</span>
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            )
          }

          // Multi-chapter sections: collapsible
          const isOpen = openSection === section.name
          return (
            <Collapsible
              key={section.name}
              open={isOpen}
              onOpenChange={(open) => setOpenSection(open ? section.name : null)}
              className="group/collapsible"
            >
              <SidebarGroup className="py-0">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      size="sm"
                      isActive={sectionActive}
                      onClick={() => handleSectionClick(section.name, visible)}
                      className={sectionActive ? ACTIVE_CLASS : ""}
                    >
                      <div className={`flex items-center justify-center size-4 rounded ${
                        sectionActive ? "bg-primary-foreground/20" : section.color
                      } text-white shrink-0`}>
                        <HugeiconsIcon icon={section.icon} size={10} />
                      </div>
                      <span className="truncate">
                        {tSection(section.name)}
                        <span className={sectionActive ? "opacity-70 ms-1" : "opacity-40 ms-1"}>({fmt(sectionCount)})</span>
                      </span>
                    </SidebarMenuButton>
                    <CollapsibleTrigger
                      className="absolute end-1 top-1.5 flex items-center justify-center size-5 rounded-md transition-colors duration-150 hover:bg-sidebar-accent/50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <HugeiconsIcon
                        icon={ArrowDown01Icon}
                        size={12}
                        className="text-muted-foreground/50 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180"
                      />
                    </CollapsibleTrigger>
                  </SidebarMenuItem>
                </SidebarMenu>

                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {visible.map((ch) => {
                        const active = selected === ch
                        return (
                          <SidebarMenuItem key={ch} className="ps-5">
                            <SidebarMenuButton
                              size="sm"
                              isActive={active}
                              onClick={() => onSelect(ch)}
                              className={active ? ACTIVE_CLASS : ""}
                            >
                              {CHAPTER_ICONS[ch] && (
                                <HugeiconsIcon
                                  icon={CHAPTER_ICONS[ch]}
                                  size={13}
                                  className={active ? "text-primary-foreground" : "text-muted-foreground/60"}
                                />
                              )}
                              <span className="truncate">
                                {tChapter(ch)}
                                <span className={active ? "opacity-70 ms-1" : "opacity-40 ms-1"}>({fmt(countMap.get(ch) ?? 0)})</span>
                              </span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        )
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          )
        })}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <a
          href="https://customs.gov.eg/Services/Tarif"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm transition-colors duration-150 hover:bg-primary/10 hover:border-primary/30"
        >
          <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary shrink-0">
            <HugeiconsIcon icon={Globe02Icon} size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold">{t("sidebar.officialLabel")}</div>
            <div className="text-xs text-muted-foreground">{t("sidebar.officialName")}</div>
          </div>
          <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} className="text-muted-foreground shrink-0" />
        </a>
      </SidebarFooter>
    </Sidebar>
  )
})
