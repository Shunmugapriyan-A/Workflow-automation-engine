const { Engine } = require('json-rules-engine');
const vm = require('vm');

async function evaluateRules(rulesList, data) {
    if (!rulesList || rulesList.length === 0) return null;

    // Rules are evaluated in ascending priority order.
    const sortedRules = [...rulesList].sort((a, b) => a.priority - b.priority);

    for (const rule of sortedRules) {
        let engine = new Engine();
        
        engine.addOperator('evalString', (factValue, jsonValue) => {
            if (jsonValue.trim() === 'DEFAULT') return true;
            
            const sandbox = {
                ...factValue,
                contains: (field, value) => {
                    const val = factValue[field];
                    return val && typeof val === 'string' && val.includes(value);
                },
                startsWith: (field, value) => {
                    const val = factValue[field];
                    return val && typeof val === 'string' && val.startsWith(value);
                },
                endsWith: (field, value) => {
                    const val = factValue[field];
                    return val && typeof val === 'string' && val.endsWith(value);
                }
            };
            
            const context = vm.createContext(sandbox);
            try {
                const result = vm.runInContext(jsonValue, context);
                return !!result;
            } catch (e) {
                throw new Error(`Invalid syntax in condition '${jsonValue}': ${e.message}`);
            }
        });

        engine.addFact('workflowData', function (params, almanac) {
            return data;
        });

        engine.addRule({
            conditions: {
                all: [{
                    fact: 'workflowData',
                    operator: 'evalString',
                    value: rule.condition
                }]
            },
            event: {
                type: 'matched',
                params: {
                   next_step_id: rule.next_step_id,
                   rule_id: rule.id
                }
            }
        });

        const { events } = await engine.run();
        if (events.length > 0) {
            return {
                next_step_id: rule.next_step_id,
                matched_rule_id: rule.id,
                condition: rule.condition
            };
        }
    }

    return null;
}

module.exports = { evaluateRules };
