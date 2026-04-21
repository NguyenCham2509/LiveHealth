"""
Chat Assistant logic for BMI guidance + meal plan + shoppable products.
"""
from __future__ import annotations

import re
from typing import Any


BMI_LABELS = {
    "underweight": "Thiếu cân",
    "normal": "Bình thường",
    "overweight": "Thừa cân",
    "obese": "Béo phì",
}

GOAL_ALIASES = {
    "gain_weight": ["tang can", "tăng cân", "bulk", "tang co", "tăng cơ"],
    "maintain_weight": ["duy tri", "duy trì", "giu can", "giữ cân", "on dinh", "ổn định"],
    "lose_weight": ["giam can", "giảm cân", "giam mo", "giảm mỡ", "siết cân", "cat can"],
    "eat_healthy": ["an lanh manh", "ăn lành mạnh", "eat clean", "can bang", "cân bằng"],
}

_STOPWORDS = {
    "va",
    "voi",
    "hoac",
    "khong",
    "it",
    "nhieu",
    "mot",
    "mon",
    "bua",
    "sang",
    "trua",
    "toi",
    "phu",
    "ngay",
    "cho",
    "theo",
    "tuan",
    "muc",
    "tieu",
    "de",
    "duoc",
}


def _strip_accents_like(text: str) -> str:
    # Keep this lightweight for keyword matching without extra dependency.
    table = str.maketrans(
        {
            "ă": "a",
            "â": "a",
            "á": "a",
            "à": "a",
            "ả": "a",
            "ã": "a",
            "ạ": "a",
            "ê": "e",
            "é": "e",
            "è": "e",
            "ẻ": "e",
            "ẽ": "e",
            "ẹ": "e",
            "ô": "o",
            "ơ": "o",
            "ó": "o",
            "ò": "o",
            "ỏ": "o",
            "õ": "o",
            "ọ": "o",
            "ư": "u",
            "ú": "u",
            "ù": "u",
            "ủ": "u",
            "ũ": "u",
            "ụ": "u",
            "í": "i",
            "ì": "i",
            "ỉ": "i",
            "ĩ": "i",
            "ị": "i",
            "ý": "y",
            "ỳ": "y",
            "ỷ": "y",
            "ỹ": "y",
            "ỵ": "y",
            "đ": "d",
            "Ă": "A",
            "Â": "A",
            "Ê": "E",
            "Ô": "O",
            "Ơ": "O",
            "Ư": "U",
            "Đ": "D",
        }
    )
    return text.translate(table)


def _normalize_number(value: str) -> float:
    return float(value.replace(",", "."))


def extract_height_cm(text: str) -> float | None:
    if not text:
        return None

    # Pattern like "1m70"
    m = re.search(r"\b([1-2])\s*m\s*([0-9]{2})\b", text.lower())
    if m:
        return float(int(m.group(1)) * 100 + int(m.group(2)))

    # Pattern like "170cm" or "1.70m"
    m = re.search(r"\b([0-9]+(?:[.,][0-9]+)?)\s*(cm|m)\b", text.lower())
    if not m:
        return None

    value = _normalize_number(m.group(1))
    unit = m.group(2)
    if unit == "m":
        if value < 3:
            return value * 100
        return value
    return value


def extract_weight_kg(text: str) -> float | None:
    if not text:
        return None
    m = re.search(r"\b([0-9]+(?:[.,][0-9]+)?)\s*kg\b", text.lower())
    if not m:
        return None
    return _normalize_number(m.group(1))


def extract_age(text: str) -> int | None:
    if not text:
        return None
    m = re.search(r"\b([1-9][0-9]?)\s*tuoi\b", _strip_accents_like(text).lower())
    if m:
        return int(m.group(1))
    return None


def extract_gender(text: str) -> str | None:
    if not text:
        return None
    lowered = _strip_accents_like(text).lower()
    if "nam" in lowered:
        return "male"
    if "nu" in lowered:
        return "female"
    return None


def extract_plan_days(text: str) -> int | None:
    if not text:
        return None

    lowered = _strip_accents_like(text).lower()
    m_days = re.search(r"\b([1-9][0-9]?)\s*ngay\b", lowered)
    if m_days:
        return int(m_days.group(1))

    m_weeks = re.search(r"\b([1-9][0-9]?)\s*tuan\b", lowered)
    if m_weeks:
        return int(m_weeks.group(1)) * 7

    if "theo tuan" in lowered or "1 tuan" in lowered:
        return 7

    return None


