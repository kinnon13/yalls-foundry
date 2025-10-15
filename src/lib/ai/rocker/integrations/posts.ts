/**
 * Rocker Integration: Posts & Social
 * 
 * Connects post actions to Rocker for memory building and engagement.
 */

import { emitRockerEvent } from '../bus';

export async function rockerPostCreated(params: {
  userId: string;
  postId: string;
  kind: string;
  sessionId?: string;
}): Promise<void> {
  await emitRockerEvent('user.create.post', params.userId, {
    postId: params.postId,
    kind: params.kind,
  }, params.sessionId);
}

export async function rockerPostSaved(params: {
  userId: string;
  postId: string;
  collection?: string;
  sessionId?: string;
}): Promise<void> {
  await emitRockerEvent('user.save.post', params.userId, {
    postId: params.postId,
    collection: params.collection,
  }, params.sessionId);

  // Rocker learns interests
}

export async function rockerPostReshared(params: {
  userId: string;
  postId: string;
  commentary?: string;
  sessionId?: string;
}): Promise<void> {
  await emitRockerEvent('user.reshare.post', params.userId, {
    postId: params.postId,
    commentary: params.commentary,
  }, params.sessionId);
}
