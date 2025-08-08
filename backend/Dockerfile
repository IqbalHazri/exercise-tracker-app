# Use Python base image
FROM python:3.11-slim

# Set work directory
WORKDIR /app

RUN mkdir -p /app/flask_sessions

# Install dependencies
COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

# Copy backend files
COPY . .

# Expose Flask port
EXPOSE 5000

# Run Flask
CMD ["python", "app.py"]
