import type { TFunction } from "i18next"

const knownErrorKeys = new Map<string, string>([
  ["Ce fichier n'est pas un export valide.", "errors.invalidExport"],
  ["Le fichier contient des données invalides.", "errors.invalidData"],
  ["Aucun manga récupéré depuis cette source.", "errors.noManga"],
  ["Impossible de scanner cette source.", "errors.scanFailed"],
  ["Seules les URLs http/https sont acceptées.", "errors.httpOnly"],
  ["Seules les URL HTTP/HTTPS sont acceptées.", "errors.httpOnly"],
  ["Image trop volumineuse.", "errors.imageTooLarge"],
])

export function translateError(message: string, t: TFunction) {
  const selectorPrefix = "Sélecteur CSS invalide:"

  if (message.startsWith(selectorPrefix)) {
    return t("errors.invalidSelector", {
      selector: message.slice(selectorPrefix.length).trim(),
    })
  }

  const key = knownErrorKeys.get(message)
  return key ? t(key) : message
}
