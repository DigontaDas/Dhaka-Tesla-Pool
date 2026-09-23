git branch -m master
git config user.name "Chief Tesla Engineer"
git config user.email "engineer@oi-tesla.dhaka"

# 1. Initial Commit
git add .gitignore job.pdf job_text.txt stitch_oi_tesla_ride_pooling/
git commit -m "chore(init): initialize oi-tesla ride pooling repository with design assets"

# 2. Database Schema Feature
git checkout -b feature/database-schema
git add oi-tesla/supabase/ oi-tesla/.env.example oi-tesla/.gitignore
git commit -m "feat(db): add supabase postgresql migrations, functions and story cast seed"
git checkout master
git merge --no-ff feature/database-schema -m "merge: integrate feature/database-schema into master"

# 3. Backend Core & Tests Feature
git checkout -b feature/backend-core
git add oi-tesla/backend/
git commit -m "feat(backend): implement express api, concurrency store, fare engine and 20 tests"
git checkout master
git merge --no-ff feature/backend-core -m "merge: integrate feature/backend-core into master"

# 4. Frontend UI Feature
git checkout -b feature/frontend-ui
git add oi-tesla/frontend/
git commit -m "feat(frontend): implement nextjs app with stitch tokens, live tracking and cockpit"
git checkout master
git merge --no-ff feature/frontend-ui -m "merge: integrate feature/frontend-ui into master"

# 5. Docker Setup Feature
git checkout -b feature/docker-setup
git add docker-compose.yml oi-tesla/docker-compose.yml oi-tesla/backend/Dockerfile oi-tesla/frontend/Dockerfile
git commit -m "build(docker): add multi-container compose orchestration with healthchecks"
git checkout master
git merge --no-ff feature/docker-setup -m "merge: integrate feature/docker-setup into master"

# 6. Pre-release Branch
git checkout -b pre-release
git add README.md oi-tesla/README.md oi-tesla/docs/
git commit -m "docs(readme): comprehensive documentation with architecture, ERD, and viral scale bonus"
git checkout master
git merge --no-ff pre-release -m "merge: integrate pre-release into master"

# 7. Release Branch v1.0.0
git checkout -b release/v1.0.0
git tag -a v1.0.0 -m "Release v1.0.0: Oi Tesla Dhaka Micro-Pool MVP"
git checkout master
