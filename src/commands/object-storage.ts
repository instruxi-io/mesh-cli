import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { Mesh, MeshLite } from '@instruxi-io/mesh-sdk-core';
import { initSDK } from '../utils/sdk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';

// Helper function to determine if the SDK instance is Mesh or MeshLite
function isMesh(sdk: Mesh | MeshLite): sdk is Mesh {
  return 'getSigner' in sdk;
}

export function registerObjectStoreCommands(program: Command): Command {
  const objectStoreCommand = program
    .command('os')
    .alias('object-storage')
    .description('Object Storage operations')
    .option('-v, --verbose', 'Print SDK method signature, inputs and outputs');

  // Create access grant command
  objectStoreCommand
    .command('create-access-grant')
    .description('Create an access grant for encrypted operations')
    .option('-f, --files <paths>', 'File paths (comma-separated)', '/')
    .option('-p, --pass-phrase <phrase>', 'Secure passphrase')
    .option('-r, --permission <permission>', 'Permission level (admin, read, write)', 'admin')
    .option('-e, --expire <seconds>', 'Expiration time in seconds', '6000')
    .action(async (options: any) => {
      try {
        if (options.verbose) {
          console.log(chalk.green('\nSDK Method Signature:'));
          console.log(chalk.cyan('sdk.os.createAccessGrant(createAccessGrantRequest)'));
          console.log(chalk.green('\nInputs:'));
          console.log(chalk.cyan(JSON.stringify({
            files: options.files,
            pass_phrase: options.passPhrase,
            permission: options.permission,
            expire: options.expire
          }, null, 2)));
          console.log(chalk.green('\nOutputs:'));
          console.log(chalk.cyan('{ data: { access: string } }'));
        }

        // If passphrase is not provided, prompt for it
        const answers = await inquirer.prompt([
          {
            type: 'password',
            name: 'passPhrase',
            message: 'Enter secure passphrase:',
            when: !options.passPhrase,
            validate: (input) => input.trim() !== '' ? true : 'Passphrase is required'
          }
        ]);

        const passPhrase = options.passPhrase || answers.passPhrase;
        const spinner = ora('Creating access grant...').start();
        
        const sdk = await initSDK();
        const files = options.files.split(',').map((f: string) => f.trim());
        
        const createAccessGrantRequest = {
          files,
          pass_phrase: passPhrase,
          permission: options.permission,
          expire: parseInt(options.expire)
        };
        
        const response = await sdk.os.createAccessGrant(createAccessGrantRequest);
        
        spinner.succeed('Access grant created successfully');
        
        console.log(chalk.green('\nAccess Grant:'));
        console.log(`  Access: ${response.data.access}`);
        console.log(`  Permission: ${options.permission}`);
        console.log(`  Expires in: ${options.expire} seconds`);
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      }
    });

  // Create encrypted bucket command
  objectStoreCommand
    .command('create-bucket')
    .description('Create an encrypted bucket')
    .option('-p, --pass-phrase <phrase>', 'Secure passphrase')
    .action(async (options: any) => {
      try {
        if (options.verbose) {
          console.log(chalk.green('\nSDK Method Signature:'));
          console.log(chalk.cyan('sdk.os.createEncryptedBucket(createEncryptedBucketRequest)'));
          console.log(chalk.green('\nInputs:'));
          console.log(chalk.cyan(JSON.stringify({
            pass_phrase: options.passPhrase
          }, null, 2)));
          console.log(chalk.green('\nOutputs:'));
          console.log(chalk.cyan('{ data: { bucket_id: string } }'));
        }

        // If passphrase is not provided, prompt for it
        const answers = await inquirer.prompt([
          {
            type: 'password',
            name: 'passPhrase',
            message: 'Enter secure passphrase:',
            when: !options.passPhrase,
            validate: (input) => input.trim() !== '' ? true : 'Passphrase is required'
          }
        ]);

        const passPhrase = options.passPhrase || answers.passPhrase;
        const spinner = ora('Creating encrypted bucket...').start();
        
        const sdk = await initSDK();
        
        const createEncryptedBucketRequest = {
          pass_phrase: passPhrase
        };
        
        const response = await sdk.os.createEncryptedBucket(createEncryptedBucketRequest);
        
        spinner.succeed('Encrypted bucket created successfully');
        
        console.log(chalk.green('\nEncrypted Bucket:'));
        console.log(JSON.stringify(response, null, 2));
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      }
    });

  // List encrypted buckets command
  objectStoreCommand
    .command('list-buckets')
    .description('List encrypted buckets')
    .option('-a, --access-grant <grant>', 'Access grant')
    .action(async (options: any) => {
      try {
        if (options.verbose) {
          console.log(chalk.green('\nSDK Method Signature:'));
          console.log(chalk.cyan('sdk.os.listEncryptedBuckets(listEncryptedBucketsRequest)'));
          console.log(chalk.green('\nInputs:'));
          console.log(chalk.cyan(JSON.stringify({
            access_grant: options.accessGrant
          }, null, 2)));
          console.log(chalk.green('\nOutputs:'));
          console.log(chalk.cyan('{ data: string[] }'));
        }

        // If access grant is not provided, prompt for it
        const answers = await inquirer.prompt([
          {
            type: 'password',
            name: 'accessGrant',
            message: 'Enter access grant:',
            when: !options.accessGrant,
            validate: (input) => input.trim() !== '' ? true : 'Access grant is required'
          }
        ]);

        const accessGrant = options.accessGrant || answers.accessGrant;
        const spinner = ora('Listing encrypted buckets...').start();
        
        const sdk = await initSDK();
        
        const listEncryptedBucketsRequest = {
          access_grant: accessGrant
        };
        
        console.log('Request payload:', JSON.stringify(listEncryptedBucketsRequest, null, 2));
        
        const response = await sdk.os.listEncryptedBuckets(listEncryptedBucketsRequest);
        
        console.log('Response payload:', JSON.stringify(response, null, 2));
        
        spinner.succeed('Encrypted buckets listed successfully');
        
        // Cast response to any to handle potential type mismatches
        const buckets = (response as any).data || [];
        
        if (buckets.length > 0) {
          console.log(chalk.green('\nEncrypted Buckets:'));
          buckets.forEach((bucketName: string, index: number) => {
            console.log(chalk.cyan(`\n[${index + 1}] ${bucketName}`));
          });
        } else {
          console.log(chalk.yellow('\nNo encrypted buckets found'));
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      }
    });

  // Upload encrypted file command
  objectStoreCommand
    .command('upload-file')
    .description('Upload an encrypted file')
    .requiredOption('-f, --file <path>', 'Path to the file to upload')
    .option('-n, --file-name <name>', 'Name for the uploaded file (defaults to original filename)')
    .option('-d, --directory-name <dir>', 'Directory name in the bucket', '')
    .option('-a, --access-grant <grant>', 'Access grant')
    .action(async (options: any) => {
      try {
        if (options.verbose) {
          console.log(chalk.green('\nSDK Method Signature:'));
          console.log(chalk.cyan('sdk.os.uploadEncryptedFile(uploadRequest)'));
          console.log(chalk.green('\nInputs:'));
          console.log(chalk.cyan(JSON.stringify({
            file: 'Buffer',
            file_name: options.fileName,
            directory_name: options.directoryName,
            access_grant: options.accessGrant
          }, null, 2)));
          console.log(chalk.green('\nOutputs:'));
          console.log(chalk.cyan('{ data: { file_id: string } }'));
        }

        // Check if file exists
        if (!fs.existsSync(options.file)) {
          console.error(chalk.red('Error: File not found:'), options.file);
          return;
        }

        // If access grant is not provided, prompt for it
        const answers = await inquirer.prompt([
          {
            type: 'password',
            name: 'accessGrant',
            message: 'Enter access grant:',
            when: !options.accessGrant,
            validate: (input) => input.trim() !== '' ? true : 'Access grant is required'
          }
        ]);

        const accessGrant = options.accessGrant || answers.accessGrant;
        const fileName = options.fileName || path.basename(options.file);
        
        const spinner = ora('Uploading encrypted file...').start();
        
        const sdk = await initSDK();
        
        // Read file as buffer
        const fileBuffer = fs.readFileSync(options.file);
        
        const uploadRequest = {
          file: fileBuffer,
          file_name: fileName,
          directory_name: options.directoryName,
          access_grant: accessGrant
        };
        
        const response = await sdk.os.uploadEncryptedFile(uploadRequest);
        
        spinner.succeed('File uploaded successfully');
        
        console.log(chalk.green('\nUploaded File:'));
        console.log(`  File ID: ${response.data.file_id}`);
        console.log(`  File Name: ${fileName}`);
        console.log(`  Directory: ${options.directoryName || '(root)'}`);
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      }
    });

  // List encrypted files command
  objectStoreCommand
    .command('list-files')
    .description('List encrypted files')
    .option('-p, --path <path>', 'Path in the bucket', '.')
    .option('-b, --bucket <name>', 'Bucket name (defaults to user address)')
    .option('-a, --access-grant <grant>', 'Access grant')
    .option('-g, --page <number>', 'Page number for pagination', '1')
    .option('-s, --page-size <number>', 'Number of items per page', '10')
    .action(async (options: any) => {
      try {
        if (options.verbose) {
          console.log(chalk.green('\nSDK Method Signature:'));
          console.log(chalk.cyan('sdk.os.listEncryptedFiles(listEncryptedFilesRequest)'));
          console.log(chalk.green('\nInputs:'));
          console.log(chalk.cyan(JSON.stringify({
            path: options.path,
            bucket: options.bucket,
            access_grant: options.accessGrant,
            page: options.page,
            page_size: options.pageSize
          }, null, 2)));
          console.log(chalk.green('\nOutputs:'));
          console.log(chalk.cyan('{ data: { file_name: string, id: string, file_size_bytes: number, created_at: string, directory_name: string }[] }'));
        }

        // If access grant is not provided, prompt for it
        const answers = await inquirer.prompt([
          {
            type: 'password',
            name: 'accessGrant',
            message: 'Enter access grant:',
            when: !options.accessGrant,
            validate: (input) => input.trim() !== '' ? true : 'Access grant is required'
          }
        ]);

        const accessGrant = options.accessGrant || answers.accessGrant;
        const spinner = ora('Listing encrypted files...').start();
        
        const sdk = await initSDK();
        
        // If bucket is not provided, use user address for Mesh SDK
        let bucket = options.bucket;
        if (!bucket && isMesh(sdk)) {
          bucket = sdk.getSigner.account.address.toLowerCase();
        }
        
        if (!bucket) {
          spinner.fail('Bucket name is required');
          console.error(chalk.red('Error: Bucket name is required when not using a wallet signer'));
          return;
        }
        
        const listEncryptedFilesRequest = {
          path: options.path,
          bucket,
          access_grant: accessGrant,
          page: parseInt(options.page),
          page_size: parseInt(options.pageSize)
        };
        
        console.log('Request payload:', JSON.stringify(listEncryptedFilesRequest, null, 2));
        
        const response = await sdk.os.listEncryptedFiles(listEncryptedFilesRequest);
        
        console.log('Response payload:', JSON.stringify(response, null, 2));
        
        spinner.succeed('Encrypted files listed successfully');
        
        if (response.data && response.data.length > 0) {
          console.log(chalk.green('\nEncrypted Files:'));
          response.data.forEach((file: any, index: number) => {
            console.log(chalk.cyan(`\n[${index + 1}] ${file.file_name || 'Unnamed File'}`));
            console.log(`  ID: ${file.id}`);
            console.log(`  Size: ${formatFileSize(file.file_size_bytes)}`);
            console.log(`  Created: ${new Date(file.created_at).toLocaleString()}`);
            console.log(`  Directory: ${file.directory_name || '(root)'}`);
          });
          
          // Display pagination information
          console.log(chalk.blue('\nPagination:'));
          console.log(`  Page: ${response.page} of ${Math.ceil(response.total / response.page_size)}`);
          console.log(`  Total Files: ${response.total}`);
          console.log(`  Files Per Page: ${response.page_size}`);
        } else {
          console.log(chalk.yellow('\nNo encrypted files found'));
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      }
    });

  // Download encrypted file command
  objectStoreCommand
    .command('download-file')
    .description('Download an encrypted file')
    .requiredOption('-i, --file-id <id>', 'ID of the file to download')
    .option('-a, --access-grant <grant>', 'Access grant')
    .option('-o, --output <path>', 'Output path for the downloaded file')
    .action(async (options: any) => {
      try {
        if (options.verbose) {
          console.log(chalk.green('\nSDK Method Signature:'));
          console.log(chalk.cyan('sdk.os.downloadEncryptedFile(downloadRequest)'));
          console.log(chalk.green('\nInputs:'));
          console.log(chalk.cyan(JSON.stringify({
            file_id: options.fileId,
            access_grant: options.accessGrant
          }, null, 2)));
          console.log(chalk.green('\nOutputs:'));
          console.log(chalk.cyan('Buffer'));
        }

        // If access grant is not provided, prompt for it
        const answers = await inquirer.prompt([
          {
            type: 'password',
            name: 'accessGrant',
            message: 'Enter access grant:',
            when: !options.accessGrant,
            validate: (input) => input.trim() !== '' ? true : 'Access grant is required'
          },
          {
            type: 'input',
            name: 'output',
            message: 'Enter output path:',
            when: !options.output,
            default: `./${options.fileId.split('/').pop() || 'downloaded-file'}`
          }
        ]);

        const accessGrant = options.accessGrant || answers.accessGrant;
        const outputPath = options.output || answers.output;
        
        const spinner = ora('Downloading encrypted file...').start();
        
        const sdk = await initSDK();
        
        const downloadRequest = {
          file_id: options.fileId,
          access_grant: accessGrant
        };
        
        const response = await sdk.os.downloadEncryptedFile(downloadRequest);
        
        // Write the file to the specified output path
        // Handle different response types
        if (Buffer.isBuffer(response)) {
          fs.writeFileSync(outputPath, response);
        } else if (typeof response === 'string') {
          fs.writeFileSync(outputPath, response);
        } else if (response instanceof Uint8Array) {
          fs.writeFileSync(outputPath, response);
        } else {
          // For other types, try to convert to string first
          try {
            fs.writeFileSync(outputPath, String(response));
          } catch (writeError) {
            spinner.fail('Failed to write file');
            console.error(chalk.red('Error:'), 'Unsupported response format');
            return;
          }
        }
        
        spinner.succeed('File downloaded successfully');
        
        console.log(chalk.green('\nDownloaded File:'));
        console.log(`  File ID: ${options.fileId}`);
        console.log(`  Saved to: ${outputPath}`);
        console.log(`  Size: ${formatFileSize(fs.statSync(outputPath).size)}`);
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      }
    });

  // Delete encrypted file command
  objectStoreCommand
    .command('delete-file')
    .description('Delete an encrypted file')
    .requiredOption('-i, --file-id <id>', 'ID of the file to delete')
    .option('-a, --access-grant <grant>', 'Access grant')
    .option('-f, --force', 'Force deletion without confirmation')
    .action(async (options: any) => {
      try {
        if (options.verbose) {
          console.log(chalk.green('\nSDK Method Signature:'));
          console.log(chalk.cyan('sdk.os.deleteEncryptedFile(deleteRequest)'));
          console.log(chalk.green('\nInputs:'));
          console.log(chalk.cyan(JSON.stringify({
            file_id: options.fileId,
            access_grant: options.accessGrant
          }, null, 2)));
          console.log(chalk.green('\nOutputs:'));
          console.log(chalk.cyan('{ }'));
        }

        // If access grant is not provided, prompt for it
        const answers = await inquirer.prompt([
          {
            type: 'password',
            name: 'accessGrant',
            message: 'Enter access grant:',
            when: !options.accessGrant,
            validate: (input) => input.trim() !== '' ? true : 'Access grant is required'
          }
        ]);

        const accessGrant = options.accessGrant || answers.accessGrant;
        
        // Confirm deletion unless force option is used
        if (!options.force) {
          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Are you sure you want to delete file with ID "${options.fileId}"?`,
              default: false
            }
          ]);
          
          if (!confirm) {
            console.log(chalk.yellow('Deletion cancelled'));
            return;
          }
        }
        
        const spinner = ora('Deleting encrypted file...').start();
        
        const sdk = await initSDK();
        
        const deleteRequest = {
          file_id: options.fileId,
          access_grant: accessGrant
        };
        
        const response = await sdk.os.deleteEncryptedFile(deleteRequest);
        
        spinner.succeed('File deleted successfully');
        
        console.log(chalk.green('\nDeleted File:'));
        console.log(`  File ID: ${options.fileId}`);
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      }
    });

  // Copy encrypted file command
  objectStoreCommand
    .command('copy-file')
    .description('Copy an encrypted file')
    .requiredOption('-i, --file-id <id>', 'ID of the file to copy')
    .requiredOption('-d, --dst-path <path>', 'Destination path')
    .option('-a, --access-grant <grant>', 'Access grant')
    .action(async (options: any) => {
      try {
        if (options.verbose) {
          console.log(chalk.green('\nSDK Method Signature:'));
          console.log(chalk.cyan('sdk.os.copyEncryptedFile(copyRequest)'));
          console.log(chalk.green('\nInputs:'));
          console.log(chalk.cyan(JSON.stringify({
            file_id: options.fileId,
            destination_path: options.dstPath,
            access_grant: options.accessGrant
          }, null, 2)));
          console.log(chalk.green('\nOutputs:'));
          console.log(chalk.cyan('{ }'));
        }

        // If access grant is not provided, prompt for it
        const answers = await inquirer.prompt([
          {
            type: 'password',
            name: 'accessGrant',
            message: 'Enter access grant:',
            when: !options.accessGrant,
            validate: (input) => input.trim() !== '' ? true : 'Access grant is required'
          }
        ]);

        const accessGrant = options.accessGrant || answers.accessGrant;
        const spinner = ora('Copying encrypted file...').start();
        
        const sdk = await initSDK();
        
        const copyRequest = {
          file_id: options.fileId,
          destination_path: options.dstPath,
          access_grant: accessGrant
        };
        
        const response = await sdk.os.copyEncryptedFile(copyRequest);
        
        spinner.succeed('File copied successfully');
        
        console.log(chalk.green('\nCopied File:'));
        console.log(`  Original File ID: ${options.fileId}`);
        console.log(`  Destination Path: ${options.dstPath}`);
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      }
    });

  // Move encrypted file command
  objectStoreCommand
    .command('move-file')
    .description('Move an encrypted file')
    .requiredOption('-i, --file-id <id>', 'ID of the file to move')
    .requiredOption('-d, --dst-path <path>', 'Destination path')
    .option('-a, --access-grant <grant>', 'Access grant')
    .action(async (options: any) => {
      try {
        if (options.verbose) {
          console.log(chalk.green('\nSDK Method Signature:'));
          console.log(chalk.cyan('sdk.os.moveEncryptedFile(moveRequest)'));
          console.log(chalk.green('\nInputs:'));
          console.log(chalk.cyan(JSON.stringify({
            file_id: options.fileId,
            destination_path: options.dstPath,
            access_grant: options.accessGrant
          }, null, 2)));
          console.log(chalk.green('\nOutputs:'));
          console.log(chalk.cyan('{ }'));
        }

        // If access grant is not provided, prompt for it
        const answers = await inquirer.prompt([
          {
            type: 'password',
            name: 'accessGrant',
            message: 'Enter access grant:',
            when: !options.accessGrant,
            validate: (input) => input.trim() !== '' ? true : 'Access grant is required'
          }
        ]);

        const accessGrant = options.accessGrant || answers.accessGrant;
        const spinner = ora('Moving encrypted file...').start();
        
        const sdk = await initSDK();
        
        const moveRequest = {
          file_id: options.fileId,
          destination_path: options.dstPath,
          access_grant: accessGrant
        };
        
        const response = await sdk.os.moveEncryptedFile(moveRequest);
        
        spinner.succeed('File moved successfully');
        
        console.log(chalk.green('\nMoved File:'));
        console.log(`  File ID: ${options.fileId}`);
        console.log(`  New Path: ${options.dstPath}`);
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      }
    });

  // Get file metadata command
  objectStoreCommand
    .command('get-file-metadata')
    .description('Get metadata for a file')
    .requiredOption('-i, --file-id <id>', 'ID of the file')
    .option('-a, --access-grant <grant>', 'Access grant')
    .action(async (options: any) => {
      try {
        if (options.verbose) {
          console.log(chalk.green('\nSDK Method Signature:'));
          console.log(chalk.cyan('sdk.os.getFileMetadata(metadataRequest)'));
          console.log(chalk.green('\nInputs:'));
          console.log(chalk.cyan(JSON.stringify({
            file_id: options.fileId,
            access_grant: options.accessGrant
          }, null, 2)));
          console.log(chalk.green('\nOutputs:'));
          console.log(chalk.cyan('{ data: { id: string, file_name: string, bucket_name: string, directory_name: string, owner_address: string, file_size_bytes: number, file_type: string, created_at: string, updated_at: string } }'));
        }

        // If access grant is not provided, prompt for it
        const answers = await inquirer.prompt([
          {
            type: 'password',
            name: 'accessGrant',
            message: 'Enter access grant:',
            when: !options.accessGrant,
            validate: (input) => input.trim() !== '' ? true : 'Access grant is required'
          }
        ]);

        const accessGrant = options.accessGrant || answers.accessGrant;
        const spinner = ora('Getting file metadata...').start();
        
        const sdk = await initSDK();
        
        const metadataRequest = {
          file_id: options.fileId,
          access_grant: accessGrant
        };
        
        const response = await sdk.os.getFileMetadata(metadataRequest);
        
        spinner.succeed('File metadata retrieved successfully');
        
        console.log(chalk.green('\nFile Metadata:'));
        console.log(`  ID: ${response.data.id}`);
        console.log(`  Name: ${response.data.file_name}`);
        console.log(`  Bucket: ${response.data.bucket_name}`);
        console.log(`  Directory: ${response.data.directory_name || '(root)'}`);
        console.log(`  Owner: ${response.data.owner_address}`);
        console.log(`  Size: ${formatFileSize(response.data.file_size_bytes)}`);
        console.log(`  Type: ${response.data.file_type}`);
        console.log(`  Created: ${new Date(response.data.created_at).toLocaleString()}`);
        console.log(`  Updated: ${new Date(response.data.updated_at).toLocaleString()}`);
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      }
    });

  // Get encrypted file metadata command
  objectStoreCommand
    .command('get-encrypted-file-metadata')
    .description('Get metadata for an encrypted file')
    .requiredOption('-i, --file-id <id>', 'ID of the file')
    .requiredOption('-a, --access-grant <grant>', 'Access grant')
    .action(async (options: any) => {
      try {
        if (options.verbose) {
          console.log(chalk.green('\nSDK Method Signature:'));
          console.log(chalk.cyan('sdk.os.getEncryptedFileMetadata(metadataRequest)'));
          console.log(chalk.green('\nInputs:'));
          console.log(chalk.cyan(JSON.stringify({
            file_id: options.fileId,
            access_grant: options.accessGrant
          }, null, 2)));
          console.log(chalk.green('\nOutputs:'));
          console.log(chalk.cyan('{ data: { file: { id: string, file_name: string, bucket_name: string, directory_name: string, owner_address: string, file_size_bytes: number, file_type: string, created_at: string, updated_at: string }, metadata: { created: string, modified: string, size: number, expires: string, encryption: { algorithm: string, cipher_suite: string } } } }'));
        }

        const spinner = ora('Getting encrypted file metadata...').start();
        
        const sdk = await initSDK();
        
        const metadataRequest = {
          file_id: options.fileId,
          access_grant: options.accessGrant
        };
        
        const response = await sdk.os.getEncryptedFileMetadata(metadataRequest);
        
        spinner.succeed('Encrypted file metadata retrieved successfully');
        
        console.log(chalk.green('\nFile Metadata:'));
        console.log(`  ID: ${response.data.file.id}`);
        console.log(`  Name: ${response.data.file.file_name}`);
        console.log(`  Bucket: ${response.data.file.bucket_name}`);
        console.log(`  Directory: ${response.data.file.directory_name || '(root)'}`);
        console.log(`  Owner: ${response.data.file.owner_address}`);
        console.log(`  Size: ${formatFileSize(response.data.file.file_size_bytes)}`);
        console.log(`  Type: ${response.data.file.file_type}`);
        console.log(`  Created: ${new Date(response.data.file.created_at).toLocaleString()}`);
        console.log(`  Updated: ${new Date(response.data.file.updated_at).toLocaleString()}`);
        
        console.log(chalk.blue('\nStorj Metadata:'));
        console.log(`  Created: ${response.data.metadata.created}`);
        console.log(`  Modified: ${response.data.metadata.modified}`);
        console.log(`  Size: ${formatFileSize(response.data.metadata.size)}`);
        if (response.data.metadata.expires) {
          console.log(`  Expires: ${response.data.metadata.expires}`);
        }
        console.log(`  Encryption Algorithm: ${response.data.metadata.encryption.algorithm}`);
        console.log(`  Encryption Cipher Suite: ${response.data.metadata.encryption.cipher_suite}`);
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      }
    });

  // Get account file bytes command
  objectStoreCommand
    .command('get-account-size')
    .description('Get total size of files in an account')
    .option('-b, --bucket <name>', 'Bucket name')
    .action(async (options: any) => {
      try {
        if (options.verbose) {
          console.log(chalk.green('\nSDK Method Signature:'));
          console.log(chalk.cyan('sdk.os.getAccountFileBytes(request)'));
          console.log(chalk.green('\nInputs:'));
          console.log(chalk.cyan(JSON.stringify({
            bucket: options.bucket
          }, null, 2)));
          console.log(chalk.green('\nOutputs:'));
          console.log(chalk.cyan('{ total_size_bytes: number }'));
        }

        const spinner = ora('Getting account file size...').start();
        
        const sdk = await initSDK();
        
        const request = options.bucket ? { bucket: options.bucket } : {};
        
        const response = await sdk.os.getAccountFileBytes(request);
        
        spinner.succeed('Account file size retrieved successfully');
        
        console.log(chalk.green('\nAccount File Size:'));
        console.log(`  Total Size: ${formatFileSize(response.total_size_bytes)}`);
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
      }
    });

  return objectStoreCommand;
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
