# Indépendants en Bauges Website

A static website for the "Indépendants en Bauges" association, built with HTML, CSS, and JavaScript.

## Project Structure

- `src/sections/`: Contains HTML section files that are combined into the final page
- `src/scripts/`: Contains JavaScript scripts for building and serving the website
- `dist/`: Contains the compiled website (generated during build)

## Development

### Prerequisites

- Node.js (v20.17.0 or later)
- Docker and Docker Compose (for containerized deployment)

### Local Development

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables:
   ```
   cp .env.example .env
   ```
   Edit the `.env` file to configure your environment variables.

3. Build the website:
   ```
   npm run build
   ```

4. Start the development server:
   ```
   npm run serve
   ```

5. Or do both in one command:
   ```
   npm start
   ```

6. Open your browser and navigate to http://localhost:3000

### Environment Variables

The application uses the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port to run the server on | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `ADMIN_PASSWORD` | Password for admin access | `123456` |
| `JWT_SECRET` | Secret key for JWT token signing | `indep-bauges-secret-key` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://root:password@localhost:27017/indep-bauges?authSource=admin` |

For production, make sure to set secure values for `ADMIN_PASSWORD` and `JWT_SECRET`.

### MongoDB Integration

The application includes MongoDB integration for persisting content changes:

1. **Content Persistence**: All content changes made through the admin interface are saved to MongoDB, ensuring they survive container restarts.

2. **Audit Logs**: Each content change is logged with details about who made the change, what was changed, and when.

3. **Sync Commands**: Use the following commands to sync content between MongoDB and the filesystem:
   ```
   # Sync from MongoDB to filesystem
   npm run sync-from-mongo

   # Sync from filesystem to MongoDB
   npm run sync-to-mongo
   ```

4. **Admin Identification**: When making changes, admins can enter their name in the admin bar, which is recorded with each change.

## Docker Deployment

### Using Docker Compose (Development)

1. Start the container:
   ```
   docker compose up
   ```

2. Access the website at http://localhost:3000

### Building and Pushing Pre-built Image

1. Build and push the pre-built image to a container registry:
   ```
   ./build-and-push.sh [registry/username]
   ```

   Replace `[registry/username]` with your container registry and username.

### Deploying on Remote Server

1. Copy the `deploy.sh` script to your remote server.

2. Run the deployment script:
   ```
   ./deploy.sh [registry/username]
   ```

   Replace `[registry/username]` with your container registry and username.

## Building Process

The website is built using a custom concatenation script that:

1. Takes `src/sections/index.html` as a template
2. Finds all include comments like `<!-- Include file.html -->`
3. Replaces each comment with the content of the corresponding file from the `src/sections` folder
4. Processes any nested includes recursively
5. Writes the final compiled file to `dist/index.html`

## License

ISC
