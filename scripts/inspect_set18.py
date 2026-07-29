import json

with open(r"C:\Users\puppets\Documents\tft_bible_v2\data\cdragon_pbe_en_us.json", "r", encoding="utf-8-sig") as f:
    data = json.load(f)

sets_data = data.get("sets", {})
print("=== All sets in PBE data ===")
for k in sorted(sets_data.keys(), key=lambda x: int(x) if x.isdigit() else 0):
    sd = sets_data[k]
    print(f"  Set {k}: '{sd.get('name', '?')}' - {len(sd.get('champions', []))} champs, {len(sd.get('traits', []))} traits")

s18 = sets_data.get("18")
if not s18:
    print("\nSet 18 not found!")
    exit()

print(f"\n=== Set 18 ===")
print(f"Name: {s18.get('name', '?')}")
print(f"Champions: {len(s18.get('champions', []))}")
print(f"Traits: {len(s18.get('traits', []))}")

# Show ALL champions
print(f"\nAll champions:")
for c in s18["champions"]:
    traits = c.get("traits", [])
    print(f"  {c.get('apiName','?'):<35} '{c.get('name','?'):<20}' cost={c.get('cost','?'):<3} traits={traits}")

# Show ALL traits
print(f"\nAll traits:")
for t in s18["traits"]:
    effects = t.get("effects", [])
    bp_summary = ", ".join([f"{e['minUnits']}+" for e in effects[:3]])
    print(f"  {t.get('apiName','?'):<35} '{t.get('name','?'):<20}' effects={bp_summary}")
