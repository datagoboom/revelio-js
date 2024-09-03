#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Command } = require('commander');
const Revelio = require('../lib/revelio');

const program = new Command();

program
  .name('revelio-js')
  .description('A tool to uncover secrets in minified JavaScript files')
  .version(require('../package.json').version);

program
  .command('dict')
  .description('Dictionary mode: Search for specific variable names')
  .option('-u, --url <url>', 'URL of the JavaScript file to analyze')
  .option('-U, --url-list <file>', 'Path to a file containing a list of URLs to analyze')
  .option('-w, --word <variable>', 'Specific variable to search for (can be used multiple times)', (val, acc) => acc.concat(val), [])
  .option('-W, --wordlist <file>', 'Path to a wordlist file containing variables to search for')
  .option('-o, --output <file>', 'File to save the output')
  .action(dictionaryMode);

program
  .command('enum')
  .description('Enumeration mode: Search for all variables')
  .option('-u, --url <url>', 'URL of the JavaScript file to analyze')
  .option('-U, --url-list <file>', 'Path to a file containing a list of URLs to analyze')
  .option('-f, --filter <word>', 'Filter results by word (can be used multiple times)', (val, acc) => acc.concat(val), [])
  .option('-F, --filter-list <file>', 'Path to a file containing filter words')
  .option('-m, --min-length <number>', 'Minimum length of variable names to include', parseInt)
  .option('-o, --output <file>', 'File to save the output')
  .action(enumerationMode);

program.parse(process.argv);

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

  if (options.word && options.word.length > 0) {
    variables = options.word;
  } else if (options.wordlist) {
    variables = readFromFile(options.wordlist);
  } else {
    const defaultWordlistPath = path.join(__dirname, '../lib/wordlist.txt');
    try {
      variables = readFromFile(defaultWordlistPath);
    } catch (error) {
      console.error(`Error reading default wordlist: ${error.message}`);
      console.error('Please provide a wordlist using -W option or individual words using -w option.');
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

  const revelio = new Revelio();
  const results = await revelio.dictionary({ urls, variables });
  const formattedResults = formatResults(results);

  if (options.output) {
    writeOutputToFile(options.output, formattedResults);
  } else {
    console.log(formattedResults);
  }
}

async function enumerationMode(options) {
  const urls = options.url ? [options.url] : (options.urlList ? readFromFile(options.urlList) : []);
  let filters = options.filter || [];

  if (options.filterList) {
    filters = filters.concat(readFromFile(options.filterList));
  }

  if (urls.length === 0) {
    console.error('No URLs provided. Use -u or -U to provide URLs.');
    process.exit(1);
  }

  const revelio = new Revelio();
  const results = await revelio.enumerate({ 
    urls, 
    filters, 
    minLength: options.minLength || 0 
  });
  const formattedResults = formatResults(results);

  if (options.output) {
    writeOutputToFile(options.output, formattedResults);
  } else {
    console.log(formattedResults);
  }
}