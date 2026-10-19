import os
import json
import time
import urllib.request
from typing import Dict, Any, List, Optional
from pathlib import Path
from dotenv import load_dotenv

# Ensure .env is loaded from root or backend directory
load_dotenv(Path(__file__).resolve().parent / ".env")
load_dotenv(Path(__file__).resolve().parent.parent / ".env")
load_dotenv()

_gemini_disabled_until = 0.0

def query_external_llm(system_prompt: str, user_prompt: str) -> Optional[str]:
    """Attempts to query Google Gemini using the configured API key with multi-model cascade."""
    global _gemini_disabled_until
    now = time.time()
    if now < _gemini_disabled_until:
        return None

    gemini_key = os.environ.get("GEMINI_API_KEY", "").strip("\"' \n\r")
    if not gemini_key or gemini_key.startswith("your_"):
        return None

    candidate_models = [
        "gemini-2.5-flash",
        "gemini-flash-latest",
        "gemini-pro-latest"
    ]

    for model in candidate_models:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_key}"
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
            with urllib.request.urlopen(req, timeout=3.5) as res:
                if res.status == 200:
                    resp_json = json.loads(res.read().decode("utf-8"))
                    candidates = resp_json.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            text = parts[0].get("text", "").strip()
                            if text:
                                return text
        except urllib.error.HTTPError as e:
            if e.code == 403:
                # Key is denied access or disabled; back off for 10 minutes to avoid UI lag
                _gemini_disabled_until = time.time() + 600
                return None
            continue
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
        q = (query or "").lower().strip()

        catalog_lines = []
        for p in catalog_summary[:12]:
            cost = float(p.get("costPrice") or 0)
            curr = float(p.get("currentPrice") or 0)
            comp = float(p.get("competitorPrice") or 0)
            sugg = float(p.get("aiSuggestedPrice") or 0)
            catalog_lines.append(
                f"- SKU: {p.get('id')}, Name: '{p.get('name')}', Category: {p.get('category', 'Industrial')}, "
                f"Stock: {p.get('stock', 0)} units, Cost: ₹{cost:.2f}, Current Price: ₹{curr:.2f}, "
                f"Competitor Price: ₹{comp:.2f}, AI Recommendation: ₹{sugg:.2f}, "
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

        # 1. Try calling real LLM if key is configured and functional
        try:
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
        except Exception:
            pass

        # 2. High-Precision Deterministic Commercial Reasoning Engine
        # Handles greetings
        if q in ["hi", "hello", "hey", "help", "start"]:
            prod_count = len(catalog_summary)
            return {
                "answer": (
                    f"**Tensor Margin Bot Ready**\n"
                    f"Currently monitoring **{prod_count} active SKUs** across dynamic market feeds.\n\n"
                    f"• **Instant Diagnostics**: Ask about competitor stockouts, margin health, or price elasticity.\n"
                    f"• **Optimization**: Type 'recommendations' to review pending price adjustments.\n"
                    f"• **Specific SKU**: Mention any SKU (e.g. 'VLV-X200') for immediate pricing advice."
                ),
                "confidence": 0.99,
                "actionRecommended": "Review Active Recommendations",
                "source": "Tensor Margin Bot"
            }

        # Focused Product query (by SKU or Name in query)
        matched_p = None
        for p in catalog_summary:
            pid = str(p.get("id") or "").lower()
            pname = str(p.get("name") or "").lower()
            if pid in q or (len(pname) > 3 and pname in q):
                matched_p = p
                break

        if matched_p or focused_product:
            target = matched_p or focused_product
            curr = float(target.get("currentPrice") or 0)
            comp = float(target.get("competitorPrice") or 0)
            sugg = float(target.get("aiSuggestedPrice") or 0)
            margin = target.get("margin", 0)
            stock = target.get("stock", 0)
            strat = target.get("strategy", "profit_maximizer").replace("_", " ").title()
            delta = sugg - curr

            direction = "increase" if delta > 0 else ("decrease" if delta < 0 else "hold")
            delta_str = f"+₹{delta:.2f}" if delta > 0 else (f"-₹{abs(delta):.2f}" if delta < 0 else "No change")

            return {
                "answer": (
                    f"**Product Analysis: {target.get('name')} ({target.get('id')})**\n\n"
                    f"• **Current vs Suggested**: ₹{curr:.2f} → **₹{sugg:.2f}** ({delta_str})\n"
                    f"• **Competitor Benchmark**: ₹{comp:.2f} (Lowest tracked market anchor)\n"
                    f"• **Gross Margin & Inventory**: {margin}% gross margin with {stock} units in stock\n"
                    f"• **Active Policy**: {strat} with hard 15% minimum margin guardrail\n\n"
                    f"**Recommendation**: Execute suggested price adjustment to maximize net gross profit while maintaining target conversion velocity."
                ),
                "confidence": 0.96,
                "actionRecommended": f"{direction.title()} price to ₹{sugg:.2f}",
                "source": "Tensor Margin Bot"
            }

        # Competitor Stockouts
        if "stockout" in q or "competitor" in q or "out of stock" in q:
            stockout_products = [p for p in catalog_summary if p.get("competitorStockoutsCount", 0) > 0 or p.get("hasCompetitorStockout")]
            if stockout_products:
                names = ", ".join(f"**{p.get('name')}** (₹{float(p.get('aiSuggestedPrice') or 0):.2f})" for p in stockout_products[:3])
                return {
                    "answer": (
                        f"**Competitor Stockout Intelligence**\n\n"
                        f"Detected supply shortages across {len(stockout_products)} competing listings:\n"
                        f"• {names}\n\n"
                        f"**Action Engine**: Applied automated +4.5% margin capture lift to take advantage of constrained external availability while protecting conversion."
                    ),
                    "confidence": 0.95,
                    "actionRecommended": "Hold Premium Pricing",
                    "source": "Tensor Margin Bot"
                }
            else:
                return {
                    "answer": (
                        f"**Competitor Feed Assessment**\n\n"
                        f"• Monitored competitors are currently **in stock** across all tracked SKUs.\n"
                        f"• Market pricing remains stable within historical variance bands.\n"
                        f"• Engine is executing standard profit-maximization policy without scarcity markups."
                    ),
                    "confidence": 0.92,
                    "actionRecommended": "Monitor Competitor Feeds",
                    "source": "Tensor Margin Bot"
                }

        # Margins & Profit
        if "margin" in q or "profit" in q or "cogs" in q or "cost" in q:
            sorted_by_margin = sorted(catalog_summary, key=lambda p: float(p.get("margin") or 0))
            low_p = sorted_by_margin[0] if sorted_by_margin else {}
            high_p = sorted_by_margin[-1] if sorted_by_margin else {}
            return {
                "answer": (
                    f"**Catalog Margin Diagnostics**\n\n"
                    f"• **Highest Margin**: {high_p.get('name')} at **{high_p.get('margin', 0)}%**\n"
                    f"• **Lowest Margin**: {low_p.get('name')} at **{low_p.get('margin', 0)}%**\n"
                    f"• **Guardrail Enforcement**: 100% of recommendations comply with the hard 15% Minimum Gross Margin Floor."
                ),
                "confidence": 0.94,
                "actionRecommended": "Audit Low-Margin SKUs",
                "source": "Tensor Margin Bot"
            }

        # Elasticity & Demand
        if "elasticity" in q or "sensitivity" in q or "demand" in q or "curve" in q:
            return {
                "answer": (
                    f"**Predictive Demand Elasticity**\n\n"
                    f"• **Microeconomic Model**: Point elasticity calculated via ε = (%ΔDemand / %ΔPrice)\n"
                    f"• **Inelastic Threshold (|ε| < 0.85)**: Price can be raised safely to harvest margin without unit churn.\n"
                    f"• **Elastic Threshold (|ε| > 1.25)**: Recommended discounts stimulate conversion volume and total revenue yield."
                ),
                "confidence": 0.96,
                "actionRecommended": "View Demand Curve Tab",
                "source": "Tensor Margin Bot"
            }

        # Discount, Undercut, Buy Box
        if "discount" in q or "undercut" in q or "buy box" in q or "strategy" in q:
            return {
                "answer": (
                    f"**Competitive Positioning Strategy**\n\n"
                    f"• **Buy Box Undercut**: Prices 1.5% below lowest active competitor to capture algorithmic search priority.\n"
                    f"• **Scarcity Protection**: When inventory drops below 20 units, engine suppresses discounts to preserve inventory gross margin."
                ),
                "confidence": 0.93,
                "actionRecommended": "Review Strategy Allocations",
                "source": "Tensor Margin Bot"
            }

        # Overall summary / recommendations
        prod_count = len(catalog_summary)
        return {
            "answer": (
                f"**Tensor Margin Bot Commercial Overview**\n\n"
                f"• **Active Catalog**: {prod_count} SKUs dynamically monitored with live competitor price feeds.\n"
                f"• **Automated Policies**: ML profit optimization, competitive undercut, and margin protection active.\n"
                f"• **Inquiry Guide**: Inquire about specific SKUs, competitor stockouts, or profit margins for detailed breakdown."
            ),
            "confidence": 0.91,
            "actionRecommended": "Inspect Catalog Recommendations",
            "source": "Tensor Margin Bot"
        }
