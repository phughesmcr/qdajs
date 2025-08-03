# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QDAJS is a Deno library for converting between QDA (Qualitative Data Analysis) XML format and JSON, focusing on the QDA-XML interchange format specification. The library provides bidirectional conversion with strict schema validation.

## Development Commands

### Primary Commands

- `deno task prep` - Format, lint, and check the entire codebase (run before commits)
- `deno fmt` - Format code according to project standards
- `deno lint` - Run linter with recommended and JSR rules
- `deno check mod.ts src/**/*.ts` - Type check all TypeScript files

### Testing and Benchmarking

- `deno test` - Run all tests (files in test/**/*.test.ts)
- `deno bench` - Run benchmarks (files in bench/**/*.bench.ts)

### Publishing

- `deno publish` - Publish to JSR registry (configured in deno.json)

## Architecture Overview

### Core Structure

- **mod.ts** - Main entry point exposing the `convert` object with `qdeToJson` and `jsonToQde` functions
- **src/convert/** - Core conversion logic
  - **xmlToJson.ts** - XML parsing using @xmldom/xmldom with optimized performance and schema validation
  - **jsonToXml.ts** - JSON to XML serialization with proper attribute/element handling
- **src/schema.ts** - Zod schemas for strict QDA-XML validation based on docs/schema.xsd
- **src/types.ts** - TypeScript type definitions including normalized data structures
- **src/constants.ts** - Performance optimizations, caching, and QDA-XML structure definitions

### Key Dependencies

- **@xmldom/xmldom** - XML parsing (as specified by the user)
- **zod** - Runtime schema validation

### Schema Validation

The library implements strict validation against the QDA-XML 1.0 specification found in docs/schema.xsd. Key validation patterns:

- GUID format: `([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})|(\{[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\})`
- RGB colors: `#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})`
- Elements requiring `_attributes` objects: Project, Code
- Elements that must always be arrays per schema: User, Code, Variable, Case, etc.

### Performance Optimizations

- Singleton DOMParser for XML parsing
- Value caching for common conversions
- Pre-compiled regex patterns
- Indent string caching for XML generation
- Optimized attribute processing with batching

### Error Handling

Uses Result pattern: `Result<T, E extends Error = Error> = [T, null] | [null, E]`

- XML parsing errors include detailed context
- Schema validation failures preserve Zod error details
- Type-safe error propagation throughout conversion pipeline

## Code Style Notes

- Uses strict TypeScript configuration with comprehensive compiler options
- Follows Deno formatting standards (2-space indents, 120 char line width, semicolons)
- Performance-focused implementations with static classes and caching
- Comprehensive error handling with typed results pattern
