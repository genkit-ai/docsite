# genkit.dev docs review guide

## Dart version

Genkit Dart requires Dart 3.12 or later (`sdk: ^3.12.0`). Review Dart snippets
against that version, not an older one.

## Dot shorthands are valid

Dot shorthands (Dart 3.10+) are valid and used in the Dart snippets. Don't
suggest replacing them with the fully qualified form. For example, all of these
compile:

```dart
return .response('ok');

outputSchema: .list(.string()),
```

The same goes for other language features up to Dart 3.12, such as
null-aware elements (`[?value]`) and digit separators.
