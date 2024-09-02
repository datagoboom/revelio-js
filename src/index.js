#!/usr/bin/env node

const axios = require('axios');
const beautify = require('js-beautify').js;
const fs = require('fs');
const path = require('path');
const { Command } = require('commander');

const program = new Command();

program
  .name('revelio-js')
  .description('A tool to uncover secrets in minified JavaScript files')
  .version('1.2.1');

program
  .command('dict')
  .description('Dictionary mode: Search for specific variable names')
  .option('-u, --url <url>', 'URL of the JavaScript file to analyze')
  .option('-U, --url-list <file>', 'Path to a file containing a list of URLs to analyze')
  .option('-w, --word <variable>', 'Specific variable to search for (can be used multiple times)', (val, acc) => acc.concat(val), [])
  .option('-W, --wordlist <file>', 'Path to a wordlist file containing variables to search for')
  .option('-o, --output <file>', 'File to save the output')
  .action(dictionaryMode);
program.parse(process.argv);

function commaSeparatedList(value) {
  return value.split(',');
}

function readFromFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8').split(/\r?\n/).filter(Boolean);
  } catch (error) {
    console.error(`Error reading from file: ${filePath}`, error.message);
    process.exit(1);
  }
}

function writeOutputToFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, data);
    console.log(`Output saved to ${filePath}`);
  } catch (error) {
    console.error(`Error writing output to file: ${filePath}`, error.message);
  }
}

async function fetchAndParseJavaScript(url, variables, mode, filters = [], minLength = 0) {
  try {
    const response = await axios.get(url);
    let jsCode = beautify(response.data, {
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
    });

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

    console.log(`\nFound ${filteredResults.length} variables for URL: ${url}`);

    return { url, results: filteredResults };

  } catch (error) {
    console.error(`Error fetching or processing the JavaScript from ${url}:`, error.message);
    return { url, results: [], error: error.message };
  }
}

async function processUrls(urls, variables, mode, filters, minLength) {
  const allResults = [];

  for (const url of urls) {
    const result = await fetchAndParseJavaScript(url, variables, mode, filters, minLength);
    allResults.push(result);
  }

  return allResults;
}

function formatResults(results) {
  return results.map(({ url, results, error }) => {
    const header = `<${url}>\n---------------------\n`;
    if (error) {
      return `${header}Error: ${error}\n`;
    }
    return `${header}${results.join('\n')}\n`;
  }).join('\n');
}

async function dictionaryMode(options) {
  const urls = options.url ? [options.url] : (options.urlList ? readFromFile(options.urlList) : []);
  let variables = [];

  // Use provided words if any
  if (options.word && options.word.length > 0) {
    variables = options.word;
  }
  // Use provided wordlist if specified
  else if (options.wordlist) {
    variables = readFromFile(options.wordlist);
  }
  // Use default wordlist
  else {
    const defaultWordlistPath = path.join(__dirname, '../lib/wordlist.txt');
    try {
      variables = readFromFile(defaultWordlistPath);
    } catch (error) {
      console.error(`Error reading default wordlist: ${error.message}`);
      console.error('Please provide a wordlist using -W option or individual words using -w option. (default wordlist used unless specified)');
      process.exit(1);
    }
  }

  if (urls.length === 0) {
    console.error('No URLs provided. Use -u or -U to provide URLs.');
    process.exit(1);
  }

  if (variables.length === 0) {
    console.error('No variables provided and default wordlist is empty or missing.');
    process.exit(1);
  }

  const results = await processUrls(urls, variables, 'dict');
  const formattedResults = formatResults(results);

  if (options.output) {
    writeOutputToFile(options.output, formattedResults);
  } else {
    console.log(formattedResults);
  }
}

async function enumerationMode(options) {
  const urls = options.url ? [options.url] : (options.urlList ? readFromFile(options.urlList) : []);
  const filters = options.filter || [];

  if (urls.length === 0) {
    console.error('No URLs provided. Use -u or -U to provide URLs.');
    process.exit(1);
  }

  const results = await processUrls(urls, [], 'enum', filters, options.minLength);
  const formattedResults = formatResults(results);

  if (options.output) {
    writeOutputToFile(options.output, formattedResults);
  } else {
    console.log(formattedResults);
  }
}