def extract_goal(text: str | None) -> str | None:
    if not text:
        return None
    lowered = _strip_accents_like(text).lower()
    for goal_key, aliases in GOAL_ALIASES.items():
        if any(alias in lowered for alias in aliases):
            return goal_key
    return None


def classify_bmi(height_cm: float, weight_kg: float) -> tuple[float, str]:
    h_m = height_cm / 100.0
    bmi = round(weight_kg / (h_m * h_m), 1)
    if bmi < 18.5:
        return bmi, "underweight"
    if bmi < 25:
        return bmi, "normal"
    if bmi < 30:
        return bmi, "overweight"
    return bmi, "obese"


def goal_from_bmi(bmi_category: str) -> str:
    if bmi_category == "underweight":
        return "gain_weight"
    if bmi_category in ("overweight", "obese"):
        return "lose_weight"
    return "maintain_weight"


def build_missing_question(missing_fields: list[str]) -> str:
    if len(missing_fields) == 1 and missing_fields[0] == "height":
        return "Mình cần chiều cao của bạn (cm hoặc m) để tính BMI."
    if len(missing_fields) == 1 and missing_fields[0] == "weight":
        return "Mình cần cân nặng của bạn (kg) để tính BMI."
    return "Mình cần chiều cao (cm/m) và cân nặng (kg) để tính BMI cho bạn."


def build_assessment(bmi: float, bmi_category: str) -> str:
    if bmi_category == "underweight":
        return (
            f"BMI của bạn là {bmi}, thuộc nhóm thiếu cân. "
            "Bạn nên ưu tiên thực phẩm giàu năng lượng sạch, protein và ăn đều bữa."
        )
    if bmi_category == "normal":
        return (
            f"BMI của bạn là {bmi}, thuộc nhóm bình thường. "
            "Bạn nên duy trì chế độ ăn cân bằng và vận động đều."
        )
    if bmi_category == "overweight":
        return (
            f"BMI của bạn là {bmi}, thuộc nhóm thừa cân. "
            "Bạn nên giảm bớt tinh bột nhanh, tăng rau xanh và đạm nạc."
        )
    return (
        f"BMI của bạn là {bmi}, thuộc nhóm béo phì. "
        "Bạn nên kiểm soát khẩu phần, ưu tiên thực phẩm ít năng lượng và vận động phù hợp."
    )


def _normalize_text(text: str) -> str:
    lowered = _strip_accents_like(text or "").lower()
    lowered = re.sub(r"[^a-z0-9\s]", " ", lowered)
    return re.sub(r"\s+", " ", lowered).strip()


def build_shopping_keywords_from_meal_plan(
    meal_plan: list[dict[str, Any]],
    user_message: str = "",
    max_keywords: int = 48,
) -> list[str]:
    """
    Build searchable keywords from generated meal plan text.
    This keeps product matching data-driven from AI-generated meals.
    """
    if max_keywords < 1:
        return []

    phrases: list[str] = []
    token_scores: dict[str, int] = {}

    def add_phrase(value: str):
        phrase = (value or "").strip()
        if phrase:
            phrases.append(phrase)

    def score_text(value: str):
        normalized = _normalize_text(value)
        tokens = [w for w in normalized.split() if len(w) >= 3 and w not in _STOPWORDS and not w.isdigit()]
        for token in tokens:
            token_scores[token] = token_scores.get(token, 0) + 1
        for idx in range(len(tokens) - 1):
            pair = f"{tokens[idx]} {tokens[idx + 1]}"
            token_scores[pair] = token_scores.get(pair, 0) + 2

    for day in meal_plan or []:
        for meal_key in ("breakfast", "lunch", "dinner", "snacks"):
            meal_text = str(day.get(meal_key) or "")
            if not meal_text:
                continue
            add_phrase(meal_text)
            score_text(meal_text)

    if user_message:
        score_text(user_message)

    ranked_tokens = sorted(token_scores.items(), key=lambda item: (-item[1], len(item[0])))

    unique: list[str] = []
    seen: set[str] = set()

    for phrase in phrases:
        key = phrase.lower()
        if key in seen:
            continue
        unique.append(phrase)
        seen.add(key)
        if len(unique) >= max_keywords:
            return unique

    for token, _ in ranked_tokens:
        if token in seen:
            continue
        unique.append(token)
        seen.add(token)
        if len(unique) >= max_keywords:
            break

    return unique


