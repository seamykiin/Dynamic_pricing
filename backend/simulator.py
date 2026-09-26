import gymnasium as gym
from gymnasium import spaces
import numpy as np

class MarketSimulatorEnv(gym.Env):
    """
    Custom Gymnasium Environment simulating an enterprise B2B market for dynamic pricing.
    Rewards are defined by Gross Profit (Volume * (Price - Cost)) minus inventory holding penalties,
    preventing the agent from collapsing to lower-bound price dumping.
    """
    metadata = {'render_modes': ['human']}

    def __init__(self, base_price: float = 100.0, cost: float = 65.0, max_inventory: float = 1000.0):
        super(MarketSimulatorEnv, self).__init__()
        
        self.base_price = float(base_price)
        self.cost = float(cost) # Cost of Goods Sold (COGS)
        self.max_inventory = float(max_inventory)
        self.max_time = 100.0
        self.base_demand = 20.0
        self.demand_multiplier = 1.0 # Dynamic demand shock multiplier (e.g. from surge traffic)
        
        # Action space: Continuous price multiplier between 0.8x and 1.5x of base cost/price
        self.action_space = spaces.Box(low=np.array([0.8]), high=np.array([1.5]), dtype=np.float32)
        
        # Observation space:
        # [inventory_level, competitor_price, time_remaining, cost, demand_multiplier]
        self.observation_space = spaces.Box(
            low=np.array([0.0, 10.0, 0.0, 1.0, 0.1]), 
            high=np.array([2000.0, 1000.0, 100.0, 1000.0, 10.0]), 
            dtype=np.float32
        )
        
        self.state = None
        self.reset()

    def step(self, action):
        price_multiplier = float(np.clip(action[0], 0.8, 1.5))
        our_price = self.base_price * price_multiplier
        
        inventory, comp_price, time_remaining, cost, demand_multiplier = self.state
        
        # Competitor price fluctuation (mean-reverting random walk)
        comp_noise = np.random.normal(0, 1.5)
        new_comp_price = float(np.clip(comp_price + comp_noise, cost * 1.05, self.base_price * 1.6))
        
        # Price elasticity of demand:
        # Base demand influenced by price competitiveness relative to competitor
        price_ratio = our_price / max(new_comp_price, 1.0)
        # Elasticity power curve: when our_price is high relative to comp, demand drops sharply
        elasticity_factor = max(0.05, 2.0 - (price_ratio ** 1.8))
        
        stochastic_noise = np.random.normal(0, 1.5)
        raw_demand = (self.base_demand * elasticity_factor * demand_multiplier) + stochastic_noise
        demand = float(max(0.0, raw_demand))
        
        # Inventory constraint
        items_sold = float(min(demand, inventory))
        new_inventory = float(max(0.0, inventory - items_sold))
        
        # PROFIT-BASED REWARD:
        # Profit = Units Sold * (Price - Cost)
        unit_margin = our_price - cost
        profit = items_sold * unit_margin
        
        # Small holding cost penalty for unsold inventory per period
        holding_penalty = (new_inventory / self.max_inventory) * (cost * 0.02)
        
        reward = float(profit - holding_penalty)
        
        new_time = float(time_remaining - 1.0)
        terminated = bool(new_time <= 0 or new_inventory <= 0)
        truncated = False
        
        # Stockout penalty or final unsold stock write-down
        if terminated and new_time <= 0 and new_inventory > 0:
            reward -= float(new_inventory * cost * 0.05)
            
        self.state = np.array([
            new_inventory, 
            new_comp_price, 
            new_time, 
            cost, 
            demand_multiplier
        ], dtype=np.float32)
        
        info = {
            "items_sold": items_sold,
            "our_price": our_price,
            "unit_margin": unit_margin,
            "revenue": items_sold * our_price,
            "profit": profit,
            "competitor_price": new_comp_price
        }
        
        return self.state, reward, terminated, truncated, info

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        
        initial_comp_price = float(self.base_price * np.random.uniform(0.95, 1.15))
        self.state = np.array([
            self.max_inventory,
            initial_comp_price,
            self.max_time,
            self.cost,
            self.demand_multiplier
        ], dtype=np.float32)
        
        return self.state, {}
