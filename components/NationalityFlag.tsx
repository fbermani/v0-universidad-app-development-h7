import Image from "next/image"

interface NationalityFlagProps {
  nationality: string
  showName?: boolean
  size?: "sm" | "md" | "lg"
}

const countryFlags: Record<string, string> = {
  argentina: "/flags/argentina.png",
  bolivia: "/flags/bolivia.png",
  brasil: "/flags/brasil.png",
  chile: "/flags/chile.png",
  paraguay: "/flags/paraguay.png",
  colombia: "/flags/colombia.png",
  ecuador: "/flags/ecuador.png",
  peru: "/flags/peru.png",
  uruguay: "/flags/uruguay.png",
  venezuela: "/flags/venezuela.png",
}

export const countries = [
  { value: "argentina", label: "Argentina" },
  { value: "bolivia", label: "Bolivia" },
  { value: "brasil", label: "Brasil" },
  { value: "chile", label: "Chile" },
  { value: "paraguay", label: "Paraguay" },
  { value: "colombia", label: "Colombia" },
  { value: "ecuador", label: "Ecuador" },
  { value: "peru", label: "Perú" },
  { value: "uruguay", label: "Uruguay" },
  { value: "venezuela", label: "Venezuela" },
]

export function NationalityFlag({ nationality, showName = false, size = "md" }: NationalityFlagProps) {
  // Validación de tipo para evitar errores
  if (!nationality || typeof nationality !== "string") {
    return null
  }

  const normalizedNationality = nationality.toLowerCase()
  const flagSrc = countryFlags[normalizedNationality]

  if (!flagSrc) {
    return null
  }

  const sizeClasses = {
    sm: "w-4 h-3",
    md: "w-6 h-4",
    lg: "w-8 h-6",
  }

  const countryNames: Record<string, string> = {
    argentina: "Argentina",
    bolivia: "Bolivia",
    brasil: "Brasil",
    chile: "Chile",
    colombia: "Colombia",
    ecuador: "Ecuador",
    paraguay: "Paraguay",
    peru: "Perú",
    uruguay: "Uruguay",
    venezuela: "Venezuela",
  }

  return (
    <div className="flex items-center gap-2">
      <Image
        src={flagSrc || "/placeholder.svg"}
        alt={countryNames[normalizedNationality] || nationality}
        width={24}
        height={16}
        className={`${sizeClasses[size]} object-cover rounded-sm`}
      />
      {showName && (
        <span className="text-sm text-muted-foreground">{countryNames[normalizedNationality] || nationality}</span>
      )}
    </div>
  )
}

export default NationalityFlag
