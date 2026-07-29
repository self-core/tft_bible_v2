import json

cdragon_path = r"C:\Users\puppets\Documents\tft_bible_v2\data\cdragon_en_us.json"
dragontail_path = r"C:\Users\puppets\Documents\League of Legends\dragontail-16.10.1\16.10.1\data\en_US\tft-champion.json"

with open(cdragon_path, "r", encoding="utf-8-sig") as f:
    cdragon = json.load(f)

with open(dragontail_path, "r", encoding="utf-8") as f:
    dragontail = json.load(f)

# Check CDragon Set 17 champions
sd17 = cdragon["sets"]["17"]
cd_champs = {c["apiName"]: c for c in sd17["champions"]}
cd_traits = {t["apiName"]: t for t in sd17["traits"]}

print(f"CDragon Set 17: {len(cd_champs)} champions, {len(cd_traits)} traits")

# Check dragontail Set 17 champions
dt_champs = {}
for champ_id, champ_data in dragontail["data"].items():
    if champ_id.startswith("TFT17_"):
        dt_champs[champ_id] = champ_data

print(f"Dragontail TFT17_*: {len(dt_champs)} champions")

# Check intersection
cd_ids = set(cd_champs.keys())
dt_ids = set(dt_champs.keys())
common = cd_ids & dt_ids
only_cd = cd_ids - dt_ids
only_dt = dt_ids - cd_ids

print(f"\nCommon champions: {len(common)}")
print(f"Only in CDragon: {len(only_cd)}")
if only_cd:
    for o in sorted(only_cd):
        c = cd_champs[o]
        print(f"  {o} - '{c['name']}' (cost={c['cost']}, traits={len(c['traits'])})")
print(f"Only in dragontail: {len(only_dt)}")
if only_dt:
    for o in sorted(only_dt):
        print(f"  {o} - '{dt_champs[o]['name']}'")

# Verify traits match
cd_trait_ids = set(t["apiName"] for t in cd_traits)
print(f"\nCDragon traits: {len(cd_trait_ids)}")
cd_traits_prefixed = {t for t in cd_trait_ids if t.startswith("TFT17_")}
print(f"TFT17_ traits: {len(cd_traits_prefixed)}")

# Check sample champion
print("\n=== Sample champion: TFT17_Vex ===")
if "TFT17_Vex" in cd_champs:
    c = cd_champs["TFT17_Vex"]
    print(json.dumps(c, indent=2))
