import type { IconSvgElement } from "@hugeicons/react"
import {
  // Animals & Animal Products
  BugIcon, BeefIcon, ShellIcon, EggIcon, BoneIcon,
  // Vegetable Products
  FlowerIcon, CarrotIcon, CherryIcon, CoffeeIcon, WheatIcon,
  CornIcon, PlantIcon, MushroomIcon, LeafIcon,
  // Fats & Oils
  DropletIcon,
  // Food, Beverages, Tobacco
  SteakIcon, CandyIcon, ChocolateIcon, BreadIcon, CookieIcon,
  HoneyIcon, BananaIcon, RecycleIcon, CigaretteIcon,
  // Mineral Products
  MountainIcon, GemIcon, FuelIcon,
  // Chemicals
  TestTubeIcon, MedicineIcon, PillIcon, ThermometerIcon,
  PerfumeIcon, RoseIcon, BrushIcon,
  CameraIcon, BombIcon, BarrelIcon,
  // Plastics & Rubber
  PackageIcon,
  // Hides & Leather
  ShirtIcon, DressIcon,
  // Wood & Paper
  TreeIcon, BookIcon, NewsIcon,
  // Textiles
  TShirtIcon, ThreadIcon,
  // Footwear & Headgear
  HatIcon, UmbrellaIcon, FeatherIcon,
  // Stone, Ceramics, Glass
  MirrorIcon,
  // Precious Metals
  DiamondIcon,
  // Base Metals
  AnvilIcon, WrenchIcon, KnifeIcon,
  // Machinery & Electrical
  CpuIcon, ZapIcon, FactoryIcon,
  // Transport
  TrainIcon, CarIcon, AirplaneIcon, BoatIcon,
  // Instruments
  TelescopeIcon, WatchIcon, NoteIcon,
  // Arms
  TargetIcon,
  // Miscellaneous
  SofaIcon, PuzzleIcon, DiceIcon,
  // Art
  CanvasIcon,
  // Utility
  GridIcon,
} from "@hugeicons/core-free-icons"

// ── Icon per chapter ──
export const CHAPTER_ICONS: Record<string, IconSvgElement> = {
  "01": BugIcon, "02": BeefIcon, "03": ShellIcon, "04": EggIcon, "05": BoneIcon,
  "06": FlowerIcon, "07": CarrotIcon, "08": CherryIcon, "09": CoffeeIcon, "10": WheatIcon,
  "11": CornIcon, "12": PlantIcon, "13": MushroomIcon, "14": LeafIcon,
  "15": DropletIcon,
  "16": SteakIcon, "17": CandyIcon, "18": ChocolateIcon, "19": BreadIcon, "20": CookieIcon,
  "21": HoneyIcon, "22": BananaIcon, "23": RecycleIcon, "24": CigaretteIcon,
  "25": MountainIcon, "26": GemIcon, "27": FuelIcon,
  "28": TestTubeIcon, "29": MedicineIcon, "30": PillIcon, "31": ThermometerIcon,
  "32": BrushIcon, "33": PerfumeIcon, "34": RoseIcon, "35": EggIcon,
  "36": BombIcon, "37": CameraIcon, "38": BarrelIcon,
  "39": PackageIcon, "40": RecycleIcon,
  "41": ShirtIcon, "42": DressIcon, "43": DressIcon,
  "44": TreeIcon, "45": TreeIcon, "46": LeafIcon, "47": TreeIcon, "48": NewsIcon, "49": BookIcon,
  "50": ThreadIcon, "51": ThreadIcon, "52": ThreadIcon, "53": LeafIcon,
  "54": ThreadIcon, "55": ThreadIcon, "56": ThreadIcon, "57": TShirtIcon,
  "58": TShirtIcon, "59": TShirtIcon, "60": TShirtIcon,
  "61": TShirtIcon, "62": DressIcon, "63": TShirtIcon,
  "64": HatIcon, "65": HatIcon, "66": UmbrellaIcon, "67": FeatherIcon,
  "68": MountainIcon, "69": MirrorIcon, "70": MirrorIcon,
  "71": DiamondIcon,
  "72": AnvilIcon, "73": AnvilIcon, "74": AnvilIcon, "75": AnvilIcon, "76": AnvilIcon,
  "78": AnvilIcon, "79": AnvilIcon, "80": AnvilIcon, "81": AnvilIcon,
  "82": KnifeIcon, "83": WrenchIcon,
  "84": FactoryIcon, "85": ZapIcon,
  "86": TrainIcon, "87": CarIcon, "88": AirplaneIcon, "89": BoatIcon,
  "90": TelescopeIcon, "91": WatchIcon, "92": NoteIcon,
  "93": TargetIcon,
  "94": SofaIcon, "95": PuzzleIcon, "96": DiceIcon,
  "97": CanvasIcon,
}

