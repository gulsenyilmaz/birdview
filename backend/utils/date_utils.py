def year_from_time(t: str | None) -> int | None:
    try:
        if not t:
            return None
        # "+1955-00-00T00:00:00Z"
        return int(t[:5])
    except Exception:
        return None
    
