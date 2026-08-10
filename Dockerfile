# ─── Build Stage ─────────────────────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Copy pom.xml from backend directory
COPY backend/pom.xml .
RUN mvn dependency:go-offline -B

# Copy backend source files
COPY backend/src ./src
RUN mvn clean package -DskipTests

# ─── Production Run Stage ───────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser:appgroup

VOLUME /tmp
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080 8088 10000

# Optimize JVM RAM limits for 512MB Render free tier to prevent Exit Status 137 (OOM)
ENTRYPOINT ["sh", "-c", "exec java -Xms128m -Xmx320m -XX:MaxMetaspaceSize=128m -XX:+UseG1GC -Djava.security.egd=file:/dev/./urandom -Dserver.port=${PORT:-8080} -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-dev} -jar app.jar"]
