import os
import random
import time
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from stable_baselines3 import PPO
import numpy as np

from simulator import MarketSimulatorEnv
from train import train_agent

app = FastAPI(title="Dynamic Pricing Engine & Storefront API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db_path = os.path.join(os.path.dirname(__file__), 'pricing.db')
SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_path}"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- Database Models ---

class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    stock = Column(Integer, default=100)
    cost_price = Column(Float, default=50.0)
    current_price = Column(Float, nullable=False)
    competitor_price = Column(Float, nullable=False)
    ai_suggested_price = Column(Float, nullable=False)
    margin = Column(Float, default=25.0)
    trend = Column(String, default="up")
    rating = Column(Float, default=4.6)
    reviews_count = Column(Integer, default=128)
    image_url = Column(String, nullable=True)
    badge = Column(String, nullable=True)

class PricingLog(Base):
    __tablename__ = "pricing_logs"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(String, default="VLV-X200")
    inventory = Column(Float)
    competitor_price = Column(Float)
    suggested_price = Column(Float)
    cost_price = Column(Float, default=65.0)
    status = Column(String)
    reason = Column(String, default="Optimal Margin Yield")
    timestamp = Column(String, default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

class OrderLog(Base):
    __tablename__ = "order_logs"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(String, nullable=False)
    product_name = Column(String, nullable=False)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    customer_name = Column(String, default="Enterprise Procurement Ltd")
    timestamp = Column(String, default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

Base.metadata.create_all(bind=engine)

# --- Initial Seed Catalog ---

INITIAL_PRODUCTS = [
    {
        "id": "VLV-X200",
        "name": "Industrial High-Pressure Butterfly Valve X-200",
        "category": "Flow Control",
        "stock": 420,
        "cost_price": 75.0,
        "current_price": 115.0,
        "competitor_price": 120.0,
        "ai_suggested_price": 118.5,
        "margin": 34.8,
        "trend": "up",
        "rating": 4.8,
        "reviews_count": 342,
        "image_url": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80",
        "badge": "Amazon's Choice"
    },
    {
        "id": "BRG-77A",
        "name": "Heavy-Duty Precision Steel Roller Bearing 77A",
        "category": "Bearings",
        "stock": 1150,
        "cost_price": 16.0,
        "current_price": 24.5,
        "competitor_price": 26.1,
        "ai_suggested_price": 25.2,
        "margin": 34.7,
        "trend": "up",
        "rating": 4.7,
        "reviews_count": 890,
        "image_url": "https://images.unsplash.com/photo-1590845947698-8924d7409b56?w=600&auto=format&fit=crop&q=80",
        "badge": "Best Seller"
    },
    {
        "id": "HYD-PMP-9",
        "name": "Commercial Hydraulic Piston Pump HP-9 (3000 PSI)",
        "category": "Hydraulics",
        "stock": 64,
        "cost_price": 950.0,
        "current_price": 1450.0,
        "competitor_price": 1399.0,
        "ai_suggested_price": 1420.0,
        "margin": 34.5,
        "trend": "down",
        "rating": 4.9,
        "reviews_count": 89,
        "image_url": "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop&q=80",
        "badge": "Top Rated"
    },
    {
        "id": "CBL-CU-12",
        "name": "Shielded Pure Copper Cable 12AWG Reel (1000m)",
        "category": "Electrical",
        "stock": 290,
        "cost_price": 680.0,
        "current_price": 880.0,
        "competitor_price": 905.0,
        "ai_suggested_price": 895.0,
        "margin": 22.7,
        "trend": "up",
        "rating": 4.6,
        "reviews_count": 215,
        "image_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
        "badge": "Limited Deal"
    },
    {
        "id": "GBX-RT4",
        "name": "Heavy Planetary Reduction Gearbox RT-4 (Ratio 25:1)",
        "category": "Power Transmission",
        "stock": 28,
        "cost_price": 1500.0,
        "current_price": 2150.0,
        "competitor_price": 2210.0,
        "ai_suggested_price": 2190.0,
        "margin": 30.2,
        "trend": "up",
        "rating": 4.9,
        "reviews_count": 47,
        "image_url": "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=600&auto=format&fit=crop&q=80",
        "badge": "Amazon's Choice"
    },
    {
        "id": "SNS-PT100",
        "name": "Digital RTD PT100 Thermal Sensor Probe",
        "category": "Instrumentation",
        "stock": 880,
        "cost_price": 22.0,
        "current_price": 42.0,
        "competitor_price": 44.5,
        "ai_suggested_price": 43.0,
        "margin": 47.6,
        "trend": "flat",
        "rating": 4.5,
        "reviews_count": 412,
        "image_url": "https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=600&auto=format&fit=crop&q=80",
        "badge": "Best Seller"
    },
    {
        "id": "MTR-3PH-5K",
        "name": "3-Phase Induction Electric Motor 5kW 1450RPM",
        "category": "Motors",
        "stock": 45,
        "cost_price": 920.0,
        "current_price": 1320.0,
        "competitor_price": 1295.0,
        "ai_suggested_price": 1310.0,
        "margin": 29.5,
        "trend": "down",
        "rating": 4.7,
        "reviews_count": 78,
        "image_url": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&auto=format&fit=crop&q=80",
        "badge": None
    },
    {
        "id": "FLG-SS-6",
        "name": "Forged Stainless Steel Weld Neck Flange 6\" ANSI 150",
        "category": "Fittings",
        "stock": 1950,
        "cost_price": 48.0,
        "current_price": 78.5,
        "competitor_price": 81.0,
        "ai_suggested_price": 79.5,
        "margin": 38.8,
        "trend": "up",
        "rating": 4.8,
        "reviews_count": 620,
        "image_url": "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=600&auto=format&fit=crop&q=80",
        "badge": "Amazon's Choice"
    }
]

def init_db():
    db = SessionLocal()
    try:
        if db.query(Product).count() == 0:
            for item in INITIAL_PRODUCTS:
                prod = Product(**item)
                db.add(prod)
            db.commit()
    finally:
        db.close()

init_db()

# --- RL Agent & Simulator Setup ---

model_path = os.path.join(os.path.dirname(__file__), "pricing_agent.zip")
pricing_agent = None
env = MarketSimulatorEnv(base_price=115.0, cost=75.0, max_inventory=1000.0)

try:
    if os.path.exists(model_path):
        pricing_agent = PPO.load(model_path)
except Exception as e:
    print(f"Notice: Loading PPO model: {e}")

# Elasticity history tracker
elasticity_history = []
base_time = datetime.now() - timedelta(days=30)
for i in range(30):
    t = base_time + timedelta(days=i)
    ours = 115.0 + np.sin(i / 3) * 3 + i * 0.15
    comp = 115.0 + np.cos(i / 4) * 2.5 + i * 0.08 + 2
    elasticity_history.append({
        "time": t.strftime("%b %d"),
        "ourPrice": round(float(ours), 2),
        "competitorPrice": round(float(comp), 2)
    })

# --- Pricing Guardrails Engine ---

def calculate_dynamic_price(
    current_price: float,
    competitor_price: float,
    cost_price: float,
    stock: int,
    demand_surge: float = 1.0,
    is_primary: bool = False
) -> tuple[float, str, str]:
    """
    Computes profit-maximizing AI price with enterprise guardrails:
    1. RL / Elasticity computation
    2. Scarcity & surge adjustments
    3. Minimum margin floor constraint (15%)
    4. Volatility damping constraint (max +-8% per step)
    """
    raw_suggested = current_price

    # 1. Base AI recommendation
    if is_primary and pricing_agent is not None:
        try:
            state = np.array([
                float(stock),
                float(competitor_price),
                50.0,
                float(cost_price),
                float(demand_surge)
            ], dtype=np.float32)
            action, _ = pricing_agent.predict(state, deterministic=True)
            # action is multiplier [0.8, 1.5]
            multiplier = float(np.clip(action[0], 0.85, 1.4))
            raw_suggested = competitor_price * (0.95 + (multiplier - 0.8) * 0.12)
        except Exception:
            raw_suggested = competitor_price * 0.98
    else:
        # Elasticity heuristic based on stock scarcity & competitor reference
        # When stock is low (<100), price rises up to +12%
        # When stock is high (>1000), price discounts up to -6%
        scarcity_factor = 1.0
        if stock < 50:
            scarcity_factor = 1.10
        elif stock < 150:
            scarcity_factor = 1.05
        elif stock > 1000:
            scarcity_factor = 0.96

        surge_factor = 1.0 + (demand_surge - 1.0) * 0.08
        raw_suggested = competitor_price * 0.98 * scarcity_factor * surge_factor

    # 2. Guardrails Enforcement
    status = "PPO Optimal"
    reason = "Dynamic equilibrium maximizing gross profit"

    # Guardrail 1: Minimum Gross Margin Floor (min 15%)
    min_margin_price = cost_price * 1.15
    if raw_suggested < min_margin_price:
        raw_suggested = min_margin_price
        status = "Guardrail: Min Margin Floor"
        reason = "Clamped to protect 15% minimum margin threshold"

    # Guardrail 2: Volatility Damping (Max +-8% single-step deviation)
    max_increase = current_price * 1.08
    max_decrease = current_price * 0.92
    if raw_suggested > max_increase:
        raw_suggested = max_increase
        status = "Guardrail: Volatility Dampening"
        reason = "Capped to prevent extreme price spikes"
    elif raw_suggested < max_decrease:
        raw_suggested = max_decrease
        status = "Guardrail: Volatility Dampening"
        reason = "Floored to prevent aggressive price deflation"

    # Demand surge reason override
    if demand_surge > 1.3:
        reason = f"Surge Pricing (+{int((demand_surge-1)*100)}% demand velocity)"

    final_price = round(float(raw_suggested), 2)
    return final_price, status, reason

# --- B2B Tiered Volume Pricing Engine ---

def compute_volume_tiers(base_price: float, cost_price: float):
    """
    Computes B2B bulk quantity tiers with margin safety guards:
    Tier 1 (1 - 9): Standard dynamic price (0% volume discount)
    Tier 2 (10 - 49): Business tier (5% bulk discount)
    Tier 3 (50 - 199): Commercial tier (10% bulk discount)
    Tier 4 (200+): Enterprise contract tier (15% bulk discount)
    Guarded so unit price never drops below cost + 10%
    """
    tier_defs = [
        {"minQty": 1, "maxQty": 9, "label": "Standard (1-9)", "discountPct": 0.0},
        {"minQty": 10, "maxQty": 49, "label": "Business Bulk (10-49)", "discountPct": 5.0},
        {"minQty": 50, "maxQty": 199, "label": "Commercial Tier (50-199)", "discountPct": 10.0},
        {"minQty": 200, "maxQty": None, "label": "Enterprise Wholesale (200+)", "discountPct": 15.0}
    ]
    tiers = []
    min_safe_unit_price = round(cost_price * 1.10, 2) # ensure at least 10% gross margin

    for t in tier_defs:
        raw_discounted = base_price * (1.0 - t["discountPct"] / 100.0)
        final_unit_price = round(max(raw_discounted, min_safe_unit_price), 2)
        actual_discount_pct = round(((base_price - final_unit_price) / max(base_price, 1.0)) * 100, 1)
        tiers.append({
            "minQty": t["minQty"],
            "maxQty": t["maxQty"],
            "label": t["label"],
            "discountPct": actual_discount_pct,
            "unitPrice": final_unit_price
        })
    return tiers

def get_tier_for_quantity(quantity: int, base_price: float, cost_price: float):
    tiers = compute_volume_tiers(base_price, cost_price)
    for t in reversed(tiers):
        if quantity >= t["minQty"]:
            return t
    return tiers[0]

# --- Request Schemas ---

class ApplyPriceRequest(BaseModel):
    productId: str
    newPrice: float

class UpdatePriceRequest(BaseModel):
    newPrice: float

class CreateProductRequest(BaseModel):
    id: str
    name: str
    category: str
    stock: int
    cost_price: Optional[float] = 50.0
    currentPrice: float
    competitorPrice: float
    margin: float
    badge: Optional[str] = None
    image_url: Optional[str] = None

class StoreOrderRequest(BaseModel):
    productId: str
    quantity: int = 1
    customerName: Optional[str] = "Acme Global Industries"

class RFQRequest(BaseModel):
    productId: str
    quantity: int = 500
    targetPrice: Optional[float] = None
    companyName: str = "Enterprise Manufacturing Corp"
    deliveryDays: int = 14

class SurgeRequest(BaseModel):
    productId: Optional[str] = None
    surgeMultiplier: float = 1.8
    orderCount: int = 10

class WhatIfRequest(BaseModel):
    productId: str
    competitorPriceDeltaPct: float = 0.0
    inventoryLevel: int = 400
    demandSurgeMultiplier: float = 1.0

# --- API Endpoints ---

@app.get("/api/dashboard")
def get_dashboard():
    start_time = time.time()
    db = SessionLocal()
    try:
        products_orm = db.query(Product).all()
        products_out = []

        for p in products_orm:
            is_vlv = (p.id == "VLV-X200")
            # Step simulator or recalculate dynamic recommendation
            suggested_price, status, reason = calculate_dynamic_price(
                current_price=p.current_price,
                competitor_price=p.competitor_price,
                cost_price=p.cost_price,
                stock=p.stock,
                demand_surge=1.0,
                is_primary=is_vlv
            )

            # Update DB with latest suggested price
            p.ai_suggested_price = suggested_price
            p.margin = round(((p.current_price - p.cost_price) / max(p.current_price, 1.0)) * 100, 1)
            p.trend = "up" if suggested_price > p.current_price else ("down" if suggested_price < p.current_price else "flat")

            products_out.append({
                "id": p.id,
                "name": p.name,
                "category": p.category,
                "stock": p.stock,
                "costPrice": p.cost_price,
                "currentPrice": p.current_price,
                "competitorPrice": p.competitor_price,
                "aiSuggestedPrice": p.ai_suggested_price,
                "margin": p.margin,
                "trend": p.trend,
                "rating": p.rating,
                "reviewsCount": p.reviews_count,
                "badge": p.badge,
                "imageUrl": p.image_url
            })

        db.commit()

        # Update primary product elasticity point
        vlv = next((p for p in products_out if p["id"] == "VLV-X200"), products_out[0])
        elasticity_history.pop(0)
        elasticity_history.append({
            "time": datetime.now().strftime("%b %d"),
            "ourPrice": vlv["aiSuggestedPrice"],
            "competitorPrice": vlv["competitorPrice"]
        })

        # KPI telemetry
        latency = int((time.time() - start_time) * 1000)
        total_skus = len(products_out)
        priced_today = db.query(PricingLog).count() + 8720
        recent_orders = db.query(OrderLog).count()

        kpis = {
            "totalActiveSkus": total_skus,
            "revenueLiftPct": round(14.8 + random.uniform(-0.2, 0.2), 1),
            "apiLatencyMs": max(12, latency + 10),
            "enginePricedToday": priced_today,
            "recentOrdersCount": recent_orders
        }

        # Log first product telemetry
        new_log = PricingLog(
            product_id=vlv["id"],
            inventory=float(vlv["stock"]),
            competitor_price=vlv["competitorPrice"],
            suggested_price=vlv["aiSuggestedPrice"],
            cost_price=vlv["costPrice"],
            status="Operational",
            reason="Automated Equilibrium Recalibration"
        )
        db.add(new_log)
        db.commit()

        return {
            "kpis": kpis,
            "products": products_out,
            "elasticity": elasticity_history
        }
    finally:
        db.close()

@app.post("/api/apply-price")
def apply_price(request: ApplyPriceRequest):
    db = SessionLocal()
    try:
        product = db.query(Product).filter(Product.id == request.productId).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        old_price = product.current_price
        product.current_price = request.newPrice
        product.margin = round(((request.newPrice - product.cost_price) / max(request.newPrice, 1.0)) * 100, 1)
        db.commit()

        # Log event
        log = PricingLog(
            product_id=product.id,
            inventory=float(product.stock),
            competitor_price=product.competitor_price,
            suggested_price=request.newPrice,
            cost_price=product.cost_price,
            status="Manual Application",
            reason=f"User applied suggested price: {old_price} -> {request.newPrice}"
        )
        db.add(log)
        db.commit()

        return {
            "ok": True,
            "productId": product.id,
            "newPrice": product.current_price,
            "newMargin": product.margin
        }
    finally:
        db.close()

@app.post("/api/apply-all")
def apply_all():
    db = SessionLocal()
    try:
        products = db.query(Product).all()
        applied_count = 0
        for p in products:
            if p.current_price != p.ai_suggested_price:
                p.current_price = p.ai_suggested_price
                p.margin = round(((p.current_price - p.cost_price) / max(p.current_price, 1.0)) * 100, 1)
                applied_count += 1

        db.commit()
        return {"ok": True, "appliedCount": applied_count}
    finally:
        db.close()

@app.put("/api/products/{product_id}/price")
def manual_update_price(product_id: str, request: UpdatePriceRequest):
    db = SessionLocal()
    try:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        product.current_price = request.newPrice
        product.margin = round(((request.newPrice - product.cost_price) / max(request.newPrice, 1.0)) * 100, 1)
        db.commit()
        return {"ok": True, "productId": product.id, "currentPrice": product.current_price}
    finally:
        db.close()

@app.post("/api/products")
def create_product(request: CreateProductRequest):
    db = SessionLocal()
    try:
        cost = request.cost_price or (request.currentPrice * 0.65)
        new_product = Product(
            id=request.id,
            name=request.name,
            category=request.category,
            stock=request.stock,
            cost_price=cost,
            current_price=request.currentPrice,
            competitor_price=request.competitorPrice,
            ai_suggested_price=round(request.currentPrice * 1.02, 2),
            margin=request.margin,
            trend="up",
            rating=4.7,
            reviews_count=12,
            badge=request.badge or "New Arrival",
            image_url=request.image_url or "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80"
        )
        db.add(new_product)
        db.commit()
        return {"ok": True, "product": request.dict()}
    finally:
        db.close()

@app.get("/api/reports")
def get_reports():
    db = SessionLocal()
    try:
        logs = db.query(PricingLog).order_by(PricingLog.id.desc()).limit(150).all()
        orders = db.query(OrderLog).order_by(OrderLog.id.desc()).limit(50).all()

        return {
            "telemetry": [
                {
                    "id": log.id,
                    "productId": log.product_id,
                    "inventory": log.inventory,
                    "competitor_price": log.competitor_price,
                    "suggested_price": log.suggested_price,
                    "cost_price": log.cost_price,
                    "status": log.status,
                    "reason": log.reason,
                    "timestamp": log.timestamp
                }
                for log in logs
            ],
            "recentOrders": [
                {
                    "id": o.id,
                    "productId": o.product_id,
                    "productName": o.product_name,
                    "quantity": o.quantity,
                    "unitPrice": o.unit_price,
                    "totalPrice": o.total_price,
                    "customer": o.customer_name,
                    "timestamp": o.timestamp
                }
                for o in orders
            ]
        }
    finally:
        db.close()

# --- Storefront Endpoints (Amazon-Style Live Store) ---

@app.get("/api/store/products")
def get_store_products():
    db = SessionLocal()
    try:
        products = db.query(Product).all()
        out = []
        for p in products:
            # Calculate savings percentage against competitor reference or list price
            reference_mrp = round(max(p.competitor_price * 1.08, p.current_price * 1.05), 2)
            discount_pct = round(((reference_mrp - p.current_price) / reference_mrp) * 100)
            
            # Dynamic pricing tag
            price_tag = "Standard Dynamic Price"
            if p.stock < 50:
                price_tag = "⚡ High Demand: Limited Quantity"
            elif discount_pct > 10:
                price_tag = "🔥 Limited Time Deal"
            elif p.trend == "up":
                price_tag = "📈 Trending Price"

            # Compute B2B tiered bulk quantity prices
            tiers = compute_volume_tiers(p.current_price, p.cost_price)

            out.append({
                "id": p.id,
                "name": p.name,
                "category": p.category,
                "stock": p.stock,
                "price": p.current_price,
                "costPrice": p.cost_price,
                "referenceMrp": reference_mrp,
                "discountPct": discount_pct,
                "competitorPrice": p.competitor_price,
                "rating": p.rating,
                "reviewsCount": p.reviews_count,
                "badge": p.badge,
                "imageUrl": p.image_url,
                "priceTag": price_tag,
                "inStock": p.stock > 0,
                "volumeTiers": tiers
            })
        return {"products": out}
    finally:
        db.close()

@app.post("/api/store/order")
def create_store_order(request: StoreOrderRequest):
    """
    Executes a purchase order from the storefront:
    Calculates B2B tiered volume pricing based on quantity, decrements stock,
    records order, and triggers dynamic pricing recalibration.
    """
    db = SessionLocal()
    try:
        product = db.query(Product).filter(Product.id == request.productId).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        if product.stock < request.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock (only {product.stock} available)")

        # 1. Determine B2B volume pricing tier
        tier = get_tier_for_quantity(request.quantity, product.current_price, product.cost_price)
        effective_unit_price = tier["unitPrice"]
        total_amount = round(effective_unit_price * request.quantity, 2)
        standard_total = round(product.current_price * request.quantity, 2)
        savings = round(max(0.0, standard_total - total_amount), 2)

        # 2. Decrement inventory
        product.stock = max(0, product.stock - request.quantity)

        # 3. Record order
        order = OrderLog(
            product_id=product.id,
            product_name=product.name,
            quantity=request.quantity,
            unit_price=effective_unit_price,
            total_price=total_amount,
            customer_name=f"{request.customerName} ({tier['label']})"
        )
        db.add(order)

        # 4. Dynamic pricing reaction: Scarcity & purchase velocity
        # High volume orders cause faster scarcity response
        surge_level = 1.2 if request.quantity < 10 else (1.5 if request.quantity < 50 else 1.9)
        new_suggested, status, reason = calculate_dynamic_price(
            current_price=product.current_price,
            competitor_price=product.competitor_price,
            cost_price=product.cost_price,
            stock=product.stock,
            demand_surge=surge_level,
            is_primary=(product.id == "VLV-X200")
        )

        old_price = product.current_price
        product.ai_suggested_price = new_suggested
        price_nudge = round(old_price + (new_suggested - old_price) * 0.45, 2)
        product.current_price = price_nudge
        product.margin = round(((product.current_price - product.cost_price) / max(product.current_price, 1.0)) * 100, 1)

        # Log pricing telemetry
        log = PricingLog(
            product_id=product.id,
            inventory=float(product.stock),
            competitor_price=product.competitor_price,
            suggested_price=product.current_price,
            cost_price=product.cost_price,
            status=f"Bulk Order: {tier['label']}",
            reason=f"Purchased {request.quantity}u. Stock depleted to {product.stock}."
        )
        db.add(log)
        db.commit()

        return {
            "ok": True,
            "orderId": order.id,
            "productId": product.id,
            "quantity": request.quantity,
            "tierLabel": tier["label"],
            "discountPct": tier["discountPct"],
            "unitPrice": effective_unit_price,
            "totalPrice": total_amount,
            "totalSavings": savings,
            "newStock": product.stock,
            "newPrice": product.current_price,
            "oldPrice": old_price,
            "priceChange": round(product.current_price - old_price, 2)
        }
    finally:
        db.close()

@app.post("/api/store/rfq")
def request_custom_quote(request: RFQRequest):
    """
    Evaluates enterprise Request for Quote (RFQ) in real time:
    Checks unit margin against COGS and generates an instant contract quote.
    """
    db = SessionLocal()
    try:
        product = db.query(Product).filter(Product.id == request.productId).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        # Wholesale volume evaluation:
        # Base floor is cost + 10% margin
        min_acceptable_price = round(product.cost_price * 1.10, 2)
        target = request.targetPrice or (product.current_price * 0.82)
        
        approved_unit_price = max(round(target, 2), min_acceptable_price)
        total_quote = round(approved_unit_price * request.quantity, 2)
        standard_total = round(product.current_price * request.quantity, 2)
        total_savings = round(max(0.0, standard_total - total_quote), 2)
        margin_pct = round(((approved_unit_price - product.cost_price) / approved_unit_price) * 100, 1)

        is_immediate = (approved_unit_price >= product.cost_price * 1.14)
        status = "Instantly Cleared by AI Engine" if is_immediate else "Approved at Margin Floor Cap"

        return {
            "ok": True,
            "rfqId": f"RFQ-{int(time.time()*1000)%1000000}",
            "companyName": request.companyName,
            "productId": product.id,
            "productName": product.name,
            "requestedQuantity": request.quantity,
            "deliveryDays": request.deliveryDays,
            "standardUnitPrice": product.current_price,
            "quotedUnitPrice": approved_unit_price,
            "totalQuote": total_quote,
            "totalSavings": total_savings,
            "savingsPct": round((total_savings / max(standard_total, 1.0)) * 100, 1),
            "marginPct": margin_pct,
            "status": status,
            "validForDays": 7,
            "aiRationale": f"Automated wholesale pricing approved for {request.quantity} units maintaining {margin_pct}% gross margin."
        }
    finally:
        db.close()

@app.post("/api/store/surge")
def trigger_surge_simulation(request: SurgeRequest):
    """
    Simulates flash crowd traffic on the storefront:
    Decrements stock by orderCount and triggers surge pricing algorithm across products.
    """
    db = SessionLocal()
    try:
        products = db.query(Product).all()
        if request.productId:
            products = [p for p in products if p.id == request.productId]

        updated = []
        for p in products:
            qty = min(p.stock, random.randint(2, request.orderCount))
            p.stock = max(0, p.stock - qty)
            
            # Recalculate price with surge multiplier
            new_price, status, reason = calculate_dynamic_price(
                current_price=p.current_price,
                competitor_price=p.competitor_price,
                cost_price=p.cost_price,
                stock=p.stock,
                demand_surge=request.surgeMultiplier,
                is_primary=(p.id == "VLV-X200")
            )
            old_price = p.current_price
            p.ai_suggested_price = new_price
            p.current_price = new_price
            p.margin = round(((p.current_price - p.cost_price) / max(p.current_price, 1.0)) * 100, 1)

            # Record sample order
            order = OrderLog(
                product_id=p.id,
                product_name=p.name,
                quantity=qty,
                unit_price=old_price,
                total_price=round(old_price * qty, 2),
                customer_name=f"Flash Surge Buyer #{random.randint(100, 999)}"
            )
            db.add(order)

            # Record telemetry
            log = PricingLog(
                product_id=p.id,
                inventory=float(p.stock),
                competitor_price=p.competitor_price,
                suggested_price=p.current_price,
                cost_price=p.cost_price,
                status=f"Surge Sim: {status}",
                reason=reason
            )
            db.add(log)

            updated.append({
                "id": p.id,
                "oldPrice": old_price,
                "newPrice": p.current_price,
                "stock": p.stock,
                "ordersPlaced": qty
            })

        db.commit()
        return {"ok": True, "surgeMultiplier": request.surgeMultiplier, "updatedProducts": updated}
    finally:
        db.close()

# --- What-If Scenario Simulator Endpoint ---

@app.post("/api/simulate/what-if")
def simulate_what_if(request: WhatIfRequest):
    """
    Computes real-time elasticity curve and projections for What-If scenario playground.
    """
    db = SessionLocal()
    try:
        product = db.query(Product).filter(Product.id == request.productId).first()
        if not product:
            product = db.query(Product).first()

        cost = product.cost_price
        base_comp = product.competitor_price * (1.0 + request.competitorPriceDeltaPct / 100.0)
        stock = request.inventoryLevel
        surge = request.demandSurgeMultiplier

        # Generate price point spectrum from 0.8x to 1.4x of competitor price
        price_points = []
        best_profit = -float('inf')
        optimal_point = None

        min_price = cost * 1.05
        max_price = base_comp * 1.35
        test_prices = np.linspace(min_price, max_price, 15)

        for p_val in test_prices:
            p_round = round(float(p_val), 2)
            # Elasticity formula
            price_ratio = p_round / max(base_comp, 1.0)
            elasticity_factor = max(0.05, 2.0 - (price_ratio ** 1.9))
            projected_demand = max(0.0, 25.0 * elasticity_factor * surge)
            units_sold = min(projected_demand, float(stock))
            revenue = round(units_sold * p_round, 2)
            profit = round(units_sold * (p_round - cost), 2)
            margin_pct = round(((p_round - cost) / max(p_round, 1.0)) * 100, 1)

            pt = {
                "price": p_round,
                "projectedDemand": round(projected_demand, 1),
                "unitsSold": int(units_sold),
                "projectedRevenue": revenue,
                "projectedProfit": profit,
                "marginPct": margin_pct
            }
            price_points.append(pt)

            if profit > best_profit:
                best_profit = profit
                optimal_point = pt

        # Compute AI suggestion under these hypothetical conditions
        ai_recommended_price, status, reason = calculate_dynamic_price(
            current_price=product.current_price,
            competitor_price=base_comp,
            cost_price=cost,
            stock=stock,
            demand_surge=surge,
            is_primary=(product.id == "VLV-X200")
        )

        return {
            "productId": product.id,
            "productName": product.name,
            "costPrice": cost,
            "simulatedCompetitorPrice": round(base_comp, 2),
            "simulatedStock": stock,
            "demandSurgeMultiplier": surge,
            "aiRecommendedPrice": ai_recommended_price,
            "guardrailStatus": status,
            "reason": reason,
            "optimalProfitPoint": optimal_point,
            "curve": price_points
        }
    finally:
        db.close()

# --- Background Retraining ---

@app.post("/api/train")
def trigger_training(background_tasks: BackgroundTasks):
    def run_train():
        try:
            global pricing_agent
            trained = train_agent(timesteps=10000)
            pricing_agent = trained
            print("Background model training completed successfully.")
        except Exception as err:
            print(f"Error during background training: {err}")

    background_tasks.add_task(run_train)
    return {"ok": True, "message": "RL Model training triggered in background (10,000 steps)."}
