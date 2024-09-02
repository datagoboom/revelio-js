# revelio-js

Unveil the secrets hidden in minified JavaScript.

## About

revelio-js is a powerful security tool designed to uncover sensitive information concealed within minified JavaScript files. It can be used to search for specific variables or extract all string-assigned variables from a script, helping security professionals identify potential security risks and vulnerabilities.

## Installation

You can install revelio-js globally using npm:

```
npm install -g revelio-js
```

This will make the `revelio-js` command available system-wide.

## Usage

revelio-js has two main modes of operation: dictionary mode (`dict`) and enumeration mode (`enum`).

### Dictionary Mode

```
revelio-js dict [options]
```

Options:
- `-u, --url <url>`: URL of the JavaScript file to analyze
- `-U, --url-list <file>`: Path to a file containing a list of URLs to analyze
- `-w, --wordlist <file>`: Path to a wordlist file containing variables to search for
- `-o, --output <file>`: File to save the output

### Enumeration Mode

```
revelio-js enum [options]
```

Options:
- `-u, --url <url>`: URL of the JavaScript file to analyze
- `-U, --url-list <file>`: Path to a file containing a list of URLs to analyze
- `-f, --filter <list>`: Comma-separated list of filter words
- `-l, --min-length <number>`: Minimum variable name length (default: 0)
- `-o, --output <file>`: File to save the output

## Examples

### 1. Dictionary Mode (Single URL)

Search for specific sensitive variables in a single JavaScript file:

```
revelio-js dict -w common_secrets.txt -u https://example.com/app.min.js -o exposed_secrets.txt
```

This command will search for variables listed in 'common_secrets.txt' in the script at the given URL and save any findings to 'exposed_secrets.txt'.

### 2. Dictionary Mode (Multiple URLs)

Search for potential secrets across multiple URLs:

```
revelio-js dict -w common_secrets.txt -U target_scripts.txt -o multi_script_secrets.txt
```

This command will search for variables listed in 'common_secrets.txt' in all URLs listed in 'target_scripts.txt' and save the results to 'multi_script_secrets.txt'.

### 3. Enumeration Mode

Extract all string-assigned variables from a script, filtering for potential secrets:

```
revelio-js enum -u https://example.com/app.min.js -l 8 -f api,key,token,secret -o potential_exposures.txt
```

This command will extract all variables assigned string values, keeping only those with names at least 8 characters long and containing 'api', 'key', 'token', or 'secret'.

### 4. Quick Scan of Multiple Scripts

Quickly scan multiple scripts and display results in the console:

```
revelio-js enum -U suspicious_scripts.txt -l 5 -f password,auth,cred
```

This command will extract all variables with names at least 5 characters long from all URLs in 'suspicious_scripts.txt', filtering for terms related to authentication, and display the results in the console.

## Output Format

revelio-js outputs results in the following format:

```
<https://example.com/app1.min.js>
---------------------
apiKey = "1234567890abcdef"
secretToken = "vwxyz98765"

<https://example.com/app2.min.js>
---------------------
authPassword = "supersecret123"
```

Each URL is enclosed in angle brackets and followed by a line of dashes. The extracted variables and their values are listed below.

## Security Considerations

revelio-js is a powerful tool designed for security professionals and researchers. Please use it responsibly and ethically. Always ensure you have permission before scanning websites or applications you do not own or have explicit authorization to test.

## Contributing

Contributions to improve revelio-js are welcome! Please feel free to submit a Pull Request or open an Issue to discuss potential enhancements.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

revelio-js is provided as-is, and is not affiliated with or endorsed by J.K. Rowling, Warner Bros., or the Harry Potter franchise. Please don't sue me.

```