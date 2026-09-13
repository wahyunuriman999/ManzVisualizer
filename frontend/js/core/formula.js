export const FormulaEngine = {
  validate(expression, columns) {
    if (!expression) return { valid: false, error: 'Empty expression' };
    return { valid: true, error: null }; // Simplified
  },

  evaluate(expression, row) {
    try {
      let expr = expression;
      // Replace [ColName] with values
      Object.keys(row).forEach(k => {
        const val = typeof row[k] === 'number' ? row[k] : `"${row[k]}"`;
        expr = expr.replace(new RegExp(`\\[${k}\\]`, 'g'), val);
      });
      // Extremely basic evaluation (use carefully)
      return new Function(`return ${expr};`)();
    } catch(e) {
      return null;
    }
  },

  applyToDataset(data, newColName, expression) {
    return data.map(row => {
      return { ...row, [newColName]: this.evaluate(expression, row) };
    });
  }
};
