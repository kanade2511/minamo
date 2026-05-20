/**
 * embedding 生成ユーティリティ
 *
 * 将来 text-embedding-3-small を使用してベクトル検索を実装する際に使う。
 * 現時点ではスケルトンのみ。
 */

/**
 * テキストから embedding ベクトルを生成する。
 * text-embedding-3-small（1536次元）を想定。
 *
 * @param text - embedding 化するテキスト
 * @returns 1536次元の浮動小数点ベクトル
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    throw new Error('Not implemented')
}