def build_meal_plan_from_products(
    products: list[dict[str, Any]],
    days: int,
) -> list[dict[str, Any]]:
    """
    Fallback meal-plan builder using available DB product names.
    Avoids static hard-coded meal libraries.
    """
    days = max(1, min(int(days or 7), 30))
    names: list[str] = []
    seen: set[str] = set()

    for product in products or []:
        name = str(product.get("name") or "").strip()
        if not name:
            continue
        lowered = name.lower()
        if lowered in seen:
            continue
        seen.add(lowered)
        names.append(name)

    if not names:
        return []

    slots: list[list[str]] = [[], [], [], []]  # breakfast, lunch, dinner, snacks
    for idx, name in enumerate(names):
        slots[idx % 4].append(name)

    for idx in range(4):
        if not slots[idx]:
            slots[idx] = names[:]

    plan: list[dict[str, Any]] = []
    for day_idx in range(days):
        breakfast_main = slots[0][day_idx % len(slots[0])]
        breakfast_side = slots[3][day_idx % len(slots[3])]
        lunch_main = slots[1][day_idx % len(slots[1])]
        lunch_side = slots[2][day_idx % len(slots[2])]
        dinner_main = slots[2][day_idx % len(slots[2])]
        dinner_side = slots[1][(day_idx + 1) % len(slots[1])]
        snack_item = slots[3][(day_idx + 1) % len(slots[3])]

        plan.append(
            {
                "day": day_idx + 1,
                "breakfast": f"{breakfast_main} + {breakfast_side}",
                "lunch": f"{lunch_main} + {lunch_side}",
                "dinner": f"{dinner_main} + {dinner_side}",
                "snacks": snack_item,
            }
        )

    return plan


def extract_unit(name: str) -> str | None:
    if not name:
        return None
    m = re.search(
        r"(\d+\s?(kg|g|gr|ml|l|lit|lít|qua|quả|trai|trái|hop|hộp|goi|gói|chai|hu|hũ))",
        _strip_accents_like(name).lower(),
    )
    if not m:
        return None
    return m.group(1)


def map_product_for_chat(product: dict[str, Any]) -> dict[str, Any]:
    stock = int(product.get("stock", 0) or 0)
    return {
        "id": str(product.get("id")),
        "name": product.get("name"),
        "image": product.get("image"),
        "price": float(product.get("price", 0) or 0),
        "unit": extract_unit(product.get("name", "")),
        "stock": stock,
        "in_stock": stock > 0,
        "availability": "Còn hàng" if stock > 0 else "Hết hàng",
        "category": product.get("category"),
        "brand": product.get("brand"),
    }


def build_chat_message(
    bmi: float,
    bmi_category: str,
    goal: str,
    days: int,
    products_count: int,
) -> str:
    goal_vi = {
        "gain_weight": "tăng cân",
        "maintain_weight": "duy trì cân nặng",
        "lose_weight": "giảm cân",
        "eat_healthy": "ăn lành mạnh",
    }[goal]

    return (
        "Kết quả BMI:\n"
        f"- BMI: {bmi} ({BMI_LABELS[bmi_category]})\n\n"
        "Đánh giá tình trạng cơ thể:\n"
        f"- {build_assessment(bmi, bmi_category)}\n\n"
        "Gợi ý thực đơn/món ăn theo thời gian:\n"
        f"- Mình đã lên thực đơn {days} ngày theo mục tiêu {goal_vi}.\n\n"
        "Danh sách sản phẩm phù hợp từ database:\n"
        f"- Tìm thấy {products_count} sản phẩm liên quan để bạn chọn mua ngay.\n\n"
        "Tùy chọn thêm vào giỏ hàng hoặc chuyển đến giỏ hàng:\n"
        "- Bạn có thể chọn nhiều sản phẩm và thêm vào giỏ trong một lần."
    )


def build_disclaimer(bmi_category: str) -> str:
    if bmi_category in ("obese",):
        return (
            "Lưu ý: Đây là tư vấn dinh dưỡng tham khảo. "
            "Bạn nên trao đổi thêm với bác sĩ/chuyên gia dinh dưỡng để có lộ trình an toàn."
        )
    return (
        "Lưu ý: Đây là tư vấn dinh dưỡng tham khảo, không thay thế chẩn đoán y khoa chuyên sâu."
    )
