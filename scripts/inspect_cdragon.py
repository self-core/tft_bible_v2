import json

path = r"C:\Users\puppets\Documents\tft_bible_v2\data\cdragon_en_us.json"
with open(path, "r", encoding="utf-8-sig") as f:
    data = json.load(f)

print("=== Top-level keys ===")
for k in data.keys():
    v = data[k]
    if isinstance(v, dict):
        print(f"  {k}: dict with {len(v)} keys")
    elif isinstance(v, list):
        print(f"  {k}: list with {len(v)} items")
    else:
        print(f"  {k}: {type(v).__name__} = {v}")

print("\n=== Sets ===")
for k in sorted(data.get("sets", {}).keys()):
    sd = data["sets"][k]
    champ_count = len(sd.get("champions", []))
    trait_count = len(sd.get("traits", []))
    name = sd.get("name", "?")
    print(f"  Set {k}: '{name}' - {champ_count} champions, {trait_count} traits")

# Get highest set number
numeric_sets = [int(k) for k in data.get("sets", {}).keys() if k.isdigit()]
if numeric_sets:
    current_set = str(max(numeric_sets))
    print(f"\n=== Current set (highest): {current_set} ===")
    sd = data["sets"][current_set]
    
    # Show first champion
    print("\nFirst champion:")
    if sd.get("champions"):
        c = sd["champions"][0]
        print(json.dumps(c, indent=2)[:2000])
    
    # Show first trait
    print("\nFirst trait:")
    if sd.get("traits"):
        t = sd["traits"][0]
        print(json.dumps(t, indent=2)[:2000])
    
    # Count items by set
    print("\n=== Items overview ===")
    items = data.get("items", [])
    print(f"Total items: {len(items)}")
    set_counts = {}
    for item in items:
        prefix = item["apiName"].split("_")[0] if "_" in item["apiName"] else "OTHER"
        set_counts[prefix] = set_counts.get(prefix, 0) + 1
    for prefix in sorted(set_counts.keys()):
        print(f"  {prefix}: {set_counts[prefix]}")
