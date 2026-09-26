import os
from stable_baselines3 import PPO
from simulator import MarketSimulatorEnv

def train_agent(timesteps: int = 15000, save_name: str = "pricing_agent"):
    print(f"Initializing MarketSimulatorEnv with profit-maximizing reward...")
    env = MarketSimulatorEnv(base_price=100.0, cost=65.0, max_inventory=1000.0)
    
    print(f"Initializing PPO agent with MlpPolicy...")
    model = PPO(
        "MlpPolicy", 
        env, 
        learning_rate=0.0003,
        n_steps=2048,
        batch_size=64,
        gamma=0.99,
        verbose=1
    )
    
    print(f"Training for {timesteps} timesteps...")
    model.learn(total_timesteps=timesteps)
    
    save_path = os.path.join(os.path.dirname(__file__), save_name)
    print(f"Saving retrained model to {save_path}.zip...")
    model.save(save_path)
    
    print("Training complete and model saved.")
    return model

if __name__ == "__main__":
    train_agent()
