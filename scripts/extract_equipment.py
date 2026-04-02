#!/usr/bin/env python3
"""Extract equipment data from consumers_guide.md into JSON files."""
import json
import os

OUTPUT_DIR = r"C:\Users\ray\projects\wfrp-char-gen\data"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# WEAPONS
# ---------------------------------------------------------------------------
# Qualities (from Weapon Qualities section):
#   Accurate, Blackpowder, Blast (Rating), Damaging, Defensive, Distract,
#   Entangle, Fast, Hack, Impact, Impale, Penetrating, Pistol, Precise,
#   Pummel, Repeater (Rating), Shield (Rating), Trap Blade, Unbreakable, Wrap
# Flaws (from Weapon Flaws section):
#   Dangerous, Imprecise, Reload (Rating), Slow, Tiring, Undamaging

WEAPON_QUALITIES = {
    "Accurate", "Blackpowder", "Damaging", "Defensive", "Distract",
    "Entangle", "Fast", "Hack", "Impact", "Impale", "Penetrating",
    "Pistol", "Precise", "Pummel", "Trap Blade", "Unbreakable", "Wrap",
}
WEAPON_FLAW_PREFIXES = {"Dangerous", "Imprecise", "Slow", "Tiring", "Undamaging"}


def classify_weapon_traits(raw: str):
    """Split a qualities/flaws string into (qualities[], flaws[])."""
    if not raw or raw == "\u2013":
        return [], []
    parts = [p.strip() for p in raw.split(",")]
    qualities, flaws = [], []
    for p in parts:
        base = p.split()[0]  # e.g. "Blast" from "Blast 3"
        if base in WEAPON_FLAW_PREFIXES or base == "Reload":
            flaws.append(p)
        elif base in ("Repeater", "Shield", "Blast"):
            qualities.append(p)
        elif p in WEAPON_QUALITIES or base in WEAPON_QUALITIES:
            qualities.append(p)
        else:
            # Unknown – default to quality
            qualities.append(p)
    return qualities, flaws


def W(name, price, enc, avail, reach=None, rng=None, damage="", raw_traits="", group=""):
    q, f = classify_weapon_traits(raw_traits)
    ordered = {
        "name": name,
        "price": price,
        "enc": enc,
        "availability": avail,
    }
    if reach is not None:
        ordered["reach"] = reach
    if rng is not None:
        ordered["range"] = rng
    ordered["damage"] = damage
    ordered["qualities"] = q
    ordered["flaws"] = f
    ordered["group"] = group
    return ordered


