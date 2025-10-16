"use client"

import Image from "next/image"

export const LogoFull = () => {
  return (
    <div className="flex items-center gap-2">
      <Image
        src="/logo.png"
        alt="Sin Fronteras Residencia Universitaria"
        width={150} // Adjust width as needed
        height={150} // Adjust height to maintain aspect ratio
        className="h-auto w-auto max-h-[50px]" // Ensure it scales down if needed
      />
    </div>
  )
}

export const LogoIcon = () => {
  return <Image src="/logo.png" alt="Sin Fronteras Icon" width={24} height={24} className="h-6 w-6" />
}

export const LogoText = () => {
  return <h1 className="text-2xl font-bold text-gray-200">Sin Fronteras</h1>
}
