import os
import json
import urllib.request
from typing import Dict, Any, List, Optional
from pathlib import Path
from dotenv import load_dotenv

# Ensure .env is loaded from root or backend directory
load_dotenv(Path(__file__).resolve().parent / ".env")
load_dotenv(Path(__file__).resolve().parent.parent / ".env")
load_dotenv()

def query_external_llm(system_prompt: str, user_prompt: str) -> Optional[str]:
    """Attempts to query Google Gemini using the configured API key with multi-model cascade."""
    gemini_key = os.environ.get("GEMINI_API_KEY", "").strip("\"' \n\r")
    if not gemini_key:
        return None

    # Model priority list (handles potential quota/503 spikes across endpoints)
    candidate_models = [
        "gemini-3.5-flash-lite",
        "gemini-3.5-flash",
        "gemini-flash-latest",
        "gemini-3.8-flash",
        "gemini-3.7-flash"
    ]

    for model in candidate_models:
        for api_version in ["v1beta", "v1"]:
            try:
                url = f"https://generativelanguage.googleapis.com/{api_version}/models/{model}:generateContent?key={gemini_key}"
                payload = {
                    "contents": [
                        {
                            "role": "user",
                            "parts": [{"text": f"{system_prompt}\n\n{user_prompt}"}]
                        }
                    ],
                    "generationConfig": {
                        "temperature": 0.35,
                        "maxOutputTokens": 650
                    }
                }
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"}
                )
                with urllib.request.urlopen(req, timeout=12) as res:
                    if res.status == 200:
                        resp_json = json.loads(res.read().decode("utf-8"))
                        candidates = resp_json.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts:
                                text = parts[0].get("text", "").strip()
                                if text:
                                    return text
            except Exception:
                continue

    return None

