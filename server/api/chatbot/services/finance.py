import re
from server.api.chatbot.services.intent import detect_intents


# ---------------- STOPWORDS ----------------
STOPWORDS = {
    "all", "list", "lists",

    "the", "a", "an", "is", "are",
    "show", "display", "give", "can", "you", "u",
    "how", "many", "much", "count", "number",
    "need", "needs", "want", "wants", "please",
    "financial", "records", "record", "data",
    "related", "to", "that", "of", "for",
    "it", "them", "those", "these", "this", "one", "ones",

    "bill", "bills",
    "voucher", "vouchers",
    "payment", "payments",

    "pending", "approve", "approves", "approval", "approved",
    "waiting", "wait", "status",

    "and", "or", "with", "about"
}

FORMAT_WORDS = {
    "point", "form", "table", "display",
    "format", "style", "using", "markdown"
}

# ---------------- EXTRACT KEYWORDS ----------------
def extract_keywords(msg: str):
    msg = msg.lower()
    words = re.findall(r"\b\w+\b", msg)
    return [w for w in words if w not in STOPWORDS]


# ---------------- FILTER FUNCTION ----------------
def filter_by_keywords(items, keywords):
    if not keywords:
        return items

    filtered = []
    for item in items:
        desc = (item.get("description") or "").lower()

        if any(k in desc for k in keywords):
            filtered.append(item)

    return filtered


# ---------------- MAIN FUNCTION ----------------
def fetch_finance(cursor, user_id, msg):

    # ---------------- GET ROLES ----------------
    cursor.execute("""
        SELECT r."roleName"
        FROM userrole ur
        JOIN role r ON ur."userRoleRoleID" = r."roleID"
        WHERE ur."userRoleUserID" = %s
    """, (user_id,))

    roles = [row["roleName"].lower() for row in cursor.fetchall()]
    is_admin = "admin" in roles
    is_staff = "staff" in roles
    print("DEBUG userID:", user_id)
    print("DEBUG roles:", roles)
    print("DEBUG is_admin:", is_admin)
    print("DEBUG is_staff:", is_staff)

    # ---------------- INTENTS ----------------
    intents = detect_intents(msg)
    print("Detected intents:", intents)

    # ---------------- FALLBACK RULE ----------------
    if not intents and "all" in msg.lower():
        intents = ["bill", "payment", "voucher"]

    result = {}

    # ======================================================
    # BILL
    # ======================================================
    if "bill" in intents:
        if is_admin:
            cursor.execute("""
                SELECT * FROM bill
                WHERE "billApprovalStatus" = 'Pending'
            """)
            result["bills"] = cursor.fetchall()
        elif is_staff:
            cursor.execute("""
                SELECT * FROM bill
                WHERE "billCreatorID" = %s
            """, (user_id,))
            result["bills"] = cursor.fetchall()
        else:
            cursor.execute("""
                SELECT * FROM bill
                WHERE "billPayerID" = %s
            """, (user_id,))
            result["bills"] = cursor.fetchall()

    # ======================================================
    # VOUCHER
    # ======================================================
    if "voucher" in intents:
        if is_admin:
            cursor.execute("""
                SELECT * FROM voucher
                WHERE "voucherStatus" = 'Pending'
            """)
            result["vouchers"] = cursor.fetchall()
        elif is_staff:
            cursor.execute("""
                SELECT * FROM voucher
                WHERE "voucherCreatorID" = %s
            """, (user_id,))
            result["vouchers"] = cursor.fetchall()
        else:
            cursor.execute("""
                SELECT * FROM voucher
                WHERE "voucherBillID" IN (
                    SELECT "billID" FROM bill WHERE "billPayerID" = %s
                )
            """, (user_id,))
            result["vouchers"] = cursor.fetchall()
            
    # ======================================================
    # PAYMENT
    # ======================================================
    if "payment" in intents:
        if is_staff:
            cursor.execute("""
                SELECT * FROM payment
                WHERE "paymentBillID" IN (
                    SELECT "billID" FROM bill WHERE "billCreatorID" = %s
                )
            """, (user_id,))
            result["payments"] = cursor.fetchall()
        else:
            cursor.execute("""
                SELECT * FROM payment
                WHERE "paymentPayerID" = %s
            """, (user_id,))
            result["payments"] = cursor.fetchall()

    # ======================================================
    # 🔥 KEYWORD FILTER (IMPORTANT FIX)
    # ======================================================
    keywords = [
        k for k in extract_keywords(msg)
        if k not in FORMAT_WORDS
    ]
    print("DEBUG keywords:", keywords)

    # detect if user REALLY wants filtering
    has_filter = len(keywords) > 0 and "all" not in msg.lower()

    # 🔥 only filter when meaningful keywords exist
    if has_filter:
        print("Applying keyword filter...")

        if "bills" in result:
            result["bills"] = filter_by_keywords(result["bills"], keywords)

        if "vouchers" in result:
            result["vouchers"] = filter_by_keywords(result["vouchers"], keywords)

        if "payments" in result:
            result["payments"] = filter_by_keywords(result["payments"], keywords)

    else:
        print("No meaningful keywords → skip filtering")

    print("FINAL FILTERED RESULT:", result)

    return result
