import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { Mesh, MeshLite } from '@instruxi-io/mesh-sdk-core';
import { initSDK, initSDKWithPrivateKey } from '../utils/sdk';
import ora from 'ora';

// Helper function to determine if the SDK instance is Mesh or MeshLite
function isMesh(sdk: Mesh | MeshLite): sdk is Mesh {
  return 'getSigner' in sdk;
}

export function registerRegisterCommands(program: Command): Command {
  const registerCommand = program
    .command('register')
    .description('Register a new account');

  // Register account command
  registerCommand
    .command('account')
    .description('Register a new account')
    .option('-u, --username <string>', 'Username')
    .option('-e, --email <string>', 'Email')
    .option('-f, --first-name <string>', 'First name')
    .option('-l, --last-name <string>', 'Last name')
    .option('-t, --tenant-code <string>', 'Tenant code', 'default')
    .action(async (options) => {
      try {
        // If options are not provided, prompt for them
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'username',
            message: 'Enter username:',
            when: !options.username,
            validate: (input) => input.trim() !== '' ? true : 'Username is required'
          },
          {
            type: 'input',
            name: 'email',
            message: 'Enter email:',
            when: !options.email,
            validate: (input) => input.trim() !== '' ? true : 'Email is required'
          },
          {
            type: 'input',
            name: 'firstName',
            message: 'Enter first name (optional):',
            when: !options.firstName
          },
          {
            type: 'input',
            name: 'lastName',
            message: 'Enter last name (optional):',
            when: !options.lastName
          },
          {
            type: 'input',
            name: 'tenantCode',
            message: 'Enter tenant code:',
            default: 'default',
            when: !options.tenantCode
          }
        ]);

        const userData = {
          username: options.username || answers.username,
          email: options.email || answers.email,
          first_name: options.firstName || answers.firstName,
          last_name: options.lastName || answers.lastName,
          tenant_code: options.tenantCode || answers.tenantCode
        };

        // Get the account address from environment variable
        const accountAddress = process.env.PUBLIC_KEY;
        if (!accountAddress) {
          console.error(chalk.red('Error: PUBLIC_KEY environment variable is not set'));
          console.error('Please set it with: export PUBLIC_KEY=0x...');
          return;
        }

        // Validate the address format
        if (!accountAddress.startsWith('0x')) {
          console.error(chalk.red('Error: PUBLIC_KEY must start with 0x'));
          return;
        }

        const spinner = ora('Registering account...').start();
        
        // Initialize SDK with private key if available
        const privateKey = process.env.PRIVATE_KEY;
        let sdk;
        
        if (privateKey) {
          sdk = await initSDKWithPrivateKey(privateKey);
        } else {
          sdk = await initSDK();
        }
        
        // Register the account
        const response = await (sdk.enforcer as any).registerAccount({
          username: userData.username,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          account_address: accountAddress as `0x${string}`,
          tenant_code: userData.tenant_code
        });
        
        spinner.succeed('Account registered successfully');
        
        if (response.data) {
          console.log(chalk.green('\nAccount Registered:'));
          console.log(`ID: ${response.data.id}`);
          console.log(`Tenant ID: ${response.data.tenant_id}`);
          console.log(`Role ID: ${response.data.role_id}`);
          console.log(`\nYou can now login with: mesh auth login --private-key ${privateKey}`);
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      }
    });

  return registerCommand;
}
