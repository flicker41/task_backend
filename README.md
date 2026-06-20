# Backend 

This repository contains the backend and frontend source code for the Backend Developer Internship assignment. 

The project implements a Scalable REST API using **FastAPI (Python)** with JWT-based authentications, Role-Based Access Control, and a fully functional CRUD flow for a secondary entity (`Task`). A premium **Web3-inspired Vanilla JS frontend** is provided to easily evaluate the API functionality without requiring a Node.js build step.

## Features Completed
- **REST API Design**: FastAPI application structured properly into routes, models, schemas, and database configuration.
- **Authentication**: Secure registration and login flow utilizing JWT (`python-jose`) and password hashing (`passlib/bcrypt`).
- **Role-Based Access Control (RBAC)**: 
   - The *first registered user* automatically becomes an **Admin**.
   - Subsequent users are **Users**.
   - Admins can view/manage tasks of all users, while regular users can only see and manage their own.
- **Database**: SQLite with `SQLAlchemy`. Fully abstracting the SQL layer so transitioning to PostgreSQL/MySQL takes replacing a single `DATABASE_URL` string.
- **API Documentation**: Automatic interactive Swagger UI available at `/docs`.
- **Premium UI**: Integrated Vanilla JS/CSS frontend with modern glassmorphism UI served directly via FastAPI static handler.

---

## Setup & Running Locally

Follow these commands to deploy the application on your local machine instantly.

### 1. Create a Virtual Environment

**Windows:**
```powershell
python -m venv venv
.\venv\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Start the Server
```bash
uvicorn backend.main:app --reload
```
*The database file `app.db` will be auto-generated upon starting the app.*

### 4. Open the App
- **Interactive UI**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Swagger Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Alternative Redoc API**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## Scalability & Production Deployment Note

This architecture serves as a high-performance boilerplate but needs additional infrastructure adjustments to scale massively for production:

1. **Microservices Migration**: The current monolithic REST API can be decoupled by separating the Auth/Identity Provider logic from the Core functionality (`Tasks`) to allow independent scaling of traffic-heavy segments.
2. **Database Pooling & Choice**: Move from local SQLite to a properly clustered Database (like AWS RDS PostgreSQL or clustered MongoDB). Utilizing SQLAlchemy allows this shift with minimal codebase modification.
3. **Caching with Redis**: Read-heavy endpoints (like retrieving `Tasks`) should be cached using Redis to drastically decrease database hits.
4. **Load Balancing**: The app should be Dockerized (`Dockerfile`) and deployed through an orchestration platform (Kubernetes or AWS ECS). An Nginx Reverse Proxy or an API Gateway (like AWS API Gateway) would route traffic to multiple container instances seamlessly.
5. **Rate Limiting**: Incorporate libraries like `slowapi` to restrict request frequency per IP to mitigate DoS attacks.
