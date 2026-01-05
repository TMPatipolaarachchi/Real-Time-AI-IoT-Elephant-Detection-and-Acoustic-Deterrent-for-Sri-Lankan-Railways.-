# Real-Time-AI-IoT-Elephant-Detection-and-Acoustic-Deterrent-for-Sri-Lankan-Railways.-

🐘 ESP32 Railway Elephant Detection System - Distance Calculation Module

📍 Overview
This ESP32-based system calculates precise track-based distances between moving trains and elephant detection pillars along railway corridors

🎯 Core Distance Calculation Logic

Two Distance Measurement Methods
The system calculates distances using BOTH methods for accuracy verification:

1.Straight-Line (GPS) Distance
Direct point-to-point measurement using Haversine formula
Calculates straightDistance in meters between train and elephant pillar

2.Track-Based (Railway) Distance
Follows actual railway curvature using predefined waypoints
Calculates trackDistance in meters along the railway path
More accurate for collision warning systems

🎯Key Technical Features

Real-time GPS processing from moving trains
Waypoint-based track modeling for accurate railway distance
Persistent storage using LittleFS 
Web-based management interface for configuration

🧮 Mathematical Formulas

Haversine Formula 

double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    const double R = 6371000; // Earth radius in meters
    double dLat = (lat2 - lat1) * PI / 180.0;
    double dLon = (lon2 - lon1) * PI / 180.0;
    
    lat1 = lat1 * PI / 180.0;
    lat2 = lat2 * PI / 180.0;
    
    double a = sin(dLat/2) * sin(dLat/2) +
               cos(lat1) * cos(lat2) *
               sin(dLon/2) * sin(dLon/2);
    double c = 2 * atan2(sqrt(a), sqrt(1-a));
    
    return R * c; // Distance in meters
}

🗺️Track Distance Calculation

trackDistance = trainToWaypoint_GPS + waypointToPillar_Track

trainToWaypoint_GPS = GPS distance from train to nearest waypoint
waypointToPillar_Track = Pre-measured railway distance from waypoint to pillar





