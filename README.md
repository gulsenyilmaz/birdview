BirdView

BirdView is an interactive data visualization project that maps artists (and other cultural figures) who were alive in a given year, based on museum collections, Wikidata, and extended metadata.

Inspired by the Museum of Modern Art (MoMA) collection and designed for extensibility, this project allows users to explore the lives of artists, thinkers, and other figures by time and geography.

🌍 Features

Visualizes artists and events on an interactive flat world map using Deck.gl and MapLibre

Time slider to select a year and dynamically update who was alive

Histogram-based year slider showing population distribution over time

Animated arcs show geographic distribution by year

Spiral layout prevents overlap when multiple artists share a nationality

Tooltips with artist name, age, or event details

War events and battles plotted with fading colors (red → purple → pale yellow, like a healing wound)

Filters by movement, museum, gender, or era

Mini timeline markers for each artwork

Detail panel for selected artist

📸 Screenshots

![screenshot](BW_Screenshot000.png)
![screenshot](BW_Screenshot001.png) 
![screenshot](BW_Screenshot002.png) 
![screenshot](BW_Screenshot003.png) 






🚀 Technologies

Frontend: React, Deck.gl, Plotly.js

Backend: FastAPI

Containerization: Docker, Docker Compose

Mapping: MapLibre (flat map)

🧭 Future Plans

Include other groups (philosophers, politicians, athletes, etc.)

Timeline / “life journey” animation mode for people

Expand dataset with natural disasters and other historical events

🧠 Data Sources

This project uses publicly available open data:

MoMA Collection
 – CC0 Public Domain

The Metropolitan Museum of Art Collection
 – CC0 Public Domain

Tate Collection
 – CC0 Public Domain

Wikidata
 – CC0 Public Domain

Kaggle – History of Wars Dataset
 – Various open sources

🛠 Development Notes

The frontend queries data from the backend on port 8000.

MapLibre is used for base map layers (no token required).

📦 Running the Project (with Docker)

Make sure you have Docker and Docker Compose installed.

git clone https://github.com/yourusername/birdview.git
cd birdview
docker compose up --build

BirdView/
│
├── backend/           # FastAPI app and SQLite DB
├── frontend/          # React + Deck.gl app
├── docker-compose.yml
├── .dockerignore
└── README.md