weapons = [
    # -------------------------------------------------------------------------
    # MELEE - BASIC
    # -------------------------------------------------------------------------
    W("Hand Weapon",       "1GC",       1, "Common",  reach="Average",    damage="+SB+4",  raw_traits="",                               group="Basic"),
    W("Improvised Weapon", "N/A",       0, "N/A",     reach="Varies",     damage="+SB+1",  raw_traits="Undamaging",                     group="Basic"),
    W("Dagger",            "16/\u2013", 0, "Common",  reach="Very Short", damage="+SB+2",  raw_traits="",                               group="Basic"),
    W("Knife",             "8/\u2013",  0, "Common",  reach="Very Short", damage="+SB+1",  raw_traits="Undamaging",                     group="Basic"),
    W("Shield (Buckler)",  "18/2",      0, "Common",  reach="Personal",   damage="+SB+1",  raw_traits="Shield 1, Defensive, Undamaging", group="Basic"),
    W("Shield",            "2GC",       1, "Common",  reach="Very Short", damage="+SB+2",  raw_traits="Shield 2, Defensive, Undamaging", group="Basic"),
    W("Shield (Large)",    "3GC",       3, "Common",  reach="Very Short", damage="+SB+3",  raw_traits="Shield 3, Defensive, Undamaging", group="Basic"),

    # -------------------------------------------------------------------------
    # MELEE - CAVALRY
    # -------------------------------------------------------------------------
    W("(2H) Cavalry Hammer", "3GC", 3, "Scarce", reach="Long",      damage="+SB+5", raw_traits="Pummel",         group="Cavalry"),
    W("Lance",               "1GC", 3, "Rare",   reach="Very Long", damage="+SB+6", raw_traits="Impact, Impale", group="Cavalry"),

    # -------------------------------------------------------------------------
    # MELEE - FENCING
    # -------------------------------------------------------------------------
    # Note: "Medium" reach used as printed (not in standard reach list – possible source typo)
    W("Foil",   "5GC", 1, "Scarce", reach="Medium", damage="+SB+3", raw_traits="Fast, Impale, Precise, Undamaging", group="Fencing"),
    W("Rapier", "5GC", 1, "Scarce", reach="Long",   damage="+SB+4", raw_traits="Fast, Impale",                     group="Fencing"),

    # -------------------------------------------------------------------------
    # MELEE - BRAWLING
    # -------------------------------------------------------------------------
    W("Unarmed",        "N/A", 0, "\u2013", reach="Personal", damage="+SB+0", raw_traits="Undamaging", group="Brawling"),
    W("Knuckledusters", "2/6", 0, "Common", reach="Personal", damage="+SB+2", raw_traits="",           group="Brawling"),

    # -------------------------------------------------------------------------
    # MELEE - FLAIL
    # -------------------------------------------------------------------------
    W("Grain Flail",        "10/\u2013", 1, "Common", reach="Average", damage="+SB+3", raw_traits="Distract, Imprecise, Wrap",      group="Flail"),
    W("Flail",              "2GC",       1, "Scarce", reach="Average", damage="+SB+5", raw_traits="Distract, Wrap",                  group="Flail"),
    W("(2H) Military Flail","3GC",       2, "Rare",   reach="Long",    damage="+SB+6", raw_traits="Distract, Impact, Tiring, Wrap", group="Flail"),

    # -------------------------------------------------------------------------
    # MELEE - PARRY
    # -------------------------------------------------------------------------
    W("Main Gauche",  "1GC",     0, "Rare",   reach="Very Short", damage="+SB+2", raw_traits="Defensive",             group="Parry"),
    W("Swordbreaker", "1GC 2/6", 1, "Scarce", reach="Short",      damage="+SB+3", raw_traits="Defensive, Trap Blade", group="Parry"),

    # -------------------------------------------------------------------------
    # MELEE - POLEARM
    # -------------------------------------------------------------------------
    W("(2H) Halberd",      "2GC",       3, "Common", reach="Long",      damage="+SB+4", raw_traits="Defensive, Hack, Impale", group="Polearm"),
    W("(2H) Spear",        "15/\u2013", 2, "Common", reach="Very Long", damage="+SB+4", raw_traits="Impale",                  group="Polearm"),
    W("(2H) Pike",         "18/\u2013", 4, "Rare",   reach="Massive",   damage="+SB+4", raw_traits="Impale",                  group="Polearm"),
    W("(2H) Quarter Staff","3/\u2013",  2, "Common", reach="Long",      damage="+SB+4", raw_traits="Defensive, Pummel",       group="Polearm"),

    # -------------------------------------------------------------------------
    # MELEE - TWO-HANDED
    # -------------------------------------------------------------------------
    W("(2H) Bastard Sword",    "8GC",        3, "Scarce", reach="Long",    damage="+SB+5", raw_traits="Damaging, Defensive",  group="Two-Handed"),
    W("(2H) Great Axe",        "4GC",        3, "Scarce", reach="Long",    damage="+SB+6", raw_traits="Hack, Impact, Tiring", group="Two-Handed"),
    W("(2H) Pick",             "9/\u2013",   3, "Common", reach="Average", damage="+SB+5", raw_traits="Damaging, Impale",     group="Two-Handed"),
    W("(2H) Warhammer",        "3GC",        3, "Common", reach="Average", damage="+SB+6", raw_traits="Damaging, Pummel",     group="Two-Handed"),
    W("(2H) Zweih\u00e4nder",  "10GC",       3, "Scarce", reach="Long",    damage="+SB+5", raw_traits="Damaging, Hack",       group="Two-Handed"),

    # =========================================================================
    # RANGED - BLACKPOWDER
    # Note: All Blackpowder/Engineering weapons gain Blackpowder + Damaging qualities
    # =========================================================================
    W("(2H) Blunderbuss",        "2GC",   1, "Scarce", rng="20",  damage="+8",  raw_traits="Blackpowder, Blast 3, Damaging, Dangerous, Reload 2",                              group="Blackpowder"),
    W("(2H) Hochland Long Rifle","100GC", 3, "Exotic", rng="100", damage="+9",  raw_traits="Accurate, Blackpowder, Damaging, Precise, Reload 4",                               group="Blackpowder"),
    W("(2H) Handgun",            "4GC",   2, "Scarce", rng="50",  damage="+9",  raw_traits="Blackpowder, Damaging, Dangerous, Reload 3",                                       group="Blackpowder"),
    W("Pistol",                  "8GC",   0, "Rare",   rng="20",  damage="+8",  raw_traits="Blackpowder, Damaging, Pistol, Reload 1",                                          group="Blackpowder"),

    # -------------------------------------------------------------------------
    # RANGED - BOW
    # -------------------------------------------------------------------------
    W("(2H) Elf Bow",  "10GC", 2, "Exotic",  rng="150", damage="+SB+4", raw_traits="Damaging, Precise", group="Bow"),
    W("(2H) Longbow",  "5GC",  3, "Scarce",  rng="100", damage="+SB+4", raw_traits="Damaging",          group="Bow"),
    W("(2H) Bow",      "4GC",  2, "Common",  rng="50",  damage="+SB+3", raw_traits="",                  group="Bow"),
    W("(2H) Shortbow", "3GC",  1, "Common",  rng="20",  damage="+SB+2", raw_traits="",                  group="Bow"),

    # -------------------------------------------------------------------------
    # RANGED - CROSSBOW
    # -------------------------------------------------------------------------
    W("Crossbow Pistol",    "6GC", 0, "Scarce", rng="10",  damage="+7", raw_traits="Pistol",             group="Crossbow"),
    W("(2H) Heavy Crossbow","7GC", 3, "Rare",   rng="100", damage="+9", raw_traits="Damaging, Reload 2", group="Crossbow"),
    W("(2H) Crossbow",      "5GC", 2, "Common", rng="60",  damage="+9", raw_traits="Reload 1",           group="Crossbow"),

    # -------------------------------------------------------------------------
    # RANGED - ENGINEERING (also gains Blackpowder + Damaging)
    # -------------------------------------------------------------------------
    W("(2H) Repeater Handgun", "10GC", 3, "Rare", rng="30", damage="+9", raw_traits="Blackpowder, Damaging, Dangerous, Reload 5, Repeater 4",          group="Engineering"),
    # Source lists both "Repeater" and "Repeater 4" (apparent source error – preserved as-is)
    W("Repeater Pistol",       "15GC", 1, "Rare", rng="10", damage="+8", raw_traits="Blackpowder, Damaging, Dangerous, Reload 4, Repeater, Repeater 4", group="Engineering"),

    # -------------------------------------------------------------------------
    # RANGED - ENTANGLING
    # -------------------------------------------------------------------------
    W("Lasso", "6/\u2013", 0, "Common", rng="SB\u00d72", damage="\u2013",  raw_traits="Entangle", group="Entangling"),
    W("Whip",  "5/\u2013", 0, "Common", rng="6",          damage="+SB+2",  raw_traits="Entangle", group="Entangling"),

    # -------------------------------------------------------------------------
    # RANGED - EXPLOSIVES
    # -------------------------------------------------------------------------
    W("Bomb",       "3GC", 0, "Rare",   rng="SB", damage="+12",   raw_traits="Blast 5, Dangerous, Impact", group="Explosives"),
    W("Incendiary", "1GC", 0, "Scarce", rng="SB", damage="Special", raw_traits="Blast 4, Dangerous",       group="Explosives"),

    # -------------------------------------------------------------------------
    # RANGED - SLING
    # -------------------------------------------------------------------------
    W("Sling",          "1/\u2013", 0, "Common", rng="60",  damage="+6", raw_traits="", group="Sling"),
    W("(2H) Staffsling","4/\u2013", 2, "Scarce", rng="100", damage="+7", raw_traits="", group="Sling"),

    # -------------------------------------------------------------------------
    # RANGED - THROWING
    # -------------------------------------------------------------------------
    W("Bolas",         "10/\u2013", 0, "Rare",
      # "Average" availability as printed (non-standard value preserved for Throwing Axe)
      rng="SB\u00d73", damage="+SB",   raw_traits="Entangle", group="Throwing"),
    W("Dart",          "2/\u2013",  0, "Scarce",  rng="SB\u00d72", damage="+SB+1", raw_traits="Impale",   group="Throwing"),
    W("Javelin",       "10/6",      1, "Scarce",  rng="SB\u00d73", damage="+SB+3", raw_traits="Impale",   group="Throwing"),
    W("Rock",          "\u2013",    0, "Common",  rng="SB\u00d73", damage="+SB+0", raw_traits="",         group="Throwing"),
    # "Average" availability as printed in source – does not match standard values; preserved as-is
    W("Throwing Axe",  "1GC",       1, "Average", rng="SB\u00d72", damage="+SB+3", raw_traits="Hack",     group="Throwing"),
    W("Throwing Knife","18/\u2013", 0, "Common",  rng="SB\u00d72", damage="+SB+2", raw_traits="",         group="Throwing"),

    # =========================================================================
    # AMMUNITION
    # =========================================================================
    # Blackpowder / Engineering
    W("Bullet and Powder (12)",     "3/3",       0, "Common", rng="As weapon",  damage="+1",       raw_traits="Impale, Penetrating", group="Ammunition"),
    W("Improvised Shot and Powder", "3d",         0, "Common", rng="Half weapon",damage="\u2013",   raw_traits="",                    group="Ammunition"),
    W("Small Shot and Powder (12)", "3/3",        0, "Common", rng="As weapon",  damage="\u2013",   raw_traits="Blast +1",            group="Ammunition"),
    # Bow
    W("Arrow (12)", "5/\u2013", 0, "Common", rng="As weapon", damage="\u2013", raw_traits="Impale",                        group="Ammunition"),
    W("Elf Arrow",  "6/\u2013", 0, "Exotic", rng="+50",       damage="+1",    raw_traits="Accurate, Impale, Penetrating", group="Ammunition"),
    # Crossbow
    W("Bolt (12)", "5/\u2013", 0, "Common", rng="As weapon", damage="\u2013", raw_traits="Impale", group="Ammunition"),
    # Sling
    W("Lead Bullet (12)",  "4d", 0, "Common", rng="\u201310",  damage="+1",       raw_traits="Pummel", group="Ammunition"),
    W("Stone Bullet (12)", "2d", 0, "Common", rng="As weapon", damage="\u2013",   raw_traits="Pummel", group="Ammunition"),
]

