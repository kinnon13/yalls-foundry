# Shared Utilities Module

Common utilities used across all Mission Control scripts.

## Files

- **logger.ts** - Logging utilities (header, line, log)
- **utils.ts** - File system utilities (listFiles)
- **file-hash.ts** - SHA-1 hashing for duplicate detection
- **colors.ts** - Terminal color codes for output formatting

## Usage

```typescript
import { header, line, log } from "../modules/logger.ts";
import { listFiles } from "../modules/utils.ts";
import { sha1 } from "../modules/file-hash.ts";
import { green, red, yellow } from "../modules/colors.ts";
```

All scripts should import from these utilities for consistency.
