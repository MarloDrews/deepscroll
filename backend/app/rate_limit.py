from collections import defaultdict
from datetime import datetime
from typing import Dict, List

from fastapi import HTTPException

_counters: Dict[str, List[float]] = defaultdict(list)


def check_rate_limit(user_id: int, key: str, max_count: int, window_seconds: int) -> None:
    now = datetime.utcnow().timestamp()
    bucket = f"{user_id}:{key}"
    cutoff = now - window_seconds
    _counters[bucket] = [t for t in _counters[bucket] if t > cutoff]
    if len(_counters[bucket]) >= max_count:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    _counters[bucket].append(now)
