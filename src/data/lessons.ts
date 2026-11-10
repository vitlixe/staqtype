import type { Lesson } from "../types/lesson";

// Lesson texts are written at column 0 on purpose: every space, newline and
// indent level in the template literal is part of the exercise and is checked
// strictly. Go and Makefile lessons keep their real tab indentation; the Tab
// key types a tab for them and spaces everywhere else.
export const lessons: Lesson[] = [
  {
    id: "dockerfile-node-service",
    title: "Node.js service image",
    difficulty: "beginner",
    language: "dockerfile",
    text: `FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .
ENV NODE_ENV=production
EXPOSE 3000
USER node
CMD ["node", "server.js"]`,
  },
  {
    id: "dockerfile-go-multistage",
    title: "Go multi-stage build",
    difficulty: "intermediate",
    language: "dockerfile",
    text: `FROM golang:1.24-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /out/api ./cmd/api

FROM gcr.io/distroless/static-debian12
COPY --from=build /out/api /api
EXPOSE 8080
ENTRYPOINT ["/api"]`,
  },
  {
    id: "compose-web-redis",
    title: "Web server with Redis cache",
    difficulty: "beginner",
    language: "yaml",
    text: `services:
  web:
    image: nginx:1.27-alpine
    ports:
      - "8080:80"
    restart: unless-stopped
  cache:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - cache-data:/data

volumes:
  cache-data:`,
  },
  {
    id: "compose-api-postgres",
    title: "API with healthy Postgres",
    difficulty: "intermediate",
    language: "yaml",
    text: `services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://app:app@db:5432/app
    depends_on:
      db:
        condition: service_healthy
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s
      timeout: 3s
      retries: 5
    volumes:
      - db-data:/var/lib/postgresql/data

volumes:
  db-data:`,
  },
  {
    id: "k8s-service",
    title: "ClusterIP Service",
    difficulty: "beginner",
    language: "yaml",
    text: `apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  type: ClusterIP
  selector:
    app: web
  ports:
    - name: http
      port: 80
      targetPort: 8080`,
  },
  {
    id: "k8s-deployment",
    title: "Deployment with resources",
    difficulty: "intermediate",
    language: "yaml",
    text: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  labels:
    app: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: nginx:1.27-alpine
          ports:
            - containerPort: 80
          resources:
            requests:
              cpu: 100m
              memory: 128Mi`,
  },
  {
    id: "gha-node-ci",
    title: "Node.js CI workflow",
    difficulty: "beginner",
    language: "yaml",
    text: `name: ci
on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test`,
  },
  {
    id: "gha-docker-publish",
    title: "Publish image to GHCR",
    difficulty: "advanced",
    language: "yaml",
    text: `name: release
on:
  push:
    tags: ["v*"]

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v6
        with:
          push: true
          tags: ghcr.io/\${{ github.repository }}:\${{ github.ref_name }}`,
  },
  {
    id: "terraform-s3-bucket",
    title: "AWS S3 bucket",
    difficulty: "intermediate",
    language: "hcl",
    text: `terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "eu-central-1"
}

resource "aws_s3_bucket" "assets" {
  bucket = "staqtype-assets"

  tags = {
    Environment = "production"
    ManagedBy   = "terraform"
  }
}`,
  },
  {
    id: "ansible-nginx-playbook",
    title: "Nginx install playbook",
    difficulty: "intermediate",
    language: "yaml",
    text: `- name: Configure web servers
  hosts: web
  become: true
  tasks:
    - name: Install nginx
      ansible.builtin.apt:
        name: nginx
        state: present
        update_cache: true

    - name: Deploy site config
      ansible.builtin.template:
        src: site.conf.j2
        dest: /etc/nginx/conf.d/site.conf
      notify: Reload nginx

  handlers:
    - name: Reload nginx
      ansible.builtin.service:
        name: nginx
        state: reloaded`,
  },
  {
    id: "bash-backup-script",
    title: "Backup rotation script",
    difficulty: "advanced",
    language: "bash",
    text: `#!/usr/bin/env bash
set -euo pipefail

SRC_DIR="/var/lib/app"
DEST_DIR="/backups"
STAMP="$(date +%Y-%m-%d)"
ARCHIVE="$DEST_DIR/app-$STAMP.tar.gz"

mkdir -p "$DEST_DIR"
tar -czf "$ARCHIVE" -C "$SRC_DIR" .

find "$DEST_DIR" -name "app-*.tar.gz" -mtime +7 -delete
echo "Backup written to $ARCHIVE"`,
  },
  {
    id: "nginx-reverse-proxy",
    title: "Reverse proxy server block",
    difficulty: "intermediate",
    language: "nginx",
    text: `server {
    listen 80;
    server_name app.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`,
  },
  {
    id: "git-everyday",
    title: "Everyday Git commands",
    difficulty: "beginner",
    language: "bash",
    text: `git status
git diff --staged
git add -p
git commit -m "fix(auth): reject empty password"
git pull --rebase origin main
git push origin feature/login
git log --oneline -10
git switch -c feature/payments`,
  },
  {
    id: "git-history-rescue",
    title: "Git history rescue kit",
    difficulty: "advanced",
    language: "bash",
    text: `git stash push -m "wip: refactor session"
git rebase -i HEAD~5
git cherry-pick 4f9d2c1
git reflog show --date=relative
git reset --soft HEAD~1
git revert --no-edit a1b2c3d
git restore --source=HEAD~2 -- src/config.ts
git stash pop`,
  },
  {
    id: "gitignore-node",
    title: ".gitignore for a Node project",
    difficulty: "beginner",
    language: "gitignore",
    text: `node_modules/
dist/
coverage/

*.log
*.local
.env
.env.*
!.env.example

.DS_Store
Thumbs.db

.vscode/
.idea/`,
  },
  {
    id: "docker-cli-basics",
    title: "Docker CLI basics",
    difficulty: "beginner",
    language: "bash",
    text: `docker ps -a
docker run -d --name web -p 8080:80 nginx:alpine
docker logs -f --tail 100 web
docker exec -it web sh
docker stop web && docker rm web
docker image prune -f
docker build -t app:latest .
docker compose up -d --build`,
  },
  {
    id: "kubectl-oneliners",
    title: "kubectl one-liners",
    difficulty: "intermediate",
    language: "bash",
    text: `kubectl get pods -n production -o wide
kubectl describe deployment web -n production
kubectl logs -f deploy/web -c app --since=1h
kubectl rollout restart deployment/web
kubectl rollout status deployment/web --timeout=120s
kubectl scale deployment/web --replicas=5
kubectl port-forward svc/web 8080:80
kubectl apply -f k8s/ --dry-run=server`,
  },
  {
    id: "curl-api-calls",
    title: "curl API calls",
    difficulty: "advanced",
    language: "bash",
    text: `curl -s https://api.example.com/health | jq .status
curl -X POST https://api.example.com/v1/tokens \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $API_TOKEN" \\
  -d '{"name": "deploy-bot", "ttl": 3600}'
curl -fsSL -o /tmp/install.sh https://get.example.com
curl -s -o /dev/null -w "%{http_code}\\n" https://example.com`,
  },
  {
    id: "makefile-go-project",
    title: "Makefile for a Go project",
    difficulty: "intermediate",
    language: "makefile",
    text: `.PHONY: build test lint clean

BINARY := app

build:
	go build -o dist/$(BINARY) ./cmd/app

test:
	go test -race ./...

lint:
	golangci-lint run ./...

clean:
	rm -rf dist`,
  },
  {
    id: "python-fastapi-route",
    title: "FastAPI route with a Pydantic model",
    difficulty: "beginner",
    language: "python",
    text: `class Item(BaseModel):
    name: str
    price: float
    tags: list[str] = []


@app.post("/items", status_code=201)
async def create_item(item: Item) -> Item:
    db.add(item)
    return item`,
  },
  {
    id: "python-pandas-groupby",
    title: "pandas group and aggregate",
    difficulty: "intermediate",
    language: "python",
    text: `daily = (
    df[df["status"] == "paid"]
    .groupby(["region", df["created_at"].dt.date])
    .agg(orders=("id", "count"), revenue=("amount", "sum"))
    .reset_index()
)`,
  },
  {
    id: "python-rotate-backups",
    title: "Rotate old backups",
    difficulty: "beginner",
    language: "python",
    text: `from datetime import datetime, timedelta
from pathlib import Path

cutoff = datetime.now() - timedelta(days=14)
for f in Path("/backup").glob("*.tar.gz"):
    if datetime.fromtimestamp(f.stat().st_mtime) < cutoff:
        f.unlink()`,
  },
  {
    id: "go-http-handler",
    title: "HTTP handler with JSON",
    difficulty: "intermediate",
    language: "go",
    text: `func (s *Server) getUser(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	u, err := s.store.User(r.Context(), id)
	if errors.Is(err, store.ErrNotFound) {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(u)
}`,
  },
  {
    id: "go-table-test",
    title: "Table-driven test",
    difficulty: "intermediate",
    language: "go",
    text: `func TestSlug(t *testing.T) {
	tests := []struct{ in, want string }{
		{"Hello World", "hello-world"},
		{"  trim  ", "trim"},
	}
	for _, tt := range tests {
		if got := Slug(tt.in); got != tt.want {
			t.Errorf("Slug(%q) = %q, want %q", tt.in, got, tt.want)
		}
	}
}`,
  },
  {
    id: "ts-express-router",
    title: "Express router",
    difficulty: "intermediate",
    language: "typescript",
    text: `router.get("/orders/:id", async (req, res, next) => {
  try {
    const order = await orders.find(req.params.id);
    if (!order) return res.status(404).json({ error: "not found" });
    res.json(order);
  } catch (err) {
    next(err);
  }
});`,
  },
  {
    id: "ts-react-controlled-input",
    title: "React controlled input",
    difficulty: "beginner",
    language: "typescript",
    text: `export function Search({ onSearch }: { onSearch: (q: string) => void }) {
  const [q, setQ] = useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSearch(q); }}>
      <input value={q} onChange={(e) => setQ(e.target.value)} />
    </form>
  );
}`,
  },
  {
    id: "sql-window-functions",
    title: "Window functions",
    difficulty: "intermediate",
    language: "sql",
    text: `SELECT
  user_id,
  order_date,
  SUM(amount) OVER (
    PARTITION BY user_id
    ORDER BY order_date
  ) AS running_total
FROM orders
WHERE order_date >= '2026-01-01';`,
  },
  {
    id: "sql-upsert-returning",
    title: "Upsert with RETURNING",
    difficulty: "beginner",
    language: "sql",
    text: `INSERT INTO users (email, name)
VALUES ('ann@example.com', 'Ann')
ON CONFLICT (email)
DO UPDATE SET name = EXCLUDED.name
RETURNING id, created_at;`,
  },
  {
    id: "css-card-grid",
    title: "Grid of cards",
    difficulty: "beginner",
    language: "css",
    text: `.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.card:hover {
  border-color: var(--accent);
}`,
  },
  {
    id: "systemd-service-unit",
    title: "systemd service unit",
    difficulty: "intermediate",
    language: "ini",
    text: `[Unit]
Description=Acme API
After=network-online.target

[Service]
ExecStart=/usr/local/bin/api --port 8080
Restart=on-failure
User=api

[Install]
WantedBy=multi-user.target`,
  },
  {
    id: "swift-codable-model",
    title: "Codable model",
    difficulty: "beginner",
    language: "swift",
    text: `struct User: Codable, Identifiable {
    let id: UUID
    var name: String
    var email: String?
}

let users = try JSONDecoder().decode([User].self, from: data)`,
  },
];

export function getLessonById(id: string | undefined): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === id);
}