with open(os.path.join(OUTPUT_DIR, "weapons.json"), "w", encoding="utf-8") as f:
    json.dump(weapons, f, ensure_ascii=False, indent=2)
print(f"weapons.json: {len(weapons)} items")


# ---------------------------------------------------------------------------
# ARMOUR
# ---------------------------------------------------------------------------
def A(name, price, enc, avail, penalty=None, locations=None, ap=0, raw_traits=""):
    qualities, flaws = [], []
    if raw_traits and raw_traits != "\u2013":
        for t in [p.strip() for p in raw_traits.split(",")]:
            if t in ("Flexible", "Impenetrable"):
                qualities.append(t)
            elif t in ("Partial", "Weakpoints"):
                flaws.append(t)
    item = {
        "name": name,
        "price": price,
        "enc": enc,
        "availability": avail,
    }
    if penalty:
        item["penalty"] = penalty
    item["locations"] = locations or []
    item["ap"] = ap
    item["qualities"] = qualities
    item["flaws"] = flaws
    return item


armour = [
    # -------------------------------------------------------------------------
    # SOFT LEATHER (* can be worn without penalty under any other armour)
    # -------------------------------------------------------------------------
    A("Leather Jack",     "12/\u2013", 1, "Common",  locations=["Arms", "Body"], ap=1),
    A("Leather Jerkin",   "10/\u2013", 1, "Common",  locations=["Body"],         ap=1),
    A("Leather Leggings", "14/\u2013", 1, "Common",  locations=["Legs"],         ap=1),
    A("Leather Skullcap", "8/\u2013",  0, "Common",  locations=["Head"],         ap=1),

    # -------------------------------------------------------------------------
    # BOILED LEATHER
    # -------------------------------------------------------------------------
    A("Breastplate (Boiled Leather)", "18/\u2013", 2, "Scarce", locations=["Body"], ap=2, raw_traits="Weakpoints"),

    # -------------------------------------------------------------------------
    # MAIL (** all mail/plate pieces carry a general -10 Stealth penalty per
    #         footnote; per-piece penalties shown where listed in the row)
    # -------------------------------------------------------------------------
    A("Mail Chausses", "2GC", 3, "Scarce",                               locations=["Legs"],        ap=2, raw_traits="Flexible"),
    A("Mail Coat",     "3GC", 3, "Common",                               locations=["Arms", "Body"],ap=2, raw_traits="Flexible"),
    A("Mail Coif",     "1GC", 2, "Scarce", penalty="\u201310% Perception", locations=["Head"],      ap=2, raw_traits="Flexible, Partial"),
    A("Mail Shirt",    "2GC", 2, "Scarce",                               locations=["Body"],        ap=2, raw_traits="Flexible"),

    # -------------------------------------------------------------------------
    # PLATE (** same general -10 Stealth note as Mail)
    # -------------------------------------------------------------------------
    A("Breastplate (Plate)", "10GC", 3, "Scarce",                                locations=["Body"], ap=2, raw_traits="Impenetrable, Weakpoints"),
    A("Open Helm",           "2GC",  1, "Common",  penalty="\u201310% Perception",  locations=["Head"], ap=2, raw_traits="Partial"),
    A("Bracers",             "8GC",  3, "Rare",                                  locations=["Arms"], ap=2, raw_traits="Impenetrable, Weakpoints"),
    A("Plate Leggings",      "10GC", 3, "Rare",    penalty="\u201310 Stealth",      locations=["Legs"], ap=2, raw_traits="Impenetrable, Weakpoints"),
    A("Helm",                "3GC",  2, "Rare",    penalty="\u201320% Perception",  locations=["Head"], ap=2, raw_traits="Impenetrable, Weakpoints"),

    # -------------------------------------------------------------------------
    # QUICK ARMOUR (optional simplified rules – included for completeness)
    # -------------------------------------------------------------------------
    A("Light Armour",  "2GC",  1, "Common", locations=["Head","Body","Arms","Legs"], ap=1, raw_traits="Flexible"),
    A("Medium Armour", "5GC",  5, "Scarce", penalty="\u201310% Perception, \u201310 Stealth",
      locations=["Head","Body","Arms","Legs"], ap=2, raw_traits="Flexible"),
    A("Heavy Armour",  "30GC", 6, "Rare",   penalty="\u201320% Perception, \u201320 Stealth",
      locations=["Head","Body","Arms","Legs"], ap=3, raw_traits="Impenetrable, Weakpoints"),
]

