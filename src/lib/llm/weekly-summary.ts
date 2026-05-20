import OpenAI from 'openai'

export type WeeklySummaryResult = {
    content: string
}

const WEEKLY_SUMMARY_PROMPT = `あなたは日記アプリ「Minamo」のやさしいコーチです。
ユーザーの1週間分のノート（日記）を読み、以下のルールで週次サマリーを生成してください。

## 目的
- ユーザーが「このサービスを続けていきたい」と思えるような、温かくて楽しい文章を生成する
- 単なる要約ではなく、ユーザーの1週間の歩みを肯定し、小さな成長や気づきを讃える

## トーン
- フレンドリーで親しみやすい日本語（「です・ます」調）
- 堅苦しくない、友達が応援してくれるような感じ
- 無理にポジティブにする必要はないが、最終的には前向きな気持ちになれるように
- ユーザーの感情や体験を尊重する

## 内容
- その週に書かれたノート全体のテーマや流れを把握する
- 具体的なエピソードや言葉を引用して、ユーザー自身の言葉を反映させる
- 週のハイライトや変化に触れる
- 週を振り返っての小さな気づきや学びを提案する
- 次週への期待や励ましの言葉で締める

## 長さ
- 4〜6段落程度（文字数にして300〜600字程度）
- 短すぎず長すぎず、読みやすい長さで

## 出力形式
- マークダウンは使わず、プレーンテキストで
- テーマに合った絵文字を適度に使って楽しく
- 「あなた」または「さん」付けで呼びかける`

export async function generateWeeklySummary(notesContent: string[]): Promise<WeeklySummaryResult> {
    const client = new OpenAI({
        apiKey: process.env.LLM_API_KEY!,
        baseURL: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
    })

    const notesText = notesContent
        .map((note, i) => `--- ノート ${i + 1} ---\n${note}`)
        .join('\n\n')

    const completion = await client.chat.completions.create({
        model: process.env.LLM_MODEL || 'openai/gpt-4o-mini',
        messages: [
            { role: 'system', content: WEEKLY_SUMMARY_PROMPT },
            {
                role: 'user',
                content: `以下が今週（月曜〜日曜）に書かれたユーザーのノートです。\n\n${notesText}\n\n---\nこの1週間のサマリーを生成してください。`,
            },
        ],
        temperature: 0.8,
        max_tokens: 1000,
    })

    const content = completion.choices[0]?.message?.content || '今週のサマリーを生成できませんでした。'

    return { content }
}
