import InterestPicker from "./InterestPicker"

interface Interest {
  id: number
  name: string
  slug: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default async function OnboardingPage() {
  const res = await fetch(`${API_URL}/api/interests`, { cache: "no-store" })
  const interests: Interest[] = await res.json()
  return <InterestPicker interests={interests} />
}
