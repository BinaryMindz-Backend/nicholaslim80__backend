export function evaluateRule(rule: any, context: any): boolean {
  if (!rule.rule_key) return true;

  const value = context[rule.rule_key];
  const ruleValue = rule.rule_value;
  console.log("role context-->", rule, context, value, ruleValue);
  switch (rule.rule_operator) {
    case '=':
      return value === ruleValue;
    case '>':
      return Number(value) > Number(ruleValue);
    case '<':
      return Number(value) < Number(ruleValue);
    case '>=':
      return Number(value) >= Number(ruleValue);
    case '<=':
      return Number(value) <= Number(ruleValue);
    default:
      return false;
  }
}