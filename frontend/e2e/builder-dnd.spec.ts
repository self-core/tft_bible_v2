import { test, expect } from '@playwright/test';

const champions = [
  {
    __typename: 'Champion',
    id: 'TFT18_Puff',
    name: 'Puff',
    cost: 2,
    traits: ['Wisp', 'Mage'],
    stats: { __typename: 'ChampionStats', hp: 600, mana: 40, damage: 50 },
    ability: { __typename: 'Ability', name: 'Puff', description: '', variables: [] },
    imageUrl: null,
    splashUrl: null,
    iconUrl: null,
  },
];

const traits = [
  {
    __typename: 'Trait',
    key: 'Wisp',
    name: 'Wisp',
    description: '',
    breakpoints: [{ __typename: 'TraitBreakpoint', count: 3, bonus: 'Wisps are upgraded', variables: [] }],
  },
  {
    __typename: 'Trait',
    key: 'Mage',
    name: 'Mage',
    description: '',
    breakpoints: [{ __typename: 'TraitBreakpoint', count: 2, bonus: 'Mages cast twice', variables: [] }],
  },
];

const items = [
  {
    __typename: 'Item',
    id: 'TFT18_BFSword',
    name: 'B.F. Sword',
    description: '',
    components: [],
    effects: [],
    imageUrl: null,
    unique: false,
    trait: null,
  },
];

async function mockBuilderData(page: import('@playwright/test').Page) {
  await page.route('**/graphql', async (route) => {
    const body = route.request().postData() || '';
    if (body.includes('champions')) {
      await route.fulfill({ json: { data: { champions } } });
      return;
    }
    if (body.includes('traits')) {
      await route.fulfill({ json: { data: { traits } } });
      return;
    }
    if (body.includes('items')) {
      await route.fulfill({ json: { data: { items } } });
      return;
    }
    await route.fulfill({ json: { data: {} } });
  });
}

async function dragPaletteTo(page: import('@playwright/test').Page, dropId: string) {
  const tile = page.getByTestId('palette-TFT18_Puff');
  const cell = page.locator(`[data-drop-id="${dropId}"]`);
  const tileBox = await tile.boundingBox();
  const cellBox = await cell.boundingBox();
  if (!tileBox || !cellBox) throw new Error('Missing drag geometry');

  await page.mouse.move(tileBox.x + tileBox.width / 2, tileBox.y + tileBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(cellBox.x + cellBox.width / 2, cellBox.y + cellBox.height / 2, { steps: 10 });
  await page.mouse.up();
}

test.describe('Team Builder drag and drop', () => {
  test.beforeEach(async ({ page }) => {
    await mockBuilderData(page);
    await page.goto('/builder');
    await expect(page.getByTestId('palette-TFT18_Puff')).toBeVisible();
  });

  test('drags a palette champion onto the board', async ({ page }) => {
    await dragPaletteTo(page, 'cell-2-3');

    const board = page.getByTestId('board-svg');
    await expect(board).toContainText('Puff');
    await expect(page.getByText('(1 / 28)')).toBeVisible();
  });

  test('assigns an item through the unit config popover', async ({ page }) => {
    await dragPaletteTo(page, 'cell-2-3');

    await page.getByTestId('board-svg').getByText('Puff').click();
    await expect(page.getByTestId('unit-config')).toBeVisible();

    await page.getByTestId('item-slot-0').click();
    await page.getByTestId('item-option-TFT18_BFSword').click();

    await expect(page.getByTestId('item-slot-0')).toHaveAttribute('data-filled', 'true');
  });
});
