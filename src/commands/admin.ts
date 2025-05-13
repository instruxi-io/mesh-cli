import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { Mesh, MeshLite } from '@instruxi-io/mesh-sdk-core';
import { initSDK } from '../utils/sdk';
import ora from 'ora';

// Helper function to determine if the SDK instance is Mesh or MeshLite
function isMesh(sdk: Mesh | MeshLite): sdk is Mesh {
  return 'getSigner' in sdk;
}

export function registerAdminCommands(program: Command): Command {
  const adminCommand = program
    .command('admin')
    .description('Admin operations');

  // List tenants command
  adminCommand
    .command('list-tenants')
    .description('List all tenants')
    .option('-p, --page <number>', 'Page number', '1')
    .option('-s, --page-size <number>', 'Page size', '10')
    .action(async (options) => {
      const spinner = ora('Fetching tenants...').start();
      try {
        const sdk = await initSDK();
        const page = parseInt(options.page);
        const pageSize = parseInt(options.pageSize);
        
        // Cast to any to avoid TypeScript errors with property access
        const response = await (sdk.admin as any).listTenants({
          page,
          page_size: pageSize
        });
        
        spinner.succeed('Tenants fetched successfully');
        
        if (response.data && response.data.length > 0) {
          console.log(chalk.green('\nTenants:'));
          response.data.forEach((tenant: any, index: number) => {
            console.log(chalk.cyan(`\n[${index + 1}] ${tenant.name || 'Unnamed Tenant'}`));
            console.log(`  ID: ${tenant.id}`);
            console.log(`  Code: ${tenant.code}`);
            console.log(`  Active: ${tenant.active ? chalk.green('Yes') : chalk.red('No')}`);
            if (tenant.description) {
              console.log(`  Description: ${tenant.description}`);
            }
          });
          console.log(`\nPage ${page} of ${Math.ceil(response.total / pageSize)}`);
          console.log(`Total tenants: ${response.total}`);
        } else {
          console.log(chalk.yellow('\nNo tenants found'));
        }
      } catch (error) {
        spinner.fail('Failed to fetch tenants');
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      }
    });

  // List roles command
  adminCommand
    .command('list-roles')
    .description('List all roles')
    .option('-p, --page <number>', 'Page number', '1')
    .option('-s, --page-size <number>', 'Page size', '10')
    .action(async (options) => {
      const spinner = ora('Fetching roles...').start();
      try {
        const sdk = await initSDK();
        const page = parseInt(options.page);
        const pageSize = parseInt(options.pageSize);
        
        const response = await (sdk.admin as any).listRoles({
          page,
          page_size: pageSize
        });
        
        spinner.succeed('Roles fetched successfully');
        
        if (response.data && response.data.length > 0) {
          console.log(chalk.green('\nRoles:'));
          response.data.forEach((role: any, index: number) => {
            console.log(chalk.cyan(`\n[${index + 1}] ${role.name || 'Unnamed Role'}`));
            console.log(`  ID: ${role.id}`);
            console.log(`  Permissions: ${role.permissions}`);
          });
          console.log(`\nPage ${page} of ${Math.ceil(response.total / pageSize)}`);
          console.log(`Total roles: ${response.total}`);
        } else {
          console.log(chalk.yellow('\nNo roles found'));
        }
      } catch (error) {
        spinner.fail('Failed to fetch roles');
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      }
    });

  // List groups command
  adminCommand
    .command('list-groups')
    .description('List all groups')
    .option('-p, --page <number>', 'Page number', '1')
    .option('-s, --page-size <number>', 'Page size', '10')
    .option('-t, --tenant-id <string>', 'Filter by tenant ID')
    .action(async (options) => {
      const spinner = ora('Fetching groups...').start();
      try {
        const sdk = await initSDK();
        const page = parseInt(options.page);
        const pageSize = parseInt(options.pageSize);
        
        const request: any = {
          page,
          page_size: pageSize
        };
        
        if (options.tenantId) {
          request.tenant_id = options.tenantId;
        }
        
        const response = await (sdk.admin as any).listGroups(request);
        
        spinner.succeed('Groups fetched successfully');
        
        if (response.data && response.data.length > 0) {
          console.log(chalk.green('\nGroups:'));
          response.data.forEach((group: any, index: number) => {
            console.log(chalk.cyan(`\n[${index + 1}] ${group.name || 'Unnamed Group'}`));
            console.log(`  ID: ${group.id}`);
            if (group.note) {
              console.log(`  Note: ${group.note}`);
            }
            if (group.tenant_id) {
              console.log(`  Tenant ID: ${group.tenant_id}`);
            }
            if (group.tenant_name) {
              console.log(`  Tenant: ${group.tenant_name}`);
            }
          });
          console.log(`\nPage ${page} of ${Math.ceil(response.total / pageSize)}`);
          console.log(`Total groups: ${response.total}`);
        } else {
          console.log(chalk.yellow('\nNo groups found'));
        }
      } catch (error) {
        spinner.fail('Failed to fetch groups');
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      }
    });

  // Get tenant details command
  adminCommand
    .command('get-tenant')
    .description('Get tenant details')
    .requiredOption('-i, --id <string>', 'Tenant ID')
    .action(async (options) => {
      const spinner = ora('Fetching tenant details...').start();
      try {
        const sdk = await initSDK();
        
        // Cast to any to avoid TypeScript errors
        const response = await (sdk.admin as any).getTenant({
          id: options.id
        });
        
        spinner.succeed('Tenant details fetched successfully');
        
        if (response.data) {
          const tenant = response.data;
          console.log(chalk.green('\nTenant Details:'));
          console.log(chalk.cyan(`\n${tenant.name || 'Unnamed Tenant'}`));
          console.log(`  ID: ${tenant.id}`);
          console.log(`  Code: ${tenant.code}`);
          console.log(`  Active: ${tenant.active ? chalk.green('Yes') : chalk.red('No')}`);
          if (tenant.description) {
            console.log(`  Description: ${tenant.description}`);
          }
          console.log(`  Created At: ${new Date(tenant.created_at).toLocaleString()}`);
          console.log(`  Updated At: ${new Date(tenant.updated_at).toLocaleString()}`);
        } else {
          console.log(chalk.yellow('\nTenant not found'));
        }
      } catch (error) {
        spinner.fail('Failed to fetch tenant details');
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      }
    });

  // Create tenant command
  adminCommand
    .command('create-tenant')
    .description('Create a new tenant')
    .option('-n, --name <string>', 'Tenant name')
    .option('-c, --code <string>', 'Tenant code')
    .option('-d, --description <string>', 'Tenant description')
    .action(async (options) => {
      try {
        // If options are not provided, prompt for them
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Enter tenant name:',
            when: !options.name,
            validate: (input) => input.trim() !== '' ? true : 'Tenant name is required'
          },
          {
            type: 'input',
            name: 'code',
            message: 'Enter tenant code:',
            when: !options.code,
            validate: (input) => input.trim() !== '' ? true : 'Tenant code is required'
          },
          {
            type: 'input',
            name: 'description',
            message: 'Enter tenant description (optional):',
            when: !options.description
          }
        ]);

        const tenantData = {
          name: options.name || answers.name,
          code: options.code || answers.code,
          description: options.description || answers.description || ''
        };

        const spinner = ora('Creating tenant...').start();
        const sdk = await initSDK();
        
        // Cast to any to avoid TypeScript errors
        const response = await (sdk.admin as any).createTenant({
          name: tenantData.name,
          code: tenantData.code,
          description: tenantData.description
        } as any);
        
        spinner.succeed('Tenant created successfully');
        
        if (response.data) {
          console.log(chalk.green('\nTenant Created:'));
          console.log(`  ID: ${response.data.id}`);
          console.log(`  Name: ${tenantData.name}`);
          console.log(`  Code: ${tenantData.code}`);
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      }
    });

  // Update tenant command
  adminCommand
    .command('update-tenant')
    .description('Update an existing tenant')
    .requiredOption('-i, --id <string>', 'Tenant ID')
    .option('-n, --name <string>', 'New tenant name')
    .option('-d, --description <string>', 'New tenant description')
    .option('-a, --active <boolean>', 'Set tenant active status (true/false)')
    .action(async (options) => {
      try {
        const spinner = ora('Fetching current tenant details...').start();
        const sdk = await initSDK();
        
        // First get the current tenant details
        const currentTenant = await (sdk.admin as any).getTenant({
          id: options.id
        });
        
        spinner.succeed('Current tenant details fetched');
        
        if (!currentTenant.data) {
          console.log(chalk.yellow('\nTenant not found'));
          return;
        }
        
        // Prompt for updates if not provided in options
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Enter new tenant name:',
            default: currentTenant.data.name,
            when: !options.name
          },
          {
            type: 'input',
            name: 'description',
            message: 'Enter new tenant description:',
            default: currentTenant.data.description,
            when: !options.description
          },
          {
            type: 'confirm',
            name: 'active',
            message: 'Is the tenant active?',
            default: currentTenant.data.active,
            when: options.active === undefined
          }
        ]);
        
        const updateSpinner = ora('Updating tenant...').start();
        
        const updateResponse = await (sdk.admin as any).updateTenant({
          id: options.id,
          name: options.name || answers.name,
          description: options.description || answers.description,
          active: options.active !== undefined 
            ? options.active === 'true' 
            : answers.active
        } as any);
        
        updateSpinner.succeed('Tenant updated successfully');
        
        if (updateResponse.data) {
          console.log(chalk.green('\nTenant Updated:'));
          console.log(`  ID: ${options.id}`);
          console.log(`  Name: ${options.name || answers.name}`);
          console.log(`  Description: ${options.description || answers.description}`);
          console.log(`  Active: ${(options.active !== undefined ? options.active === 'true' : answers.active) 
            ? chalk.green('Yes') 
            : chalk.red('No')}`);
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      }
    });

  // Delete tenant command
  adminCommand
    .command('delete-tenant')
    .description('Delete a tenant')
    .requiredOption('-i, --id <string>', 'Tenant ID')
    .option('-f, --force', 'Force deletion without confirmation')
    .action(async (options) => {
      try {
        const sdk = await initSDK();
        
        // Get tenant details first
        const spinner = ora('Fetching tenant details...').start();
        const tenant = await (sdk.admin as any).getTenant({
          id: options.id
        });
        spinner.succeed('Tenant details fetched');
        
        if (!tenant.data) {
          console.log(chalk.yellow('\nTenant not found'));
          return;
        }
        
        // Confirm deletion unless force option is used
        if (!options.force) {
          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Are you sure you want to delete tenant "${tenant.data.name}" (${tenant.data.code})?`,
              default: false
            }
          ]);
          
          if (!confirm) {
            console.log(chalk.yellow('Deletion cancelled'));
            return;
          }
        }
        
        const deleteSpinner = ora('Deleting tenant...').start();
        
        const response = await sdk.admin.deleteTenant({
          id: options.id
        });
        
        deleteSpinner.succeed('Tenant deleted successfully');
        
        console.log(chalk.green('\nTenant Deleted:'));
        console.log(`  ID: ${options.id}`);
        console.log(`  Name: ${tenant.data.name}`);
        console.log(`  Code: ${tenant.data.code}`);
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      }
    });

  return adminCommand;
}
