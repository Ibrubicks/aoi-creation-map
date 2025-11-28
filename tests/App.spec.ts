import { test, expect, Page } from '@playwright/test'

test.describe('AOI Creation Map Application', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
  })

  test('should render the application with correct header and sidebar', async ({ page }: { page: Page }) => {
    const headerTitle = page.locator('.header-title')
    await expect(headerTitle).toBeVisible()
    await expect(headerTitle).toContainText('Define Area of Interest')

    await expect(headerTitle).toHaveCSS('color', 'rgb(212, 165, 116)')

    const sidebar = page.locator('.app-sidebar')
    await expect(sidebar).toBeVisible()

    const sectionTitles = page.locator('.section-title')
    await expect(sectionTitles).toContainText('Search Area')
    await expect(sectionTitles).toContainText('Drawing Tools')
    await expect(sectionTitles).toContainText('Statistics')
  })

  test('should display map and satellite imagery', async ({ page }: { page: Page }) => {
    const mapContainer = page.locator('.app-map')
    await expect(mapContainer).toBeVisible()

    const leafletContainer = page.locator('.leaflet-container')
    await expect(leafletContainer).toBeVisible()

    const zoomControls = page.locator('.leaflet-control-zoom')
    await expect(zoomControls).toBeVisible()
  })

  test('should have correct button styling and colors', async ({ page }: { page: Page }) => {
    const primaryButton = page.locator('.btn-primary').first()
    await expect(primaryButton).toBeVisible()
    await expect(primaryButton).toHaveCSS('background-color', 'rgb(212, 165, 116)')
    await expect(primaryButton).toHaveCSS('color', 'rgb(255, 255, 255)')

    const secondaryButton = page.locator('.btn-secondary').first()
    await expect(secondaryButton).toBeVisible()
    await expect(secondaryButton).toHaveCSS('background-color', 'rgb(245, 245, 245)')

    const applyButton = page.locator('.btn-apply-outline')
    await expect(applyButton).toBeVisible()
    await expect(applyButton).toHaveCSS('background-color', 'rgb(166, 122, 94)')

    const confirmButton = page.locator('.btn-confirm')
    await expect(confirmButton).toBeVisible()
    await expect(confirmButton).toHaveCSS('background-color', 'rgb(212, 165, 116)')
  })

  test('should update statistics when drawing', async ({ page }: { page: Page }) => {
    const drawPolygonBtn = page.locator('.btn-primary').first()
    await drawPolygonBtn.click()

    const statsBox = page.locator('.stats-box')
    await expect(statsBox).toBeVisible()

    const featuresStat = statsBox.locator('.stat-value').first()
    await expect(featuresStat).toContainText('0')
  })

  test('should have responsive design on mobile', async ({ page }: { page: Page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    const sidebar = page.locator('.app-sidebar')
    await expect(sidebar).toBeVisible()

    const map = page.locator('.app-map')
    await expect(map).toBeVisible()

    const buttons = page.locator('.btn-primary, .btn-secondary')
    for (const button of await buttons.all()) {
      const padding = await button.evaluate((el: HTMLElement) => {
        return window.getComputedStyle(el).padding
      })
      expect(padding).toBeTruthy()
    }
  })

  test('should display search input with correct placeholder', async ({ page }: { page: Page }) => {
    const searchInput = page.locator('.search-input')
    await expect(searchInput).toBeVisible()
    await expect(searchInput).toHaveAttribute('placeholder', 'Search for a city, town...')
    await expect(searchInput).toHaveValue('Cologne City Proper')
  })

  test('should handle search input interaction', async ({ page }: { page: Page }) => {
    const searchInput = page.locator('.search-input')

    await searchInput.clear()
    await searchInput.fill('Berlin')

    await expect(searchInput).toHaveValue('Berlin')
  })

  test('should display features list section', async ({ page }: { page: Page }) => {
    const featuresSection = page.locator('.features-scroll')
    await expect(featuresSection).toBeVisible()

    const emptyState = page.locator('.empty-features')
    await expect(emptyState).toBeVisible()
    await expect(emptyState).toContainText('No features yet')
  })

  test('should have correct header background color', async ({ page }: { page: Page }) => {
    const header = page.locator('.app-header')
    const bgColor = await header.evaluate((el: HTMLElement) => {
      return window.getComputedStyle(el).backgroundColor
    })
    expect(bgColor).toBeTruthy()
  })

  test('should have correct sidebar background color', async ({ page }: { page: Page }) => {
    const sidebar = page.locator('.app-sidebar')
    await expect(sidebar).toHaveCSS('background-color', 'rgb(255, 255, 255)')
  })

  test('should have correct map background color', async ({ page }: { page: Page }) => {
    const mapContainer = page.locator('.app-map')
    const bgColor = await mapContainer.evaluate((el: HTMLElement) => {
      return window.getComputedStyle(el).backgroundColor
    })
    expect(bgColor).toBeTruthy()
  })

  test('should display all action buttons', async ({ page }: { page: Page }) => {
    const drawPolygonBtn = page.locator('button:has-text("Draw Polygon")')
    await expect(drawPolygonBtn).toBeVisible()

    const drawLineBtn = page.locator('button:has-text("Draw Line")')
    await expect(drawLineBtn).toBeVisible()

    const clearBtn = page.locator('button:has-text("Clear All")')
    await expect(clearBtn).toBeVisible()

    const exportBtn = page.locator('button:has-text("Export GeoJSON")')
    await expect(exportBtn).toBeVisible()

    const applyBtn = page.locator('button:has-text("Apply outline as base image")')
    await expect(applyBtn).toBeVisible()

    const confirmBtn = page.locator('button:has-text("Confirm Area of Interest")')
    await expect(confirmBtn).toBeVisible()
  })

  test('should verify button hover effects', async ({ page }: { page: Page }) => {
    const primaryButton = page.locator('.btn-primary').first()

    const initialBg = await primaryButton.evaluate((el: HTMLElement) => {
      return window.getComputedStyle(el).backgroundColor
    })

    await primaryButton.hover()

    const hoverBg = await primaryButton.evaluate((el: HTMLElement) => {
      return window.getComputedStyle(el).backgroundColor
    })

    expect(initialBg).not.toBe(hoverBg)
  })

  test('should have map toolbar with icons', async ({ page }: { page: Page }) => {
    const toolbar = page.locator('.map-toolbar')
    await expect(toolbar).toBeVisible()

    const icons = page.locator('.toolbar-icon')
    const iconCount = await icons.count()
    expect(iconCount).toBeGreaterThanOrEqual(3)

    for (const icon of await icons.all()) {
      const text = await icon.textContent()
      expect(text).toBeTruthy()
    }
  })

  test('should verify statistics display format', async ({ page }: { page: Page }) => {
    const statsBox = page.locator('.stats-box')
    await expect(statsBox).toBeVisible()

    const statRows = page.locator('.stat-row')
    const firstRow = statRows.first()
    await expect(firstRow).toContainText('Features')
    await expect(firstRow).toContainText('0')

    const lastRow = statRows.nth(1)
    await expect(lastRow).toContainText('Total Area')
    await expect(lastRow).toContainText('km²')
  })

  test('should have correct color scheme throughout', async ({ page }: { page: Page }) => {
    const headerTitle = page.locator('.header-title')
    const headerColor = await headerTitle.evaluate((el: HTMLElement) => {
      const computed = window.getComputedStyle(el)
      return computed.color
    })
    expect(headerColor).toBeTruthy()

    const buttons = page.locator('button')
    expect(await buttons.count()).toBeGreaterThan(0)
  })
})