with open(os.path.join(OUTPUT_DIR, "armour.json"), "w", encoding="utf-8") as f:
    json.dump(armour, f, ensure_ascii=False, indent=2)
print(f"armour.json: {len(armour)} items")


# ---------------------------------------------------------------------------
# EQUIPMENT
# ---------------------------------------------------------------------------
def E(name, price, enc, avail, category, description=None):
    item = {
        "name": name,
        "price": price,
        "enc": enc,
        "availability": avail,
        "category": category,
    }
    if description:
        item["description"] = description
    return item


equipment = [
    # =========================================================================
    # PACKS AND CONTAINERS
    # =========================================================================
    E("Backpack",     "4/10",      2, "Common", "Containers", "Carries 4 Enc. Counts as 'worn' when strapped to your back."),
    E("Barrel",       "8/\u2013",  6, "Common", "Containers", "Carries 12 Enc. Capacity: 32 gallons of liquid."),
    E("Cask",         "3/\u2013",  2, "Common", "Containers", "Carries 4 Enc. Capacity: 10 gallons of liquid."),
    E("Flask",        "5/\u2013",  0, "Common", "Containers", "Carries 0 Enc. Capacity: 1 pint of liquid."),
    E("Jug",          "3/2",       1, "Common", "Containers", "Carries 1 Enc. Capacity: 1 gallon of liquid."),
    E("Pewter Stein", "4/\u2013",  0, "Common", "Containers", "Carries 0 Enc."),
    E("Pouch",        "4d",        0, "Common", "Containers", "Carries 1 Enc."),
    E("Sack",         "1/\u2013",  2, "Common", "Containers", "Carries 4 Enc. Requires 1 hand to carry."),
    E("Sack, Large",  "1/6",       3, "Common", "Containers", "Carries 6 Enc. Requires 1 hand to carry (or 2 hands if full)."),
    E("Saddlebags",   "18/\u2013", 4, "Common", "Containers", "Carries 8 Enc."),
    E("Sling Bag",    "1/\u2013",  1, "Common", "Containers", "Carries 2 Enc. Counts as 'worn' when slung over your shoulder."),
    E("Scroll Case",  "16/\u2013", 0, "Scarce", "Containers", "Carries 0 Enc."),
    E("Waterskin",    "1/8",       1, "Common", "Containers", "Carries 1 Enc. Capacity: 1 gallon of liquid."),

    # =========================================================================
    # CLOTHING AND ACCESSORIES
    # =========================================================================
    E("Amulet",           "2d",          0, "Common", "Clothing"),
    E("Boots",            "5/\u2013",    1, "Common", "Clothing"),
    E("Cloak",            "10/\u2013",   1, "Common", "Clothing",  "Protects wearer against the elements."),
    E("Clothing",         "6/\u2013",    1, "Common", "Clothing"),
    E("Coat",             "18/\u2013",   1, "Common", "Clothing",  "Protects against the elements and extreme cold; without a good coat you receive penalties to resist cold exposure."),
    E("Costume",          "1GC",         1, "Scarce", "Clothing"),
    E("Courtly Garb",     "12GC",        1, "Scarce", "Clothing",  "Nobles' garb with lace cuffs, collars, and high-quality fabric. Servants' surcoats can be purchased at half price."),
    E("Face Powder",      "10/\u2013",   0, "Common", "Clothing"),
    E("Gloves",           "4/\u2013",    0, "Common", "Clothing"),
    E("Hood or Mask",     "5/\u2013",    0, "Common", "Clothing"),
    E("Jewellery",        "Varies",      0, "Common", "Clothing",  "Prices vary by craftsmanship, metal type, and gem value."),
    E("Perfume",          "10/\u2013",   0, "Common", "Clothing"),
    E("Pins (6)",         "10 s",        0, "Scarce", "Clothing"),
    E("Religious Symbol", "6/8",         0, "Common", "Clothing"),
    E("Robes",            "2GC",         1, "Common", "Clothing"),
    E("Sceptre",          "8GC",         1, "Rare",   "Clothing",  "Carried by the highest-ranking legal officials to indicate their status."),
    E("Shoes",            "5/\u2013",    0, "Common", "Clothing"),
    E("Signet Ring",      "5GC",         0, "Rare",   "Clothing",  "Gold rings with engraved stamps worn by nobles and guild officials."),
    E("Tattoo",           "4/\u2013 +",  0, "Scarce", "Clothing"),
    E("Uniform",          "1GC 2/\u2013",1, "Scarce", "Clothing"),
    E("Walking Cane",     "3GC",         1, "Common", "Clothing",  "Polished wooden cane with metal cap; a status symbol amongst wealthier townsfolk."),

    # =========================================================================
    # FOOD, DRINK, AND LODGING
    # =========================================================================
    E("Ale, pint",             "3d",         0, "Common", "Food & Drink"),
    E("Ale, keg",              "3 s",        2, "Common", "Food & Drink", "Capacity 3 gallons. Empty kegs can be refilled for 18d."),
    E("Bugman's XXXXXX Ale, pint","9d",      0, "Exotic", "Food & Drink", "Potent Dwarfen ale. Counts as 4 mugs of normal ale for intoxication; grants immunity to Fear Tests for 1d10 hours."),
    E("Food, groceries/day",   "10d",        1, "Common", "Food & Drink"),
    E("Meal, inn",             "1/\u2013",   0, "Common", "Food & Drink"),
    E("Rations, 1 day",        "2/\u2013",   0, "Common", "Food & Drink"),
    E("Room, common/night",    "10d",        0, "Common", "Food & Drink", "Guests sleeping in common rooms should be wary of thieves."),
    E("Room, private/night",   "10/\u2013",  0, "Common", "Food & Drink"),
    E("Spirits, pint",         "2/\u2013",   0, "Common", "Food & Drink"),
    E("Stables/night",         "10d",        0, "Common", "Food & Drink"),
    E("Wine, bottle",          "10d",        0, "Common", "Food & Drink"),
    E("Wine & Spirits, drink",  "1/\u2013",  0, "Common", "Food & Drink"),

    # =========================================================================
    # TOOLS AND KITS
    # =========================================================================
    E("Abacus",          "3/4",        0, "Scarce", "Tools"),
    E("Animal Trap",     "2/6",        1, "Common", "Tools",  "Used to catch game."),
    E("Antitoxin Kit",   "3GC",        0, "Scarce", "Tools",  "Contains a small knife, herbs, and leeches. A successful Heal Test removes all Poisoned Conditions."),
    E("Boat Hook",       "5/\u2013",   1, "Common", "Tools"),
    E("Broom",           "10d",        2, "Common", "Tools"),
    E("Bucket",          "2/6",        1, "Common", "Tools"),
    E("Chisel",          "4/2",        0, "Common", "Tools"),
    E("Comb",            "10d",        0, "Common", "Tools"),
    E("Crowbar",         "2/6",        1, "Common", "Tools"),
    E("Crutch",          "3/\u2013",   2, "Common", "Tools"),
    E("Disguise Kit",    "6/6",        0, "Scarce", "Tools",  "Contains props for four disguises (wigs, make-up, wax, fake blood, prosthetics)."),
    E("Ear Pick",        "2/\u2013",   0, "Scarce", "Tools"),
    E("Fish Hooks (12)", "1/\u2013",   0, "Common", "Tools",  "Used to catch fish."),
    E("Floor Brush",     "1/6",        0, "Common", "Tools"),
    E("Gavel",           "1GC",        0, "Scarce", "Tools"),
    E("Hammer",          "3/\u2013",   0, "Common", "Tools"),
    E("Hand Mirror",     "1GC 1/6",    0, "Exotic", "Tools"),
    E("Hoe",             "4/\u2013",   2, "Common", "Tools"),
    E("Key",             "1/\u2013",   0, "Common", "Tools"),
    E("Knife",           "8/\u2013",   0, "Common", "Tools"),
    E("Lock Picks",      "15/\u2013",  0, "Scarce", "Tools",  "Assortment of small tools needed to use the Pick Lock Skill without penalty."),
    E("Manacles",        "18/\u2013",  0, "Scarce", "Tools",  "Prisoners breaking out suffer 1 Wound and must pass a Very Hard (\u201330) Strength Test."),
    E("Mop",             "1/\u2013",   2, "Common", "Tools"),
    E("Nails (12)",      "2d",         0, "Common", "Tools"),
    E("Paint Brush",     "4/\u2013",   0, "Common", "Tools"),
    E("Pestle & Mortar", "14/\u2013",  0, "Common", "Tools"),
    E("Pick",            "18/\u2013",  1, "Scarce", "Tools"),
    E("Pole (3 yards)",  "8/\u2013",   3, "Common", "Tools",  "Counts as an Improvised Weapon."),
    E("Quill Pen",       "3/\u2013",   0, "Common", "Tools"),
    E("Rake",            "4/6",        2, "Common", "Tools"),
    E("Reading Lens",    "3GC",        0, "Rare",   "Tools",  "Grants +20 to Read/Write Tests for tiny writing and +20 to Perception Tests for fine details."),
    E("Saw",             "6/\u2013",   1, "Common", "Tools"),
    E("Sickle",          "1GC",        1, "Common", "Tools"),
    E("Spade",           "8/\u2013",   2, "Common", "Tools"),
    E("Spike",           "1/\u2013",   0, "Common", "Tools"),
    E("Stamp, engraved", "5GC",        0, "Scarce", "Tools"),
    E("Telescope",       "5GC",        0, "Rare",   "Tools"),
    E("Tongs, steel",    "16/\u2013",  0, "Common", "Tools"),
    E("Tweezers",        "1/\u2013",   0, "Scarce", "Tools"),
    E("Writing Kit",     "2GC",        0, "Scarce", "Tools",  "Contains a quill pen, inkpot, and ink blotter."),

    # =========================================================================
    # BOOKS AND DOCUMENTS
    # =========================================================================
    E("Book, Apothecary",   "8GC",      1, "Scarce", "Books", "Contains ingredient descriptions and brewing instructions; includes formulas for Digestive Tonics, Healing Draughts, and Vitality Draughts."),
    E("Book, Art",          "5GC",      1, "Scarce", "Books", "Plays, poems, ballads, musical arrangements, or treatises on art by famous painters or sculptors."),
    E("Book, Cryptography", "8GC",      1, "Exotic", "Books", "Hand-scribed codices on mathematics, numerology, and polyalphabetic encryption."),
    E("Book, Engineer",     "3GC",      1, "Scarce", "Books", "Press-printed engineering texts, often authored or edited by Dwarfs."),
    E("Book, Law",          "15GC",     1, "Rare",   "Books", "Legislation in bound volumes; often combines printed and written pages from different towns."),
    E("Book, Magic",        "20GC",     1, "Exotic", "Books", "Spell grimoire usually scribed by wizards; carrying one is punishable as heresy unless owner is licensed."),
    E("Book, Medicine",     "15GC",     1, "Rare",   "Books", "Medical texts including detailed autopsy drawings and procedural diagrams."),
    E("Book, Religion",     "1GC",      1, "Common", "Books", "Religious texts in all forms; many cheaply produced by printing presses."),
    E("Guild License",      "N/A",      0, "N/A",    "Books", "Printed on parchment, stamped with an official seal. Granted to guild members, not purchased."),
    E("Leaflet",            "1/\u2013", 0, "Common", "Books"),
    E("Legal Document",     "3/\u2013", 0, "Common", "Books", "A simple legal document such as a will, IOU, or letter of intent."),
    E("Map",                "3GC",      0, "Scarce", "Books"),
    E("Parchment/sheet",    "1/\u2013", 0, "Common", "Books"),

    # =========================================================================
    # TRADE TOOLS AND WORKSHOPS
    # =========================================================================
    E("Trade Tools", "3GC",  1, "Rare",   "Trade Tools", "Required for Trade Tests to make or fix items. Covers all trade specialities (Apothecary, Smith, Herbalist, etc.)."),
    E("Workshop",    "80GC", 0, "Exotic", "Trade Tools", "Required for larger crafting projects. Enc listed as N/A in source (not a carried item)."),

    # =========================================================================
    # ANIMALS AND VEHICLES
    # =========================================================================
    E("Cart",               "20GC",       0, "Common", "Animals", "Carries 25 Enc. Requires one driver and one draft animal."),
    E("Chicken",            "5d",         1, "Common", "Animals"),
    E("Coach",              "150GC",      0, "Rare",   "Animals", "Carries 80 Enc. Standard: two drivers and four horses."),
    E("Coracle",            "2GC",        6, "Scarce", "Animals", "Carries 10 Enc. Small leather or bark boat for one person; rowed with a single oar."),
    E("Destrier",           "230GC",      0, "Scarce", "Animals", "Carries 20 Enc. Horse trained for war."),
    E("Dog collar and lead","1/7",         0, "Common", "Animals"),
    E("Draught Horse",      "4GC",        0, "Common", "Animals", "Carries 20 Enc."),
    E("Homing Pigeons",     "3/\u2013",   1, "Scarce", "Animals", "Carries 0 Enc."),
    E("Hunting Dog",        "2GC",        0, "Rare",   "Animals", "Carries 0 Enc."),
    E("Light Warhorse",     "70GC",       0, "Common", "Animals", "Carries 18 Enc."),
    E("Monkey",             "10GC",       2, "Rare",   "Animals", "Carries 1 Enc."),
    E("Mule",               "5GC",        0, "Common", "Animals", "Carries 14 Enc."),
    E("Pony",               "10GC",       0, "Common", "Animals", "Carries 14 Enc."),
    E("Riding Horse",       "15GC",       0, "Common", "Animals", "Carries 16 Enc."),
    E("River Barge",        "225GC",      0, "Rare",   "Animals", "Carries 300 Enc. Standard crew: three."),
    E("Row Boat",           "6GC",        0, "Scarce", "Animals", "Carries 60 Enc. Standard crew: one rower."),
    E("Saddle and Harness", "6GC",        4, "Common", "Animals"),
    E("Wagon",              "75GC",       0, "Common", "Animals", "Carries 30 Enc. Standard: one driver and two horses."),
    E("Worms (6)",          "1d",         0, "Common", "Animals"),

    # =========================================================================
    # DRUGS AND POISONS
    # =========================================================================
    E("Black Lotus",       "20GC",        0, "Exotic", "Drugs & Poisons", "Deadly blade venom. Victims hit for 1+ Wound take 2 Poisoned Conditions; resisted with Difficult (\u201310) Endurance."),
    E("Heartkill",         "40GC",        0, "Exotic", "Drugs & Poisons", "Odourless poison from Amphisbaena and Jabberslythe venoms. When ingested inflicts 4 Poisoned Conditions; resisted with Difficult (\u201310) Endurance."),
    E("Mad Cap Mushrooms", "5GC",         0, "Exotic", "Drugs & Poisons", "Hallucinogenic. Adds +10 Strength, +4 Wounds, and Frenzy; user loses 1d10 Wounds when effect ends. Duration: 2d10 minutes."),
    E("Mandrake Root",     "1GC",         0, "Rare",   "Drugs & Poisons", "Highly addictive deliriant. WP Test each Round to act; Movement halved; Cool Tests +20. Duration: 1d10\u00d710 minutes."),
    E("Moonflower",        "5GC",         0, "Scarce", "Drugs & Poisons", "Tranquilliser. Elves gain +30 to resist Black Plague; others risk Unconscious Condition or gain +20 Cool. Duration: 1d10+5 hours."),
    E("Ranald's Delight",  "18/\u2013",   0, "Scarce", "Drugs & Poisons", "Stimulant. +1 Movement and +10 to WS, S, T, Agi for 3 hours; afterwards \u20132 Movement and \u201320 to those Characteristics."),
    E("Spit",              "1GC 5/\u2013",0, "Rare",   "Drugs & Poisons", "Powerful hallucinogen. Fail Very Hard (\u201330) Toughness or be lost in vivid fantasy. Duration: 1d10 minutes."),
    E("Weirdroot",         "4/\u2013",    0, "Rare",   "Drugs & Poisons", "Common street drug. Chewed for euphoria; +10 Toughness and Willpower, \u201310 Agility, Initiative, and Intelligence. Duration: 1d10\u00d710 minutes."),

    # =========================================================================
    # HERBS AND DRAUGHTS
    # =========================================================================
    E("Digestive Tonic",  "3/\u2013",  0, "Common", "Herbs", "Provides +20 to recovery Tests from stomach ailments such as Galloping Trots or Bloody Flux."),
    E("Earth Root",       "5GC",        0, "Scarce", "Herbs", "Negates Buboes from Black Plague; grants +10 on all related Tests. Dose: 1 per day."),
    E("Faxtoryll",        "15/\u2013",  0, "Exotic", "Herbs", "Herbal coagulant; poultices remove all Bleeding Conditions without a Heal Test. Dose: 1 per Critical Wound."),
    E("Healing Draught",  "10/\u2013",  0, "Scarce", "Herbs", "Immediately recover Toughness Bonus Wounds if you have more than 0. Dose: 1 per encounter."),
    E("Healing Poultice", "12/\u2013",  0, "Common", "Herbs", "Prevents Minor Infections from a treated Critical Wound."),
    E("Nightshade",       "3GC",        0, "Rare",   "Herbs", "Causes deep sleep after 2\u20133 hours unless Endurance Test passed; lasts 1d10+4 hours. Dose: 1 per person."),
    E("Salwort",          "12/\u2013",  0, "Common", "Herbs", "Crushed sprig removes 1 Stunned Condition when held under someone's nose. Dose: 1 per encounter."),
    E("Vitality Draught", "18/\u2013",  0, "Scarce", "Herbs", "Instantly removes all Fatigued Conditions."),

    # =========================================================================
    # PROSTHETICS
    # =========================================================================
    E("Eye Patch",          "6d",        0, "Common", "Prosthetics", "Often decorated; used to cover scarred eye sockets."),
    E("False Eye",          "1GC",       0, "Rare",   "Prosthetics", "Comes in many forms from wooden to polished glass; popular with the wealthy."),
    E("False Leg",          "16/\u2013", 2, "Scarce", "Prosthetics", "Ignores 1 point of Movement loss from missing limb. For 100 XP recover last Movement point; for 200 XP relearn Dodge."),
    E("Gilded Nose",        "18/\u2013", 0, "Scarce", "Prosthetics", "Usually wood or ceramic. Ignore the Fellowship loss for having no nose."),
    E("Hook",               "3/4",       1, "Common", "Prosthetics", "Replaces a lost hand. Buy back \u201320 penalty for 100 XP per 5 subtracted. Counts as a Dagger in Close Combat."),
    E("Engineering Marvel", "20GC",      1, "Exotic", "Prosthetics", "Steam-powered prosthetic from Engineers' Guild. Fully replaces lost ear, hand, arm, or leg; breaks on Critical Wound and costs 10%+ to repair."),
    E("Wooden Teeth",       "10/\u2013", 0, "Rare",   "Prosthetics", "False teeth; ignore all penalties for loss of teeth."),

    # =========================================================================
    # MISCELLANEOUS TRAPPINGS
    # =========================================================================
    E("Ball",           "5d",          0, "Common",  "Miscellaneous"),
    E("Bandage",        "4d",          0, "Common",  "Miscellaneous", "A successful Heal Test removes +1 extra Bleeding Condition."),
    E("Baton",          "1/\u2013",    0, "Common",  "Miscellaneous"),
    E("Bedroll",        "6/\u2013",    1, "Common",  "Miscellaneous", "Endurance Tests to resist cold exposure gain +20 when resting."),
    E("Blanket",        "8d",          0, "Common",  "Miscellaneous"),
    E("Candle (dozen)", "1/\u2013",    0, "Common",  "Miscellaneous", "Provides illumination for 10 yards when lit."),
    E("Canvas Tarp",    "8/\u2013",    1, "Common",  "Miscellaneous"),
    E("Chalk",          "10d",         0, "Common",  "Miscellaneous"),
    E("Charcoal Stick", "10d",         0, "Common",  "Miscellaneous"),
    E("Cutlery",        "3/6",         0, "Common",  "Miscellaneous"),
    E("Davrich Lamp",   "2GC",         1, "Rare",    "Miscellaneous", "Safety lamp for mines; flares in firedamp and causes explosion after 1d10 rounds."),
    E("Deck of Cards",  "1/\u2013",    0, "Common",  "Miscellaneous"),
    E("Cooking Pot",    "8/\u2013",    1, "Common",  "Miscellaneous"),
    E("Cup",            "8d",          0, "Common",  "Miscellaneous"),
    E("Dice",           "10d",         0, "Common",  "Miscellaneous"),
    E("Doll",           "2/\u2013",    0, "Common",  "Miscellaneous"),
    E("Grappling Hook", "1GC 0/10",    1, "Scarce",  "Miscellaneous", "Coupled with a rope, allows unscalable surfaces to be climbed."),
    E("Instrument",     "2GC",         1, "Rare",    "Miscellaneous", "Medium-sized instrument (e.g. mandolin). Small: half price, 0 Enc. Large: double price, 2 Enc."),
    E("Lamp Oil",       "2/\u2013",    0, "Common",  "Miscellaneous", "Fuel for 4 hours standard or 8 hours at low flame."),
    E("Lantern",        "12/\u2013",   1, "Common",  "Miscellaneous", "Provides illumination for 20 yards."),
    E("Storm Lantern",  "1GC",         1, "Scarce",  "Miscellaneous", "Shuttered; illuminates 20 yards (30 targeted). Flame protected from wind."),
    E("Match",          "1d",          0, "Common",  "Miscellaneous"),
    E("Pan",            "7/6",         1, "Common",  "Miscellaneous"),
    E("Pipe and Tobacco","3/4",        0, "Scarce",  "Miscellaneous"),
    E("Placard",        "1/\u2013",    2, "Common",  "Miscellaneous"),
    E("Plate",          "1/\u2013",    0, "Common",  "Miscellaneous"),
    E("Bowl",           "1/\u2013",    0, "Common",  "Miscellaneous"),
    E("Rags",           "1d",          0, "Common",  "Miscellaneous"),
    E("Rope, 10 yards", "8/4",         1, "Common",  "Miscellaneous"),
    E("Tent",           "12/\u2013",   2, "Scarce",  "Miscellaneous", "Medium tent for four people. Small (2 people): half price, 1 Enc. Large (8 people): double price, 4 Enc."),
    E("Tinderbox",      "4/2",         0, "Common",  "Miscellaneous"),

    # =========================================================================
    # HIRELINGS  (price = Quick Job cost; daily/weekly rates in description)
    # =========================================================================
    E("Local Scout",        "5d",           0, "Common", "Hirelings", "Daily: 15d. Weekly: 10/\u2013. Works independently without Leadership Tests."),
    E("Seasoned Mercenary", "3/\u2013",     0, "Common", "Hirelings", "Daily: 9/\u2013. Weekly: 3GC/12/\u2013. Demands a share of loot in lieu of danger pay."),
    E("Lawyer",             "3/\u2013",     0, "Common", "Hirelings", "Daily: 9/\u2013. Weekly: 3GC/12/\u2013. Drafting a simple legal document costs 2\u20134 shillings."),
    E("Porter",             "1/\u2013",     0, "Common", "Hirelings", "Daily: 3/\u2013. Weekly: 1GC/4/\u2013. Carries 10 Encumbrance points."),
    E("Scribe",             "2/\u2013",     0, "Common", "Hirelings", "Daily: 6/\u2013. Weekly: 2GC/8/\u2013. Also translates 1\u20132 other common languages."),
    E("Doktor",             "5/\u2013",     0, "Common", "Hirelings", "Daily: 15/\u2013. Weekly: 5GC. A single visit costs 4\u20136 shillings for medical attention."),
]

with open(os.path.join(OUTPUT_DIR, "equipment.json"), "w", encoding="utf-8") as f:
    json.dump(equipment, f, ensure_ascii=False, indent=2)
print(f"equipment.json: {len(equipment)} items")

print("\nAll done.")
