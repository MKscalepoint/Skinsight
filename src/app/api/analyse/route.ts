import { NextRequest, NextResponse } from 'next/server';
import { UserProfile, ProductEntry } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { products, profile }: { products: ProductEntry[]; profile?: UserProfile } = await req.json();

    const profileContext = profile ? `
USER PROFILE:
- Skin type: ${profile.skinType || 'unknown'}
- Concerns: ${profile.concerns?.join(', ') || 'none'}
- Experience: ${profile.experience || 'unknown'}
- Age: ${profile.age || 'not specified'}
- Sensitivities: ${profile.sensitivities || 'none'}
` : '';

    const productList = products.map((p, i) =>
      `${i + 1}. ${p.name} (${p.type})${p.ingredients ? `\n   Ingredients: ${p.ingredients}` : ''}`
    ).join('\n\n');

    const prompt = `You are Skinsight, an expert skincare advisor. Analyse the following skincare products for the user and provide a comprehensive compatibility report.
${profileContext}
PRODUCTS TO ANALYSE:
${productList}

Respond ONLY with a valid JSON object in exactly this structure (no markdown, no backticks, just raw JSON):
{
  "summary": "2-3 sentence overall assessment of this product combination for the user's skin type",
  "layeringOrder": [
    { "step": 1, "product": "product name", "reason": "why this goes first" }
  ],
  "conflicts": [
    { "products": ["product A", "product B"], "issue": "clear explanation of the conflict", "severity": "high|medium|low" }
  ],
  "recommendations": [
    "specific actionable recommendation"
  ],
  "amRoutine": ["product name in order"],
  "pmRoutine": ["product name in order"]
}

Rules:
- layeringOrder should list ALL products in the correct application order (thinnest to thickest, considering pH)
- conflicts should only include genuine issues (ingredient conflicts, pH clashes, over-exfoliation etc)
- If no conflicts exist, return an empty array for conflicts
- recommendations should be specific and actionable (max 5)
- amRoutine and pmRoutine should split products appropriately (e.g. SPF only AM, retinol only PM)
- If a product works for both, include it in both
- Tailor everything to the user's skin type and concerns`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.find((b: { type: string }) => b.type === 'text')?.text || '{}';

    try {
      const report = JSON.parse(text);
      return NextResponse.json(report);
    } catch {
      return NextResponse.json({ error: 'Failed to parse analysis' }, { status: 500 });
    }
  } catch (error) {
    console.error('Analyse API error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
