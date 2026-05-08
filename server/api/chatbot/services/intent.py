def detect_intents(message: str):
    msg = message.lower()

    intents_map = {
        "bill": ["bill", "bills", "invoice", "due"],
        "payment": ["payment", "payments", "paid", "expense", "spend"],
        "voucher": ["voucher", "discount", "promo"],
        "pending": ["pending", "approve", "approval", "waiting"],
        "relation": ["belong", "belongs", "related", "under", "linked", "for"]
    }

    detected = []

    for intent, keywords in intents_map.items():
        for word in keywords:
            if word in msg:   # ✅ CHANGE HERE
                detected.append(intent)
                break

    detected = list(set(detected))
    
    if "relation" in detected and not any(x in detected for x in ["bill", "payment", "voucher"]):
        return ["bill", "payment", "voucher"]
    # handle "all X and Y"
    return detected


def is_format_followup(message: str):
    msg = message.lower()

    format_words = [
        "emoji", "emojis", "format", "reformat", "rewrite",
        "make it", "more good", "better", "clearer", "organize",
        "section", "sections", "one section", "each bill",
        "bullet", "bullets", "table"
    ]

    data_request_words = [
        "show", "display", "list", "find", "search", "get",
        "fetch", "which", "what", "how many", "total"
    ]

    has_format_word = any(word in msg for word in format_words)
    asks_for_new_data = any(word in msg for word in data_request_words)

    return has_format_word and not asks_for_new_data


def resolve_finance_followup(message: str, history):
    msg = message.lower()
    current_intents = detect_intents(msg)
    has_data_intent = any(
        intent in current_intents
        for intent in ["bill", "payment", "voucher"]
    )

    reference_words = [
        "it", "them", "that", "those", "these",
        "this", "one", "ones", "show them", "show it"
    ]

    if has_data_intent or not any(word in msg for word in reference_words):
        return msg

    topic_words = []

    for item in reversed(history):
        content = (item.get("content") or "").lower()
        previous_intents = detect_intents(content)

        if "bill" in previous_intents:
            topic_words.append("bill")
        elif "payment" in previous_intents:
            topic_words.append("payment")
        elif "voucher" in previous_intents:
            topic_words.append("voucher")

        if "pending" in previous_intents:
            topic_words.append("pending approval")

        if topic_words:
            break

    if not topic_words:
        return msg

    return f"{msg} {' '.join(topic_words)}"
