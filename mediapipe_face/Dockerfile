# Use a modern Python version
FROM python:3.10-slim

# Install system dependencies required by MediaPipe and OpenCV 
# libgles2 is specifically what fixes the "libGLESv2.so.2" error
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgles2 \
    && rm -rf /var/lib/apt/lists/*

# Set our application working directory
WORKDIR /app

# Copy requirement files first
COPY requirements.txt .

# Install python dependencies from requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy everything else from the mediapipe_face folder into the container
COPY . .

# Expose the default port Render uses
EXPOSE 10000

# The command to start Gunicorn
CMD ["gunicorn", "-b", "0.0.0.0:10000", "app:app"]