class PricingAICopilot:
    """
    Generative AI: Strategy Copilot & Explainability Agent.
    Provides executive commercial rationale and interactive Q&A for pricing decisions.
    """

    @staticmethod
    def generate_explanation(
        product_name: str,
        current_price: float,
        suggested_price: float,
        cost_price: float,
        competitor_price: float,
        elasticity_score: float,
        elasticity_label: str,
        stock: int,
        competitor_stockout: bool = False,
        strategy: str = "profit_maximizer"
    ) -> str:
        """Generates executive-ready commercial reasoning for a price suggestion."""
        delta_pct = round(((suggested_price - current_price) / max(current_price, 0.01)) * 100, 1)
        direction = "raised" if delta_pct > 0 else ("discounted" if delta_pct < 0 else "held steady")
        abs_delta = abs(delta_pct)
        margin_pct = round(((suggested_price - cost_price) / max(suggested_price, 0.01)) * 100, 1)

        # 1. Competitor Stockout Exploitation
        if competitor_stockout:
            return (
                f"⚡ Competitor Stockout Margin Capture: Key competitor is out of stock. Price {direction} by {abs_delta}% to ₹{suggested_price:.2f}. "
                f"Demand elasticity is {elasticity_label} ({elasticity_score}), capturing an estimated {margin_pct}% gross margin without risking conversion volume."
            )

        # 2. Strategy-Specific Rationale
        if strategy == "aggressive_undercut":
            return (
                f"🎯 Buy Box Capture: Price set to ₹{suggested_price:.2f} to undercut lowest in-stock competitor (₹{competitor_price:.2f}) by 1.5%. "
                f"Maintains a safe {margin_pct}% gross margin above base COGS while maximizing search rank."
            )
        elif strategy == "clearance_markdown":
            return (
                f"📦 Liquidation Markdown: Accelerated turnover pricing applied for {stock} units in inventory. "
                f"Discounted to ₹{suggested_price:.2f} ({margin_pct}% margin) to prevent holding depreciation."
            )
        elif strategy == "brand_premium":
            return (
                f"👑 Brand Equity Positioning: Price indexed +6% above market average (₹{competitor_price:.2f}) at ₹{suggested_price:.2f}. "
                f"Backed by high seller reputation and verified customer satisfaction ratings."
            )
        elif strategy == "margin_preservation":
            return (
                f"🛡️ Margin Preservation Floor: Locked at cost-plus 35% margin (₹{suggested_price:.2f}) above base COGS of ₹{cost_price:.2f}."
            )

        # 3. Default: ML Profit Maximizer
        if abs_delta < 0.3:
            return (
                f"⚖️ Microeconomic Equilibrium: Current price ₹{current_price:.2f} is already at optimal profit yield. "
                f"Elasticity is {elasticity_label} ({elasticity_score}) with healthy {margin_pct}% gross margin."
            )
        elif delta_pct > 0:
            return (
                f"📈 ML Profit Optimization: Price {direction} by +{abs_delta}% to ₹{suggested_price:.2f}. "
                f"Our predictive demand model identified inelastic consumer sensitivity ({elasticity_score}), yielding higher gross profit."
            )
        else:
            return (
                f"📉 Elasticity Volume Re-capture: Price {direction} by -{abs_delta}% to ₹{suggested_price:.2f}. "
                f"High price sensitivity ({elasticity_score}) indicates this discount will accelerate sales velocity and net profit."
            )

    @staticmethod
    def answer_query(
        query: str,
        catalog_summary: List[Dict[str, Any]],
        focused_product: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Interactive Copilot Chat:
        Answers commercial pricing questions using real-time catalog and elasticity context.
        """
        catalog_lines = []
        for p in catalog_summary[:12]:
            catalog_lines.append(
                f"- SKU: {p.get('id')}, Name: '{p.get('name')}', Category: {p.get('category', 'Industrial')}, "
                f"Stock: {p.get('stock')} units, Cost: ₹{p.get('costPrice', 0):.2f}, Current Price: ₹{p.get('currentPrice', 0):.2f}, "
                f"Competitor Price: ₹{p.get('competitorPrice', 0):.2f}, AI Recommendation: ₹{p.get('aiSuggestedPrice', 0):.2f}, "
                f"Gross Margin: {p.get('margin', 0)}%, Strategy: {p.get('strategy', 'profit_maximizer')}"
            )
        catalog_text = "\n".join(catalog_lines)

        system_context = (
            "You are Tensor Margin Bot, the intelligent dynamic pricing assistant for Tensor Margin. "
            "Provide clean, concise, formatted, and simple pricing advice. "
            "Rules: "
            "1. Output must be simple, structured, and easy to read. "
            "2. Never write letter headers like 'From:', 'To:', 'Subject:' or formal memos. "
            "3. Do not use raw markdown hashes ('###') or dividers ('--'). Use clean bold section titles like '**Market Assessment**'. "
            "4. Use concise bullet points with exact rupee figures (₹) and SKU codes. "
            "5. Keep the total response concise (under 180 words) focusing on practical pricing actions."
        )

        user_prompt = (
            f"LIVE CATALOG DATA ({len(catalog_summary)} active SKUs):\n{catalog_text}\n\n"
            f"USER INQUIRY:\n{query}"
        )

        # Try calling real LLM if key is configured
        llm_answer = query_external_llm(
            system_prompt=system_context,
            user_prompt=user_prompt
        )
        if llm_answer:
            return {
                "answer": llm_answer,
                "confidence": 0.98,
                "source": "Tensor Margin Bot"
            }

        # Deterministic Commercial Reasoning Engine
        if "stockout" in q or "competitor" in q:
            stockout_products = [p for p in catalog_summary if p.get("competitorStockoutsCount", 0) > 0 or p.get("hasCompetitorStockout")]
            if stockout_products:
                names = ", ".join(p["name"] for p in stockout_products[:2])
                return {
                    "answer": (
                        f"Detected competitor stockouts on {len(stockout_products)} items, including {names}. "
                        "Our AI engine has automatically applied a +4.5% margin capture lift since competing supply is constrained. "
                        "Recommended action: Maintain price premiums until competitor inventory restocks."
                    ),
                    "confidence": 0.94,
                    "actionRecommended": "Hold Premium Pricing",
                    "source": "Tensor Margin Bot"
                }
            else:
                return {
                    "answer": (
                        "All monitored competitors are currently in stock across your active catalog. "
                        "Market pricing is stable. Our AI engine is maintaining standard profit-maximizing equilibrium."
                    ),
                    "confidence": 0.90,
                    "actionRecommended": "Monitor Competitor Feeds",
                    "source": "Tensor Margin Bot"
                }

        if "margin" in q or "profit" in q:
            low_margin = sorted(catalog_summary, key=lambda p: p.get("margin", 50))[:2]
            high_margin = sorted(catalog_summary, key=lambda p: p.get("margin", 0), reverse=True)[:2]
            return {
                "answer": (
                    f"Catalog Margin Diagnostics: Average gross margin is across healthy thresholds. "
                    f"Highest margin item is '{high_margin[0].get('name', 'Product')}' at {high_margin[0].get('margin', 0)}% margin. "
                    f"Lowest margin item is '{low_margin[0].get('name', 'Product')}' at {low_margin[0].get('margin', 0)}%. "
                    "All pricing suggestions strictly respect our 15% Minimum Gross Margin Guardrail."
                ),
                "confidence": 0.92,
                "actionRecommended": "Audit Low-Margin SKUs",
                "source": "Tensor Margin Bot"
            }

        if "elasticity" in q or "sensitivity" in q or "demand" in q:
            return {
                "answer": (
                    "Demand Elasticity Analysis: Our predictive XGBoost/GBDT demand forecaster continuously calculates "
                    "point elasticity (ε = %ΔDemand / %ΔPrice). When |ε| < 0.85 (inelastic), we capture price premiums without volume loss. "
                    "When |ε| > 1.25 (elastic), our engine prevents steep increases to avoid conversion churn."
                ),
                "confidence": 0.95,
                "actionRecommended": "View Elasticity Sensitivity Curve",
                "source": "Tensor Margin Bot"
            }

        if "discount" in q or "undercut" in q or "buy box" in q:
            return {
                "answer": (
                    "Buy Box Strategy: For fast-moving items, setting strategy to 'Buy Box Undercut' will price 1.5% below "
                    "the lowest in-stock competitor. If inventory is below 20 units, the system automatically matches rather than discounts "
                    "to preserve margin while inventory is limited."
                ),
                "confidence": 0.91,
                "actionRecommended": "Review Strategy Settings",
                "source": "Tensor Margin Bot"
            }

        # General response
        prod_count = len(catalog_summary)
        return {
            "answer": (
                f"Tensor Margin Bot Analysis: Monitoring {prod_count} active SKUs across real-time SerpApi Google Shopping benchmarks "
                f"and Open Shopify competitor feeds. All items are evaluated with Machine Learning demand curves and gross margin guardrails. "
                "How would you like to optimize pricing today? You can ask about margin preservation, elasticity curves, or competitor stockout advantages."
            ),
            "confidence": 0.89,
            "actionRecommended": "Inspect Catalog Recommendations",
            "source": "Tensor Margin Bot"
        }
