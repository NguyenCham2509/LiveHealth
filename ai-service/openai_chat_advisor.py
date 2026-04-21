"""
OpenAI Chat Advisor — chat-completion helper for BMI assistant responses.
"""
from __future__ import annotations

import json
import logging
from typing import Any

import requests

logger = logging.getLogger(__name__)

CHAT_MESSAGE_SYSTEM_PROMPT = """Bạn là AI Assistant tư vấn sức khỏe và hỗ trợ mua thực phẩm/dinh dưỡng.
Mục tiêu:
- Trả lời ngắn gọn, dễ hiểu, thân thiện, cá nhân hóa theo dữ liệu người dùng.
- Không chẩn đoán bệnh, không đưa khuyến nghị y khoa chuyên sâu.
- Nếu có rủi ro sức khỏe (đặc biệt béo phì), nhắc người dùng tham khảo bác sĩ/chuyên gia dinh dưỡng.

Bắt buộc trả về JSON hợp lệ, không markdown, không giải thích thêm:
{
  "assistant_message": "..."
}

Nội dung assistant_message phải có đúng 5 phần theo thứ tự:
1) Kết quả BMI
2) Đánh giá tình trạng cơ thể
3) Gợi ý thực đơn/món ăn theo thời gian
4) Danh sách sản phẩm phù hợp từ database
5) Tùy chọn thêm vào giỏ hàng hoặc chuyển đến giỏ hàng
"""

MEAL_PLAN_SYSTEM_PROMPT = """Bạn là chuyên gia dinh dưỡng tạo thực đơn thực tế cho người dùng Việt Nam.
Chỉ trả về JSON hợp lệ, không markdown, không giải thích thêm, theo đúng schema:
{
  "meal_plan": [
    {
      "day": 1,
      "breakfast": "...",
      "lunch": "...",
      "dinner": "...",
      "snacks": "..."
    }
  ]
}

Yêu cầu:
- Tạo đúng số ngày người dùng yêu cầu.
- Món ăn thực tế, dễ mua, dễ nấu, phù hợp mục tiêu dinh dưỡng.
- Không để trống bất kỳ bữa nào.
- Ưu tiên tiếng Việt tự nhiên, ngắn gọn, cụ thể món/nhóm thực phẩm.
"""


