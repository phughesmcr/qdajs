# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QDAJS is a Deno library for working with QDE (Qualitative Data Exchange) and QDPX (QDA Project Exchange) files. The library provides bidirectional conversion between QDE XML format and JSON, plus functionality to pack/unpack QDPX archive files containing QDE projects and source files.

## Development Commands

### Primary Commands

- `deno task prep` - Format, lint, and check the entire codebase (run before commits)
- `deno fmt` - Format code according to project standards
- `deno lint` - Run linter with recommended and JSR rules
- `deno check mod.ts src/**/*.ts` - Type check all TypeScript files

### Testing and Benchmarking

- `deno test --allow-read --allow-write ./test/**/*.test.ts` - Run all tests with required permissions
- `deno bench -A` - Run benchmarks with all permissions

### Publishing

- `deno publish` - Publish to JSR registry (configured in deno.json)

## Architecture Overview

### Core Structure

The library is split into two main functional areas:

#### QDE Module (`src/qde/`)
Handles XML ↔ JSON conversion for QDE project files:
- **xmlToJson.ts** - High-performance XML parsing using @xmldom/xmldom with singleton parser, optimized attribute processing, and schema-aware conversion
- **jsonToXml.ts** - JSON to XML serialization using DOM construction and XMLSerializer for proper escaping and formatting
- **validate.ts** - Zod-based schema validation for QDE JSON structures

#### QDPX Module (`src/qdpx/`)
Handles ZIP archive operations for QDPX project files:
- **unpack.ts** - Extracts QDPX files using @zip-js/zip-js, provides async generator for entries and project.qde access
- **pack.ts** - Creates QDPX archives with QDE validation, source file validation against REFI-QDA standards, and MIME type handling

#### Supporting Files
- **mod.ts** - Main entry point exposing `qde` and `qdpx` objects with their respective functions
- **src/types.ts** - TypeScript type definitions including Result pattern and function return types
- **src/schema.ts** - Zod schemas for strict QDE validation
- **src/constants.ts** - Performance optimizations, element categorization, regex patterns, and caching

### Key Dependencies

- **@xmldom/xmldom** - XML parsing and serialization with proper DOM handling
- **@zip-js/zip-js** - ZIP file operations for QDPX archive handling
- **zod** - Runtime schema validation for QDE structures

### Result Pattern

All conversion functions use a consistent Result pattern for error handling:
```typescript
Result<T, E extends Error = Error> = [boolean, T | E]
```

Success: `[true, data]`  
Error: `[false, error]`

### Performance Optimizations

#### XML Processing
- Singleton DOMParser instance for reuse across conversions
- Value caching for common attribute conversions (integers, floats)
- Pre-compiled regex patterns for number detection
- Optimized element categorization using Set lookups
- Direct attribute indexing instead of iterator methods

#### Memory Management
- Static classes to avoid instance creation overhead
- Shared constants and cached values
- DOM-based XML generation for proper escaping without manual string operations

### REFI-QDA Compliance

The QDPX packing functionality validates source files against REFI-QDA standards:
- Supported text: `.txt` (UTF-8), `.docx` (Office Open XML)
- Supported images: `.jpg/.jpeg`, `.png`
- Supported documents: `.pdf`
- Recommended audio/video: `.m4a`, `.mp4`
- Other formats stored as-is with warnings

## Code Style Notes

- Uses strict TypeScript configuration with comprehensive compiler options
- Follows Deno formatting standards (2-space indents, 120 char line width, semicolons)
- Performance-focused implementations with static classes and caching
- Comprehensive error handling with typed Result pattern
- Schema validation at conversion boundaries
