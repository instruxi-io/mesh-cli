import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { Mesh, MeshLite } from '@instruxi-io/mesh-sdk-core';
import { initSDK, initSDKWithPrivateKey, loginWithSIWE } from '../utils/sdk';
import ora from 'ora';

// Helper function to determine if the SDK instance is Mesh or MeshLite
function isMesh(sdk: Mesh | MeshLite): sdk is Mesh {
  return 'getSigner' in sdk;
}

export function registerEnforcerCommands(program: Command): Command {
  const enforcerCommand = program
    .command('auth')
    .description('Authentication and authorization operations');

  // Login command
  enforcerCommand
    .command('login')
    .description('Login with SIWE or API key')
    .option('-p, --private-key <string>', 'Private key for SIWE authentication')
    .option('-a, --api-key <string>', 'API key for direct authentication')
    .option('-u, --api-uri <string>', 'API URI (defaults to environment variable or http://localhost:8080)')
    .action(async (options) => {
      try {
        // If no options provided, prompt for authentication method
        if (!options.privateKey && !options.apiKey) {
          const { authMethod } = await inquirer.prompt([
            {
              type: 'list',
              name: 'authMethod',
              message: 'Select authentication method:',
              choices: [
                { name: 'Sign-In With Ethereum (SIWE)', value: 'siwe' },
                { name: 'API Key', value: 'apiKey' }
              ]
            }
          ]);
          
          if (authMethod === 'siwe') {
            const { privateKey } = await inquirer.prompt([
              {
                type: 'password',
                name: 'privateKey',
                message: 'Enter your private key:',
                mask: '*',
                validate: (input) => input.trim() !== '' ? true : 'Private key is required'
              }
            ]);
            options.privateKey = privateKey;
          } else {
            const { apiKey } = await inquirer.prompt([
              {
                type: 'password',
                name: 'apiKey',
                message: 'Enter your API key:',
                mask: '*',
                validate: (input) => input.trim() !== '' ? true : 'API key is required'
              }
            ]);
            options.apiKey = apiKey;
          }
        }
        
        // If API URI is provided, use it
        const apiUri = options.apiUri || process.env.API_URI || 'http://localhost:8080';
        
        // Login with SIWE if private key is provided
        if (options.privateKey) {
          const spinner = ora('Logging in with SIWE...').start();
          
          try {
            // Initialize SDK with private key
            const mesh = await initSDKWithPrivateKey(options.privateKey, options.apiKey || '', apiUri);
            
            // Login with SIWE
            const token = await loginWithSIWE(mesh);
            
            spinner.succeed('Login successful');
            console.log(chalk.green('\nAuthenticated with SIWE'));
            console.log(`Account Address: ${mesh.getSigner.account.address}`);
            console.log(`JWT Token: ${token.substring(0, 10)}...${token.substring(token.length - 10)}`);
            
            // Get account details
            try {
              const accountDetails = await mesh.enforcer.accountDetail();
              if (accountDetails.data) {
                console.log(chalk.cyan('\nAccount Details:'));
                console.log(`Username: ${accountDetails.data.username}`);
                console.log(`Email: ${accountDetails.data.email}`);
                console.log(`Tenant: ${accountDetails.data.tenant || 'N/A'}`);
                console.log(`Role: ${accountDetails.data.role || 'N/A'}`);
              }
            } catch (error) {
              console.log(chalk.yellow('\nCould not fetch account details'));
            }
          } catch (error) {
            spinner.fail('Login failed');
            console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
          }
        } 
        // Login with API key
        else if (options.apiKey) {
          const spinner = ora('Logging in with API key...').start();
          
          try {
            // Set environment variable for future use
            process.env.API_KEY = options.apiKey;
            process.env.API_URI = apiUri;
            
            // Initialize SDK with API key
            const sdk = await initSDK();
            
            // Test the connection by getting account details
            try {
              const accountDetails = await sdk.enforcer.accountDetail();
              
              spinner.succeed('Login successful');
              console.log(chalk.green('\nAuthenticated with API key'));
              
              if (accountDetails.data) {
                console.log(chalk.cyan('\nAccount Details:'));
                console.log(`Username: ${accountDetails.data.username}`);
                console.log(`Email: ${accountDetails.data.email}`);
                console.log(`Tenant: ${accountDetails.data.tenant || 'N/A'}`);
                console.log(`Role: ${accountDetails.data.role || 'N/A'}`);
              }
            } catch (error) {
              spinner.succeed('API key set, but could not verify account details');
              console.log(chalk.yellow('\nAPI key has been set, but account details could not be fetched.'));
              console.log('This may be normal if the API key has limited permissions.');
            }
          } catch (error) {
            spinner.fail('Login failed');
            console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
          }
        } else {
          console.error(chalk.red('Error: Either private key or API key must be provided'));
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      }
    });

  // Account details command
  enforcerCommand
    .command('account')
    .description('Get account details')
    .action(async () => {
      const spinner = ora('Fetching account details...').start();
      try {
        const sdk = await initSDK();
        
        const response = await sdk.enforcer.accountDetail();
        
        spinner.succeed('Account details fetched successfully');
        
        if (response.data) {
          const account = response.data;
          console.log(chalk.green('\nAccount Details:'));
          console.log(`Username: ${account.username}`);
          console.log(`Email: ${account.email}`);
          console.log(`Account Address: ${account.account_address}`);
          console.log(`Tenant: ${account.tenant || 'N/A'}`);
          console.log(`Role: ${account.role || 'N/A'}`);
          console.log(`Active: ${account.active ? chalk.green('Yes') : chalk.red('No')}`);
          
          if (account.first_name || account.last_name) {
            console.log(`Name: ${[account.first_name, account.last_name].filter(Boolean).join(' ')}`);
          }
          
          if (account.phone_number) {
            console.log(`Phone: ${account.phone_number}`);
          }
          
          if (account.groups && account.groups.length > 0) {
            console.log(`Groups: ${account.groups.join(', ')}`);
          }
          
          console.log(`Terms Accepted: ${account.instruxi_terms_accepted ? chalk.green('Yes') : chalk.red('No')}`);
        } else {
          console.log(chalk.yellow('\nAccount not found or not authenticated'));
        }
      } catch (error) {
        spinner.fail('Failed to fetch account details');
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      }
    });

  // Create API key command
  enforcerCommand
    .command('create-api-key')
    .description('Create a new API key')
    .action(async () => {
      const spinner = ora('Creating API key...').start();
      try {
        const sdk = await initSDK();
        
        // Cast to any to avoid TypeScript errors
        const response = await (sdk.enforcer as any).createAPIKey();
        
        spinner.succeed('API key created successfully');
        
        if (response.data) {
          console.log(chalk.green('\nAPI Key Created:'));
          console.log(`ID: ${response.data.id}`);
          // Access the key property using type assertion
          console.log(`Key: ${(response.data as any).key || response.data.api_key}`);
          console.log(chalk.yellow('\nIMPORTANT: Save this API key securely. It will not be shown again.'));
        }
      } catch (error) {
        spinner.fail('Failed to create API key');
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      }
    });

  // List API keys command
  enforcerCommand
    .command('list-api-keys')
    .description('List all API keys for the account')
    .option('-p, --page <number>', 'Page number', '1')
    .option('-s, --page-size <number>', 'Page size', '10')
    .action(async (options) => {
      const spinner = ora('Fetching API keys...').start();
      try {
        const sdk = await initSDK();
        const page = parseInt(options.page);
        const pageSize = parseInt(options.pageSize);
        
        const response = await sdk.enforcer.listAccountAPIKeys({
          page,
          page_size: pageSize
        });
        
        spinner.succeed('API keys fetched successfully');
        
        if (response.data && response.data.length > 0) {
          console.log(chalk.green('\nAPI Keys:'));
          response.data.forEach((apiKey: any, index: number) => {
            console.log(chalk.cyan(`\n[${index + 1}] API Key ${apiKey.id}`));
            console.log(`  Created: ${new Date(apiKey.created_at).toLocaleString()}`);
            console.log(`  Active: ${apiKey.active ? chalk.green('Yes') : chalk.red('No')}`);
            if (apiKey.last_used_at) {
              console.log(`  Last Used: ${new Date(apiKey.last_used_at).toLocaleString()}`);
            }
          });
          console.log(`\nPage ${page} of ${Math.ceil(response.total / pageSize)}`);
          console.log(`Total API keys: ${response.total}`);
        } else {
          console.log(chalk.yellow('\nNo API keys found'));
        }
      } catch (error) {
        spinner.fail('Failed to fetch API keys');
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      }
    });

  // Deactivate API key command
  enforcerCommand
    .command('deactivate-api-key')
    .description('Deactivate an API key')
    .requiredOption('-i, --id <string>', 'API key ID')
    .action(async (options) => {
      const spinner = ora('Deactivating API key...').start();
      try {
        const sdk = await initSDK();
        
        const response = await sdk.enforcer.deactivateAPIKey({
          id: options.id
        });
        
        spinner.succeed('API key deactivated successfully');
        
        console.log(chalk.green('\nAPI Key Deactivated:'));
        console.log(`ID: ${options.id}`);
      } catch (error) {
        spinner.fail('Failed to deactivate API key');
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      }
    });

  // Activate API key command
  enforcerCommand
    .command('activate-api-key')
    .description('Activate an API key')
    .requiredOption('-i, --id <string>', 'API key ID')
    .action(async (options) => {
      const spinner = ora('Activating API key...').start();
      try {
        const sdk = await initSDK();
        
        const response = await sdk.enforcer.activateAPIKey({
          id: options.id
        });
        
        spinner.succeed('API key activated successfully');
        
        console.log(chalk.green('\nAPI Key Activated:'));
        console.log(`ID: ${options.id}`);
      } catch (error) {
        spinner.fail('Failed to activate API key');
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      }
    });

  // Delete API key command
  enforcerCommand
    .command('delete-api-key')
    .description('Delete an API key')
    .requiredOption('-i, --id <string>', 'API key ID')
    .option('-f, --force', 'Force deletion without confirmation')
    .action(async (options) => {
      try {
        // Confirm deletion unless force option is used
        if (!options.force) {
          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Are you sure you want to delete API key ${options.id}?`,
              default: false
            }
          ]);
          
          if (!confirm) {
            console.log(chalk.yellow('Deletion cancelled'));
            return;
          }
        }
        
        const spinner = ora('Deleting API key...').start();
        const sdk = await initSDK();
        
        const response = await sdk.enforcer.deleteAPIKey({
          id: options.id
        });
        
        spinner.succeed('API key deleted successfully');
        
        console.log(chalk.green('\nAPI Key Deleted:'));
        console.log(`ID: ${options.id}`);
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      }
    });

  // Get terms command
  enforcerCommand
    .command('terms')
    .description('Get terms and conditions')
    .action(async () => {
      const spinner = ora('Fetching terms...').start();
      try {
        const sdk = await initSDK();
        
        const response = await sdk.enforcer.getTerms();
        
        spinner.succeed('Terms fetched successfully');
        
        if (response.data && response.data.text) {
          console.log(chalk.green('\nTerms and Conditions:'));
          console.log(response.data.text);
        } else {
          console.log(chalk.yellow('\nNo terms found'));
        }
      } catch (error) {
        spinner.fail('Failed to fetch terms');
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      }
    });

  // Accept terms command
  enforcerCommand
    .command('accept-terms')
    .description('Accept terms and conditions')
    .action(async () => {
      try {
        const spinner = ora('Fetching terms...').start();
        const sdk = await initSDK();
        
        // First get the terms
        const terms = await sdk.enforcer.getTerms();
        
        spinner.succeed('Terms fetched successfully');
        
        if (terms.data && terms.data.text) {
          console.log(chalk.green('\nTerms and Conditions:'));
          console.log(terms.data.text);
          
          // Prompt for acceptance
          const { accept } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'accept',
              message: 'Do you accept these terms and conditions?',
              default: false
            }
          ]);
          
          if (accept) {
            const acceptSpinner = ora('Accepting terms...').start();
            
            const response = await sdk.enforcer.updateAccountTerms({
              accepted: true
            });
            
            acceptSpinner.succeed('Terms accepted successfully');
            
            console.log(chalk.green('\nTerms Accepted'));
            console.log(`Account Address: ${response.data.account_address}`);
          } else {
            console.log(chalk.yellow('\nTerms not accepted'));
          }
        } else {
          console.log(chalk.yellow('\nNo terms found'));
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      }
    });

  // Check if account exists command
  enforcerCommand
    .command('account-exists')
    .description('Check if an account exists')
    .requiredOption('-a, --address <string>', 'Ethereum address (0x...)')
    .action(async (options) => {
      const spinner = ora('Checking if account exists...').start();
      try {
        const sdk = await initSDK();
        
        // Validate the address format
        if (!options.address.startsWith('0x')) {
          spinner.fail('Invalid address format');
          console.error(chalk.red('Error: Address must start with 0x'));
          return;
        }
        
        const response = await sdk.enforcer.accountExists({
          account_address: options.address as `0x${string}`
        });
        
        spinner.succeed('Account check completed');
        
        if (response.data.exists) {
          console.log(chalk.green('\nAccount exists'));
          
          // Try to get account details if possible
          try {
            const accountDetails = await sdk.enforcer.accountDetail();
            if (accountDetails.data) {
              console.log(chalk.cyan('\nAccount Details:'));
              console.log(`Username: ${accountDetails.data.username}`);
              console.log(`Email: ${accountDetails.data.email}`);
              console.log(`Account Address: ${accountDetails.data.account_address}`);
              console.log(`Tenant: ${accountDetails.data.tenant || 'N/A'}`);
              console.log(`Role: ${accountDetails.data.role || 'N/A'}`);
            }
          } catch (error) {
            console.log(chalk.yellow('\nAccount exists but could not fetch details. You may need to authenticate first.'));
          }
        } else {
          console.log(chalk.yellow('\nAccount does not exist'));
        }
      } catch (error) {
        spinner.fail('Failed to check account');
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      }
    });

  return enforcerCommand;
}
