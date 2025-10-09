# Production Deployment Guide

This guide covers deploying the Equipment Lending System to a self-hosted environment using Docker Compose with PostgreSQL.

## Prerequisites

- Docker Engine 20.10+ and Docker Compose 2.0+
- At least 2GB RAM and 10GB disk space
- Network access to the deployment server
- Basic knowledge of Docker and command line

## Quick Start

### 1. Clone and Prepare

```bash
# Clone the repository
git clone <repository-url>
cd schedule_assistant

# Copy environment templates
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Configure Environment Variables

Edit `backend/.env` and update the following values:

```bash
# Database Configuration
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=equipment_lending
POSTGRES_USER=equipment_user
POSTGRES_PASSWORD=your_secure_password_here

# JWT Configuration
SECRET_KEY=your_super_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application Configuration
ENVIRONMENT=production
```

Edit `frontend/.env` and update:

```bash
# API Configuration
VITE_API_URL=http://your-server-ip:8000

# Application Configuration
VITE_APP_TITLE=Equipment Lending System
VITE_APP_VERSION=1.0.0
```

### 3. Deploy with Docker Compose

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 4. Access the Application

- **Frontend**: http://your-server-ip
- **Backend API**: http://your-server-ip:8000
- **API Documentation**: http://your-server-ip:8000/docs

### 5. Initial Login

The system creates an admin account during initialization:

- **Email**: admin@admin.com
- **Password**: admin123

**Important**: Change the admin password immediately after first login.

## Service Architecture

### Services

1. **PostgreSQL Database** (`postgres`)
   - Port: 5432
   - Persistent data volume
   - Health checks enabled

2. **Backend API** (`backend`)
   - Port: 8000
   - FastAPI with Uvicorn
   - 4 worker processes
   - Health checks enabled

3. **Frontend** (`frontend`)
   - Port: 80
   - Nginx serving React app
   - Proxies API requests to backend
   - Gzip compression enabled

### Network

All services communicate through a custom Docker network (`equipment-network`).

## Configuration Details

### Database Configuration

The PostgreSQL service is configured with:
- Persistent volume for data storage
- Automatic database initialization
- Health checks for service dependencies
- Environment-based configuration

### Backend Configuration

The backend service includes:
- Multi-stage Docker build for optimization
- Non-root user for security
- Health check endpoint
- Environment variable validation
- Production-ready settings

### Frontend Configuration

The frontend service features:
- Multi-stage build with Nginx
- Static file serving with caching
- API request proxying
- Security headers
- Gzip compression

## Environment Variables

### Backend (.env)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `POSTGRES_HOST` | Database host | `postgres` | Yes |
| `POSTGRES_PORT` | Database port | `5432` | Yes |
| `POSTGRES_DB` | Database name | `equipment_lending` | Yes |
| `POSTGRES_USER` | Database user | `equipment_user` | Yes |
| `POSTGRES_PASSWORD` | Database password | `secure_password_123` | Yes |
| `SECRET_KEY` | JWT secret key | `your-secret-key-change-in-production` | Yes |
| `ALGORITHM` | JWT algorithm | `HS256` | No |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry | `30` | No |
| `ENVIRONMENT` | Environment mode | `development` | No |

### Frontend (.env)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API URL | `http://localhost:8000` | Yes |
| `VITE_APP_TITLE` | Application title | `Equipment Lending System` | No |
| `VITE_APP_VERSION` | Application version | `1.0.0` | No |

## Management Commands

### Start Services

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Stop Services

```bash
docker-compose -f docker-compose.prod.yml down
```

### Restart Services

```bash
docker-compose -f docker-compose.prod.yml restart
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Update Application

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build
```

### Database Backup

```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U equipment_user equipment_lending > backup.sql

# Restore backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U equipment_user equipment_lending < backup.sql
```

## Security Considerations

### Production Checklist

- [ ] Change default `SECRET_KEY` to a strong, random value
- [ ] Change default `POSTGRES_PASSWORD` to a secure password
- [ ] Update admin account password after first login
- [ ] Configure firewall to restrict access to necessary ports only
- [ ] Enable SSL/TLS if accessing over public networks
- [ ] Regular security updates for Docker images
- [ ] Monitor application logs for suspicious activity

### Network Security

For LAN-only access:
- Ensure firewall blocks external access to ports 80 and 8000
- Use private IP addresses for `VITE_API_URL`
- Consider VPN access for remote administration

## Monitoring and Maintenance

### Health Checks

All services include health checks:
- Database: `pg_isready` command
- Backend: HTTP GET `/health`
- Frontend: HTTP GET `/`

### Log Monitoring

Monitor logs for:
- Application errors
- Database connection issues
- Authentication failures
- Performance issues

### Regular Maintenance

1. **Weekly**:
   - Check service health
   - Review application logs
   - Monitor disk space

2. **Monthly**:
   - Update Docker images
   - Database backup verification
   - Security updates

3. **As needed**:
   - User account management
   - Equipment inventory updates
   - System configuration changes

## Troubleshooting

### Common Issues

#### Services Won't Start

```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# View detailed logs
docker-compose -f docker-compose.prod.yml logs

# Check port conflicts
netstat -tulpn | grep :80
netstat -tulpn | grep :8000
```

#### Database Connection Issues

```bash
# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Test database connection
docker-compose -f docker-compose.prod.yml exec postgres psql -U equipment_user -d equipment_lending -c "SELECT 1;"
```

#### Frontend Not Loading

```bash
# Check frontend logs
docker-compose -f docker-compose.prod.yml logs frontend

# Verify nginx configuration
docker-compose -f docker-compose.prod.yml exec frontend nginx -t
```

#### API Not Responding

```bash
# Check backend logs
docker-compose -f docker-compose.prod.yml logs backend

# Test API endpoint
curl http://localhost:8000/health
```

### Reset Everything

If you need to start fresh:

```bash
# Stop and remove all containers and volumes
docker-compose -f docker-compose.prod.yml down -v

# Remove all images (optional)
docker-compose -f docker-compose.prod.yml down --rmi all

# Start fresh
docker-compose -f docker-compose.prod.yml up -d
```

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review application logs
3. Verify environment configuration
4. Check Docker and system resources

## License

This project is licensed under the MIT License.
