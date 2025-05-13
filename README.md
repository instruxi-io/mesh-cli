# Mesh CLI

Command Line Interface for Mesh SDK

## Installation

```bash
npm install
npm run build

# To install the CLI globally
sudo npm link
```

This will make the `mesh` command available globally in your terminal.

## Configuration

The CLI can be configured using environment variables or command line options:

- `API_KEY` - Your Mesh API key
- `PRIVATE_KEY` - Your Ethereum private key for SIWE authentication
- `API_URI` - The Mesh API URI (defaults to http://localhost:8080)

You can also create a `.env` file in the CLI directory with these variables.

## Authentication

You can authenticate using either an API key or Sign-In With Ethereum (SIWE):

```bash
# Login with API key
mesh auth login --api-key YOUR_API_KEY

# Login with SIWE
mesh auth login --private-key YOUR_PRIVATE_KEY
```

If you don't provide the keys as command line arguments, the CLI will prompt you for them.

## Available Commands

### Authentication and Authorization (Enforcer)

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

# Terms and conditions
mesh auth terms
mesh auth accept-terms

# Authorization
mesh auth authorize --file ./scenarios/profile.json
mesh auth authorize --json '{"action":"read","resource":"...","policy_id":"app.profile",...}'
mesh auth authorize --file ./scenarios/profile.json --outfile
mesh auth authorize-batch --file ./scenarios/batch.json
```

### Admin Operations

```bash
# Tenant management
mesh admin list-tenants
mesh admin get-tenant --id TENANT_ID
mesh admin create-tenant --name "Tenant Name" --code "tenant-code"
mesh admin update-tenant --id TENANT_ID --name "New Name" --description "New description"
mesh admin delete-tenant --id TENANT_ID

# Role management
mesh admin list-roles

# Group management
mesh admin list-groups
mesh admin list-groups --tenant-id TENANT_ID
```

## Examples

### Creating and using an API key

```bash
# Create a new API key
mesh auth login --private-key YOUR_PRIVATE_KEY
mesh auth create-api-key
# Save the API key output

# Use the API key for future operations
mesh auth login --api-key YOUR_API_KEY
mesh auth account
```

### Checking if an account exists

```bash
# Check if an account exists
mesh auth account-exists --address 0xYOUR_ETHEREUM_ADDRESS

# If you're authenticated, you can also get your own account details
mesh auth account
```

### Managing tenants

```bash
# List all tenants
mesh admin list-tenants

# Create a new tenant
mesh admin create-tenant --name "Test Tenant" --code "test-tenant" --description "A test tenant"

# Get tenant details
mesh admin get-tenant --id TENANT_ID

# Update tenant
mesh admin update-tenant --id TENANT_ID --name "Updated Tenant" --active true

# Delete tenant
mesh admin delete-tenant --id TENANT_ID
```

### Authorization

```bash
# Single authorization from a JSON file
mesh auth authorize --file ./scenarios/profile.json

# Single authorization from a JSON string
mesh auth authorize --json '{"action":"read","resource":"/api/v1/admin/profiles/list","policy_id":"app.profile","resource_type":"api","contexts":["profile"],"resource_metadata":{"method":"GET","attributes":["id","account_address","tenant_id","email","username"],"tenant_id":"00000000-0000-0000-0000-000000000002","account_address":"0x92F78491093bA0dd88A419b1BF07aeb3BA9fD0dc"}}'

# Save authorization response to default file (tmp/my.json)
mesh auth authorize --file ./scenarios/profile.json --outfile

# Save authorization response to custom file
mesh auth authorize --file ./scenarios/profile.json --outfile ./results/auth-response.json

# Batch authorization from a JSON file
mesh auth authorize-batch --file ./scenarios/batch.json

# Save batch authorization response to file
mesh auth authorize-batch --file ./scenarios/batch.json --outfile ./results/batch-response.json
```

#### Sample JSON Files

For single authorization (`scenarios/profile.json`):
```json
{
  "action": "read",
  "resource": "/api/v1/admin/profiles/list",
  "policy_id": "app.profile",
  "resource_type": "api",
  "contexts": ["profile"],
  "resource_metadata": {
    "method": "GET",
    "attributes": ["id", "account_address", "tenant_id", "email", "username"],
    "tenant_id": "00000000-0000-0000-0000-000000000002",
    "account_address": "0x92F78491093bA0dd88A419b1BF07aeb3BA9fD0dc"
  }
}
```

For batch authorization (`scenarios/batch.json`):
```json
{
  "policy_id": "app.profile",
  "contexts": ["profile"],
  "requests": [
    {
      "action": "read",
      "resource": "/api/v1/admin/profiles/list",
      "resource_type": "api",
      "resource_metadata": {
        "method": "GET",
        "attributes": ["id", "account_address", "tenant_id", "email", "username"],
        "tenant_id": "00000000-0000-0000-0000-000000000002",
        "account_address": "0x92F78491093bA0dd88A419b1BF07aeb3BA9fD0dc"
      }
    },
    {
      "action": "write",
      "resource": "/api/v1/admin/profile/create",
      "resource_type": "api",
      "resource_metadata": {
        "method": "POST",
        "attributes": ["account_address", "tenant_id", "email", "username"],
        "tenant_id": "00000000-0000-0000-0000-000000000002",
        "account_address": "0x92F78491093bA0dd88A419b1BF07aeb3BA9fD0dc"
      }
    }
  ]
}
```

## Development

To run the CLI in development mode:

```bash
npm run dev -- [command] [options]
```

For example:

```bash
npm run dev -- auth login
```

## Troubleshooting

### Module Not Found Errors

If you encounter an error like `Cannot find module '@instruxi-io/mesh-sdk-core'` when running the CLI, it means the dependencies are not properly linked. Try these steps:

1. Make sure the core SDK is built and linked:
   ```bash
   # From the mesh-sdk directory
   cd packages/core
   npm install
   npm run build
   npm link
   ```

2. Link the core SDK to the CLI:
   ```bash
   # From the CLI directory
   npm link @instruxi-io/mesh-sdk-core
   ```

3. Rebuild and reinstall the CLI:
   ```bash
   npm run build
   sudo npm link
   ```

This should resolve dependency issues by ensuring the CLI can find all required modules.
