import type { MetricExplorerResults } from "@shared/metrics/types";

type Operator = "+" | "-" | "*" | "/";
type FormulaToken =
  | { readonly type: "number"; readonly value: number }
  | { readonly type: "symbol"; readonly value: string }
  | { readonly type: "operator"; readonly value: Operator };
type LexToken = FormulaToken | { readonly type: "parenthesis"; readonly value: "(" | ")" };

type ParsedFormula =
  | {
      readonly tokens: readonly FormulaToken[];
      readonly symbols: readonly string[];
      readonly error: null;
    }
  | { readonly tokens: readonly []; readonly symbols: readonly []; readonly error: string };

const precedence: Record<Operator, number> = { "+": 1, "-": 1, "*": 2, "/": 2 };
const operators = new Set<string>(Object.keys(precedence));

function isOperator(value: string): value is Operator {
  return operators.has(value);
}

function invalidFormula(error: string): ParsedFormula {
  return { tokens: [], symbols: [], error };
}

function tokenizeFormula(expression: string): LexToken[] | string {
  const tokens: LexToken[] = [];
  let index = 0;
  while (index < expression.length) {
    const source = expression.slice(index);
    const whitespace = source.match(/^\s+/)?.[0];
    if (whitespace) {
      index += whitespace.length;
      continue;
    }
    const number = source.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i)?.[0];
    if (number) {
      const value = Number(number);
      if (!Number.isFinite(value)) return "Only finite numbers are supported";
      tokens.push({ type: "number", value });
      index += number.length;
      continue;
    }
    const identifier = source.match(/^[A-Za-z_][A-Za-z0-9_]*/)?.[0];
    if (identifier) {
      tokens.push({ type: "symbol", value: identifier });
      index += identifier.length;
      continue;
    }
    const char = source.charAt(0);
    if (char === "(" || char === ")") {
      tokens.push({ type: "parenthesis", value: char });
      index++;
      continue;
    }
    if (isOperator(char)) {
      tokens.push({ type: "operator", value: char });
      index++;
      continue;
    }
    return "Only numbers, query labels, and + - * / are supported";
  }
  return tokens;
}

interface ParserState {
  readonly activeIds: ReadonlySet<string>;
  readonly symbols: Set<string>;
  readonly output: FormulaToken[];
  readonly operators: Array<Operator | "(">;
  expectOperand: boolean;
}

function pushOperand(state: ParserState, token: Extract<LexToken, { type: "number" | "symbol" }>) {
  if (!state.expectOperand) return "Invalid expression";
  if (token.type === "symbol") {
    if (!state.activeIds.has(token.value)) return `Query "${token.value}" has no metric selected`;
    state.symbols.add(token.value);
  }
  state.output.push(token);
  state.expectOperand = false;
  return null;
}

function pushOperator(state: ParserState, operator: Operator): string | null {
  if (state.expectOperand) return `Unsupported operator: ${operator}`;
  while (
    state.operators.length > 0 &&
    state.operators.at(-1) !== "(" &&
    precedence[state.operators.at(-1) as Operator] >= precedence[operator]
  ) {
    state.output.push({ type: "operator", value: state.operators.pop() as Operator });
  }
  state.operators.push(operator);
  state.expectOperand = true;
  return null;
}

function pushParenthesis(state: ParserState, parenthesis: "(" | ")"): string | null {
  if (parenthesis === "(") {
    if (!state.expectOperand) return "Invalid expression";
    state.operators.push(parenthesis);
    return null;
  }
  if (state.expectOperand) return "Invalid expression";
  while (state.operators.length && state.operators.at(-1) !== "(") {
    state.output.push({ type: "operator", value: state.operators.pop() as Operator });
  }
  if (state.operators.pop() !== "(") return "Invalid expression";
  state.expectOperand = false;
  return null;
}

function completeFormula(state: ParserState): ParsedFormula {
  if (state.expectOperand || state.output.length === 0) return invalidFormula("Invalid expression");
  while (state.operators.length > 0) {
    const operator = state.operators.pop();
    if (operator === "(") return invalidFormula("Invalid expression");
    state.output.push({ type: "operator", value: operator as Operator });
  }
  return { tokens: state.output, symbols: [...state.symbols], error: null };
}

function toReversePolish(
  tokens: readonly LexToken[],
  activeQueryIds: readonly string[]
): ParsedFormula {
  const state: ParserState = {
    activeIds: new Set(activeQueryIds),
    symbols: new Set(),
    output: [],
    operators: [],
    expectOperand: true,
  };
  for (const token of tokens) {
    let error: string | null;
    if (token.type === "number" || token.type === "symbol") {
      error = pushOperand(state, token);
    } else if (token.type === "operator") {
      error = pushOperator(state, token.value);
    } else {
      error = pushParenthesis(state, token.value);
    }
    if (error) return invalidFormula(error);
  }
  return completeFormula(state);
}

function parseFormula(expression: string, activeQueryIds: readonly string[]): ParsedFormula {
  const tokens = tokenizeFormula(expression);
  return typeof tokens === "string"
    ? invalidFormula(tokens)
    : toReversePolish(tokens, activeQueryIds);
}

export function validateFormulaExpression(
  expression: string,
  activeQueryIds: readonly string[]
): string | null {
  if (!expression.trim()) return null;
  return parseFormula(expression, activeQueryIds).error;
}

function evaluateTokens(tokens: readonly FormulaToken[], scope: Readonly<Record<string, number>>) {
  const stack: number[] = [];
  for (const token of tokens) {
    if (token.type === "number") {
      stack.push(token.value);
      continue;
    }
    if (token.type === "symbol") {
      const value = scope[token.value];
      if (value === undefined) return null;
      stack.push(value);
      continue;
    }

    const right = stack.pop();
    const left = stack.pop();
    if (left === undefined || right === undefined) return null;
    switch (token.value) {
      case "+":
        stack.push(left + right);
        break;
      case "-":
        stack.push(left - right);
        break;
      case "*":
        stack.push(left * right);
        break;
      case "/":
        stack.push(left / right);
        break;
    }
  }
  const [result] = stack;
  return stack.length === 1 && result !== undefined && Number.isFinite(result) ? result : null;
}

/** Evaluates a formula against the first series of each metric query. */
export function evaluateFormula(
  expression: string,
  results: MetricExplorerResults,
  timestamps: number[]
): Array<number | null> {
  const formula = parseFormula(expression, Object.keys(results));
  if (formula.error) return timestamps.map(() => null);

  const queryLookups = new Map<string, Map<number, number>>();
  for (const symbol of formula.symbols) {
    const lookup = new Map<number, number>();
    const result = results[symbol];
    const series = result?.series[0];
    if (result && series) {
      result.timestamps.forEach((timestamp, index) => {
        const value = series.values[index];
        if (value != null) lookup.set(timestamp, value);
      });
    }
    queryLookups.set(symbol, lookup);
  }

  return timestamps.map((timestamp) => {
    const scope: Record<string, number> = {};
    for (const symbol of formula.symbols) {
      const value = queryLookups.get(symbol)?.get(timestamp);
      if (value === undefined) return null;
      scope[symbol] = value;
    }
    return evaluateTokens(formula.tokens, scope);
  });
}
