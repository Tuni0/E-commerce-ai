import { test, expect } from '@playwright/test';

test.describe('E-commerce Platform Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.route('**/auth/verify', async route => {
      await route.fulfill({ json: { validUser: false } });
    });

    await page.route('**/products', async route => {
      await route.fulfill({
        json: [
          { id: 101, name: 'Test Product A', price: 50, imgSrc: '/img/a.jpg', imgAlt: 'Alt A' },
          { id: 102, name: 'Test Product B', price: 100, imgSrc: '/img/b.jpg', imgAlt: 'Alt B' },
        ]
      });
    });

    await page.route('**/basketItems', async route => {
      await route.fulfill({ json: [] });
    });
  });


  test('01. Homepage loads and displays brand title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Vite/);
    await expect(page.getByText('WebShop')).toBeVisible();
  });

  test('02. Homepage renders product list from API', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Test Product A')).toBeVisible();
    await expect(page.getByText('Test Product B')).toBeVisible();
  });

  test('03. Navigation to Login page works', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Account').click();
    await page.getByText('Log in').click();
    await expect(page).toHaveURL(/\/signin/);
  });

  test('04. Navigation to Sign Up page works', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Account').click();
    await page.getByText('Register').click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test('05. Navigation to Basket via icon works', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Basket').click();
    await expect(page).toHaveURL(/\/basket/);
  });


  test('06. ThemeSwitcher toggles dark mode', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');

    const initialClass = await html.getAttribute('class') || '';
  });


  test.describe('Sign Up Flow', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/signup');
    });

    test('07. Sign Up form renders all fields', async ({ page }) => {
      await expect(page.locator('input[name="user-name"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
    });

    test('08. Valid Sign Up redirects to Sign In', async ({ page }) => {
      await page.route('**/signup', async route => {
        await route.fulfill({ status: 201, body: 'User registered successfully' });
      });

      page.on('dialog', dialog => dialog.accept());

      await page.fill('input[name="user-name"]', 'New User');
      await page.fill('input[name="email"]', 'new@example.com');
      await page.fill('input[name="password"]', 'password123');

      const submitButton = page.locator('button[type="submit"]', { hasText: 'Sign in' });
      await page.locator('form button').click();

      await expect(page).toHaveURL(/\/signin/);
    });

    test('09. Duplicate email shows alert', async ({ page }) => {
      await page.route('**/signup', async route => {
        await route.fulfill({ status: 409, body: 'User already exists' });
      });

      let alertMessage = '';
      page.on('dialog', dialog => {
        alertMessage = dialog.message();
        dialog.accept();
      });

      await page.fill('input[name="user-name"]', 'Existing User');
      await page.fill('input[name="email"]', 'exists@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.locator('form button').click();

      await expect.poll(() => alertMessage).toContain('User already exists');
    });
  });


  test.describe('Sign In Flow', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/signin');
    });

    test('10. Sign In form renders email and password inputs', async ({ page }) => {
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
    });

    test('11. Successful login Redirects to Home', async ({ page }) => {
      await page.route('**/login', async route => {
        await route.fulfill({
          json: { Login: true, username: 'TestUser' }
        });
      });

      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'correctpass');
      await page.locator('form button').click();

      await expect(page).toHaveURL('/');
    });

    test('12. Incorrect password triggers alert', async ({ page }) => {
      await page.route('**/login', async route => {
        await route.fulfill({
          json: "Incorrect password"
        });
      });

      let alertMessage = '';
      page.on('dialog', dialog => {
        alertMessage = dialog.message();
        dialog.accept();
      });

      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'wrongpass');
      await page.locator('form button').click();

      await expect.poll(() => alertMessage).toContain('Incorrect password');
    });
  });


  test.describe('Logged In User', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/auth/verify', async route => {
        await route.fulfill({ json: { validUser: true, username: 'Authorized User' } });
      });
    });

    test('13. Navbar renders "Logged In" text', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByText('Logged In')).toBeVisible();
    });

    test('14. Logout interaction works', async ({ page }) => {
      await page.route('**/logout', async route => {
        await route.fulfill({ json: { Logout: true } });
      });

      await page.goto('/');
      await page.getByText('Logged In').click();
      await page.getByText('Log out').click();

      await expect(page).toHaveURL('/');
    });
  });


  test.describe('Product Details Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/products', async route => {
        if (route.request().url().endsWith('/products')) {
            await route.fulfill({
              json: [
                { id: 999, name: 'Premium Headphones', price: 300, imgSrc: '/assets/headphones.avif', imgAlt: 'Headphones' }
              ]
            });
        } else {
            route.continue();
        }
      });

      await page.route('**/products/999', async route => {
        await route.fulfill({
          json: {
             id: 999,
             name: 'Premium Headphones',
             price: 300,
             imgSrc: '/assets/headphones.avif',
             imgAlt: 'Headphones',
             description: 'Great sound'
          }
        });
      });

      await page.goto('/');
      await page.locator('a[href="/products/999"]').first().click();
      await expect(page).toHaveURL(/products\/999/);
    });

    test('15. Renders product details correctly', async ({ page }) => {
      await expect(page.getByRole('img', { name: 'Headphones' })).toBeVisible();
      await expect(page.locator('form')).toBeVisible();
    });

    test('16. Color selection updates state', async ({ page }) => {
      const firstRadio = page.locator('[role="radio"]').first();
      await firstRadio.waitFor({ state: 'visible' });
      await firstRadio.click();
      await expect(firstRadio).toBeChecked();
    });

    test('17. Size selection updates state', async ({ page }) => {
      const sizeRadio = page.locator('[role="radio"]').filter({ hasText: '32 GB' });
      await sizeRadio.click();
      await expect(sizeRadio).toBeChecked();
    });

    test('18. Submission without selection alerts user', async ({ page }) => {
      let alertMessage = '';
      page.on('dialog', dialog => {
        alertMessage = dialog.message();
        dialog.accept();
      });

      await page.locator('button[type="submit"]').click();

      await expect.poll(() => alertMessage).toContain('Please select a color and size');
    });

    test('19. Successful Add to Basket', async ({ page }) => {
       await page.route('**/products/999/basket', async route => {
         await route.fulfill({ json: { success: true } });
       });

       await page.locator('[role="radio"]').first().click();
       await page.locator('[role="radio"]').filter({ hasText: '32 GB' }).click();

       const basketPromise = page.waitForRequest(req => req.url().includes('/basketItems'));
       await page.locator('button[type="submit"]').click();
       await basketPromise;
    });
  });


  test.describe('Basket Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/basketItems', async route => {
        await route.fulfill({
           json: [
             {
               id: 1,
               quantity: 2,
               color: 'black',
               size: '32 GB',
               product: { name: 'Item A', price: 50, imgSrc: '', imgAlt: '' }
             }
           ]
        });
      });
      await page.goto('/basket');
    });

    test('20. Displays items in basket', async ({ page }) => {
      await expect(page.getByText('Item A')).toBeVisible();
    });

    test('21. Calculates subtotal correctly', async ({ page }) => {
      await expect(page.locator('body')).toContainText('100');
    });

    test('22. Address form inputs are present', async ({ page }) => {
       await expect(page.getByPlaceholder('Name', { exact: true })).toBeVisible();
       await expect(page.getByPlaceholder('Surname')).toBeVisible();
       await expect(page.getByPlaceholder('City')).toBeVisible();
    });

    test('24. Empty basket displays empty message', async ({ page }) => {
      await page.route('**/basketItems', async route => {
        await route.fulfill({ json: [] });
      });
      await page.reload();
      await expect(page.getByText('Twój koszyk jest pusty')).toBeVisible();
    });

    test('25. Increase item quantity', async ({ page }) => {
      await page.route('**/basket/increase', async route => {
         await route.fulfill({ status: 200 });
      });


      let refetchCalled = false;
      await page.route('**/basketItems', async route => {
        if (refetchCalled) {
             await route.fulfill({
               json: [{
                 id: 1, quantity: 3, color: 'black', size: '32 GB',
                 product: { name: 'Item A', price: 50, imgSrc: '', imgAlt: '' }
               }]
            });
        } else {
            refetchCalled = true;
            await route.fulfill({
               json: [{
                 id: 1, quantity: 2, color: 'black', size: '32 GB',
                 product: { name: 'Item A', price: 50, imgSrc: '', imgAlt: '' }
               }]
            });
        }
      });

      await page.reload();

      await page.getByText('+').click();

      await expect(page.locator('span').filter({ hasText: /^3$/ })).toBeVisible();
    });

    test('26. Decrease item quantity', async ({ page }) => {
      await page.route('**/basket/decrease', async route => {
         await route.fulfill({ status: 200 });
      });

      let refetchCalled = false;
      await page.route('**/basketItems', async route => {
        if (refetchCalled) {
             await route.fulfill({
               json: [{
                 id: 1, quantity: 1, color: 'black', size: '32 GB',
                 product: { name: 'Item A', price: 50, imgSrc: '', imgAlt: '' }
               }]
            });
        } else {
            refetchCalled = true;
            await route.fulfill({
               json: [{
                 id: 1, quantity: 2, color: 'black', size: '32 GB',
                 product: { name: 'Item A', price: 50, imgSrc: '', imgAlt: '' }
               }]
            });
        }
      });
      await page.reload();

      await page.getByText('-').click();
      await expect(page.locator('span').filter({ hasText: /^1$/ })).toBeVisible();
    });

    test('27. Remove item from basket', async ({ page }) => {
      await page.route('**/basket/remove', async route => {
         await route.fulfill({ status: 200 });
      });

      await page.route('**/basketItems', async route => {
        await route.fulfill({
           json: [{
             id: 1, quantity: 2, color: 'black', size: '32 GB',
             product: { name: 'Item A', price: 50, imgSrc: '/assets/headphones.avif', imgAlt: 'Alt A' }
           }]
        });
      });
      await page.reload();
      await expect(page.getByText('Item A')).toBeVisible();

      await page.route('**/basketItems', async route => {
         await route.fulfill({ json: [] });
      });

      await page.getByText('Remove').click();
      await expect(page.getByText('Twój koszyk jest pusty')).toBeVisible();
    });

    test('28. Shipping cost added for order under $100', async ({ page }) => {
      await page.route('**/basketItems', async route => {
        await route.fulfill({
           json: [{
             id: 1, quantity: 1, color: 'black', size: '32 GB',
             product: { name: 'Item A', price: 50, imgSrc: '', imgAlt: '' }
           }]
        });
      });
      await page.reload();

      await page.getByPlaceholder('Name', { exact: true }).fill('John');
      await page.getByPlaceholder('Surname').fill('Doe');
      await page.getByPlaceholder('Country').fill('USA');
      await page.getByPlaceholder('Address – line 1').fill('123 St');
      await page.getByPlaceholder('City').fill('NY');
      await page.getByPlaceholder('Postal Code').fill('10001');

      await expect(page.locator('div').filter({ hasText: /^Shipping\$5.00$/ })).toBeVisible();
    });

    test('29. Free shipping for order over $100', async ({ page }) => {
      await page.route('**/basketItems', async route => {
        await route.fulfill({
           json: [{
             id: 1, quantity: 3, color: 'black', size: '32 GB',
             product: { name: 'Item A', price: 50, imgSrc: '', imgAlt: '' }
           }]
        });
      });
      await page.reload();

      await page.getByPlaceholder('Name', { exact: true }).fill('John');
      await page.getByPlaceholder('Surname').fill('Doe');
      await page.getByPlaceholder('Country').fill('USA');
      await page.getByPlaceholder('Address – line 1').fill('123 St');
      await page.getByPlaceholder('City').fill('NY');
      await page.getByPlaceholder('Postal Code').fill('10001');

      await expect(page.locator('div').filter({ hasText: /^ShippingFREE$/ })).toBeVisible();
    });

    test('30. Checkout blocked without address', async ({ page }) => {
       await page.route('**/basketItems', async route => {
        await route.fulfill({
           json: [{
             id: 1, quantity: 1, color: 'black', size: '32 GB',
             product: { name: 'Item A', price: 50, imgSrc: '', imgAlt: '' }
           }]
        });
       });
       await page.reload();

       await expect(page.getByText('Item A')).toBeVisible();

       let alertMessage = '';
       page.on('dialog', dialog => {
         alertMessage = dialog.message();
         dialog.accept();
       });

       await expect(page.getByRole('button', { name: 'Checkout' })).not.toBeVisible();
       await expect(page.getByText('Fill in the complete address', { exact: false })).toBeVisible();
    });
  });


  test.describe('Responsive Behavior', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('32. Mobile menu opens on small screens', async ({ page }) => {
      await page.goto('/');

      await page.locator('button').filter({ has: page.locator('svg') }).first().click();

      const closeButton = page.locator('div[role="dialog"] button').first();
      await expect(closeButton).toBeVisible();
    });
  });


  test('33. Contact/Footer section is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Made with love by Wiktor Mazepa')).toBeVisible();
    await expect(page.getByText('wiktor.mazepa@gmail.com')).toBeVisible();
  });


  test('23. Invalid route renders empty/white page (no catch-all)', async ({ page }) => {
     await page.goto('/random-non-existent-page');
     await expect(page.getByText('WebShop')).not.toBeVisible();
  });

});

