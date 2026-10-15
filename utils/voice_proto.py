import re

KEYWORD_MAP = {
    "maintenance": ["tap", "water", "pipe", "broken", "leak", "door", "lock", "light", "fan", "switch", "repair", "kharab", "paani", "bijli"],
    "grocery": ["medicine", "pharmacy", "dawa", "milk", "bread", "vegetable", "grocery", "ration", "fruits", "dukaan"],
    "utility": ["bill", "electricity", "water bill", "recharge", "gas", "cylinder", "payment"],
    "errand": ["bank", "post office", "courier", "document", "pension", "walk"]
}

PRIORITY_MAP = {
    "High": ["broken", "leak", "urgent", "emergency", "kharab", "turant", "medicine", "dawa", "severe"],
    "Medium": ["bill", "grocery", "milk", "ration", "repair"],
    "Low": ["walk", "bank", "courier", "document"]
}

def parse_voice_or_text_request(transcript):
    """
    Parse natural language text or voice transcript into structured request parameters.
    Example: "Bathroom ka tap kharab hai" -> Category: Maintenance, Priority: High
    """
    text = transcript.lower()

    # Determine Category
    detected_category = "Other"
    for cat, keywords in KEYWORD_MAP.items():
        if any(kw in text for kw in keywords):
            detected_category = cat.capitalize()
            break

    # Determine Priority
    detected_priority = "Medium"
    for prio, keywords in PRIORITY_MAP.items():
        if any(kw in text for kw in keywords):
            detected_priority = prio
            break

    # Generate Clean Title
    title = transcript.strip().capitalize()

    return {
        "transcript": transcript,
        "title": title,
        "category": detected_category,
        "priority": detected_priority,
        "notes": f"Generated via Voice/Text Prototype input: '{transcript}'"
    }

parse_voice_text = parse_voice_or_text_request
