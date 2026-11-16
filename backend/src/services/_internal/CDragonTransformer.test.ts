import { describe, it, expect } from 'vitest';
import { CDragonTransformer } from './CDragonTransformer';
import { TftRawData, RawCDragonChampion, RawCDragonTrait, RawCDragonItem } from './CDragonService';

const MOCK_CDN_BASE = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default';

describe('CDragonTransformer', () => {
  describe('transformChampion', () => {
    it('maps champion fields correctly', () => {
      const raw: RawCDragonChampion = {
        apiName: 'TFT17_Vex',
        name: 'Vex',
        cost: 3,
        traits: ['Arcane', 'Sorcerer'],
        stats: { hp: 700, mana: 60, initialMana: 0, armor: 25, magicResist: 25, attackSpeed: 0.7, damage: 50, range: 3, critChance: 0.25, critMultiplier: 1.4 },
        ability: { name: 'Shadow Burst', desc: 'Deals magic damage', variables: [{ name: 'Damage', value: [200, 300, 450] }] },
        icon: 'ASSETS/UX/TFT/ChampionSplashes/TFT17_Vex.tex',
        squareIcon: 'ASSETS/UX/TFT/ChampionSplashes/TFT17_Vex_Mobile.tex',
        tileIcon: 'ASSETS/Characters/TFT17_Vex/HUD/TFT17_Vex_Square.tex',
      };

      const result = CDragonTransformer.transformChampion(raw, MOCK_CDN_BASE);

      expect(result.id).toBe('TFT17_Vex');
      expect(result.name).toBe('Vex');
      expect(result.cost).toBe(3);
      expect(result.traits).toEqual(['Arcane', 'Sorcerer']);
      expect(result.stats).toEqual({
        hp: 700,
        mana: 60,
        damage: 50,
        armor: 25,
        magicResist: 25,
        attackSpeed: 0.7,
        range: 3,
        initialMana: 0,
        critChance: 0.25,
        critMultiplier: 1.4,
      });
      expect(result.ability.name).toBe('Shadow Burst');
      expect(result.ability.description).toBe('Deals magic damage');
      expect(result.ability.variables).toEqual([{ name: 'Damage', values: [200, 300, 450] }]);
      expect(result.imageUrl).toBe(
        'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/characters/tft17_vex/hud/tft17_vex_square.png'
      );
      expect(result.iconUrl).toBe(result.imageUrl);
      expect(result.splashUrl).toBe(
        'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/ux/tft/championsplashes/tft17_vex_mobile.png'
      );
    });

    it('falls back to the splash tile and strips its TFT set variant suffix', () => {
      const raw = {
        apiName: 'TFT17_Briar',
        name: 'Briar',
        cost: 3,
        traits: [],
        stats: undefined,
        ability: undefined,
        icon: '',
        squareIcon:
          'ASSETS/Characters/TFT17_Briar/Skins/Base/Images/TFT17_Briar_splash_tile_10.TFT_Set17.tex',
      } as unknown as RawCDragonChampion;

      const result = CDragonTransformer.transformChampion(raw, MOCK_CDN_BASE);

      expect(result.imageUrl).toBe(
        'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/characters/tft17_briar/skins/base/images/tft17_briar_splash_tile_10.png'
      );
    });

    it('handles missing stats gracefully', () => {
      const raw = {
        apiName: 'TFT17_Test',
        name: 'Test',
        cost: 1,
        traits: [],
        stats: undefined,
        ability: undefined,
        icon: '',
        squareIcon: '',
      } as unknown as RawCDragonChampion;

      const result = CDragonTransformer.transformChampion(raw, MOCK_CDN_BASE);

      expect(result.stats).toEqual({
        hp: 600,
        mana: 40,
        damage: 50,
        armor: 40,
        magicResist: 40,
        attackSpeed: 0.55,
        range: 1,
        initialMana: 0,
        critChance: 0.25,
        critMultiplier: 1.4,
      });
      expect(result.ability).toEqual({ name: '', description: '', variables: [] });
    });

    it('normalizes ability variables with null values to empty arrays', () => {
      const raw = {
        apiName: 'TFT17_Gwen',
        name: 'Gwen',
        cost: 3,
        traits: [],
        stats: undefined,
        ability: {
          name: 'Snip Snip!',
          desc: '',
          variables: [
            { name: 'BonusDashRange', value: null },
            { name: 'Damage', value: [100, 150, 999] },
          ],
        },
        icon: '',
        squareIcon: '',
      } as unknown as RawCDragonChampion;

      const result = CDragonTransformer.transformChampion(raw, MOCK_CDN_BASE);

      expect(result.ability.variables).toEqual([
        { name: 'BonusDashRange', values: [] },
        { name: 'Damage', values: [100, 150, 999] },
      ]);
    });
  });

  describe('transformTrait', () => {
    it('maps trait with effects to breakpoints', () => {
      const raw: RawCDragonTrait = {
        apiName: 'TFT17_Arcane',
        name: 'Arcane',
        desc: 'Arcane units gain mana',
        effects: [
          { minUnits: 2, maxUnits: 3, style: null, variables: [{ name: 'Mana', value: [20] }] },
          { minUnits: 4, maxUnits: 5, style: null, variables: [{ name: 'Mana', value: [50] }] },
        ],
        icon: '',
      };

      const result = CDragonTransformer.transformTrait(raw);

      expect(result.key).toBe('TFT17_Arcane');
      expect(result.name).toBe('Arcane');
      expect(result.description).toBe('Arcane units gain mana');
      expect(result.imageUrl).toBeNull();
      expect(result.breakpoints).toHaveLength(2);
      expect(result.breakpoints[0]).toEqual({
        count: 2,
        bonus: 'Mana: 20',
        variables: [{ name: 'Mana', value: 20 }],
        rawVariables: [],
      });
      expect(result.breakpoints[1]).toEqual({
        count: 4,
        bonus: 'Mana: 50',
        variables: [{ name: 'Mana', value: 50 }],
        rawVariables: [],
      });
    });

    it('keeps hash-keyed variables out of the display bonus but preserves their values', () => {
      const raw = {
        apiName: 'DA_18_Elderwood',
        name: 'Elderwood',
        desc: 'Gain plants',
        effects: [
          {
            minUnits: 3,
            maxUnits: 4,
            style: 1,
            variables: { StonebarkTreeBonusHealth: 100, '{0f90e7a4}': 0.25 },
          },
        ],
        icon: '',
      } as unknown as RawCDragonTrait;

      const result = CDragonTransformer.transformTrait(raw);

      expect(result.breakpoints[0].bonus).toBe('StonebarkTreeBonusHealth: 100');
      expect(result.breakpoints[0].variables).toEqual([{ name: 'StonebarkTreeBonusHealth', value: 100 }]);
      expect(result.breakpoints[0].rawVariables).toEqual([{ key: '{0f90e7a4}', value: 0.25 }]);
    });

    it('handles missing effects and description', () => {
      const raw = {
        apiName: 'TFT17_Test',
        name: '',
        desc: '',
        effects: null,
        icon: '',
      } as unknown as RawCDragonTrait;

      const result = CDragonTransformer.transformTrait(raw);

      expect(result.key).toBe('TFT17_Test');
      expect(result.name).toBe('TFT17_Test');
      expect(result.description).toBe('');
      expect(result.imageUrl).toBeNull();
      expect(result.breakpoints).toEqual([]);
    });

    it('maps the trait icon to an asset URL', () => {
      const raw = {
        apiName: 'TFT17_VexUniqueTrait',
        name: 'Doomer',
        desc: '',
        effects: [],
        icon: 'ASSETS/UX/TraitIcons/Trait_Icon_17_Doomer.TFT_Set17.tex',
      } as unknown as RawCDragonTrait;

      expect(CDragonTransformer.transformTrait(raw).imageUrl).toBe(
        'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/ux/traiticons/trait_icon_17_doomer.png',
      );
    });

    it('skips effects without a numeric minimum unit count', () => {
      const raw: RawCDragonTrait = {
        apiName: 'DA_18_Eclipse',
        name: 'Eclipse',
        desc: '',
        effects: [
          { minUnits: null, maxUnits: null, style: null, variables: [{ name: 'DelaySeconds', value: [8] }] },
          { minUnits: 2, maxUnits: 3, style: null, variables: [{ name: 'DamageAmp', value: [0.1] }] },
        ],
        icon: '',
      } as unknown as RawCDragonTrait;

      const result = CDragonTransformer.transformTrait(raw);

      expect(result.breakpoints).toHaveLength(1);
      expect(result.breakpoints[0].count).toBe(2);
    });

    it('strips client markup, per-tier rows, and unit-property refs from the description', () => {
      const raw = {
        apiName: 'Set17_CarouselMarket_Psionic',
        name: 'Psionic',
        desc:
          'Gain Psionic items that can be equipped to any ally.<br><br>' +
          '<row>(@MinUnits@) Gain the @TFTUnitProperty.trait:TFT17_PsyOps_Item1@</row><br>' +
          '<expandRow>(@MinUnits@) @Effectiveness*100@% strength</expandRow>',
        effects: [],
        icon: '',
      } as unknown as RawCDragonTrait;

      const result = CDragonTransformer.transformTrait(raw);

      expect(result.description).toBe('Gain Psionic items that can be equipped to any ally.');
    });

    it('keeps inline tag text but drops icons, placeholders, and orphan percents', () => {
      const raw = {
        apiName: 'TFT7_Whispers',
        name: 'Whispers',
        desc:
          'Damage applies 20% <TFTKeyword>Shred</TFTKeyword> for @Duration@&nbsp;seconds ' +
          'and <tftbold>more</tftbold>.<br><rules>More stats at higher tiers</rules>',
        effects: [],
        icon: '',
      } as unknown as RawCDragonTrait;

      const result = CDragonTransformer.transformTrait(raw);

      expect(result.description).toBe(
        'Damage applies 20% Shred for seconds and more. More stats at higher tiers',
      );
    });

    it('drops dynamic tracker blocks and label-only parentheses', () => {
      const raw = {
        apiName: 'TFT14_Virus',
        name: 'Virus',
        desc:
          'Infects your shop. (Current Bonus: @Bonus@% ) ' +
          '<TFTTracker>(Total Bloblets: <TFTBonus>@TFTUnitProperty.trait:TFT14_Virus_Stacks@</TFTBonus>)</TFTTracker>',
        effects: [],
        icon: '',
      } as unknown as RawCDragonTrait;

      const result = CDragonTransformer.transformTrait(raw);

      expect(result.description).toBe('Infects your shop.');
    });

    it('returns an empty description when only unresolvable property refs remain', () => {
      const raw = {
        apiName: 'Set17_CarouselMarket_EmpoweredHexTrait',
        name: 'God-Blessed',
        desc:
          '@TFTUnitProperty.trait:TFT17_CarouselMarket_TraitTRAKey1@<br><br>' +
          '@TFTUnitProperty.trait:TFT17_CarouselMarket_TraitTRAKey2@<br>',
        effects: [],
        icon: '',
      } as unknown as RawCDragonTrait;

      const result = CDragonTransformer.transformTrait(raw);

      expect(result.description).toBe('');
    });
  });

  describe('transformItem', () => {
    it('maps item fields', () => {
      const raw: RawCDragonItem = {
        apiName: 'TFT17_BFSword',
        name: 'B.F. Sword',
        description: '+15 Attack Damage',
        icon: '',
      };

      const result = CDragonTransformer.transformItem(raw, MOCK_CDN_BASE);

      expect(result.id).toBe('TFT17_BFSword');
      expect(result.name).toBe('B.F. Sword');
      expect(result.description).toBe('+15 Attack Damage');
      expect(result.components).toEqual([]);
      expect(result.effects).toEqual([]);
      expect(result.rawEffects).toEqual([]);
      expect(result.imageUrl).toBeNull();
    });

    it('sanitizes client markup in item descriptions', () => {
      const raw = {
        apiName: 'TFT17_SupportItem',
        name: 'Support Item',
        description:
          'Each round: Equip 2 random Support items.<br><br>' +
          '<tftitemrules>[Consumes 3 item slots.]</tftitemrules><br>' +
          '@TFTUnitProperty.:TFT_BindOnEquipTRA@',
        icon: '',
      } as unknown as RawCDragonItem;

      const result = CDragonTransformer.transformItem(raw, MOCK_CDN_BASE);

      expect(result.description).toBe(
        'Each round: Equip 2 random Support items. [Consumes 3 item slots.]',
      );
    });

    it('sanitizes placeholder tokens out of item names', () => {
      const raw = {
        apiName: 'TFT17_MarketOffering_Health',
        name: '@Health@ Tactician Health',
        description: '',
        icon: '',
      } as unknown as RawCDragonItem;

      expect(CDragonTransformer.transformItem(raw, MOCK_CDN_BASE).name).toBe('Tactician Health');
    });

    it('maps components, unique, trait, and numeric effects', () => {
      const raw = {
        apiName: 'TFT17_Item_Sample',
        name: 'Sample',
        description: 'd',
        icon: '',
        composition: ['TFT17_Item_BFSword'],
        unique: true,
        associatedTraits: ['TFT17_Challenger'],
        effects: { AD: 0.2, '{abb9f4ce}': 25, Broken: null },
      } as unknown as RawCDragonItem;

      const result = CDragonTransformer.transformItem(raw, MOCK_CDN_BASE);

      expect(result.components).toEqual(['TFT17_Item_BFSword']);
      expect(result.unique).toBe(true);
      expect(result.trait).toBe('TFT17_Challenger');
      expect(result.effects).toEqual([{ name: 'AD', value: 0.2 }]);
      expect(result.rawEffects).toEqual([{ key: '{abb9f4ce}', value: 25 }]);
    });

    it('builds imageUrl from icon field', () => {
      const raw: RawCDragonItem = {
        apiName: 'TFT17_BFSword',
        name: 'B.F. Sword',
        description: 'AD',
        icon: 'ASSETS/UX/TFT/ItemIcons/BFSword.tex',
      };

      const result = CDragonTransformer.transformItem(raw, MOCK_CDN_BASE);

      expect(result.imageUrl).toBe(
        'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/ux/tft/itemicons/bfsword.png'
      );
    });

    it('strips patch-version suffixes that are not part of the hosted filename', () => {
      const postlaunch = CDragonTransformer.transformItem(
        {
          apiName: 'TFT17_Augment_Timestream',
          name: 'Timestream',
          description: '',
          icon: 'ASSETS/Maps/TFT/Icons/Augments/Hexcore/Timestream_II.TFT_Set17_PostlaunchAugments.tex',
        },
        MOCK_CDN_BASE,
      );
      const hotfix = CDragonTransformer.transformItem(
        {
          apiName: 'TFT17_Augment_Concentration',
          name: 'Concentration',
          description: '',
          icon: 'ASSETS/Maps/TFT/Icons/Augments/Hexcore/Concentration_II.tft_17_3.tex',
        },
        MOCK_CDN_BASE,
      );

      expect(postlaunch.imageUrl).toMatch(/\/timestream_ii\.png$/);
      expect(hotfix.imageUrl).toMatch(/\/concentration_ii\.png$/);
    });
  });

  describe('transformAugment', () => {
    it('maps raw CDragon augment to GraphQL shape', () => {
      const raw = {
        apiName: 'TFT17_Aug1',
        name: 'Arcane Empowerment',
        desc: 'Your Arcane units gain 30 AP',
        icon: 'ASSETS/UX/TFT/Augments/Arcane.tex',
      };

      const result = CDragonTransformer.transformAugment(raw, MOCK_CDN_BASE);

      expect(result.id).toBe('TFT17_Aug1');
      expect(result.name).toBe('Arcane Empowerment');
      expect(result.description).toBe('Your Arcane units gain 30 AP');
      expect(result.imageUrl).toContain('arcane.png');
    });

    it('drops tier placeholders from augment names and trims leftover punctuation', () => {
      const raw = {
        apiName: 'TFT18_Augment_ShopTier',
        name: '@Tier@-Cost Shop',
        desc: '',
        icon: '',
      };

      expect(CDragonTransformer.transformAugment(raw, MOCK_CDN_BASE).name).toBe('Cost Shop');
    });

    it('handles missing fields', () => {
      const result = CDragonTransformer.transformAugment({}, MOCK_CDN_BASE);

      expect(result.id).toBe('');
      expect(result.name).toBe('');
      expect(result.description).toBe('');
      expect(result.imageUrl).toBeNull();
    });
  });

  describe('transformSet', () => {
    it('uses the sets roster (incl. non-prefixed champions) and setData.number for items/augments', () => {
      const ahri = {
        apiName: 'TFT17_Ahri',
        name: 'Ahri',
        cost: 4,
        traits: ['Arcane', 'Sorcerer'],
        stats: { hp: 800, mana: 40, initialMana: 0, armor: 20, magicResist: 20, attackSpeed: 0.75, damage: 55, range: 3, critChance: 0.25, critMultiplier: 1.4 },
        ability: { name: 'Orb', desc: '', variables: [{ name: 'Dmg', value: [300, 450, 675] }] },
        icon: '',
        squareIcon: '',
      } as RawCDragonChampion;
      const blueGolem = {
        apiName: 'TFT_BlueGolem',
        name: 'Blue Golem',
        cost: 1,
        traits: [],
        stats: { hp: 600, mana: 100, initialMana: 30, armor: 40, magicResist: 40, attackSpeed: 0.55, damage: 55, range: 1, critChance: 0.25, critMultiplier: 1.4 },
        ability: { name: 'Smash', desc: 'Slam', variables: [{ name: 'Damage', value: [100, 300, 480] }] },
        icon: '',
        squareIcon: '',
      } as RawCDragonChampion;

      const raw: TftRawData = {
        sets: {
          '17': {
            name: 'Set 17',
            champions: [ahri, blueGolem],
            traits: [
              {
                apiName: 'TFT17_Arcane',
                name: 'Arcane',
                desc: 'Mana on cast',
                effects: [{ minUnits: 2, maxUnits: 3, style: null, variables: { Mana: 20 } }],
                icon: '',
              } as RawCDragonTrait,
            ],
          },
        },
        setData: {
          '0': {
            name: 'Set 15',
            number: 15,
            champions: [blueGolem],
            traits: [],
            items: [{ apiName: 'TFT15_Old', name: 'Old', description: '', icon: '' }],
            augments: ['TFT15_Augment_Old'],
          },
          '4': {
            name: 'Set 17',
            number: 17,
            champions: [ahri],
            traits: [],
            items: [
              { apiName: 'TFT17_BFSword', name: 'B.F. Sword', description: 'AD', icon: '', composition: ['TFT17_BFSword'] },
              { apiName: 'TFT17_Rabadon', name: 'Rabadon', description: 'AP', icon: '' },
            ],
            augments: ['TFT17_Aug1', 'TFT10_Augment_CrownGuarded'],
          },
        },
        items: [],
        augments: [{ apiName: 'TFT17_Aug1', name: 'Augment 1', desc: 'Test augment', icon: '' }],
      };

      const result = CDragonTransformer.transformSet(raw, 17, MOCK_CDN_BASE);

      expect(result.setName).toBe('Set 17');
      expect(result.champions.map((c) => c.id)).toEqual(['TFT17_Ahri', 'TFT_BlueGolem']);
      expect(result.traits.map((t) => t.key)).toEqual(['TFT17_Arcane']);
      expect(result.items.map((i) => i.id)).toEqual(['TFT17_BFSword', 'TFT17_Rabadon']);
      expect(result.augments.map((a) => a.id)).toEqual(['TFT17_Aug1', 'TFT10_Augment_CrownGuarded']);
      expect(result.augments[0]).toMatchObject({ name: 'Augment 1', description: 'Test augment' });
      expect(result.augments[1].name).toBe('Crown Guarded');
    });

    it('enriches set augments from the top-level items array when augment metadata is absent', () => {
      const raw: TftRawData = {
        setData: {
          '0': {
            name: 'Set 18',
            number: 18,
            champions: [],
            traits: [],
            items: [],
            augments: ['DA_18_BigGrabBag'],
          },
        },
        items: [
          {
            apiName: 'DA_18_BigGrabBag',
            name: 'Big Grab Bag',
            description: 'Gain rewards.',
            icon: 'ASSETS/Maps/TFT/Icons/Augments/Hexcore/grab-bag-ii.tex',
          },
        ],
        augments: [],
      };

      const result = CDragonTransformer.transformSet(raw, 18, MOCK_CDN_BASE);

      expect(result.augments).toHaveLength(1);
      expect(result.augments[0]).toMatchObject({
        id: 'DA_18_BigGrabBag',
        name: 'Big Grab Bag',
        description: 'Gain rewards.',
        imageUrl:
          'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/maps/tft/icons/augments/hexcore/grab-bag-ii.png',
      });
    });

    it('falls back to prefix scanning when sets/setData numbers are absent', () => {
      const raw: TftRawData = {
        setData: {
          '0': {
            name: 'Category0',
            champions: [
              {
                apiName: 'TFT17_Garen',
                name: 'Garen',
                cost: 1,
                traits: ['Fortress'],
                stats: { hp: 650, mana: 50, initialMana: 0, armor: 35, magicResist: 25, attackSpeed: 0.6, damage: 45, range: 1, critChance: 0.25, critMultiplier: 1.4 },
                ability: { name: 'Spin', desc: '', variables: [] },
                icon: '',
                squareIcon: '',
              } as RawCDragonChampion,
              {
                apiName: 'TFT16_Renekton',
                name: 'Renekton',
                cost: 1,
                traits: [],
                stats: { hp: 600, mana: 0, initialMana: 0, armor: 25, magicResist: 25, attackSpeed: 0.65, damage: 50, range: 1, critChance: 0.25, critMultiplier: 1.4 },
                ability: { name: '', desc: '', variables: [] },
                icon: '',
                squareIcon: '',
              } as unknown as RawCDragonChampion,
            ],
            traits: [],
          },
        },
        items: [
          { apiName: 'TFT17_BFSword', name: 'B.F. Sword', description: 'AD', icon: '' } as RawCDragonItem,
          { apiName: 'TFT16_BFSword', name: 'B.F. Sword', description: 'AD', icon: '' } as RawCDragonItem,
        ],
        augments: [
          { apiName: 'TFT17_Aug1', name: 'Augment 1', desc: 'Test augment', icon: '' },
          { apiName: 'TFT16_AugOld', name: 'Old Aug', desc: '', icon: '' },
        ],
      };

      const result = CDragonTransformer.transformSet(raw, 17, MOCK_CDN_BASE);

      expect(result.champions.map((c) => c.id)).toEqual(['TFT17_Garen']);
      expect(result.items.map((i) => i.id)).toEqual(['TFT17_BFSword']);
      expect(result.augments).toHaveLength(1);
      expect(result.augments[0]).toMatchObject({ id: 'TFT17_Aug1', name: 'Augment 1' });
    });

    it('returns empty arrays when no setData exists', () => {
      const raw: TftRawData = { setData: {}, items: [], augments: [] };

      const result = CDragonTransformer.transformSet(raw, 99, MOCK_CDN_BASE);

      expect(result.champions).toEqual([]);
      expect(result.traits).toEqual([]);
      expect(result.items).toEqual([]);
      expect(result.augments).toEqual([]);
    });
  });
});
