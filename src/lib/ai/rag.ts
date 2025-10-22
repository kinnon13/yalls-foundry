export async function embed(text: string): Promise<number[]> {
  // stub embedding
  return Array.from({ length: 8 }, (_, i) => Math.sin(i + text.length));
}

export async function searchRag(query: string): Promise<Array<{id:string; score:number}>> {
  // stub search
  return [{ id: 'stub-doc', score: 0.42 }];
}

export async function upsertDocs(docs: Array<{id:string; text:string}>) {
  // stub upsert
  return { upserted: docs.length };
}
