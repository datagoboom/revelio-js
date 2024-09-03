const axios = require('axios');
const beautify = require('js-beautify').js;

class Revelio {
  constructor() {
    this.beautifyOptions = {
      indent_size: 2,
      indent_char: ' ',
      max_preserve_newlines: 10,
      preserve_newlines: true,
      keep_array_indentation: false,
      break_chained_methods: false,
      indent_scripts: 'normal',
      brace_style: 'collapse',
      space_before_conditional: true,
      unescape_strings: false,
      jslint_happy: false,
      end_with_newline: false,
      wrap_line_length: 0,
      indent_inner_html: false,
      comma_first: false,
      e4x: false,
      indent_empty_lines: false
    };
  }

  async fetchAndParseJavaScript(url, variables, mode, filters = [], minLength = 0) {
    try {
      const response = await axios.get(url);
      let jsCode = beautify(response.data, this.beautifyOptions);

      const results = [];
      const regex = mode === 'dict'
        ? new RegExp(`(?<!\\.)(${variables.join('|')})\\s*[:=]\\s*(['"])((?:\\\\\\2|.)*?)\\2`, 'g')
        : /(?<!\.)([a-zA-Z_$][a-zA-Z0-9_$]*)(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)*\s*[:=]\s*(['"])((?:\\\2|.)*?)\2/g;

      let match;
      while ((match = regex.exec(jsCode)) !== null) {
        const variableName = match[1];
        const variableValue = match[3];
        results.push(`${variableName} = ${variableValue}`);
      }

      const filteredResults = results.filter(result => {
        const [variableName] = result.split('=').map(s => s.trim());
        const meetsLengthRequirement = variableName.length >= minLength;
        const meetsFilterRequirement = filters.length === 0 || 
                                       filters.some(word => variableName.toLowerCase().includes(word.toLowerCase()));
        return meetsLengthRequirement && meetsFilterRequirement;
      });

      return { url, results: filteredResults };

    } catch (error) {
      return { url, results: [], error: error.message };
    }
  }

  async processUrls(urls, variables, mode, filters, minLength) {
    const allResults = [];

    for (const url of urls) {
      const result = await this.fetchAndParseJavaScript(url, variables, mode, filters, minLength);
      allResults.push(result);
    }

    return allResults;
  }

  async enumerate(options) {
    const { urls, filters = [], minLength = 0 } = options;
    return this.processUrls(urls, [], 'enum', filters, minLength);
  }

  async dictionary(options) {
    const { urls, variables } = options;
    return this.processUrls(urls, variables, 'dict');
  }
}

module.exports = Revelio;