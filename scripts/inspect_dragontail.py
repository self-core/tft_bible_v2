import json, os

base = r"C:\Users\puppets\Documents\League of Legends\dragontail-16.10.1\16.10.1\data\en_US"

print("=== Champion File ===")
with open(os.path.join(base, "tft-champion.json"), "r", encoding="utf-8") as f:
    champion_data = json.load(f)
print(f"Type: {champion_data.get('type')}")
print(f"Version: {champion_data.get('version')}")
data = champion_data.get("data", {})
print(f"Champions: {len(data)}")

print("\n--- First champion ---")
key = list(data.keys())[0]
print(json.dumps(data[key], indent=2))

print("\n\n=== Trait File ===")
with open(os.path.join(base, "tft-trait.json"), "r", encoding="utf-8") as f:
    trait_data = json.load(f)
print(f"Type: {trait_data.get('type')}")
data2 = trait_data.get("data", {})
print(f"Traits: {len(data2)}")
key2 = list(data2.keys())[0]
print(json.dumps(data2[key2], indent=2))

print("\n\n=== Item File ===")
with open(os.path.join(base, "tft-item.json"), "r", encoding="utf-8") as f:
    item_data = json.load(f)
print(f"Type: {item_data.get('type')}")
data3 = item_data.get("data", {})
print(f"Items: {len(data3)}")
key3 = list(data3.keys())[0]
print(json.dumps(data3[key3], indent=2))
