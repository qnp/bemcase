// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { pascalCase, camelCase, kebabCase } from 'case-anything';

function toPascalCamelBem(text: string): string {
  return text
    .trim()
    .split(/(\.|\s+)/)
    .map((fragment, i) =>
      i % 2
        ? fragment
        : fragment
            .split(/(__|--)/)
            .map((fragment, j) =>
              j % 2
                ? fragment
                : j === 0
                ? pascalCase(fragment)
                : camelCase(fragment)
            )
            .join('')
    )
    .join('');
}

function toKebabBem(text: string): string {
  return text
    .trim()
    .split(/(\.|\s+)/)
    .map((fragment, i) =>
      i % 2
        ? fragment
        : fragment
            .split(/(__|--)/)
            .map((fragment, j) => (j % 2 ? fragment : kebabCase(fragment)))
            .join('')
    )
    .join('');
}

function isRangeSimplyCursorPosition(range: vscode.Range): boolean {
  return (
    range.start.line === range.end.line &&
    range.start.character === range.end.character
  );
}

function getSelectedText(
  selection: vscode.Selection,
  document: vscode.TextDocument
): { text: string; range: vscode.Range } {
  const range = new vscode.Range(selection.start, selection.end);
  return {
    text: document.getText(range),
    range,
  };
}

async function executeChangeBemCase(mode: 'kebab' | 'pascal-camel') {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  const { document, selections } = editor;
  let replacementActions = [];
  await editor.edit((editBuilder) => {
    replacementActions = selections.map((selection) => {
      const { text, range } = getSelectedText(selection, document);
      let replacement;
      let offset;
      if (selection.isSingleLine) {
        replacement =
          mode === 'kebab' ? toKebabBem(text) : toPascalCamelBem(text);
        // it's possible that the replacement string is shorter or longer than the original,
        // so calculate the offsets and new selection coordinates appropriately
        offset = replacement.length - text.length;
      } else {
        const newLineChar = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
        const lines = document.getText(range).split(newLineChar);
        const replacementLines = lines.map((line) =>
          mode === 'kebab' ? toKebabBem(line) : toPascalCamelBem(line)
        );
        replacement = replacementLines.reduce(
          (acc, v) => (!acc ? '' : acc + newLineChar) + v,
          ''
        );
        offset =
          replacementLines[replacementLines.length - 1].length -
          lines[lines.length - 1].length;
      }
      return {
        text,
        range,
        replacement,
        offset,
        newRange: isRangeSimplyCursorPosition(range)
          ? range
          : new vscode.Range(
              range.start.line,
              range.start.character,
              range.end.line,
              range.end.character + offset
            ),
      };
    });
    replacementActions
      .filter((x) => x.replacement !== x.text)
      .forEach((x) => {
        editBuilder.replace(x.range, x.replacement);
      });
  });
}

export function activate(context: vscode.ExtensionContext) {
  const disposablePascalCamel = vscode.commands.registerCommand(
    'bemcase.formatToPascalCamelBem',
    () => executeChangeBemCase('pascal-camel')
  );
  const disposableKebab = vscode.commands.registerCommand(
    'bemcase.formatToKebabBem',
    () => executeChangeBemCase('kebab')
  );

  context.subscriptions.push(disposablePascalCamel, disposableKebab);
}

// This method is called when your extension is deactivated
export function deactivate() {}