def _extract_json_object(text: str) -> dict[str, Any] | None:
    if not text:
        return None

    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`").strip()
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:].strip()

    try:
        data = json.loads(cleaned)
        if isinstance(data, dict):
            return data
    except json.JSONDecodeError:
        pass

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None

    candidate = cleaned[start : end + 1]
    try:
        data = json.loads(candidate)
        if isinstance(data, dict):
            return data
    except json.JSONDecodeError:
        return None

    return None


def _post_chat_completion(
    api_key: str,
    api_base: str,
    model: str,
    messages: list[dict[str, str]],
    temperature: float,
    max_tokens: int,
    timeout: int = 10,
) -> str | None:
    if not api_key or not api_base or not model:
        return None

    url = f"{api_base.rstrip('/')}/chat/completions"
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=timeout)
        response.raise_for_status()
        data = response.json()
        choices = data.get("choices") or []
        if not choices:
            return None
        content = (((choices[0] or {}).get("message") or {}).get("content") or "").strip()
        return content or None
    except Exception as exc:
        logger.warning("OpenAI chat completion failed: %s", exc)
        return None


def _build_user_prompt(context: dict[str, Any]) -> str:
    preview_days = context.get("meal_plan_preview", [])
    products = context.get("product_preview", [])

    preview_days_text = "\n".join(
        [
            f"- Ngày {d.get('day')}: sáng={d.get('breakfast')}; trưa={d.get('lunch')}; tối={d.get('dinner')}; phụ={d.get('snacks')}"
            for d in preview_days
        ]
    )
    if not preview_days_text:
        preview_days_text = "- (Không có dữ liệu)"

    products_text = "\n".join(
        [
            f"- {p.get('name')} | giá={p.get('price')} | đơn vị={p.get('unit') or 'N/A'} | trạng thái={p.get('availability')}"
            for p in products
        ]
    )
    if not products_text:
        products_text = "- (Hiện chưa tìm thấy sản phẩm phù hợp trong database)"

    return (
        "Dữ liệu ngữ cảnh người dùng:\n"
        f"- user_message: {context.get('user_message', '')}\n"
        f"- bmi: {context.get('bmi')}\n"
        f"- bmi_status: {context.get('bmi_status')}\n"
        f"- bmi_category: {context.get('bmi_category')}\n"
        f"- body_assessment: {context.get('body_assessment')}\n"
        f"- nutrition_goal: {context.get('nutrition_goal')}\n"
        f"- plan_days: {context.get('plan_days')}\n"
        f"- total_products_found: {context.get('products_count', 0)}\n\n"
        "Preview thực đơn:\n"
        f"{preview_days_text}\n\n"
        "Preview sản phẩm gợi ý:\n"
        f"{products_text}\n\n"
        "Yêu cầu cách viết:\n"
        "- Dùng tiếng Việt tự nhiên, tối đa khoảng 8-12 dòng.\n"
        "- Nêu rõ BMI số + phân loại.\n"
        "- Nhắc thực đơn theo số ngày cụ thể.\n"
        "- Nêu có thể chọn nhiều sản phẩm và thêm vào giỏ một lượt.\n"
    )


def _build_meal_plan_prompt(context: dict[str, Any]) -> str:
    goal_vi = {
        "gain_weight": "tăng cân",
        "maintain_weight": "duy trì cân nặng",
        "lose_weight": "giảm cân",
        "eat_healthy": "ăn lành mạnh",
    }.get(context.get("nutrition_goal"), "ăn lành mạnh")

    return (
        "Dữ liệu người dùng để sinh thực đơn:\n"
        f"- user_message: {context.get('user_message', '')}\n"
        f"- bmi: {context.get('bmi')}\n"
        f"- bmi_status: {context.get('bmi_status')}\n"
        f"- bmi_category: {context.get('bmi_category')}\n"
        f"- nutrition_goal: {goal_vi}\n"
        f"- plan_days: {context.get('plan_days')}\n"
        f"- age: {context.get('age')}\n"
        f"- gender: {context.get('gender')}\n\n"
        "Hãy tạo thực đơn đầy đủ bữa sáng/trưa/tối/phụ cho từng ngày."
    )


def _normalize_day_item(item: dict[str, Any], day_number: int) -> dict[str, Any] | None:
    breakfast = str(item.get("breakfast") or "").strip()
    lunch = str(item.get("lunch") or "").strip()
    dinner = str(item.get("dinner") or "").strip()
    snacks = str(item.get("snacks") or "").strip()
    if not all([breakfast, lunch, dinner, snacks]):
        return None
    return {
        "day": day_number,
        "breakfast": breakfast,
        "lunch": lunch,
        "dinner": dinner,
        "snacks": snacks,
    }


def _validate_meal_plan(raw_plan: Any, plan_days: int) -> list[dict[str, Any]] | None:
    if not isinstance(raw_plan, list):
        return None

    normalized: list[dict[str, Any]] = []
    for idx, item in enumerate(raw_plan):
        if not isinstance(item, dict):
            continue
        normalized_item = _normalize_day_item(item, idx + 1)
        if normalized_item:
            normalized.append(normalized_item)
        if len(normalized) >= plan_days:
            break

    if not normalized:
        return None

    while len(normalized) < plan_days:
        seed = normalized[len(normalized) % len(normalized)]
        normalized.append(
            {
                "day": len(normalized) + 1,
                "breakfast": seed["breakfast"],
                "lunch": seed["lunch"],
                "dinner": seed["dinner"],
                "snacks": seed["snacks"],
            }
        )

    return normalized


def generate_meal_plan(
    api_key: str,
    api_base: str,
    model: str,
    context: dict[str, Any],
) -> list[dict[str, Any]] | None:
    """
    Generate dynamic meal plan using OpenAI-compatible chat API.
    Returns None when unavailable/error so caller can fallback safely.
    """
    if not api_key or not api_base or not model:
        return None

    plan_days = max(1, min(int(context.get("plan_days") or 7), 30))
    user_prompt = _build_meal_plan_prompt({**context, "plan_days": plan_days})

    content = _post_chat_completion(
        api_key=api_key,
        api_base=api_base,
        model=model,
        messages=[
            {"role": "system", "content": MEAL_PLAN_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.7,
        max_tokens=min(2200, 180 * plan_days + 500),
        timeout=15,
    )
    if not content:
        return None

    parsed = _extract_json_object(content)
    meal_plan = _validate_meal_plan((parsed or {}).get("meal_plan"), plan_days) if parsed else None
    if meal_plan:
        return meal_plan

    retry_content = _post_chat_completion(
        api_key=api_key,
        api_base=api_base,
        model=model,
        messages=[
            {"role": "system", "content": MEAL_PLAN_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"{user_prompt}\n\n"
                    "Lưu ý thêm: bắt buộc trả đúng JSON schema {\"meal_plan\":[...]}."
                ),
            },
        ],
        temperature=0.3,
        max_tokens=min(2200, 180 * plan_days + 500),
        timeout=15,
    )
    if not retry_content:
        return None

    retry_parsed = _extract_json_object(retry_content)
    return _validate_meal_plan((retry_parsed or {}).get("meal_plan"), plan_days) if retry_parsed else None


def generate_chat_message(
    api_key: str,
    api_base: str,
    model: str,
    context: dict[str, Any],
) -> str | None:
    """
    Generate assistant message from OpenAI-compatible Chat Completions API.
    Returns None when unavailable/error so caller can fallback.
    """
    content = _post_chat_completion(
        api_key=api_key,
        api_base=api_base,
        model=model,
        messages=[
            {"role": "system", "content": CHAT_MESSAGE_SYSTEM_PROMPT},
            {"role": "user", "content": _build_user_prompt(context)},
        ],
        temperature=0.4,
        max_tokens=900,
        timeout=8,
    )
    if not content:
        return None

    parsed = _extract_json_object(content)
    if parsed and isinstance(parsed.get("assistant_message"), str):
        return parsed["assistant_message"].strip()

    return content
