import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import pillarService from '../services/pillarService';
import locationService from '../services/locationService';
import calibrationService from '../services/calibrationService';
import waypointService from '../services/waypointService';

export default function CalibrationScreen({ navigation }) {
  const [pillars, setPillars] = useState([]);
  const [waypoints, setWaypoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  
  // ESP32 Connection
  const [esp32Ip, setEsp32Ip] = useState('');
  const [connected, setConnected] = useState(false);
  
  // Bulk Import
  const [showImport, setShowImport] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');
  
  
  // Add Pillar states
  const [showAddPillar, setShowAddPillar] = useState(false);
  const [newPillarName, setNewPillarName] = useState('');
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');
  
  // Edit Pillar states
  const [showEditPillar, setShowEditPillar] = useState(false);
  const [editingPillar, setEditingPillar] = useState(null);
  const [editPillarName, setEditPillarName] = useState('');
  const [editPillarLat, setEditPillarLat] = useState('');
  const [editPillarLon, setEditPillarLon] = useState('');
  
  // Waypoints view states
  const [showWaypoints, setShowWaypoints] = useState(false);
  const [selectedPillarWaypoints, setSelectedPillarWaypoints] = useState([]);
  
  // Edit Waypoint states
  const [showEditWaypoint, setShowEditWaypoint] = useState(false);
  const [editingWaypoint, setEditingWaypoint] = useState(null);
  const [editWaypointDistance, setEditWaypointDistance] = useState('');
  const [editWaypointDescription, setEditWaypointDescription] = useState('');
  
  // Calibration states
  const [selectedPillar, setSelectedPillar] = useState(null);
  const [targetDistance, setTargetDistance] = useState('1000');
  const [calibrationStatus, setCalibrationStatus] = useState(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [calibrationStartTime, setCalibrationStartTime] = useState(null);

  useEffect(() => {
    loadData();
    initLocation();
    checkConnection();
    
    const unsubscribe = calibrationService.addListener((status) => {
      setCalibrationStatus(status);
      setIsCalibrating(status.isCalibrating);
    });
    
    return () => {
      unsubscribe();
      if (calibrationService.isActive()) {
        calibrationService.stopCalibration();
      }
    };
  }, []);

  // Update screen every second during calibration
  useEffect(() => {
    let updateInterval;
    
    if (isCalibrating) {
      // Set start time when calibration begins
      if (!calibrationStartTime) {
        setCalibrationStartTime(Date.now());
      }
      
      updateInterval = setInterval(() => {
        // Force UI update by getting fresh status
        const status = calibrationService.getStatus();
        setCalibrationStatus(status);
        setUpdateTrigger(prev => prev + 1);
        
        // Update elapsed time
        if (calibrationStartTime) {
          const elapsed = Math.floor((Date.now() - calibrationStartTime) / 1000);
          setElapsedTime(elapsed);
        }
      }, 1000); // Update every 1 second
    } else {
      // Reset when calibration stops
      setCalibrationStartTime(null);
      setElapsedTime(0);
    }
    
    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    };
  }, [isCalibrating, calibrationStartTime]);

  const loadData = async () => {
    try {
      const [pillarsData, waypointsData, ip] = await Promise.all([
        pillarService.getPillars(),
        waypointService.getWaypoints(),
        pillarService.getESP32IP(),
      ]);
      
      setPillars(pillarsData);
      setWaypoints(waypointsData);
      setEsp32Ip(ip);
    } catch (error) {
    }
  };

  const checkConnection = async () => {
    try {
      const status = await pillarService.checkConnection();
      setConnected(status !== null);
    } catch (error) {
      setConnected(false);
    }
  };

  const initLocation = async () => {
    const allowed = await locationService.requestPermissions();
    if (allowed) {
      const location = await locationService.getCurrentLocation();
      setCurrentLocation(location);
      
      // Watch location
      locationService.watchLocation((loc) => {
        setCurrentLocation(loc);
      }, 5000);
    }
  };

  const handleAddPillarHere = async () => {
    if (!currentLocation) {
      Alert.alert('Error', 'GPS location not available');
      return;
    }

    if (!newPillarName.trim()) {
      Alert.alert('Error', 'Please enter a pillar name');
      return;
    }

    setLoading(true);
    try {
      await pillarService.addPillar(
        newPillarName.trim(),
        currentLocation.latitude,
        currentLocation.longitude
      );
      
      Alert.alert('Success', `Pillar "${newPillarName}" added at current location`);
      setNewPillarName('');
      setShowAddPillar(false);
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to add pillar: ' + error.message);
    }
    setLoading(false);
  };

  const handleAddPillarManual = async () => {
    if (!newPillarName.trim()) {
      Alert.alert('Error', 'Please enter a pillar name');
      return;
    }

    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);

    if (isNaN(lat) || isNaN(lon)) {
      Alert.alert('Error', 'Invalid coordinates');
      return;
    }

    setLoading(true);
    try {
      await pillarService.addPillar(newPillarName.trim(), lat, lon);
      
      Alert.alert('Success', `Pillar "${newPillarName}" added`);
      setNewPillarName('');
      setManualLat('');
      setManualLon('');
      setShowAddPillar(false);
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to add pillar: ' + error.message);
    }
    setLoading(false);
  };

  const handleStartCalibration = async () => {
    if (!selectedPillar) {
      Alert.alert('Error', 'Please select a pillar to calibrate');
      return;
    }

    const distance = parseInt(targetDistance);
    if (isNaN(distance) || distance <= 0) {
      Alert.alert('Error', 'Invalid distance value');
      return;
    }

    try {
      await calibrationService.startCalibration(selectedPillar, distance);
      
      Alert.alert(
        'Calibration Started',
        `Keep phone STILL for 2.5 seconds, then START MOVING!\n\nWill record waypoints every ${distance}m for ${pillars.find(p => p.id === selectedPillar)?.name}\n\nWatch console for "Movement:" messages.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleStopCalibration = () => {
    const result = calibrationService.stopCalibration();
    Alert.alert(
      'Calibration Stopped',
      `Recorded ${result.waypointsRecorded} waypoints`
    );
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await pillarService.fetchPillars();
      await waypointService.fetchWaypoints();
      await loadData();
      await checkConnection();
      Alert.alert('Success', 'Data refreshed from ESP32');
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh data: ' + error.message);
    }
    setLoading(false);
  };

  const handleUpdateIP = async () => {
    if (!esp32Ip) {
      Alert.alert('Error', 'Please enter ESP32 IP address');
      return;
    }
    
    try {
      await pillarService.setESP32IP(esp32Ip);
      await checkConnection();
      Alert.alert('Success', 'ESP32 IP updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update IP: ' + error.message);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkImportText.trim()) {
      Alert.alert('Error', 'Please enter data to import');
      return;
    }

    setLoading(true);
    try {
      const data = waypointService.parseSpreadsheet(bulkImportText);
      
      if (data.length === 0) {
        Alert.alert('Error', 'No valid data found. Please check format.');
        setLoading(false);
        return;
      }

      const response = await waypointService.bulkImport(data);
      
      if (response.status === 'success') {
        Alert.alert(
          'Success',
          `Imported ${response.addedPillars} pillars and ${response.addedWaypoints} waypoints`
        );
        setBulkImportText('');
        setShowImport(false);
        await loadData();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to import: ' + error.message);
    }
    setLoading(false);
  };

  const handleLoadSample = () => {
    const sample = waypointService.createSampleData();
    const formatted = sample.map(row => 
      `${row.index}\t${row.trackPathId}\t${row.latitude}\t${row.longitude}\t${row.pillerName}\t${row.front}\t${row.frontTotal}\t${row.back}\t${row.backTotal}`
    ).join('\n');
    
    setBulkImportText(`index\ttrackPathId\tlatitude\tlongitude\tpillerName\tfront\tfrontTotal\tback\tbackTotal\n${formatted}`);
  };

  const handleClearAll = () => {
    Alert.alert(
      'Confirm Clear',
      'This will delete all pillars and waypoints from ESP32. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await pillarService.clearAll();
              await loadData();
              Alert.alert('Success', 'All data cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear: ' + error.message);
            }
            setLoading(false);
          },
        },
      ]
    );
  };

  const handleEditPillar = (pillar) => {
    setEditingPillar(pillar);
    setEditPillarName(pillar.name);
    setEditPillarLat(pillar.lat.toString());
    setEditPillarLon(pillar.lon.toString());
    setShowEditPillar(true);
  };

  const handleUpdatePillar = async () => {
    if (!editPillarName.trim()) {
      Alert.alert('Error', 'Please enter a pillar name');
      return;
    }

    const lat = parseFloat(editPillarLat);
    const lon = parseFloat(editPillarLon);

    if (isNaN(lat) || isNaN(lon)) {
      Alert.alert('Error', 'Invalid coordinates');
      return;
    }

    setLoading(true);
    try {
      // Delete old pillar and add updated one
      await pillarService.deletePillar(editingPillar.id);
      await pillarService.addPillar(editPillarName.trim(), lat, lon);
      
      Alert.alert('Success', 'Pillar updated');
      setShowEditPillar(false);
      setEditingPillar(null);
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update pillar: ' + error.message);
    }
    setLoading(false);
  };

  const handleDeletePillar = (pillar) => {
    Alert.alert(
      'Delete Pillar',
      `Are you sure you want to delete "${pillar.name}"? This will also delete all its waypoints.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await pillarService.deletePillar(pillar.id);
              Alert.alert('Success', 'Pillar deleted');
              await loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete pillar: ' + error.message);
            }
            setLoading(false);
          },
        },
      ]
    );
  };

  const handleViewWaypoints = (pillar) => {
    const pillarWaypoints = waypoints.filter(wp => 
      wp.pillarId === pillar.id || wp.pillerName === pillar.name
    );
    setSelectedPillarWaypoints(pillarWaypoints);
    setShowWaypoints(true);
  };

  const handleDeleteWaypoint = (waypoint) => {
    Alert.alert(
      'Delete Waypoint',
      'Are you sure you want to delete this waypoint?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await waypointService.deleteWaypoint(waypoint.id);
              Alert.alert('Success', 'Waypoint deleted');
              await loadData();
              // Refresh the waypoints view if open
              if (showWaypoints) {
                const updatedWaypoints = selectedPillarWaypoints.filter(wp => wp.id !== waypoint.id);
                setSelectedPillarWaypoints(updatedWaypoints);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete waypoint: ' + error.message);
            }
            setLoading(false);
          },
        },
      ]
    );
  };

  const handleEditWaypoint = (waypoint) => {
    setEditingWaypoint(waypoint);
    setEditWaypointDistance(waypoint.distanceFromPillar?.toString() || '0');
    setEditWaypointDescription(waypoint.description || '');
    setShowEditWaypoint(true);
  };

  const handleSaveWaypoint = async () => {
    if (!editingWaypoint) return;

    const distance = parseFloat(editWaypointDistance);
    if (isNaN(distance)) {
      Alert.alert('Error', 'Invalid distance value');
      return;
    }

    setLoading(true);
    try {
      await waypointService.updateWaypoint(
        editingWaypoint.id,
        distance,
        editWaypointDescription
      );
      
      Alert.alert('Success', 'Waypoint updated');
      setShowEditWaypoint(false);
      await loadData();
      
      // Refresh waypoints list if modal is open
      if (showWaypoints) {
        const pillarId = editingWaypoint.pillarId || editingWaypoint.pillerName;
        const updatedWaypoints = waypoints.filter(wp => 
          (wp.pillarId === pillarId || wp.pillerName === pillarId)
        );
        setSelectedPillarWaypoints(updatedWaypoints);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update waypoint: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calibration & Pillars</Text>
        <View style={[styles.statusDot, connected && styles.statusConnected]} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* ESP32 Connection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ESP32 Connection</Text>
          <View style={styles.ipRow}>
            <TextInput
              style={styles.ipInput}
              value={esp32Ip}
              onChangeText={setEsp32Ip}
              placeholder="192.168.1.100"
              keyboardType="numeric"
            />
            <TouchableOpacity onPress={handleUpdateIP} style={styles.updateButton}>
              <Text style={styles.buttonText}>Update</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.statusText}>
            Status: {connected ? '✓ Connected' : '✗ Disconnected'}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.actionButton} disabled={loading}>
            <Text style={styles.actionButtonText}>🔄 Refresh from ESP32</Text>
          </TouchableOpacity>
        </View>

        {/* Bulk Import Section */}
        {showImport && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bulk Import Data</Text>
            <Text style={styles.importHelp}>
              Paste spreadsheet data (tab or comma separated). Format:
              {'\n'}index, trackPathId, latitude, longitude, pillerName, front, frontTotal, back, backTotal
            </Text>
            <TextInput
              style={styles.importTextInput}
              value={bulkImportText}
              onChangeText={setBulkImportText}
              placeholder="Paste your data here..."
              multiline
              numberOfLines={10}
            />
            <View style={styles.importButtonRow}>
              <TouchableOpacity onPress={handleLoadSample} style={styles.sampleButton}>
                <Text style={styles.buttonText}>Load Sample</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleBulkImport} style={styles.importSubmitButton} disabled={loading}>
                <Text style={styles.buttonText}>Import</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{pillars.length}</Text>
              <Text style={styles.statLabel}>Pillars</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{waypoints.length}</Text>
              <Text style={styles.statLabel}>Waypoints</Text>
            </View>
          </View>
        </View>

        {/* Current Location */}
        {currentLocation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Current Location</Text>
            <Text style={styles.locationText}>
              {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            </Text>
          </View>
        )}

        {/* Add Pillar Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add New Pillar</Text>
          <TouchableOpacity
            onPress={() => setShowAddPillar(true)}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>➕ Add Pillar</Text>
          </TouchableOpacity>
        </View>

        {/* Calibration Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calibrate Waypoints</Text>
          
          {!isCalibrating ? (
            <>
              <Text style={styles.label}>Select Pillar:</Text>
              <View style={styles.pillarSelector}>
                {pillars.map((pillar) => (
                  <TouchableOpacity
                    key={pillar.id}
                    style={[
                      styles.pillarOption,
                      selectedPillar === pillar.id && styles.pillarOptionSelected,
                    ]}
                    onPress={() => setSelectedPillar(pillar.id)}
                  >
                    <Text
                      style={[
                        styles.pillarOptionText,
                        selectedPillar === pillar.id && styles.pillarOptionTextSelected,
                      ]}
                    >
                      {pillar.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Distance per Waypoint (meters):</Text>
              <TextInput
                style={styles.input}
                value={targetDistance}
                onChangeText={setTargetDistance}
                placeholder="1000"
                keyboardType="numeric"
              />
              <Text style={styles.helpText}>
                Waypoints will be recorded automatically every {targetDistance}m while the train moves
              </Text>

              <TouchableOpacity
                onPress={handleStartCalibration}
                style={styles.calibrateButton}
                disabled={!selectedPillar || loading}
              >
                <Text style={styles.calibrateButtonText}>🚂 Start Calibration</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.calibrationActive}>
              <Text style={styles.calibrationTitle}>🔴 Calibration Active</Text>
              <Text style={styles.calibrationPillar}>
                Pillar: {pillars.find(p => p.id === selectedPillar)?.name}
              </Text>
              
              {/* Elapsed Time */}
              <View style={styles.timeContainer}>
                <Text style={styles.timeLabel}>Elapsed Time:</Text>
                <Text style={styles.timeValue}>
                  {Math.floor(elapsedTime / 60)}:{String(elapsedTime % 60).padStart(2, '0')}
                </Text>
              </View>
              
              {calibrationStatus && (
                <View style={styles.calibrationStats}>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Real Distance (Walked):</Text>
                    <Text style={styles.statValue}>
                      {calibrationStatus.realDistance.toFixed(0)}m / {calibrationStatus.targetDistance}m
                    </Text>
                  </View>
                  
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Straight Distance (GPS):</Text>
                    <Text style={styles.statValue}>
                      {calibrationStatus.straightDistance.toFixed(0)}m
                    </Text>
                  </View>
                  
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Waypoints Recorded:</Text>
                    <Text style={styles.statValue}>{calibrationStatus.waypointsRecorded}</Text>
                  </View>
                  
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Current Velocity:</Text>
                    <Text style={styles.statValue}>
                      {calibrationStatus.velocity?.toFixed(2) || '0.00'} m/s
                    </Text>
                  </View>
                  
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Calibrated:</Text>
                    <Text style={[styles.statValue, { color: calibrationStatus.isCalibrated ? '#4CAF50' : '#F44336' }]}>
                      {calibrationStatus.isCalibrated ? '✓ Yes' : '✗ No'}
                    </Text>
                  </View>
                  
                  {/* Live update indicator */}
                  <View style={styles.liveIndicator}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>Live Update (Every 1s)</Text>
                  </View>
                  
                  <Text style={styles.helpText}>
                    💡 Real distance: Actual path walked (accelerometer)
                    {'\n'}📍 Straight distance: Direct line from start (GPS)
                    {'\n'}🚶 Walk normally to track distance accurately
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={handleStopCalibration}
                style={styles.stopButton}
              >
                <Text style={styles.stopButtonText}>⏹ Stop Calibration</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Pillars List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Pillars ({pillars.length})</Text>
          {pillars.length === 0 ? (
            <Text style={styles.emptyText}>No pillars yet. Add one to get started.</Text>
          ) : (
            pillars.map((pillar) => (
              <View key={pillar.id} style={styles.pillarItem}>
                <View style={styles.pillarInfo}>
                  <Text style={styles.pillarItemName}>{pillar.name}</Text>
                  <Text style={styles.pillarItemCoords}>
                    {pillar.lat.toFixed(6)}, {pillar.lon.toFixed(6)}
                  </Text>
                  <Text style={styles.pillarItemWaypoints}>
                    {waypoints.filter(wp => wp.pillarId === pillar.id || wp.pillerName === pillar.name).length} waypoints
                  </Text>
                </View>
                <View style={styles.pillarActions}>
                  <TouchableOpacity 
                    onPress={() => handleViewWaypoints(pillar)}
                    style={styles.iconButton}
                  >
                    <Text style={styles.iconButtonText}>👁️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => handleEditPillar(pillar)}
                    style={styles.iconButton}
                  >
                    <Text style={styles.iconButtonText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => handleDeletePillar(pillar)}
                    style={styles.iconButton}
                  >
                    <Text style={styles.iconButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Pillar Modal */}
      <Modal
        visible={showAddPillar}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddPillar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Pillar</Text>
            
            <Text style={styles.label}>Pillar Name:</Text>
            <TextInput
              style={styles.input}
              value={newPillarName}
              onChangeText={setNewPillarName}
              placeholder="e.g., Pillar A"
            />

            <TouchableOpacity
              onPress={handleAddPillarHere}
              style={styles.primaryButton}
              disabled={loading || !currentLocation}
            >
              <Text style={styles.buttonText}>
                📍 Add Pillar Here (Current Location)
              </Text>
            </TouchableOpacity>

            <Text style={styles.orText}>— OR —</Text>

            <Text style={styles.label}>Manual Coordinates:</Text>
            <TextInput
              style={styles.input}
              value={manualLat}
              onChangeText={setManualLat}
              placeholder="Latitude"
              keyboardType="decimal-pad"
            />
            <TextInput
              style={styles.input}
              value={manualLon}
              onChangeText={setManualLon}
              placeholder="Longitude"
              keyboardType="decimal-pad"
            />

            <TouchableOpacity
              onPress={handleAddPillarManual}
              style={styles.secondaryButton}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Add with Manual Coordinates</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowAddPillar(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Pillar Modal */}
      <Modal
        visible={showEditPillar}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditPillar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Pillar</Text>
            
            <Text style={styles.label}>Pillar Name:</Text>
            <TextInput
              style={styles.input}
              value={editPillarName}
              onChangeText={setEditPillarName}
              placeholder="e.g., Pillar A"
            />

            <Text style={styles.label}>Latitude:</Text>
            <TextInput
              style={styles.input}
              value={editPillarLat}
              onChangeText={setEditPillarLat}
              placeholder="Latitude"
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Longitude:</Text>
            <TextInput
              style={styles.input}
              value={editPillarLon}
              onChangeText={setEditPillarLon}
              placeholder="Longitude"
              keyboardType="decimal-pad"
            />

            <TouchableOpacity
              onPress={handleUpdatePillar}
              style={styles.primaryButton}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Update Pillar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowEditPillar(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Waypoints Modal */}
      <Modal
        visible={showWaypoints}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowWaypoints(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <Text style={styles.modalTitle}>Waypoints ({selectedPillarWaypoints.length})</Text>
            
            <ScrollView style={styles.waypointsScroll}>
              {selectedPillarWaypoints.length === 0 ? (
                <Text style={styles.emptyText}>No waypoints for this pillar</Text>
              ) : (
                selectedPillarWaypoints.map((waypoint, index) => (
                  <View key={waypoint.id || index} style={styles.waypointCard}>
                    <View style={styles.waypointInfo}>
                      <Text style={styles.waypointTitle}>
                        Waypoint {waypoint.index || index + 1}
                      </Text>
                      <Text style={styles.waypointCoords}>
                        Lat: {waypoint.lat?.toFixed(6) || 'N/A'}
                      </Text>
                      <Text style={styles.waypointCoords}>
                        Lon: {waypoint.lon?.toFixed(6) || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.waypointActions}>
                      <TouchableOpacity 
                        onPress={() => handleDeleteWaypoint(waypoint)}
                        style={styles.iconButton}
                      >
                        <Text style={styles.iconButtonText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowWaypoints(false)}
              style={styles.primaryButton}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Waypoint Modal */}
      <Modal
        visible={showEditWaypoint}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditWaypoint(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Waypoint</Text>
            
            <Text style={styles.label}>Distance from Pillar (meters):</Text>
            <TextInput
              style={styles.input}
              value={editWaypointDistance}
              onChangeText={setEditWaypointDistance}
              placeholder="0"
              keyboardType="numeric"
            />
            <Text style={styles.helpText}>
              Negative = before pillar, Positive = after pillar
            </Text>

            <Text style={styles.label}>Description:</Text>
            <TextInput
              style={styles.input}
              value={editWaypointDescription}
              onChangeText={setEditWaypointDescription}
              placeholder="Waypoint description"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setShowEditWaypoint(false)}
                style={[styles.modalButton, styles.cancelButton]}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveWaypoint}
                style={[styles.modalButton, styles.saveButton]}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#757575',
    fontFamily: 'monospace',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
    marginTop: 12,
  },
  pillarSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  pillarOption: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pillarOptionSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#1976D2',
  },
  pillarOptionText: {
    fontSize: 14,
    color: '#212121',
    fontWeight: '500',
  },
  pillarOptionTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  calibrateButton: {
    backgroundColor: '#FF9800',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  calibrateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  calibrationActive: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  calibrationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F57C00',
    marginBottom: 8,
    textAlign: 'center',
  },
  calibrationPillar: {
    fontSize: 16,
    color: '#212121',
    textAlign: 'center',
    marginBottom: 16,
  },
  calibrationStats: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#757575',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212121',
  },
  progressBar: {
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 8,
    position: 'relative',
    justifyContent: 'center',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  progressText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#212121',
    textAlign: 'center',
    zIndex: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
  },
  timeLabel: {
    fontSize: 14,
    color: '#757575',
    marginRight: 8,
  },
  timeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF9800',
    fontFamily: 'monospace',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  stopButton: {
    backgroundColor: '#F44336',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pillarItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  pillarInfo: {
    flex: 1,
  },
  pillarActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 4,
  },
  iconButtonText: {
    fontSize: 18,
  },
  pillarItemWaypoints: {
    fontSize: 11,
    color: '#2196F3',
    marginTop: 4,
  },
  modalContentLarge: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  waypointsScroll: {
    maxHeight: 400,
    marginBottom: 16,
  },
  waypointCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  waypointInfo: {
    flex: 1,
  },
  waypointActions: {
    flexDirection: 'row',
    gap: 8,
  },
  waypointTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  waypointCoords: {
    fontSize: 12,
    color: '#757575',
  },
  waypointDetail: {
    fontSize: 11,
    color: '#2196F3',
    marginTop: 2,
  },
  deleteWaypointButton: {
    padding: 8,
  },
  deleteWaypointText: {
    fontSize: 20,
  },
  pillarItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  pillarItemCoords: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#757575',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  orText: {
    textAlign: 'center',
    color: '#757575',
    marginVertical: 16,
    fontSize: 14,
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#757575',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F44336',
  },
  statusConnected: {
    backgroundColor: '#4CAF50',
  },
  ipRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  ipInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginRight: 8,
  },
  updateButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 12,
    color: '#757575',
  },
  actionButton: {
    backgroundColor: '#2196F3',
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
  },
  importButton: {
    backgroundColor: '#4CAF50',
  },
  clearButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  importHelp: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 8,
    lineHeight: 18,
  },
  importTextInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 8,
    minHeight: 150,
  },
  importButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sampleButton: {
    backgroundColor: '#757575',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  importSubmitButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
  },
});