export const CHAPTER_NAMES: Record<string, string> = {
  "01": "Live Animals", "02": "Meat", "03": "Fish & Seafood", "04": "Dairy & Eggs",
  "05": "Animal Products", "06": "Live Plants", "07": "Vegetables", "08": "Fruits & Nuts",
  "09": "Coffee & Tea", "10": "Cereals", "11": "Milling Products", "12": "Oil Seeds",
  "13": "Gums & Resins", "14": "Vegetable Materials", "15": "Fats & Oils",
  "16": "Meat Preparations", "17": "Sugar", "18": "Cocoa", "19": "Cereal Preparations",
  "20": "Vegetable Preparations", "21": "Food Preparations", "22": "Beverages",
  "23": "Residues & Waste", "24": "Tobacco", "25": "Salt & Minerals", "26": "Ores & Slag",
  "27": "Mineral Fuels", "28": "Inorganic Chemicals", "29": "Organic Chemicals",
  "30": "Pharmaceuticals", "31": "Fertilizers", "32": "Dyes & Pigments", "33": "Cosmetics",
  "34": "Soap & Detergents", "35": "Albuminoids", "36": "Explosives",
  "37": "Photographic Goods", "38": "Chemical Products", "39": "Plastics", "40": "Rubber",
  "41": "Raw Hides", "42": "Leather Articles", "43": "Furskins", "44": "Wood", "45": "Cork",
  "46": "Straw & Wicker", "47": "Wood Pulp", "48": "Paper", "49": "Printed Books",
  "50": "Silk", "51": "Wool", "52": "Cotton", "53": "Vegetable Fibers",
  "54": "Man-Made Filaments", "55": "Man-Made Staple", "56": "Wadding & Felt",
  "57": "Carpets", "58": "Special Fabrics", "59": "Coated Textiles", "60": "Knitted Fabrics",
  "61": "Knitted Apparel", "62": "Woven Apparel", "63": "Textile Articles",
  "64": "Footwear", "65": "Headgear", "66": "Umbrellas", "67": "Feathers",
  "68": "Stone & Cement", "69": "Ceramics", "70": "Glass", "71": "Jewelry & Gems",
  "72": "Iron & Steel", "73": "Iron/Steel Articles", "74": "Copper", "75": "Nickel",
  "76": "Aluminum", "78": "Lead", "79": "Zinc", "80": "Tin", "81": "Other Metals",
  "82": "Tools & Cutlery", "83": "Metal Misc.", "84": "Machinery",
  "85": "Electrical Equipment", "86": "Railway", "87": "Vehicles", "88": "Aircraft",
  "89": "Ships & Boats", "90": "Optical & Medical", "91": "Clocks & Watches",
  "92": "Musical Instruments", "93": "Arms & Ammunition", "94": "Furniture",
  "95": "Toys & Games", "96": "Miscellaneous", "97": "Art & Antiques",
}

export interface ChapterSection {
  name: string
  icon: IconSvgElement
  chapters: string[]
  color: string      // solid bg for dots/icons
  badgeClass: string  // text + bg + border for badge styling (light & dark)
}

