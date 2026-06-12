import { useEffect, useState } from "react"
import { Pressable, ScrollView, Text, View } from "react-native"
import { useRouter } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { apiFetch } from "../lib/api"
import { getInterestSlugs, setInterestSlugs } from "../lib/interests"
import { colors, fonts } from "../theme/tokens"
import PrimaryButton from "../components/PrimaryButton"

// Port of frontend/src/app/onboarding/InterestPicker.tsx. The CATEGORIES map
// is copied verbatim from the web file; selected slugs go to AsyncStorage
// under the same "deepscroll_interests" key meaning, and gate the feed.

interface Interest {
  id: number
  name: string
  slug: string
}

interface Category {
  label: string
  slugs: string[]
}

const CATEGORIES: Category[] = [
  {
    label: "Science & Nature",
    slugs: [
      "physics", "quantum-physics", "astronomy", "cosmology",
      "chemistry", "biology", "genetics", "neuroscience",
      "evolution", "ecology", "climate", "geology", "oceans",
      "animals", "mathematics", "statistics", "medicine",
      "materials-science",
    ],
  },
  {
    label: "Technology & Engineering",
    slugs: [
      "artificial-intelligence", "machine-learning", "computing",
      "internet", "cybersecurity", "robotics", "biotech",
      "space-tech", "energy-tech", "engineering", "gadgets",
      "cryptography", "blockchain", "aviation", "transportation",
    ],
  },
  {
    label: "Business & Economics",
    slugs: [
      "economics", "behavioral-economics", "finance",
      "entrepreneurship", "startups", "marketing", "management",
      "negotiation", "money-history", "markets", "career",
      "productivity-work", "supply-chains", "advertising",
    ],
  },
  {
    label: "Self-Improvement & Psychology",
    slugs: [
      "psychology", "cognitive-biases", "habits", "productivity",
      "focus", "motivation", "decision-making",
      "emotional-intelligence", "mental-health", "mindfulness",
      "happiness", "relationships", "communication", "learning",
      "discipline", "confidence", "stoicism-practice",
    ],
  },
  {
    label: "Philosophy & Ideas",
    slugs: [
      "philosophy", "ethics", "stoicism", "existentialism",
      "eastern-philosophy", "logic", "epistemology",
      "consciousness", "free-will", "political-philosophy",
      "philosophy-of-mind", "meaning", "mental-models",
    ],
  },
  {
    label: "History & Civilization",
    slugs: [
      "ancient-history", "medieval-history", "modern-history",
      "world-wars", "cold-war", "empires", "revolutions",
      "ancient-egypt", "ancient-rome", "ancient-greece",
      "exploration", "archaeology", "history-of-science",
      "forgotten-history", "military-history", "history",
      "anthropology",
    ],
  },
  {
    label: "Politics & Society",
    slugs: [
      "politics", "geopolitics", "political-systems", "democracy",
      "law", "human-rights", "social-movements", "inequality",
      "propaganda", "diplomacy", "elections", "public-policy",
    ],
  },
  {
    label: "Arts & Culture",
    slugs: [
      "art-history", "music", "music-theory", "literature", "film",
      "architecture", "design", "photography", "writing",
      "mythology", "religion", "language", "poetry", "theater",
    ],
  },
  {
    label: "Health & Body",
    slugs: [
      "nutrition", "fitness", "sleep", "longevity", "human-body",
      "brain-health", "immunity", "public-health", "sports-science",
    ],
  },
  {
    label: "Curiosity & Everyday",
    slugs: [
      "everyday-science", "food-science", "games", "sports",
      "travel", "nature-phenomena", "curiosities", "future",
      "internet-culture", "crime", "money-everyday",
      "exponential-growth", "patience", "critical-thinking",
      "trade-offs", "scarcity",
    ],
  },
]

function LabelCaps({ text, color }: { text: string; color: string }) {
  return (
    <Text
      style={{
        fontFamily: fonts.sansSemiBold,
        fontSize: 11,
        letterSpacing: 2,
        textTransform: "uppercase",
        color,
      }}
    >
      {text}
    </Text>
  )
}

