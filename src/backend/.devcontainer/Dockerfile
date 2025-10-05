# Use the official Python runtime image
FROM python:3.13

# Create the app directory
RUN mkdir /app

# Set the working directory inside the container
WORKDIR /app

# Set environment variables
# Prevents Python from writing pyc files to disk
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \
    g++ \
    gcc \
    libgdal-dev \
    gdal-bin \
    libproj-dev \
    proj-data \
    proj-bin \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip

# Copy and install dependencies
COPY requirements.txt  /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the Django project to the container
COPY . /app/

# Expose the Django port
EXPOSE $DJANGO_PORT

# Run Django’s development server
CMD ["sh", "-c", "python manage.py runserver 0.0.0.0:$DJANGO_PORT"]

