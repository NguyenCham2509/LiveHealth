"""
Gemini Advisor — LLM-powered nutrition advice using Google Gemini
"""
import json
import logging

try:
    from google import genai
except ImportError:
    genai = None

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """Bạn là chuyên gia dinh dưỡng AI của LiveHealth — cửa hàng thực phẩm sạch online.

Nhiệm vụ: Dựa vào chỉ số sức khỏe của khách hàng và danh sách sản phẩm có sẵn trong cửa hàng, 
hãy đưa ra lời khuyên dinh dưỡng cá nhân hóa bằng tiếng Việt.

Quy tắc:
1. Trả lời bằng tiếng Việt, giọng thân thiện nhưng chuyên nghiệp
2. Dựa trên bằng chứng y khoa
3. CHỈ gợi ý sản phẩm CÓ TRONG danh sách cửa hàng (đừng bịa tên sản phẩm)
4. Trả về JSON hợp lệ theo format yêu cầu"""


def build_user_prompt(health_data: dict, product_catalog: str) -> str:
    return f"""Khách hàng có chỉ số sức khỏe:
- BMI: {health_data['bmi']} ({health_data['bmi_status']})
- BMR: {health_data['bmr']} kcal/ngày
- TDEE: {health_data['tdee']} kcal/ngày  
- Lượng calo cần: {health_data['daily_calories']} kcal/ngày
- Protein: {health_data['protein_g']}g | Carbs: {health_data['carbs_g']}g | Fat: {health_data['fat_g']}g
- Giới tính: {"Nam" if health_data.get("gender","").lower() == "male" else "Nữ"}
- Tuổi: {health_data.get("age", "N/A")}

Danh sách sản phẩm có trong cửa hàng LiveHealth:
{product_catalog}

Hãy trả về JSON (KHÔNG markdown, KHÔNG ```json```) với format:
{{
  "advice": "Lời khuyên dinh dưỡng chi tiết 3-5 câu dựa trên chỉ số sức khỏe",
  "meal_plan": {{
    "breakfast": "Gợi ý bữa sáng",
    "lunch": "Gợi ý bữa trưa", 
    "dinner": "Gợi ý bữa tối",
    "snacks": "Gợi ý bữa phụ"
  }},
  "diet_tips": ["Mẹo 1", "Mẹo 2", "Mẹo 3", "Mẹo 4", "Mẹo 5"],
  "recommended_foods": ["tên sản phẩm 1", "tên sản phẩm 2", "...(8-12 sản phẩm từ danh sách cửa hàng)"]
}}"""


def get_advice(api_key: str, health_data: dict, product_catalog: str) -> dict:
    """Call Gemini API for personalized nutrition advice."""
    if not api_key or api_key == "your_gemini_api_key_here":
        logger.warning("Gemini API key not configured, using fallback advice")
        return _fallback_advice(health_data)
    if genai is None:
        logger.warning("Gemini SDK not installed, using fallback advice")
        return _fallback_advice(health_data)

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=build_user_prompt(health_data, product_catalog),
            config=genai.types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.7,
                max_output_tokens=2048,
            ),
        )

        text = response.text.strip()
        # Clean markdown code blocks if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
        text = text.strip()

        result = json.loads(text)
        logger.info("Gemini advice generated successfully")
        return result

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Gemini response: {e}")
        logger.debug(f"Raw response: {text[:500]}")
        return _fallback_advice(health_data)
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        return _fallback_advice(health_data)


def _fallback_advice(health_data: dict) -> dict:
    """Fallback when Gemini is unavailable."""
    category = health_data.get("bmi_category", "normal")

    advice_map = {
        "underweight": "Bạn đang thiếu cân. Cần tăng cường protein và calo từ thực phẩm giàu dinh dưỡng.",
        "normal": "Thể trạng của bạn ở mức lý tưởng. Duy trì chế độ ăn cân bằng.",
        "overweight": "Bạn đang thừa cân. Giảm tinh bột, tăng rau xanh và protein nạc.",
        "obese": "Cần kiểm soát cân nặng. Tăng cường rau xanh, hoa quả ít đường.",
    }

    tips_map = {
        "underweight": ["Ăn 5-6 bữa nhỏ/ngày", "Bổ sung protein sau tập", "Uống sinh tố trái cây", "Ăn hạt dinh dưỡng", "Tránh uống nước trước bữa ăn"],
        "normal": ["Ăn đa dạng 5 nhóm thực phẩm", "Uống 2L nước/ngày", "Ăn nhiều rau và trái cây", "Hạn chế đồ chế biến sẵn", "Tập thể dục 30 phút/ngày"],
        "overweight": ["Giảm tinh bột 30%", "Thay thịt đỏ bằng cá", "Ăn salad trước bữa chính", "Tránh ăn sau 20:00", "Đi bộ 45 phút/ngày"],
        "obese": ["Bỏ đồ chiên, nước ngọt", "Ăn nhiều rau xanh", "Protein ít béo: ức gà, cá", "Uống nước chanh buổi sáng", "Tập 60 phút/ngày"],
    }

    return {
        "advice": advice_map.get(category, advice_map["normal"]),
        "meal_plan": {
            "breakfast": "Yến mạch + trái cây + sữa",
            "lunch": "Cơm + thịt/cá + rau xanh",
            "dinner": "Salad + protein nạc",
            "snacks": "Hạt, sữa chua, trái cây",
        },
        "diet_tips": tips_map.get(category, tips_map["normal"]),
        "recommended_foods": [],
    }
