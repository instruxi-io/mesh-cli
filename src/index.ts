#!/usr/bin/env node

import { Command } from 'commander';
import { config } from 'dotenv';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';

// Load environment variables
config(); // Load from .env in current directory

// Try to load from parent directory if exists
const parentEnvPath = path.resolve(process.cwd(), '../.env');
if (fs.existsSync(parentEnvPath)) {
  config({ path: parentEnvPath });
  console.log(`Loaded environment variables from ${parentEnvPath}`);
}

// Import command modules
import { registerAdminCommands } from './commands/admin';
import { registerEnforcerCommands } from './commands/enforcer';
import { registerRegisterCommands } from './commands/register';
import { registerAuthorizationCommands } from './commands/authorization';
import { registerObjectStoreCommands } from './commands/object-storage';

// Create the CLI program
const program = new Command();

// Set up CLI metadata
program
  .name('mesh')
  .description('Command Line Interface for Mesh SDK')
  .version('0.4.0');

// Initialize SDK and register commands
async function main() {
  try {
    // Register all command groups
    registerAdminCommands(program);
    registerEnforcerCommands(program);
    registerRegisterCommands(program);
    registerAuthorizationCommands(program);
    registerObjectStoreCommands(program);

    // Add more command groups here as they are implemented
    // registerIdentitySessionCommands(program);
    // etc.

    // Display help if no arguments provided
    if (process.argv.length === 2) {
      program.help();
    }

    // Parse command line arguments
    await program.parseAsync(process.argv);
  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the CLI
main().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
