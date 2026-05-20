import OpenAI from 'openai'

export type Emotion = { label: string; score: number }
export type Sentiment = 'positive' | 'neutral' | 'negative'

export type AnalysisResult = {
    emotions: Emotion[]
    sentiment: Sentiment
    keywords: string[]
    summary: string
}

const ANALYSIS_PROMPT = `あなたはテキスト分析エンジンです。
ユーザーの書いた日記ノートを分析し、以下のJSON形式で返してください。
余計な説明は不要です。JSONのみを返してください。

{
  "emotions": [
    { "label": "喜び", "score": 0-1 },
    { "label": "悲しみ", "score": 0-1 },
    { "label": "怒り", "score": 0-1 },
    { "label": "不安", "score": 0-1 },
    { "label": "安心", "score": 0-1 },
    { "label": "驚き", "score": 0-1 }
  ],
  "sentiment": "positive" | "neutral" | "negative",
  "keywords": ["word1", "word2", "word3", "word4", "word5"],
  "summary": "ノートの内容を1〜2行で客観的にまとめたもの"
}

ルール:
- emotionsは0〜1の範囲。0は全く感じられない、1は強く感じられる。
- ノートに含まれる感情を過不足なく検出すること。
- 忖度しない。ノートに含まれない感情を推測して追加しない。
- keywordsは重要な単語を最大5つ。長すぎるフレーズではなく、核心を捉えた単語を選ぶこと。
- summaryは客観的で、解釈や決めつけを含まない。`

export async function analyzeText(text: string): Promise<AnalysisResult> {
    const client = new OpenAI({
        apiKey: process.env.LLM_API_KEY!,
        baseURL: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
    })

    const completion = await client.chat.completions.create({
        model: 'openai/gpt-oss-20b:free',
        messages: [
            { role: 'system', content: ANALYSIS_PROMPT },
            { role: 'user', content: text },
        ],
        temperature: 0.1,
        max_tokens: 500,
    })

    const raw = completion.choices[0]?.message?.content || '{}'

    // Extract JSON from response (handle markdown code blocks)
    const jsonStr = raw
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
    const data = JSON.parse(jsonStr)

    return {
        emotions: data.emotions ?? [],
        sentiment: data.sentiment ?? 'neutral',
        keywords: data.keywords ?? [],
        summary: data.summary ?? '',
    }
}
