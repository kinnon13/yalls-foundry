# Lib Layer - Shared Utilities

Core utilities used across all Mission Control scripts.

## Modules

- **logger.ts** - Unified logging and console formatting (header, line, log)
- **utils.ts** - File system helpers (listFiles walker)
- **file-hash.ts** - SHA-1 content hashing for duplicate detection
- **colors.ts** - Terminal color formatting functions

## Usage

```typescript
import { header, line, log } from "../lib/logger.ts";
import { listFiles } from "../lib/utils.ts";
import { sha1 } from "../lib/file-hash.ts";
import { green, red, yellow } from "../lib/colors.ts";
```

## Purpose

Provides consistent utilities for logging, file operations, and output formatting across all layers of the Mission Control Stack.