import { test, expect } from '@playwright/test';

test.describe('End-to-End Book Production Flow (Gemini Only Mock)', () => {
  test.setTimeout(120000); // 2 minutes

  test.beforeEach(async ({ page }) => {
    // Intercept Google Generative AI API calls (Gemini)
    await page.route('**/generativelanguage.googleapis.com/**', async (route) => {
      const requestBody = route.request().postDataJSON();
      const promptText = JSON.stringify(requestBody);
      
      let mockResponse = {};

      if (promptText.includes('DIRECTOR') || promptText.includes('Design professional book architecture')) {
        mockResponse = {
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify([
                { title: 'Introduction to AI', description: 'What is AI?' }
              ]) }]
            }
          }]
        };
      } else if (promptText.includes('WRITER') || promptText.includes('Write FULL prose')) {
        mockResponse = {
          candidates: [{
            content: {
              parts: [{ text: 'This is the full chapter content written by Gemini for Introduction to AI. It covers the basics of artificial intelligence and machine learning.' }]
            }
          }]
        };
      } else if (promptText.includes('Amazon KDP SEO expert') || promptText.includes('SEO Analyst')) {
        mockResponse = {
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify({
                backendKeywords: ['ai', 'book', 'publishing'],
                competitorGaps: ['no books about cursor']
              }) }]
            }
          }]
        };
      } else if (promptText.includes('Market Researcher') || promptText.includes('Trending KDP niches') || promptText.includes('KDP niche:')) {
        mockResponse = {
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify({
                marketAnalysis: 'Strategic roadmap for AI authors.',
                seoKeywords: ['ai', 'writing'],
                targetAudience: 'Authors',
                pricingStrategy: { suggestedPrice: 19.99, reasoning: 'Premium content.' },
                suggestedChapters: [
                  { title: 'Introduction to AI', description: 'Basics' }
                ],
                competitorGaps: ['No specific Cursor guides']
              }) }]
            }
          }]
        };
      } else if (promptText.includes('AUDITOR') || promptText.includes('Senior Editor')) {
        mockResponse = {
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify({ isPass: true, score: 95, feedback: 'Consistency is perfect.' }) }]
            }
          }]
        };
      } else if (promptText.includes('WORLD_ARCHITECT') || promptText.includes('Extract structured Lore')) {
        mockResponse = {
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify([{ name: 'Neural Networks', category: 'rule', description: 'Rules of AI' }]) }]
            }
          }]
        };
      } else if (promptText.includes('VECTOR_RETRIEVER') || promptText.includes('Semantic Search Engine')) {
        mockResponse = {
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify({ relevantIds: [] }) }]
            }
          }]
        };
      } else {
        mockResponse = {
          candidates: [{
            content: {
              parts: [{ text: 'Generic Gemini AI response' }]
            }
          }]
        };
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse),
      });
    });

    await page.route('**/api.openai.com/**', route => route.abort());
    await page.route('**/api.anthropic.com/**', route => route.abort());
    await page.route('**/api.deepseek.com/**', route => route.abort());

    await page.goto('/');
  });

  test('should complete a full book production flow', async ({ page }) => {
    // 1. Dashboard
    await page.click('text=Sıfırdan Yaz');

    // 2. Strategy Planner
    await page.fill('input[placeholder="Target Book Title..."]', 'AI for Authors');
    await page.click('text=START CUSTOM FLOW');
    await expect(page.locator('text=Strategic Framework Active')).toBeVisible({ timeout: 20000 });
    await page.click('text=APPROVE & LAUNCH');

    // 3. Book Configuration
    await expect(page.locator('text=Book Configuration')).toBeVisible();
    await page.click('text=Storytelling');
    await page.click('text=Start Production (Autonomous)');

    // 4. Orchestrator View (War Room)
    await expect(page.locator('text=Autonomous War Room')).toBeVisible();
    
    // Wait until generation is finished (Return to Studio button appears)
    const returnBtn = page.locator('button:has-text("Return to Studio")');
    await expect(returnBtn).toBeVisible({ timeout: 90000 });
    await returnBtn.click();

    // 5. Editor
    // After clicking Return to Studio, we should be in the Editor view automatically
    await expect(page.getByRole('heading', { name: 'Introduction to AI' })).toBeVisible({ timeout: 15000 });
    
    // The editor content should be populated from the auto-write process
    const textarea = page.locator('textarea[placeholder="Start your masterpiece..."]');
    
    // Check for content with retries
    await expect(async () => {
      const val = await textarea.inputValue();
      if (!val.includes('written by Gemini')) {
        throw new Error(`Textarea content "${val}" does not contain expected text.`);
      }
    }).toPass({ timeout: 20000 });

    // 6. Navigate to Export Lab via Header "Export" button
    await page.getByRole('button', { name: 'Export', exact: true }).click();

    // 7. Export Lab
    await expect(page.locator('text=Ready for Distribution')).toBeVisible();
    
    // 8. PDF Export (Mocking download)
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Generate PDF Master")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.pdf');
  });
});
