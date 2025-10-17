/**
 * @feature(composer_core)
 * Compose Page
 * Create new posts with rich media
 */

import React from 'react';
import { ComposerCore } from '@/components/composer/ComposerCore';
import { EntityPicker } from '@/components/composer/EntityPicker';

export default function ComposePage() {
  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Post</h1>
        <p className="text-muted-foreground">Share your thoughts with your audience</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <ComposerCore />
        </div>
        <div>
          <EntityPicker />
        </div>
      </div>
    </div>
  );
}
