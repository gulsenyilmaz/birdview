# Frontend Dockerfile

# ---------- Build Stage ----------
FROM node:18 AS build

WORKDIR /app

# Install deps only when needed
COPY package*.json ./
RUN npm install

# Copy rest of the code
COPY .env.production .env
COPY . .

# Build the app
RUN npm run build


# ---------- Production Stage ----------
FROM nginx:alpine

# Remove default nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy built app to nginx folder
COPY --from=build /app/dist /usr/share/nginx/html

# Optional: custom nginx config (if needed)
# COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

