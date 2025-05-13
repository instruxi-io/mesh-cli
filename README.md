# Mesh CLI Demo

This project demonstrates how to install and use the Mesh CLI in your own projects.

## Installation

### Using the Installation Script

The easiest way to install the Mesh CLI is to use the provided installation script:

```bash
# Make sure the script is executable
chmod +x install.sh

# Run the installation script
./install.sh
```

The script will:
1. Check if npm or pnpm is installed
2. Configure the package manager to use GitHub Packages
3. Install the Mesh CLI
4. Create a `.env` file from the `.env.example` template if it doesn't exist

### Manual Installation

You can also install the Mesh CLI manually:

#### 1. Configure your package manager to use GitHub Packages

```bash
# For npm
npm config set @instruxi-io:registry https://npm.pkg.github.com

# For pnpm
pnpm config set @instruxi-io:registry https://npm.pkg.github.com

# For yarn
yarn config set @instruxi-io:registry https://npm.pkg.github.com
```

#### 2. Install the CLI

You can install the Mesh CLI globally:

```bash
# Using npm
npm install -g @instruxi-io/mesh-cli

# Using pnpm
pnpm add -g @instruxi-io/mesh-cli

# Using yarn
yarn global add @instruxi-io/mesh-cli
```

Or you can install it as a dependency in your project:

```bash
# Using npm
npm install @instruxi-io/mesh-cli

# Using pnpm
pnpm add @instruxi-io/mesh-cli

# Using yarn
yarn add @instruxi-io/mesh-cli
```

## Configuration

The CLI can be configured using environment variables or command line options:

- `API_KEY` - Your Mesh API key
- `PRIVATE_KEY` - Your Ethereum private key for SIWE authentication
- `API_URI` - The Mesh API URI (defaults to http://localhost:8080)

You can create a `.env` file in your project directory with these variables:

```
API_KEY=your_api_key_here
PRIVATE_KEY=your_private_key_here
API_URI=https://your-api-endpoint.com
```

## Usage

### Direct CLI Usage

Once installed globally, you can use the CLI directly:

```bash
# Login with API key
mesh auth login --api-key YOUR_API_KEY

# Login with SIWE
mesh auth login --private-key YOUR_PRIVATE_KEY

# Get account details
mesh auth account

# List tenants
mesh admin list-tenants
```

### Using in npm/pnpm Scripts

If you've installed the CLI as a project dependency, you can use it in your npm/pnpm scripts:

```json
{
  "scripts": {
    "auth:login": "mesh auth login",
    "auth:account": "mesh auth account",
    "admin:list-tenants": "mesh admin list-tenants"
  }
}
```

Then run:

```bash
npm run auth:login
# or
pnpm auth:login
```

## Example Commands

### Authentication and Authorization

```bash
# Login
mesh auth login

# Get account details
mesh auth account

# Check if an account exists
mesh auth account-exists --address 0xYOUR_ETHEREUM_ADDRESS

# API key management
mesh auth create-api-key
mesh auth list-api-keys
mesh auth activate-api-key --id API_KEY_ID
mesh auth deactivate-api-key --id API_KEY_ID
mesh auth delete-api-key --id API_KEY_ID

# Authorization
mesh auth authorize --file ./scenarios/auth_authorize.json
mesh auth authorize-batch --file ./scenarios/auth_authorize_batch.json
```

### Admin Operations

```bash
# Tenant management
mesh admin list-tenants
mesh admin get-tenant --id TENANT_ID
mesh admin create-tenant --file ./scenarios/admin_create_tenant.json
mesh admin update-tenant --id TENANT_ID --name "New Name" --description "New description"
mesh admin delete-tenant --id TENANT_ID

# Role management
mesh admin list-roles

# Group management
mesh admin list-groups
mesh admin list-groups --tenant-id TENANT_ID
```

### Object Storage

```bash
# List buckets
mesh storage list-buckets

# Create bucket
mesh storage create-bucket --file ./scenarios/storage_create_bucket.json

# Upload file
mesh storage upload --bucket my-bucket --file ./path/to/file.txt --key file.txt

# Download file
mesh storage download --bucket my-bucket --key file.txt --output ./downloaded-file.txt
```

## Using the Scenarios Directory

This demo includes a `scenarios` directory with example JSON files for various CLI commands:

- `auth_authorize.json`: Example for single authorization request
- `auth_authorize_batch.json`: Example for batch authorization requests
- `admin_create_tenant.json`: Example for creating a tenant
- `storage_create_bucket.json`: Example for creating a storage bucket

You can use these files with the corresponding CLI commands:

```bash
# Using the auth_authorize.json file
mesh auth authorize --file ./scenarios/auth_authorize.json

# Using the auth_authorize_batch.json file
mesh auth authorize-batch --file ./scenarios/auth_authorize_batch.json

# Using the admin_create_tenant.json file
mesh admin create-tenant --file ./scenarios/admin_create_tenant.json

# Using the storage_create_bucket.json file
mesh storage create-bucket --file ./scenarios/storage_create_bucket.json
```

You can also modify these files to suit your specific needs or create new ones for other commands.

## Advanced Usage

For more advanced usage and examples, refer to the [full CLI documentation](https://github.com/instruxi-io/mesh-sdk/tree/main/apps/cli).
