import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { Mesh, MeshLite, ValidateAuthorizationRequest, ValidateAuthorizationsRequest } from '@instruxi-io/mesh-sdk-core';
import { initSDK } from '../utils/sdk';
import ora from 'ora';

// Helper function to determine if the SDK instance is Mesh or MeshLite
function isMesh(sdk: Mesh | MeshLite): sdk is Mesh {
  return 'getSigner' in sdk;
}

export function registerAuthorizationCommands(program: Command): Command {
  // Find the existing auth command
  const authCommand = program.commands.find(cmd => cmd.name() === 'auth');
  
  if (!authCommand) {
    console.error(chalk.red('Error: auth command not found. Make sure registerEnforcerCommands is called before registerAuthorizationCommands.'));
    return program;
  }

  // Single authorization command
  authCommand
    .command('authorize')
    .description('Validate a single authorization request')
    .option('-f, --file <path>', 'JSON file containing the authorization request')
    .option('-j, --json <string>', 'JSON string containing the authorization request')
    .option('-o, --outfile [path]', 'Save response to a file (defaults to tmp/my.json)')
    .action(async (options) => {
      const spinner = ora('Validating authorization...').start();
      try {
        // Get request data from file or JSON string
        let requestData: ValidateAuthorizationRequest;
        if (options.file) {
          // Read from file
          try {
            requestData = JSON.parse(fs.readFileSync(options.file, 'utf8'));
          } catch (error) {
            spinner.fail(`Failed to read or parse file: ${options.file}`);
            console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
            return;
          }
        } else if (options.json) {
          // Parse JSON string
          try {
            requestData = JSON.parse(options.json);
          } catch (error) {
            spinner.fail('Failed to parse JSON string');
            console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
            return;
          }
        } else {
          spinner.fail('No input provided. Use --file or --json option.');
          return;
        }

        // Initialize SDK
        const sdk = await initSDK();

        // Make the request
        const response = await sdk.enforcer.validateAuthorization(requestData);

        // Handle success
        spinner.succeed('Authorization validated');
        
        // Log response
        console.log(chalk.green('\nAuthorization Response:'));
        console.log(JSON.stringify(response, null, 2));
        
        // Save to file if requested
        if (options.outfile) {
          const outPath = options.outfile === true ? 'tmp/my.json' : options.outfile;
          const dirPath = path.dirname(outPath);
          
          // Create directory if it doesn't exist
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
          }
          
          fs.writeFileSync(outPath, JSON.stringify(response, null, 2));
          console.log(chalk.green(`\nResponse saved to ${outPath}`));
        }
      } catch (error) {
        spinner.fail('Authorization validation failed');
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      }
    });

  // Batch authorization command
  authCommand
    .command('authorize-batch')
    .description('Validate multiple authorization requests')
    .option('-f, --file <path>', 'JSON file containing the authorization requests')
    .option('-j, --json <string>', 'JSON string containing the authorization requests')
    .option('-o, --outfile [path]', 'Save response to a file (defaults to tmp/my.json)')
    .action(async (options) => {
      const spinner = ora('Validating batch authorization...').start();
      try {
        // Get request data from file or JSON string
        let requestData: ValidateAuthorizationsRequest;
        if (options.file) {
          // Read from file
          try {
            requestData = JSON.parse(fs.readFileSync(options.file, 'utf8'));
          } catch (error) {
            spinner.fail(`Failed to read or parse file: ${options.file}`);
            console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
            return;
          }
        } else if (options.json) {
          // Parse JSON string
          try {
            requestData = JSON.parse(options.json);
          } catch (error) {
            spinner.fail('Failed to parse JSON string');
            console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
            return;
          }
        } else {
          spinner.fail('No input provided. Use --file or --json option.');
          return;
        }

        // Initialize SDK
        const sdk = await initSDK();

        // Make the request
        const response = await sdk.enforcer.validateAuthorizations(requestData);

        // Handle success
        spinner.succeed('Batch authorization validated');
        
        // Log response
        console.log(chalk.green('\nBatch Authorization Response:'));
        console.log(JSON.stringify(response, null, 2));
        
        // Save to file if requested
        if (options.outfile) {
          const outPath = options.outfile === true ? 'tmp/my.json' : options.outfile;
          const dirPath = path.dirname(outPath);
          
          // Create directory if it doesn't exist
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
          }
          
          fs.writeFileSync(outPath, JSON.stringify(response, null, 2));
          console.log(chalk.green(`\nResponse saved to ${outPath}`));
        }
      } catch (error) {
        spinner.fail('Batch authorization validation failed');
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      }
    });

  return program;
}
