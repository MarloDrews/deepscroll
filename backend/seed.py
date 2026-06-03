import json
import os

from app.database import Base, SessionLocal, engine
from app.models import Interest, Post, User, post_interests

Base.metadata.create_all(bind=engine)

SLUGS = [
    "physics", "quantum-physics", "astronomy", "cosmology", "chemistry",
    "biology", "genetics", "neuroscience", "evolution", "ecology", "climate",
    "geology", "oceans", "animals", "mathematics", "statistics", "medicine",
    "materials-science", "artificial-intelligence", "machine-learning",
    "computing", "internet", "cybersecurity", "robotics", "biotech",
    "space-tech", "energy-tech", "engineering", "gadgets", "cryptography",
    "blockchain", "aviation", "transportation", "economics",
    "behavioral-economics", "finance", "entrepreneurship", "startups",
    "marketing", "management", "negotiation", "money-history", "markets",
    "career", "productivity-work", "supply-chains", "advertising",
    "psychology", "cognitive-biases", "habits", "productivity", "focus",
    "motivation", "decision-making", "emotional-intelligence", "mental-health",
    "mindfulness", "happiness", "relationships", "communication", "learning",
    "discipline", "confidence", "stoicism-practice", "philosophy", "ethics",
    "stoicism", "existentialism", "eastern-philosophy", "logic", "epistemology",
    "consciousness", "free-will", "political-philosophy", "philosophy-of-mind",
    "meaning", "mental-models", "ancient-history", "medieval-history",
    "modern-history", "world-wars", "cold-war", "empires", "revolutions",
    "ancient-egypt", "ancient-rome", "ancient-greece", "exploration",
    "archaeology", "history-of-science", "forgotten-history", "military-history",
    "politics", "geopolitics", "political-systems", "democracy", "law",
    "human-rights", "social-movements", "inequality", "propaganda", "diplomacy",
    "elections", "public-policy", "art-history", "music", "music-theory",
    "literature", "film", "architecture", "design", "photography", "writing",
    "mythology", "religion", "language", "poetry", "theater", "nutrition",
    "fitness", "sleep", "longevity", "human-body", "brain-health", "immunity",
    "public-health", "sports-science", "everyday-science", "food-science",
    "games", "sports", "travel", "nature-phenomena", "curiosities", "future",
    "internet-culture", "crime", "money-everyday", "history", "anthropology",
    "exponential-growth", "patience", "critical-thinking", "trade-offs",
    "scarcity",
]

NAME_EXCEPTIONS = {
    "money-everyday": "Personal Finance",
}


def slug_to_name(slug):
    if slug in NAME_EXCEPTIONS:
        return NAME_EXCEPTIONS[slug]
    return slug.replace("-", " ").title()


db = SessionLocal()

# Phase 1: get-or-create interests (idempotent — skips slugs already in DB)
created_count = 0
for slug in SLUGS:
    if db.query(Interest).filter_by(slug=slug).first() is None:
        db.add(Interest(name=slug_to_name(slug), slug=slug))
        created_count += 1
db.commit()

# Phase 2: clear posts, then reseed from seed_content.json
db.execute(post_interests.delete())
db.query(Post).delete()
db.commit()

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
json_path = os.path.join(project_root, "seed_content.json")
with open(json_path, encoding="utf-8") as f:
    data = json.load(f)

post_count = 0
for item in data["posts"]:
    interests = []
    for slug in item.get("interests", []):
        interest = db.query(Interest).filter_by(slug=slug).first()
        if interest is None:
            print(f"Warning: interest slug '{slug}' not found in DB, skipping")
        else:
            interests.append(interest)

    post = Post(
        format=item["format"],
        title=item["title"],
        body=item.get("body", ""),
        source=item.get("source"),
        hook=item.get("hook"),
        key_points=item.get("key_points"),
        takeaway=item.get("takeaway"),
        source_url=item.get("source_url"),
        image_url=item.get("image_url"),
        image_attribution=item.get("image_attribution"),
        details=item.get("details"),
        interests=interests,
    )
    db.add(post)
    post_count += 1

db.commit()

# Phase 3: assign seed posts to Marlo's account and set is_verified=True
marlo = db.query(User).filter_by(email="marlo07drews@gmail.com").first()
if marlo:
    marlo.is_verified = True
    db.query(Post).filter(Post.author_id == None).update({"author_id": marlo.id})
    db.commit()
    print(f"Assigned seed posts to user {marlo.id} (@{marlo.username}) and set is_verified=True")
else:
    print("marlo07drews@gmail.com not found — seed posts remain unassigned")

db.close()

print(f"Seeded {created_count} interests, {post_count} posts")
