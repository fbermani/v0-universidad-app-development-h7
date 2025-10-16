import Image from "next/image"

interface NationalityFlagProps {
  nationality?: string
  className?: string
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

function NationalityFlag({ nationality, className = "" }: NationalityFlagProps) {
  if (!nationality) {
    return null
  }

  const normalizedNationality = nationality.toLowerCase()
  const flagSrc = countryFlags[normalizedNationality]

  if (!flagSrc) {
    return null
  }

  return (
    <Image
      src={flagSrc || "/placeholder.svg"}
      alt={`${nationality} flag`}
      width={24}
      height={24}
      className={`rounded-full object-cover ${className}`}
    />
  )
}

export { NationalityFlag }
export default NationalityFlag