function Chip({
  name,
  isSelected,
  onPress,
}: {
  name: string
  isSelected: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: isSelected ? "rgba(124, 111, 255, 0.5)" : "rgba(130, 145, 220, 0.25)",
        backgroundColor: isSelected ? "rgba(124, 111, 255, 0.16)" : "transparent",
      }}
    >
      <Text
        style={{
          fontFamily: isSelected ? fonts.sansSemiBold : fonts.sansMedium,
          fontSize: 14,
          color: isSelected ? colors.lamp : colors["ink-dim"],
        }}
      >
        {name}
      </Text>
    </Pressable>
  )
}

export default function OnboardingScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [interests, setInterests] = useState<Interest[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Already onboarded? Straight to the feed (mirrors the web guard).
    getInterestSlugs().then((slugs) => {
      if (slugs) {
        router.replace("/")
        return
      }
      apiFetch("/api/interests")
        .then((r) => r.json())
        .then((data: Interest[]) => {
          setInterests(data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    })
  }, [router])

  function toggle(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  async function handleContinue() {
    await setInterestSlugs([...selected])
    router.replace("/")
  }

  const canContinue = selected.size >= 1

  // Build a lookup map from slug to Interest for fast grouping
  const bySlug = new Map(interests.map((i) => [i.slug, i]))

  // Build category sections: each entry is { label, items: Interest[] }
  const categorySections = CATEGORIES.map((cat) => ({
    label: cat.label,
    items: cat.slugs.flatMap((s) => {
      const interest = bySlug.get(s)
      return interest ? [interest] : []
    }),
  })).filter((sec) => sec.items.length > 0)

  // Interests that don't belong to any category
  const categorisedSlugs = new Set(CATEGORIES.flatMap((c) => c.slugs))
  const otherItems = interests.filter((i) => !categorisedSlugs.has(i.slug))

  const sections = [
    ...categorySections,
    ...(otherItems.length > 0 ? [{ label: "Other", items: otherItems }] : []),
  ]

  return (
    <View style={{ flex: 1, backgroundColor: colors["surface-0"], paddingTop: insets.top }}>
      {/* Top bar — fixed, does not scroll */}
      <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 }}>
        <LabelCaps text="Deepscroll" color={colors.lamp} />
        <Text
          style={{
            fontFamily: fonts.serifMedium,
            fontSize: 30,
            lineHeight: 36,
            color: colors.ink,
            marginTop: 16,
          }}
        >
          What are you into?
        </Text>
        <Text
          style={{ fontFamily: fonts.sans, fontSize: 14, color: colors["ink-dim"], marginTop: 8 }}
        >
          Pick topics to personalize your feed.
        </Text>
        <Text
          style={{ fontFamily: fonts.sans, fontSize: 14, color: colors["ink-muted"], marginTop: 4 }}
        >
          {selected.size} selected
        </Text>
      </View>

      {/* Scrollable pill sections */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <Text
            style={{ fontFamily: fonts.sans, fontSize: 14, color: colors["ink-faint"], marginTop: 16 }}
          >
            Loading...
          </Text>
        ) : (
          sections.map((section, index) => (
            <View key={section.label} style={{ marginBottom: 24 }}>
              {index > 0 && (
                <View
                  style={{ borderTopWidth: 1, borderTopColor: colors.edge, marginBottom: 12 }}
                />
              )}
              <View style={{ marginBottom: 12 }}>
                <LabelCaps text={section.label} color={colors["ink-dim"]} />
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {section.items.map((i) => (
                  <Chip
                    key={i.id}
                    name={i.name}
                    isSelected={selected.has(i.slug)}
                    onPress={() => toggle(i.slug)}
                  />
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Bottom bar — fixed, does not scroll */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: insets.bottom + 16,
          borderTopWidth: 1,
          borderTopColor: colors.edge,
          backgroundColor: colors["surface-0"],
        }}
      >
        <Text
          style={{ fontFamily: fonts.sans, fontSize: 14, color: colors["ink-muted"], marginBottom: 12 }}
        >
          {selected.size} of {interests.length} selected
        </Text>
        <PrimaryButton label="Continue" onPress={handleContinue} disabled={!canContinue} />
      </View>
    </View>
  )
}
