import type { ReleaseSourceDraft } from "@/types/release-source.type"

export const natomangaSourceDraft: ReleaseSourceDraft = {
  name: "Natomanga",
  enabled: true,
  color: "#7c3aed",
  proxyImages: false,
  baseUrl: "https://www.natomanga.com",
  releaseParentSelector: ".doreamon",
  deleteSelectors: [".js-banner-ai-home"],
  titleSelector: "h3 .tooltip",
  imageSelector: ".lazy.lz-entered.lz-loaded",
  mangaLinkSelector: ".tooltip.cover.bookmark_check",
  dateFormats: [
    "relative-en",
    "compact-duration",
    "MM-dd HH:mm",
    "last week",
    "2 weeks ago",
    "2h 14m",
  ],
  releaseSelectors: [
    {
      id: "release-1",
      linkSelector: "li:nth-child(2) .sts.sts_1",
      textSelectors: ["li:nth-child(2) .sts.sts_1"],
      timeSelector: "li:nth-child(2) i",
    },
    {
      id: "release-2",
      linkSelector: "li:nth-child(3) .sts.sts_1",
      textSelectors: ["li:nth-child(3) .sts.sts_1"],
      timeSelector: "li:nth-child(3) i",
    },
    {
      id: "release-3",
      linkSelector: "li:nth-child(4) .sts.sts_1",
      textSelectors: ["li:nth-child(4) .sts.sts_1"],
      timeSelector: "li:nth-child(4) i",
    },
  ],
}