export const CHAPTER_SECTIONS: ChapterSection[] = [
  { name: "Animals & Animal Products", icon: BeefIcon,      chapters: ["01","02","03","04","05"],                                                     color: "bg-red-500",     badgeClass: "text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800" },
  { name: "Vegetable Products",        icon: LeafIcon,      chapters: ["06","07","08","09","10","11","12","13","14"],                                  color: "bg-green-500",   badgeClass: "text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-800" },
  { name: "Fats & Oils",               icon: DropletIcon,   chapters: ["15"],                                                                         color: "bg-amber-500",   badgeClass: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950 dark:border-amber-800" },
  { name: "Food, Beverages, Tobacco",  icon: BreadIcon,     chapters: ["16","17","18","19","20","21","22","23","24"],                                  color: "bg-orange-500",  badgeClass: "text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950 dark:border-orange-800" },
  { name: "Mineral Products",          icon: MountainIcon,  chapters: ["25","26","27"],                                                                color: "bg-stone-500",   badgeClass: "text-stone-700 bg-stone-50 border-stone-200 dark:text-stone-400 dark:bg-stone-950 dark:border-stone-800" },
  { name: "Chemicals",                 icon: TestTubeIcon,  chapters: ["28","29","30","31","32","33","34","35","36","37","38"],                         color: "bg-purple-500",  badgeClass: "text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-950 dark:border-purple-800" },
  { name: "Plastics & Rubber",         icon: RecycleIcon,   chapters: ["39","40"],                                                                     color: "bg-cyan-500",    badgeClass: "text-cyan-700 bg-cyan-50 border-cyan-200 dark:text-cyan-400 dark:bg-cyan-950 dark:border-cyan-800" },
  { name: "Hides & Leather",           icon: PackageIcon,   chapters: ["41","42","43"],                                                                color: "bg-yellow-700",  badgeClass: "text-yellow-800 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950 dark:border-yellow-800" },
  { name: "Wood & Paper",              icon: TreeIcon,      chapters: ["44","45","46","47","48","49"],                                                  color: "bg-lime-600",    badgeClass: "text-lime-700 bg-lime-50 border-lime-200 dark:text-lime-400 dark:bg-lime-950 dark:border-lime-800" },
  { name: "Textiles",                  icon: TShirtIcon,    chapters: ["50","51","52","53","54","55","56","57","58","59","60","61","62","63"],           color: "bg-pink-500",    badgeClass: "text-pink-700 bg-pink-50 border-pink-200 dark:text-pink-400 dark:bg-pink-950 dark:border-pink-800" },
  { name: "Footwear & Headgear",       icon: HatIcon,       chapters: ["64","65","66","67"],                                                           color: "bg-rose-400",    badgeClass: "text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950 dark:border-rose-800" },
  { name: "Stone, Ceramics, Glass",    icon: MirrorIcon,    chapters: ["68","69","70"],                                                                color: "bg-slate-500",   badgeClass: "text-slate-700 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-950 dark:border-slate-800" },
  { name: "Precious Metals",           icon: DiamondIcon,   chapters: ["71"],                                                                          color: "bg-yellow-400",  badgeClass: "text-yellow-800 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950 dark:border-yellow-800" },
  { name: "Base Metals",               icon: AnvilIcon,     chapters: ["72","73","74","75","76","78","79","80","81","82","83"],                         color: "bg-zinc-500",    badgeClass: "text-zinc-700 bg-zinc-50 border-zinc-200 dark:text-zinc-400 dark:bg-zinc-950 dark:border-zinc-800" },
  { name: "Machinery & Electrical",    icon: CpuIcon,       chapters: ["84","85"],                                                                     color: "bg-blue-500",    badgeClass: "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-800" },
  { name: "Transport",                 icon: CarIcon,       chapters: ["86","87","88","89"],                                                           color: "bg-indigo-500",  badgeClass: "text-indigo-700 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-950 dark:border-indigo-800" },
  { name: "Instruments",               icon: TelescopeIcon, chapters: ["90","91","92"],                                                                color: "bg-violet-500",  badgeClass: "text-violet-700 bg-violet-50 border-violet-200 dark:text-violet-400 dark:bg-violet-950 dark:border-violet-800" },
  { name: "Arms",                      icon: TargetIcon,    chapters: ["93"],                                                                          color: "bg-red-700",     badgeClass: "text-red-800 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800" },
  { name: "Miscellaneous",             icon: SofaIcon,      chapters: ["94","95","96"],                                                                color: "bg-teal-500",    badgeClass: "text-teal-700 bg-teal-50 border-teal-200 dark:text-teal-400 dark:bg-teal-950 dark:border-teal-800" },
  { name: "Art & Antiques",            icon: CanvasIcon,    chapters: ["97"],                                                                          color: "bg-fuchsia-500", badgeClass: "text-fuchsia-700 bg-fuchsia-50 border-fuchsia-200 dark:text-fuchsia-400 dark:bg-fuchsia-950 dark:border-fuchsia-800" },
]

// ── Lookups ──
const _chapterToSection = new Map<string, ChapterSection>()
for (const section of CHAPTER_SECTIONS) {
  for (const ch of section.chapters) {
    _chapterToSection.set(ch, section)
  }
}

export function getSectionForChapter(ch: string): string {
  return _chapterToSection.get(ch)?.name ?? ""
}

export function getColorForChapter(ch: string): string {
  return _chapterToSection.get(ch)?.color ?? "bg-gray-400"
}

export function getBadgeClassForChapter(ch: string): string {
  return _chapterToSection.get(ch)?.badgeClass ?? ""
}

export function getIconForChapter(ch: string): IconSvgElement {
  return CHAPTER_ICONS[ch] ?? GridIcon
}

/** Build the direct link to customs.gov.eg that shows a specific tariff code */
export function govLink(code: string): string {
  const chapter = parseInt(code.split("/")[0], 10)
  return `https://customs.gov.eg/Services/Tarif?type=0&chapterId=${chapter}&textSearch=${encodeURIComponent(code)}`
}
